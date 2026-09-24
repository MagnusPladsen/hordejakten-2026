import { useEffect, useImperativeHandle, useLayoutEffect, useRef, type Ref } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { BERGEN, DEFAULTNO, DEFAULTNO_TERRENG, FLY_PUNKT, FLY_PUNKT2, HYTTER, OSLO, SKYANALYSE, SKYDEKKE, SOL_I_DAG, STEDER, TAAKE, TEORIER, type Sted } from '@/data/innhold'
import { FARGE, KJORETID_KLASSER, type LagId } from '@/data/lag'
import { avstand, destinasjon, formaterTid, iPolygon, sektor, storsirkel, type LatLon } from '@/lib/geo'
import { PEKETID_EKTE, posisjon, type FlyData } from '@/lib/fly'
import { FAKTORER, faktorer, klasse, utelukkNokkel, type Kontekst, type Punkt, type Resultat, type Vekter } from '@/lib/modell'
import { TEORIER_LISTE, type TeoriId } from '@/data/teorier'
import { stedsnavn } from '@/lib/stedsnavn'
import { KART_MARKORER, statusTekst } from '@/data/kartmarkorer'

export type Bakgrunn = 'gra' | 'topo' | 'satellitt'

export type KartApi = {
  flyTil: (pos: LatLon, zoom?: number) => void
  visLag: (id: LagId) => void
  sentrum: () => LatLon
  /** Flytter kartet til et punkt, setter en nål og viser info om ruta */
  visPunkt: (pos: LatLon) => void
}

type Props = {
  ref?: Ref<KartApi>
  /** Plass som panelet dekker, slik at startutsnittet havner i den synlige delen */
  polstring: { venstre: number; bunn: number }
  punkter: Punkt[] | null
  norge: GeoJSON.MultiPolygon | null
  flyData: FlyData | null
  innlandet: GeoJSON.MultiPolygon | null
  utelukket: [number, number, string][] | null
  hoyde891: Hoyde891 | null
  fellesskap891: [number, number][] | null
  kommuner: GeoJSON.FeatureCollection | null
  kontekst: Kontekst
  prosent: Record<TeoriId, number>
  resultat: Resultat | null
  vekter: Vekter
  aktive: Set<LagId>
  bakgrunn: Bakgrunn
  feltPos: LatLon | null
  onFeltFlytt: (pos: LatLon) => void
  /** Kalles før en info-popup åpnes, slik at panelet kan gjøre plass */
  onPopup: () => void
  /** Åpner et hint i Hint-fanen */
  onApneHint: (id: string) => void
  /** Brukeren klikker eller drar i kartet */
  onKartBruk: () => void
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

const roligBevegelse = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

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

/** Punkter mellom 790 og 911 moh nær vei: [lat, lon, moh, meter til vei, vei mot sørøst (0/1)] */
export type Hoyde891 = { dlat: number; dlon: number; punkter: [number, number, number, number, number][] }

export function Kart({ ref, polstring, punkter, norge, flyData, innlandet, utelukket, hoyde891, fellesskap891, kommuner, kontekst, prosent, resultat, vekter, aktive, bakgrunn, feltPos, onFeltFlytt, onPopup, onApneHint, onKartBruk, minPos }: Props) {
  const divRef = useRef<HTMLDivElement>(null)
  const kartRef = useRef<L.Map | null>(null)
  const flisRef = useRef<L.TileLayer | null>(null)
  const grupper = useRef<Record<LagId, L.FeatureGroup> | null>(null)
  const modellRuter = useRef<L.Rectangle[]>([])
  const feltRef = useRef<{ markor: L.Marker; sektor: L.Polygon; pil: L.Polyline } | null>(null)
  const minPosRef = useRef<L.CircleMarker | null>(null)
  const nalRef = useRef<L.Marker | null>(null)
  const visInfoRef = useRef<(ll: L.LatLng) => void>(() => {})
  const ventendeRef = useRef<(() => void) | null>(null)
  // Siste verdier for klikk-popupen, som lever utenfor React
  const siste = useRef({ punkter, resultat, vekter, kontekst })
  const onFeltFlyttRef = useRef(onFeltFlytt)
  const onPopupRef = useRef(onPopup)
  const onApneHintRef = useRef(onApneHint)
  const onKartBrukRef = useRef(onKartBruk)
  const mobilRef = useRef(polstring.venstre === 0)
  useLayoutEffect(() => {
    siste.current = { punkter, resultat, vekter, kontekst }
    onFeltFlyttRef.current = onFeltFlytt
    onPopupRef.current = onPopup
    onApneHintRef.current = onApneHint
    onKartBrukRef.current = onKartBruk
    mobilRef.current = polstring.venstre === 0
  })

  useImperativeHandle(ref, () => ({
    flyTil: (pos, zoom = 9) => kartRef.current?.flyTo(pos, zoom, { duration: 0.8, animate: !roligBevegelse() }),
    visLag: (id) => {
      const g = grupper.current?.[id]
      const kart = kartRef.current
      if (!g || !kart) return
      const b = g.getBounds()
      if (b.isValid()) kart.flyToBounds(b, { padding: [40, 40], maxZoom: 10, duration: 0.8, animate: !roligBevegelse() })
    },
    sentrum: () => {
      const c = kartRef.current?.getCenter()
      return c ? [c.lat, c.lng] : OSLO
    },
    visPunkt: (pos) => {
      const kart = kartRef.current
      if (!kart) return
      nalRef.current?.remove()
      nalRef.current = L.marker(pos, { icon: pin('pin-nal', '', 18), zIndexOffset: 900, interactive: false }).addTo(kart)
      // Fjern en ventende popup fra et tidligere søk, så bare det siste åpner
      if (ventendeRef.current) kart.off('moveend', ventendeRef.current)
      const vis = () => {
        ventendeRef.current = null
        visInfoRef.current(L.latLng(pos[0], pos[1]))
      }
      ventendeRef.current = vis
      kart.once('moveend', vis)
      kart.flyTo(pos, 11, { duration: 0.8, animate: !roligBevegelse() })
    },
  }))

  // Opprett kartet og de statiske lagene én gang
  useEffect(() => {
    if (!divRef.current || kartRef.current) return
    const kart = L.map(divRef.current, { zoomControl: false, preferCanvas: true, attributionControl: true })
    kart.fitBounds(
      [
        [57.9, 4.6],
        [63.6, 12.6],
      ],
      { paddingTopLeft: [polstring.venstre + 16, 72], paddingBottomRight: [60, polstring.bunn + 16] },
    )
    kart.attributionControl.setPrefix(false)
    kartRef.current = kart

    // Rutenettet får egen rute, som tones ned når man zoomer inn så bakgrunnskartet synes
    const rutePane = kart.createPane('rutenett')
    rutePane.style.zIndex = '350'
    const tone = () => (rutePane.style.opacity = String(kart.getZoom() >= 9 ? 0.35 : kart.getZoom() >= 8 ? 0.65 : 1))
    kart.on('zoomend', tone)
    tone()
    // Høydelagene har små ruter og skal synes godt også når man zoomer inn
    kart.createPane('hoyde').style.zIndex = '355'

    const g = Object.fromEntries(
      (['modell', 'hintmarkorer', 'teoriomrader', 'hoyde891', 'fellesskap891', 'dn_hoyde', 'dn_vei', 'dn_plan', 'dn_avvist', 'dn_notater', 'coop', 'utelukket', 'kommuner', 'innlandet', 'kjoretid', 'retning', 'skydekke', 'solidag', 'skyanalyse', 'defaultno', 'steder', 'teorier', 'hytter', 'fly', 'felt', 'utenfor'] as LagId[]).map((id) => [
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
    L.polyline(nv, { color: FARGE.retning, weight: 3, bubblingMouseEvents: false })
      .bindPopup(popupTekst('298° fra Oslo', 'Hvis 118° er retningen fra kassen mot Oslo, ligger kassen på denne linja.'))
      .addTo(g.retning)
    L.polyline(so, { color: FARGE.retning, weight: 3, dashArray: '6 8', bubblingMouseEvents: false })
      .bindPopup(popupTekst('118° fra Oslo', 'Retningen 118° rett fra Oslo. Under 2 t kjøring, så lite sannsynlig.'))
      .addTo(g.retning)
    // 118° fra Horde AS i Bergen
    L.polyline(storsirkel(BERGEN, destinasjon(BERGEN, 118, 320), 24), { color: '#0891b2', weight: 3, bubblingMouseEvents: false })
      .bindPopup(popupTekst('118° fra Horde AS i Bergen', 'Teori: skiltet peker 118° fra Horde sitt kontor (5008). Linja går forbi Odda og gjennom Telemark til Kragerø.'))
      .addTo(g.retning)
    // Samme linje korrigert for misvisning: kompass viser ca. 4° for lite på Østlandet
    L.polyline(storsirkel(BERGEN, destinasjon(BERGEN, 123, 320), 24), { color: '#0891b2', weight: 2.5, dashArray: '6 6', bubblingMouseEvents: false })
      .bindPopup(popupTekst('123° fra Bergen (korrigert)', 'Skiltets 118–120° korrigert for misvisning (ca. +4°). Går litt lenger sør gjennom Telemark.'))
      .addTo(g.retning)

    // Tretopphyttene
    for (const h of HYTTER) {
      L.marker(h.pos, { icon: pin(h.helePerioden ? 'pin-hytte hel' : 'pin-hytte', '', h.helePerioden ? 20 : 16) })
        .bindTooltip(h.navn, { direction: 'right', offset: [10, 0], className: 'etikett' })
        .bindPopup(popupTekst(`${h.navn} (${h.sted})`, `${h.opptatt}. En av Tretopphyttene i Ringsaker.`))
        .addTo(g.hytter)
    }

    for (const km of [100, 200, 300, 400, 500]) {
      L.marker(destinasjon(OSLO, 298, km), {
        icon: L.divIcon({ className: '', html: `<div class="km-merke">${km} km</div>`, iconSize: [52, 20], iconAnchor: [-6, 10] }),
        interactive: false,
      }).addTo(g.retning)
    }

    // Blått på Windy. Flatene er gjennomklikkbare, rute-popupen sier om man er i et blått område.
    for (const ring of SKYDEKKE) {
      L.polygon(ring, { color: FARGE.skydekke, weight: 1.5, dashArray: '4 5', fillColor: FARGE.skydekke, fillOpacity: 0.28, interactive: false }).addTo(g.skydekke)
    }
    for (const ring of TAAKE) {
      L.polygon(ring, { color: '#475569', weight: 1.5, dashArray: '2 4', fillColor: '#64748b', fillOpacity: 0.3, interactive: false }).addTo(g.skydekke)
    }

    // Klart på satellitt 23.09. Trondheim–Ålesund er stiplet fordi det var blått på Windy tidligere.
    SOL_I_DAG.forEach((ring, i) => {
      L.polygon(ring, { color: '#ca8a04', weight: 2, dashArray: i === 0 ? undefined : '6 6', fillColor: FARGE.solidag, fillOpacity: 0.22, interactive: false }).addTo(g.solidag)
    })

    // Skyanalyse (Agder)
    L.circle(SKYANALYSE.senter, { radius: SKYANALYSE.ytreKm * 1000, color: FARGE.skyanalyse, weight: 2, fillOpacity: 0.06, interactive: false }).addTo(g.skyanalyse)
    L.circle(SKYANALYSE.senter, { radius: SKYANALYSE.indreKm * 1000, color: FARGE.skyanalyse, weight: 0, fillOpacity: 0.55, interactive: false }).addTo(g.skyanalyse)

    // default.no-kandidater
    for (const k of DEFAULTNO) {
      L.circle(k.pos, { radius: 10000, color: FARGE.defaultno, weight: 1.5, dashArray: '3 4', fillOpacity: 0.04, interactive: false }).addTo(g.defaultno)
      L.marker(k.pos, { icon: pin('pin-default', String(k.nr), 24) })
        .bindPopup(popupTekst(`#${k.nr} ${k.navn}`, `${k.p} i default.no sin modell.`))
        .addTo(g.defaultno)
    }

    for (const t of DEFAULTNO_TERRENG) {
      L.marker(t.pos, { icon: pin('pin-terreng', '', 14) })
        .bindTooltip(`${t.navn} (${t.omrade})`, { direction: 'right', offset: [8, 0], className: 'etikett' })
        .bindPopup(popupTekst(`Terrengtreff: ${t.navn}`, `Sterkt treff i default.no sitt terrengsøk (${t.omrade}): nær vei, oppover, furu og riktig relieff.`))
        .addTo(g.defaultno)
    }

    // Hint på kartet: én markør per sted, med alt som hører til stedet
    const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
    for (const m of KART_MARKORER) {
      const harHint = m.poster.some((p) => p.type === 'hint')
      const nytt = m.poster.some((p) => p.nytt)
      const klasse = `pin-hintmerke ${harHint ? '' : 'folk'} ${nytt ? 'nytt' : ''}`
      const html = `<div class="pop"><h5>${m.poster.length > 1 ? `${m.poster.length} ting her` : esc(m.poster[0].tittel)}</h5>
        ${m.poster
          .map(
            (p) => `<div class="pop-post">
              ${m.poster.length > 1 ? `<p class="pop-post-tittel">${esc(p.tittel)}</p>` : ''}
              <p class="pop-post-meta">${p.nytt ? '<span class="pop-nytt">Siste nytt</span> ' : ''}${esc(statusTekst(p.status))}</p>
              <p>${esc(p.tekst)}</p>
              ${p.hint ? `<button type="button" class="pop-knapp" data-hint="${esc(p.hint)}">Les hele hintet →</button>` : ''}
            </div>`,
          )
          .join('')}</div>`
      L.marker(m.pos, { icon: pin(klasse, m.poster.length > 1 ? String(m.poster.length) : '!', 26), zIndexOffset: nytt ? 600 : 400 })
        .bindTooltip(m.poster[0].tittel, { direction: 'top', offset: [0, -14], className: 'etikett' })
        .bindPopup(html, { maxWidth: 300 })
        .addTo(g.hintmarkorer)
    }
    // Knappene i popupene er ren HTML, så klikket fanges her
    kart.on('popupopen', (e: L.PopupEvent) => {
      e.popup
        .getElement()
        ?.querySelectorAll<HTMLButtonElement>('[data-hint]')
        .forEach(
          (b) =>
            (b.onclick = () => {
              kart.closePopup()
              onApneHintRef.current(b.dataset.hint!)
            }),
        )
    })

    // Steder og teorier
    const leggTilSted = (s: Sted, gruppe: L.FeatureGroup) => {
      const klasse = { start: 'pin-start', hint: 'pin-hint', tidligere: 'pin-tidligere', teori: s.utelukket ? 'pin-teori ut' : 'pin-teori' }[s.type]
      const innhold = { start: 'S', hint: '', tidligere: `<b>${s.id === 'tokke' ? '23' : '24'}</b>`, teori: '?' }[s.type]
      L.marker(s.pos, { icon: pin(klasse, innhold, s.type === 'hint' ? 20 : 24) })
        .bindTooltip(s.navn, { direction: 'right', offset: [12, 0], className: 'etikett' })
        .bindPopup(popupTekst(s.navn, s.info))
        .addTo(gruppe)
    }
    STEDER.forEach((s) => leggTilSted(s, g.steder))
    TEORIER.forEach((s) => leggTilSted(s, g.teorier))

    // Klikk på kartet: vis info om nærmeste rute
    const visInfo = (latlng: L.LatLng) => {
      const { punkter: pk, resultat: res, vekter: v, kontekst: ktx } = siste.current
      if (!pk) return
      const klikk: LatLon = [latlng.lat, latlng.lng]
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
      const f = faktorer(p, v, ktx)
      const relativ = res ? res.relativ[best] : null
      const utelukket = relativ != null && relativ < 0.01
      const merknader = [
        SKYDEKKE.some((r) => iPolygon(klikk, r)) && 'Blått på Windy (utelukket)',
        SOL_I_DAG.some((r) => iPolygon(klikk, r)) && 'Klart på satellitt 23.09',
        TAAKE.some((r) => iPolygon(klikk, r)) && 'Tåke i morges (utelukket)',
        ktx.utelukket?.has(utelukkNokkel(klikk[0], klikk[1])) && 'Utelukket av fellesskapet (fjellbjørk/rødt)',
        ktx.innlandet.some((r) => iPolygon(klikk, r)) && 'I Innlandet fylke',
        ...TEORIER_LISTE.filter((t) => t.senter && avstand(klikk, t.senter) <= t.radiusKm).map((t) => `Teori: ${t.navn}`),
      ].filter(Boolean)
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
          ${relativ != null ? `<dt>Passer</dt><dd>${utelukket ? 'utelukket' : `${Math.round(relativ * 100)} % av beste rute`}</dd>` : ''}
        </dl>
        ${merknader.length ? `<ul class="pop-merk">${merknader.map((m) => `<li>${m}</li>`).join('')}</ul>` : ''}
        ${rader ? `<p class="pop-under">Slik passer ruta med hintene</p><dl>${rader}</dl>` : ''}
        <div class="lenker">
          <a target="_blank" rel="noopener" href="https://www.google.com/maps/@?api=1&map_action=map&center=${lat},${lon}&zoom=13&basemap=satellite">Satellitt</a>
          <a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${lat},${lon}">Google Maps</a>
        </div>
      </div>`
      onPopupRef.current()
      // Hold popupen unna tittel, tegnforklaring og knapper som ligger oppå kartet
      const popup = L.popup({
        maxWidth: 290,
        autoPanPaddingTopLeft: mobilRef.current ? [12, 250] : [440, 90],
        autoPanPaddingBottomRight: mobilRef.current ? [70, 150] : [70, 20],
      })
        .setLatLng(latlng)
        .setContent(html)
        .openOn(kart)
      stedsnavn(klikk[0], klikk[1]).then((navn) => {
        const el = popup.getElement()?.querySelector('[data-sted]')
        if (el && navn) el.textContent = `Nær ${navn}`
      })
    }
    visInfoRef.current = visInfo
    kart.on('click', (e: L.LeafletMouseEvent) => visInfo(e.latlng))
    // Klikk, dra eller zoom med musa i kartet: panelet går tilbake til smalt
    kart.on('mousedown dragstart', () => onKartBrukRef.current())
    kart.getContainer().addEventListener('wheel', () => onKartBrukRef.current(), { passive: true })

    return () => {
      kart.remove()
      kartRef.current = null
    }
    // Startutsnittet settes bare én gang
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
    const renderer = L.canvas({ padding: 0.3, pane: 'rutenett' })
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
      const k = klasse(resultat.relativ[i])
      r.setStyle(k < 0 ? { fillOpacity: 0 } : { fillColor: FARGE.modell[k], fillOpacity: [0.72, 0.62, 0.5, 0.38][k] })
    })
  }, [resultat])

  // Flyspor rundt 21:29
  useEffect(() => {
    const g = grupper.current
    if (!flyData || !g) return
    g.fly.clearLayers()
    for (const fly of flyData.fly) {
      const hovedfly = fly.kallesignal === FLY_PUNKT.kallesignal || fly.kallesignal === FLY_PUNKT2.kallesignal
      const naa = posisjon(fly, PEKETID_EKTE)
      const lavt = (naa?.fot ?? fly.spor[0][3]) < 3000
      L.polyline(
        fly.spor.map(([, la, lo]) => [la, lo] as LatLon),
        { color: FARGE.fly, weight: hovedfly ? 4 : 1.5, opacity: hovedfly ? 0.95 : lavt ? 0.25 : 0.55, bubblingMouseEvents: false },
      )
        .bindPopup(
          popupTekst(
            fly.kallesignal + (fly.type ? ` (${fly.type})` : ''),
            `Sporet 21:28–21:34 (ekte tid). ${naa ? `Kl. ${PEKETID_EKTE} var flyet i ca. ${Math.round(naa.fot).toLocaleString('nb-NO')} fot.` : ''}`,
          ),
        )
        .addTo(g.fly)
      if (naa) {
        L.circleMarker(naa.pos, { radius: hovedfly ? 6 : 3.5, color: '#fff', weight: 1.5, fillColor: FARGE.fly, fillOpacity: lavt ? 0.4 : 1 }).addTo(g.fly)
      }
    }
    for (const punkt of [FLY_PUNKT, FLY_PUNKT2]) {
      L.circle(punkt.pos, { radius: 10000, color: FARGE.fly, weight: 2, dashArray: '5 5', fillOpacity: 0.08, interactive: false }).addTo(g.fly)
    }
  }, [flyData])

  // Fellesskapets utelukkingskart
  useEffect(() => {
    const g = grupper.current
    if (!utelukket || !g) return
    g.utelukket.clearLayers()
    const renderer = L.canvas({ padding: 0.3, pane: 'rutenett' })
    const farger: Record<string, string> = { R: '#b91c1c', C: '#22d3ee' }
    for (const [la, lo, k] of utelukket) {
      L.rectangle(
        [
          [la - 0.025, lo - 0.05],
          [la + 0.025, lo + 0.05],
        ],
        { renderer, stroke: false, fillColor: farger[k] ?? '#dc2626', fillOpacity: k === 'R' ? 0.24 : 0.42, interactive: false },
      ).addTo(g.utelukket)
    }
  }, [utelukket])

  // 810–891 moh nær vei (2,7 eiffeltårn)
  useEffect(() => {
    const g = grupper.current
    if (!hoyde891 || !g) return
    g.hoyde891.clearLayers()
    const renderer = L.canvas({ padding: 0.3, pane: 'hoyde' })
    const [hla, hlo] = [hoyde891.dlat / 2, hoyde891.dlon / 2]
    for (const [la, lo, z, , so] of hoyde891.punkter) {
      const farge = z < 830 ? '#6d28d9' : z < 860 ? '#a78bfa' : '#1d4ed8'
      L.rectangle(
        [
          [la - hla, lo - hlo],
          [la + hla, lo + hlo],
        ],
        // Sterk farge der det går vei mot sørøst («kom fra den veien ←»), svak ellers
        { renderer, stroke: false, fillColor: farge, fillOpacity: so ? 0.7 : 0.2, interactive: false },
      ).addTo(g.hoyde891)
    }
  }, [hoyde891])

  // Lag fra default.no (hentet 24.09). Lastes én gang.
  useEffect(() => {
    const g = grupper.current
    if (!g) return
    const base = `${import.meta.env.BASE_URL}data/defaultno/`
    const hent = (f: string) => fetch(base + f).then((r) => (r.ok ? r.json() : null)).catch(() => null)
    const esc = (t: unknown) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
    const kilde = '<p class="kilde">Kilde: default.no</p>'
    for (const [id, navn] of [
      ['dn_hoyde', 'eiffel_band'],
      ['dn_vei', 'eiffel_road'],
    ] as const) {
      hent(`${navn}.json`).then((d: { bounds: L.LatLngBoundsExpression } | null) => {
        if (d) L.imageOverlay(`${base}${navn}.png`, d.bounds, { opacity: 0.7, interactive: false, pane: 'hoyde' }).addTo(g[id])
      })
    }
    type Stopp = { rank: number; name: string; lat: number; lon: number; walk: string; park_lat: number; park_lon: number; road_type: string; pine: boolean; nearest_building_m: number; checked: string }
    hent('plan.json').then((d: { stops: Stopp[] } | null) => {
      for (const s of d?.stops ?? []) {
        L.marker([s.lat, s.lon], { icon: pin('pin-plan', String(s.rank), 22) })
          .bindPopup(
            `<div class="pop"><h5>${s.rank}. ${esc(s.name)}</h5><p>Parker ved ${s.park_lat.toFixed(4)}, ${s.park_lon.toFixed(4)} (${esc(s.road_type)}). Gå ${esc(s.walk)}.</p><p>${s.pine ? 'Furu. ' : ''}Nærmeste hus ${s.nearest_building_m} m.${s.checked ? ` Sjekket: ${esc(s.checked)}.` : ''}</p>${kilde}</div>`,
          )
          .addTo(g.dn_plan)
      }
    })
    hent('rejected.json').then((d: { areas: { name: string; lat: number; lon: number; why: string }[] } | null) => {
      for (const a of d?.areas ?? []) {
        L.circleMarker([a.lat, a.lon], { radius: 9, color: '#475569', weight: 2, fillColor: '#94a3b8', fillOpacity: 0.6 })
          .bindPopup(`<div class="pop"><h5>Avvist: ${esc(a.name)}</h5><p>${esc(a.why)}</p>${kilde}</div>`)
          .addTo(g.dn_avvist)
      }
    })
    hent('pins.json').then((d: { lat: number; lon: number; note: string }[] | null) => {
      for (const n of d ?? []) {
        L.circleMarker([n.lat, n.lon], { radius: 6, color: '#fff', weight: 2, fillColor: '#1e293b', fillOpacity: 1 })
          .bindPopup(`<div class="pop"><h5>Feltnotat</h5><p>${esc(n.note)}</p>${kilde}</div>`)
          .addTo(g.dn_notater)
      }
    })
    hent('coop.json').then((d: { shops: { name: string; lat: number; lon: number; hours: string }[] } | null) => {
      for (const b of d?.shops ?? []) {
        L.circleMarker([b.lat, b.lon], { radius: 6, color: '#fff', weight: 2, fillColor: '#00843d', fillOpacity: 1 })
          .bindPopup(`<div class="pop"><h5>${esc(b.name)}</h5><p>${esc(b.hours) || 'Åpningstider ukjent'}</p>${kilde}</div>`)
          .addTo(g.coop)
      }
    })
  }, [])

  // Fellesskapets 800–900 moh-kart
  useEffect(() => {
    const g = grupper.current
    if (!fellesskap891 || !g) return
    g.fellesskap891.clearLayers()
    const renderer = L.canvas({ padding: 0.3, pane: 'hoyde' })
    for (const [la, lo] of fellesskap891) {
      L.rectangle(
        [
          [la - 0.0025, lo - 0.005],
          [la + 0.0025, lo + 0.005],
        ],
        { renderer, stroke: false, fillColor: '#e11d1d', fillOpacity: 0.45, interactive: false },
      ).addTo(g.fellesskap891)
    }
  }, [fellesskap891])

  // Kommunevurdering fra hordejakten.vercel.app
  useEffect(() => {
    const g = grupper.current
    if (!kommuner || !g) return
    g.kommuner.clearLayers()
    const farger: Record<string, string> = { usikkert: '#4d9b73', 'lite sannsynlig': '#64748b', utelukket: '#b91c1c' }
    for (const f of kommuner.features) {
      const p = f.properties as { navn: string; v: string }
      const geo = f.geometry as GeoJSON.MultiPolygon
      L.polygon(
        geo.coordinates.map((poly) => poly.map((ring) => ring.map(([lo, la]) => [la, lo] as LatLon))),
        { color: '#ffffff', weight: 0.6, fillColor: farger[p.v] ?? '#94a3b8', fillOpacity: p.v === 'usikkert' ? 0.35 : 0.2, bubblingMouseEvents: false },
      )
        .bindTooltip(`${p.navn}: ${p.v}`, { sticky: true, className: 'etikett' })
        .bindPopup(popupTekst(p.navn, `Vurdering: <b>${p.v}</b>. Kilde: hordejakten.vercel.app (23.09).`))
        .addTo(g.kommuner)
    }
  }, [kommuner])

  // Innlandet fylke
  useEffect(() => {
    const g = grupper.current
    if (!innlandet || !g) return
    g.innlandet.clearLayers()
    L.polygon(
      innlandet.coordinates.map((poly) => poly.map((ring) => ring.map(([lon, lat]) => [lat, lon] as LatLon))),
      { color: FARGE.innlandet, weight: 2.5, dashArray: '8 6', fillColor: FARGE.innlandet, fillOpacity: 0.05, interactive: false },
    ).addTo(g.innlandet)
  }, [innlandet])

  // Teori-områdene med prosent
  useEffect(() => {
    const g = grupper.current
    if (!g) return
    g.teoriomrader.clearLayers()
    const maks = Math.max(...Object.values(prosent))
    // Bare de fire største får etikett, ellers overlapper de på oversiktskartet
    const medEtikett = new Set(
      TEORIER_LISTE.filter((t) => t.senter)
        .sort((a, b) => prosent[b.id] - prosent[a.id])
        .slice(0, 4)
        .map((t) => t.id),
    )
    for (const t of TEORIER_LISTE) {
      if (!t.senter) continue
      const p = prosent[t.id]
      L.circle(t.senter, {
        radius: t.radiusKm * 1000,
        color: t.farge,
        weight: 1.5 + 3.5 * (p / maks),
        fillColor: t.farge,
        fillOpacity: 0.04 + 0.14 * (p / maks),
        interactive: false,
      }).addTo(g.teoriomrader)
      if (!medEtikett.has(t.id)) continue
      L.marker(t.senter, {
        icon: L.divIcon({
          className: '',
          html: `<div class="teori-merke" style="--f:${t.farge}"><b>${Math.round(p)}%</b><span>${t.etikett}</span></div>`,
          iconSize: [0, 0],
        }),
        interactive: false,
      }).addTo(g.teoriomrader)
    }
  }, [prosent])

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
      sektor: sektor(pos, 300, 25, 0.3, 0.9),
      pil: [pos, destinasjon(pos, 300, 0.6)] as LatLon[],
    })
    const { sektor: s, pil } = tegn(feltPos)
    if (!feltRef.current) {
      const sek = L.polygon(s, { color: FARGE.felt, weight: 2, fillOpacity: 0.22 }).addTo(g.felt)
      const p = L.polyline(pil, { color: FARGE.felt, weight: 2, dashArray: '4 6' }).addTo(g.felt)
      const m = L.marker(feltPos, { draggable: true, icon: pin('pin-felt', 'P', 30), zIndexOffset: 1000 })
        .bindPopup(popupTekst('Parkering', 'Dra meg til en parkering eller skogsbilvei. Grønt felt = der kassen bør ligge (ca. 300° ±25°, altså nordvest, 300–900 m, oppover, uten sti).'))
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
