import { useEffect, useImperativeHandle, useRef, type Ref } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { DEFAULTNO, FLYRUTE, OSLO, SKYANALYSE, SKYDEKKE, STEDER, TEORIER, type Sted } from '@/data/innhold'
import { FARGE, KJORETID_KLASSER, type LagId } from '@/data/lag'
import { avstand, destinasjon, formaterTid, peiling, sektor, storsirkel, type LatLon } from '@/lib/geo'
import { FAKTORER, faktorer, klasse, type Punkt, type Resultat, type Vekter } from '@/lib/modell'
import { stedsnavn } from '@/lib/stedsnavn'

export type Bakgrunn = 'gra' | 'topo' | 'satellitt'

export type KartApi = {
  flyTil: (pos: LatLon, zoom?: number) => void
  visLag: (id: LagId) => void
  sentrum: () => LatLon
}

type Props = {
  ref?: Ref<KartApi>
  punkter: Punkt[] | null
  norge: GeoJSON.MultiPolygon | null
  resultat: Resultat | null
  vekter: Vekter
  aktive: Set<LagId>
  bakgrunn: Bakgrunn
  feltPos: LatLon | null
  onFeltFlytt: (pos: LatLon) => void
  minPos: LatLon | null
}

const BAKGRUNNER: Record<Bakgrunn, { url: string; attribusjon: string }> = {
  gra: {
    url: 'https://cache.kartverket.no/v1/wmts/1.0.0/topograatone/default/webmercator/{z}/{y}/{x}.png',
    attribusjon: '&copy; <a href="https://www.kartverket.no/">Kartverket</a>',
  },
  topo: {
    url: 'https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png',
    attribusjon: '&copy; <a href="https://www.kartverket.no/">Kartverket</a>',
  },
  satellitt: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribusjon: 'Bilder &copy; Esri, Maxar, Earthstar Geographics',
  },
}

// Rutene er 0,1° × 0,2°, sentrert på hvert punkt
const HALV_LAT = 0.05
const HALV_LON = 0.1

const rutenett = (p: Punkt): L.LatLngBoundsExpression => [
  [p.lat - HALV_LAT, p.lon - HALV_LON],
  [p.lat + HALV_LAT, p.lon + HALV_LON],
]

function pin(klasse: string, innhold = '', str = 26) {
  return L.divIcon({
    className: '',
    html: `<div class="pin ${klasse}" style="width:${str}px;height:${str}px">${innhold}</div>`,
    iconSize: [str, str],
    iconAnchor: [str / 2, str / 2],
    popupAnchor: [0, -str / 2],
  })
}

const popupTekst = (tittel: string, tekst: string) =>
  `<div class="pop"><h5>${tittel}</h5><p>${tekst}</p></div>`

function kjoretidFarge(p: Punkt): string | null {
  if (p.sek == null) return null
  if (p.snap > 3000) return FARGE.langtFraVei
  const t = p.sek / 3600
  const i = KJORETID_KLASSER.findIndex((k) => t >= k.fra && t < k.til)
  return i < 0 ? null : FARGE.kjoretid[i]
}

export function Kart({ ref, punkter, norge, resultat, vekter, aktive, bakgrunn, feltPos, onFeltFlytt, minPos }: Props) {
  const divRef = useRef<HTMLDivElement>(null)
  const kartRef = useRef<L.Map | null>(null)
  const flisRef = useRef<L.TileLayer | null>(null)
  const grupper = useRef<Record<LagId, L.FeatureGroup> | null>(null)
  const modellRuter = useRef<L.Rectangle[]>([])
  const feltRef = useRef<{ markor: L.Marker; sektor: L.Polygon; pil: L.Polyline } | null>(null)
  const minPosRef = useRef<L.CircleMarker | null>(null)
  // Siste verdier for klikk-popupen, som lever utenfor React
  const siste = useRef({ punkter, resultat, vekter, aktive })
  siste.current = { punkter, resultat, vekter, aktive }
  const onFeltFlyttRef = useRef(onFeltFlytt)
  onFeltFlyttRef.current = onFeltFlytt

  useImperativeHandle(ref, () => ({
    flyTil: (pos, zoom = 9) => kartRef.current?.flyTo(pos, zoom, { duration: 0.8 }),
    visLag: (id) => {
      const g = grupper.current?.[id]
      const kart = kartRef.current
      if (!g || !kart) return
      const b = g.getBounds()
      if (b.isValid()) kart.flyToBounds(b, { padding: [40, 40], maxZoom: 10, duration: 0.8 })
    },
    sentrum: () => {
      const c = kartRef.current?.getCenter()
      return c ? [c.lat, c.lng] : OSLO
    },
  }))

  // Opprett kartet og de statiske lagene én gang
  useEffect(() => {
    if (!divRef.current || kartRef.current) return
    const kart = L.map(divRef.current, { zoomControl: false, preferCanvas: true, attributionControl: true })
    kart.setView([61.3, 9.8], 5)
    kart.attributionControl.setPrefix(false)
    kartRef.current = kart

    const g = Object.fromEntries(
      (['modell', 'kjoretid', 'retning', 'skydekke', 'skyanalyse', 'defaultno', 'steder', 'teorier', 'fly', 'felt', 'utenfor'] as LagId[]).map((id) => [
        id,
        L.featureGroup(),
      ]),
    ) as Record<LagId, L.FeatureGroup>
    grupper.current = g

    // Retning 298° / 118° fra Oslo
    const nv = storsirkel(OSLO, destinasjon(OSLO, 298, 560), 40)
    const so = storsirkel(OSLO, destinasjon(OSLO, 118, 160), 12)
    const kjegle = (kurs: number, km: number) => [OSLO, ...Array.from({ length: 11 }, (_, i) => destinasjon(OSLO, kurs - 5 + i, km)), OSLO]
    L.polygon(kjegle(298, 560), { color: FARGE.retning, weight: 0, fillOpacity: 0.1, interactive: false }).addTo(g.retning)
    L.polygon(kjegle(118, 160), { color: FARGE.retning, weight: 0, fillOpacity: 0.06, interactive: false }).addTo(g.retning)
    L.polyline(nv, { color: FARGE.retning, weight: 3 })
      .bindPopup(popupTekst('298° fra Oslo', 'Hvis 118° er retningen fra kassen mot Oslo, ligger kassen på denne linja.'))
      .addTo(g.retning)
    L.polyline(so, { color: FARGE.retning, weight: 3, dashArray: '6 8' })
      .bindPopup(popupTekst('118° fra Oslo', 'Retningen 118° rett fra Oslo. Under 2 t kjøring, så lite sannsynlig.'))
      .addTo(g.retning)
    for (const km of [100, 200, 300, 400, 500]) {
      L.marker(destinasjon(OSLO, 298, km), {
        icon: L.divIcon({ className: '', html: `<div class="km-merke">${km} km</div>`, iconSize: [52, 20], iconAnchor: [-6, 10] }),
        interactive: false,
      }).addTo(g.retning)
    }

    // Skydekke
    for (const ring of SKYDEKKE) {
      L.polygon(ring, { color: FARGE.skydekke, weight: 1.5, dashArray: '4 5', fillColor: FARGE.skydekke, fillOpacity: 0.28 })
        .bindPopup(popupTekst('Tett skydekke', 'Grovt tegnet fra Windy-skykartet. Anja så klar himmel, så dette området er mindre sannsynlig.'))
        .addTo(g.skydekke)
    }

    // Skyanalyse (Agder)
    L.circle(SKYANALYSE.senter, { radius: SKYANALYSE.ytreKm * 1000, color: FARGE.skyanalyse, weight: 2, fillOpacity: 0.06 })
      .bindPopup(popupTekst('Skyanalyse: usikkerhet', 'Ytre ring rundt møtepunktet i fellesskapets skyanalyse. Plassert omtrentlig ut fra bildet.'))
      .addTo(g.skyanalyse)
    L.circle(SKYANALYSE.senter, { radius: SKYANALYSE.indreKm * 1000, color: FARGE.skyanalyse, weight: 0, fillOpacity: 0.55 })
      .bindPopup(popupTekst('Skyanalyse: møtepunkt', 'Der sonene for kl. 12, 15–17 og 19–20 overlapper. Ca. 4 t kjøring fra Oslo.'))
      .addTo(g.skyanalyse)

    // default.no-kandidater
    for (const k of DEFAULTNO) {
      L.circle(k.pos, { radius: 10000, color: FARGE.defaultno, weight: 1.5, dashArray: '3 4', fillOpacity: 0.04, interactive: false }).addTo(g.defaultno)
      L.marker(k.pos, { icon: pin('pin-default', String(k.nr), 24) })
        .bindPopup(popupTekst(`#${k.nr} ${k.navn}`, `${k.p} i default.no sin modell.`))
        .addTo(g.defaultno)
    }

    // Steder og teorier
    const leggTilSted = (s: Sted, gruppe: L.FeatureGroup) => {
      const klasse = { start: 'pin-start', hint: 'pin-hint', tidligere: 'pin-tidligere', teori: s.utelukket ? 'pin-teori ut' : 'pin-teori' }[s.type]
      const innhold = { start: 'O', hint: '', tidligere: `<b>${s.id === 'tokke' ? '23' : '24'}</b>`, teori: '?' }[s.type]
      L.marker(s.pos, { icon: pin(klasse, innhold, s.type === 'hint' ? 20 : 24) })
        .bindTooltip(s.navn, { direction: 'right', offset: [12, 0], className: 'etikett' })
        .bindPopup(popupTekst(s.navn, s.info))
        .addTo(gruppe)
    }
    STEDER.forEach((s) => leggTilSted(s, g.steder))
    TEORIER.forEach((s) => leggTilSted(s, g.teorier))

    // Fly Oslo–Bodø
    L.polyline(storsirkel(FLYRUTE.fra, FLYRUTE.til, 60), { color: FARGE.fly, weight: 2.5, dashArray: '2 7', lineCap: 'round' })
      .bindPopup(popupTekst('Flyrute Oslo–Bodø', 'NOZ56U tok denne ruten. Anja så og hørte et fly ca. 21:29 (ekte tid).'))
      .addTo(g.fly)
    const kurs = peiling(FLYRUTE.fra, FLYRUTE.til)
    L.polyline(storsirkel(destinasjon(FLYRUTE.fra, kurs, 100), destinasjon(FLYRUTE.fra, kurs, 200), 10), { color: FARGE.fly, weight: 7, opacity: 0.8 })
      .bindPopup(popupTekst('Flyet ca. kl. 21:29', 'Grovt anslag: i stigning 100–200 km fra Gardermoen. Kassen bør ligge nær flyets bane.'))
      .addTo(g.fly)

    // Klikk på kartet: vis info om nærmeste rute
    kart.on('click', (e: L.LeafletMouseEvent) => {
      const { punkter: pk, resultat: res, vekter: v } = siste.current
      if (!pk) return
      const klikk: LatLon = [e.latlng.lat, e.latlng.lng]
      let best = -1
      let bestKm = Infinity
      pk.forEach((p, i) => {
        const d = avstand(klikk, [p.lat, p.lon])
        if (d < bestKm) {
          bestKm = d
          best = i
        }
      })
      if (best < 0 || bestKm > 12) return
      const p = pk[best]
      const f = faktorer(p, v)
      const topp = res ? Math.max(0.1, res.andel[best] * 100) : null
      const rader = FAKTORER.filter((fk) => v[fk.id] > 0)
        .map((fk) => `<dt>${fk.navn}</dt><dd>${Math.round(f[fk.id] * 100)} %</dd>`)
        .join('')
      const lat = klikk[0].toFixed(4)
      const lon = klikk[1].toFixed(4)
      const html = `<div class="pop">
        <h5 class="sted" data-sted>Ruta her</h5>
        <p class="pop-koord">${lat}, ${lon}</p>
        <dl>
          <dt>Kjøretid fra Oslo</dt><dd>${p.sek == null ? 'ukjent' : formaterTid(p.sek)}</dd>
          <dt>Kjørelengde</dt><dd>${p.meter == null ? 'ukjent' : Math.round(p.meter / 1000) + ' km'}</dd>
          <dt>Til nærmeste bilvei</dt><dd>${p.snap < 1000 ? p.snap + ' m' : (p.snap / 1000).toFixed(1) + ' km'}</dd>
          ${topp != null ? `<dt>Plassering</dt><dd>topp ${topp < 1 ? topp.toFixed(1) : Math.round(topp)} %</dd>` : ''}
        </dl>
        ${rader ? `<p class="pop-under">Slik passer ruta med hintene</p><dl>${rader}</dl>` : ''}
        <div class="lenker">
          <a target="_blank" rel="noopener" href="https://www.google.com/maps/@?api=1&map_action=map&center=${lat},${lon}&zoom=13&basemap=satellite">Satellitt</a>
          <a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${lat},${lon}">Google Maps</a>
        </div>
      </div>`
      const popup = L.popup({ maxWidth: 300 }).setLatLng(e.latlng).setContent(html).openOn(kart)
      stedsnavn(klikk[0], klikk[1]).then((navn) => {
        const el = popup.getElement()?.querySelector('[data-sted]')
        if (el && navn) el.textContent = `Nær ${navn}`
      })
    })

    return () => {
      kart.remove()
      kartRef.current = null
    }
  }, [])

  // Bakgrunnskart
  useEffect(() => {
    const kart = kartRef.current
    if (!kart) return
    flisRef.current?.remove()
    const b = BAKGRUNNER[bakgrunn]
    flisRef.current = L.tileLayer(b.url, { attribution: b.attribusjon, maxZoom: 18 }).addTo(kart)
    flisRef.current.bringToBack()
  }, [bakgrunn])

  // Rutenettet (kjøretid + modell) når dataene er lastet
  useEffect(() => {
    const g = grupper.current
    if (!punkter || !g) return
    g.kjoretid.clearLayers()
    g.modell.clearLayers()
    const renderer = L.canvas({ padding: 0.3 })
    for (const p of punkter) {
      const farge = kjoretidFarge(p)
      if (farge) {
        L.rectangle(rutenett(p), { renderer, stroke: false, fillColor: farge, fillOpacity: 0.55, interactive: false }).addTo(g.kjoretid)
      }
    }
    modellRuter.current = punkter.map((p) =>
      L.rectangle(rutenett(p), { renderer, stroke: false, fillOpacity: 0, interactive: false }).addTo(g.modell),
    )
  }, [punkter])

  // Farg modellrutene på nytt når vektene endres
  useEffect(() => {
    if (!resultat) return
    modellRuter.current.forEach((r, i) => {
      const k = klasse(resultat.andel[i])
      r.setStyle(k < 0 ? { fillOpacity: 0 } : { fillColor: FARGE.modell[k], fillOpacity: [0.72, 0.62, 0.5, 0.38][k] })
    })
  }, [resultat])

  // Maske utenfor Norge
  useEffect(() => {
    const g = grupper.current
    if (!norge || !g) return
    g.utenfor.clearLayers()
    const verden: LatLon[] = [[85, -180], [85, 180], [-85, 180], [-85, -180]]
    const hull = norge.coordinates.map((poly) => poly[0].map(([lon, lat]) => [lat, lon] as LatLon))
    L.polygon([verden, ...hull], {
      stroke: true,
      color: '#334155',
      weight: 1,
      opacity: 0.5,
      fillColor: FARGE.utenfor,
      fillOpacity: 0.16,
      interactive: false,
    }).addTo(g.utenfor)
  }, [norge])

  // Slå lag av og på
  useEffect(() => {
    const kart = kartRef.current
    const g = grupper.current
    if (!kart || !g) return
    for (const [id, gruppe] of Object.entries(g) as [LagId, L.FeatureGroup][]) {
      if (aktive.has(id)) gruppe.addTo(kart)
      else gruppe.remove()
    }
  }, [aktive])

  // Søkesektor fra parkering
  useEffect(() => {
    const g = grupper.current
    if (!g) return
    if (!feltPos) {
      g.felt.clearLayers()
      feltRef.current = null
      return
    }
    const tegn = (pos: LatLon) => ({
      sektor: sektor(pos, 298, 20, 0.3, 0.9),
      pil: [pos, destinasjon(pos, 298, 0.6)] as LatLon[],
    })
    const { sektor: s, pil } = tegn(feltPos)
    if (!feltRef.current) {
      const sek = L.polygon(s, { color: FARGE.felt, weight: 2, fillOpacity: 0.22 }).addTo(g.felt)
      const p = L.polyline(pil, { color: FARGE.felt, weight: 2, dashArray: '4 6' }).addTo(g.felt)
      const m = L.marker(feltPos, { draggable: true, icon: pin('pin-felt', 'P', 30), zIndexOffset: 1000 })
        .bindPopup(popupTekst('Parkering', 'Dra meg til en parkering eller skogsbilvei. Grønt felt = der kassen bør ligge (298° ±20°, 300–900 m, oppover).'))
        .addTo(g.felt)
      m.on('drag', () => {
        const ll = m.getLatLng()
        const ny = tegn([ll.lat, ll.lng])
        sek.setLatLngs(ny.sektor)
        p.setLatLngs(ny.pil)
      })
      m.on('dragend', () => {
        const ll = m.getLatLng()
        onFeltFlyttRef.current([ll.lat, ll.lng])
      })
      feltRef.current = { markor: m, sektor: sek, pil: p }
    } else {
      feltRef.current.markor.setLatLng(feltPos)
      feltRef.current.sektor.setLatLngs(s)
      feltRef.current.pil.setLatLngs(pil)
    }
  }, [feltPos])

  // Min posisjon
  useEffect(() => {
    const kart = kartRef.current
    if (!kart) return
    minPosRef.current?.remove()
    minPosRef.current = minPos
      ? L.circleMarker(minPos, { radius: 8, color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }).addTo(kart)
      : null
  }, [minPos])

  return <div ref={divRef} className="absolute inset-0 z-0" aria-label="Kart" />
}
