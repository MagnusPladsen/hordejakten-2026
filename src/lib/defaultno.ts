// Kartlag fra default.no/map.php (hentet 24.09 kl. 18:36). Dataene hentes først når laget slås på.
import L from 'leaflet'

import type { LagId } from '@/data/lag'

const BASE = `${import.meta.env.BASE_URL}data/defaultno/`
const KILDE = '<p class="kilde">Kilde: default.no</p>'

const hent = <T>(f: string): Promise<T | null> =>
  fetch(BASE + f)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)

const esc = (t: unknown) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
const pop = (tittel: string, html: string) => `<div class="pop"><h5>${tittel}</h5>${html}${KILDE}</div>`
const tall = (x: number | null | undefined, des = 0) => (x == null ? '?' : x.toLocaleString('nb-NO', { maximumFractionDigits: des }))
const pst = (x: number | null | undefined) => (x == null ? '?' : `${Math.round(x * 100)} %`)
const tid = (t: string | null | undefined) => (t ? String(t).slice(0, 16).replace('T', ' ') : '')
const lenker = (lat: number, lon: number) =>
  `<div class="lenker"><a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${lat},${lon}">Google Maps</a><a target="_blank" rel="noopener" href="https://norgeskart.no/#!?project=norgeskart&layers=1002&zoom=13&lat=${lat}&lon=${lon}&markerLat=${lat}&markerLon=${lon}">Norgeskart</a></div>`

function punkt(pos: L.LatLngExpression, farge: string, radius: number, html: string, kant = '#fff') {
  return L.circleMarker(pos, { radius, color: kant, weight: 1.5, fillColor: farge, fillOpacity: 0.9, bubblingMouseEvents: false }).bindPopup(html, { maxWidth: 290 })
}

function nummer(pos: L.LatLngExpression, tekst: string, farge: string, html: string, str = 22) {
  return L.marker(pos, {
    icon: L.divIcon({
      className: '',
      html: `<div class="pin" style="width:${str}px;height:${str}px;background:${farge};color:#fff;border:2px solid #fff">${tekst}</div>`,
      iconSize: [str, str],
      iconAnchor: [str / 2, str / 2],
      popupAnchor: [0, -str / 2],
    }),
  }).bindPopup(html, { maxWidth: 290 })
}

/** Rutenett lagret som løp langs hver rad: [rad, kolonne, lengde, nivå, ...] */
type Grid = { lat0: number; dlat: number; lon0: number; dlon: number; lop: number[] }

function tegnGrid(g: L.FeatureGroup, d: Grid, stil: Record<number, [string, number]>) {
  const renderer = L.canvas({ padding: 0.3, pane: 'rutenett' })
  for (let n = 0; n < d.lop.length; n += 4) {
    const [i, j, len, k] = d.lop.slice(n, n + 4)
    const s = stil[k]
    if (!s) continue
    const lat = d.lat0 + i * d.dlat
    L.rectangle(
      [
        [lat - d.dlat / 2, d.lon0 + (j - 0.5) * d.dlon],
        [lat + d.dlat / 2, d.lon0 + (j + len - 0.5) * d.dlon],
      ],
      { renderer, stroke: false, fillColor: s[0], fillOpacity: s[1], interactive: false },
    ).addTo(g)
  }
}

// Samme farger som default.no: rødt = beste 2 %, oransje = topp 15 %, gult = topp 40 %
export const RANG_STIL: Record<number, [string, number]> = { 3: ['#ff1e14', 0.8], 2: ['#ff9614', 0.55], 1: ['#ffdc14', 0.3] }

type Fusjon = Grid & {
  omrader: { lat: number; lon: number; m10: number; m25: number; skog: number | null; deler: Record<string, number> }[]
  bevis: string[] | null
  oppdatert: string | null
}

const DEL_NAVN: Record<string, string> = {
  sun: 'sol',
  sunpath: 'solbane',
  aircraft: 'flylyd',
  weather: 'vær',
  live: 'MET nå',
  sighting: 'flyene hun så',
  rarity: 'INGEN FLY',
  satellite: 'satellittskyer',
  prior: 'forhånd',
  drive: 'kjøretid',
  rain: 'regn',
  pine: 'furu',
  berries: 'bær',
  furu: 'furu (NIBIO)',
}

function fusjon(fil: string, navn: string): Laster {
  return async (g) => {
    const d = await hent<Fusjon>(`fusjon/${fil}.json`)
    if (!d) return
    tegnGrid(g, d, RANG_STIL)
    d.omrader.forEach((a, k) => {
      const deler = Object.entries(a.deler)
        .map(([n, v]) => `${DEL_NAVN[n] ?? n} ${v}`)
        .join(', ')
      nummer(
        [a.lat, a.lon],
        String(k + 1),
        k === 0 ? '#dc2626' : '#b45309',
        pop(
          `#${k + 1} i «${esc(navn)}»`,
          `<p>${a.lat.toFixed(2)}, ${a.lon.toFixed(2)}</p><dl><dt>Sannsynlighet innen 10 km</dt><dd>${pst(a.m10)}</dd><dt>Innen 25 km</dt><dd>${pst(a.m25)}</dd>${a.skog != null ? `<dt>Skog</dt><dd>${pst(a.skog)}</dd>` : ''}</dl>${deler ? `<p class="pop-koord">Straff per bevis (0 = passer): ${esc(deler)}</p>` : ''}${lenker(a.lat, a.lon)}`,
        ),
        20,
      ).addTo(g)
    })
  }
}

type Laster = (g: L.FeatureGroup) => Promise<void>

const ALT_FARGE = (fot: number | null) => {
  const t = Math.min(1, Math.max(0, (fot ?? 0) / 40000))
  return `rgb(${Math.round(68 + 185 * t)},${Math.round(1 + 230 * t)},${Math.round(84 - 47 * t)})`
}

export const DN_LASTERE: Partial<Record<LagId, Laster>> = {
  dn_skytefelt: async (g) => {
    const d = await hent<{ felt: { navn: string; type: string; status: string; ringer: [number, number][][] }[] }>('skytefelt.json')
    for (const f of d?.felt ?? []) {
      L.polygon(f.ringer, { color: '#b91c1c', weight: 2, dashArray: '6 4', fillColor: '#dc2626', fillOpacity: 0.18, bubblingMouseEvents: false })
        .bindTooltip(f.navn, { sticky: true, className: 'etikett' })
        .bindPopup(
          pop(
            esc(f.navn),
            `<p>${f.type === 'øvingsfelt' ? 'Øvingsfelt' : 'Skyte- og øvingsfelt'}, ${f.status === 'brukes' ? 'i bruk' : esc(f.status)}. Forsvarets felt, ikke gå inn.</p><p>Anja skrev «INGEN SKYTING». default.no regner med at kassen ikke står her.</p>`,
          ),
        )
        .addTo(g)
    }
  },

  dn_hogst: async (g) => {
    const d = await hent<{ omrader: { rank: number; bounds: L.LatLngBoundsExpression }[] }>('omrader.json')
    for (const a of d?.omrader ?? []) {
      L.imageOverlay(`${BASE}hogst/logging_${String(a.rank).padStart(2, '0')}.png`, a.bounds, { opacity: 0.8, interactive: false, pane: 'hoyde' }).addTo(g)
      L.rectangle(a.bounds, { color: '#78716c', weight: 1, dashArray: '3 5', fill: false, interactive: false }).addTo(g)
    }
  },

  dn_steder: async (g) => {
    type Sted = { lat: number; lon: number; score: number; abs: number; moh: number; vei_m: number; vei: string; veinavn: string | null; opp: number; relieff: string; furu: boolean; hogst_m: number | null; tog_m: number | null; omr: number }
    const d = await hent<{ retning: number; omrader: { rank: number; b: L.LatLngBoundsExpression }[]; steder: Sted[] }>('steder.json')
    if (!d) return
    for (const a of d.omrader) {
      L.imageOverlay(`${BASE}steder/sites_${String(a.rank).padStart(2, '0')}.png`, a.b, { opacity: 0.6, interactive: false, pane: 'hoyde' }).addTo(g)
    }
    d.steder.forEach((s, k) => {
      punkt(
        [s.lat, s.lon],
        '#16a34a',
        6,
        pop(
          `Sted ${k + 1} (område ${s.omr})`,
          `<p>${s.lat.toFixed(5)}, ${s.lon.toFixed(5)}</p><dl><dt>Passer</dt><dd>${tall(s.score, 2)}</dd><dt>Høyde</dt><dd>${s.moh} moh</dd><dt>Vei</dt><dd>${esc(s.veinavn ?? s.vei)}, ${s.vei_m} m unna</dd><dt>Stigning fra vei</dt><dd>${tall(s.opp)} m</dd><dt>Relieff mot ${d.retning}°</dt><dd>${s.relieff === 'match' ? 'passer' : esc(s.relieff)}</dd><dt>Furu</dt><dd>${s.furu ? 'ja' : 'nei'}</dd>${s.hogst_m != null ? `<dt>Nærmeste hogst</dt><dd>${s.hogst_m} m</dd>` : ''}${s.tog_m != null ? `<dt>Til jernbane</dt><dd>${tall(s.tog_m / 1000, 1)} km</dd>` : ''}</dl>${lenker(s.lat, s.lon)}`,
        ),
      ).addTo(g)
    })
  },

  dn_omrader: async (g) => {
    type Omr = { rank: number; lat: number; lon: number; p: number; b: L.LatLngBoundsExpression; sterk: number; mulig: number; furu: number | null; hogd22: number | null; hogd24: number | null; ekstra: boolean; merke: string | null }
    const d = await hent<{ omrader: Omr[] }>('steder.json')
    const maks = Math.max(...(d?.omrader ?? []).map((a) => a.p), 0.01)
    for (const a of d?.omrader ?? []) {
      const html = pop(
        `Område ${a.rank}${a.ekstra ? ' (hypotese)' : ''}`,
        `<dl><dt>Andel av sannsynligheten</dt><dd>${pst(a.p)}</dd><dt>Sterke steder</dt><dd>${tall(a.sterk, 1)} km²</dd><dt>Mulige steder</dt><dd>${tall(a.mulig, 1)} km²</dd>${a.furu != null ? `<dt>Furu</dt><dd>${tall(a.furu)} km²</dd>` : ''}${a.hogd22 != null ? `<dt>Hogd 2022+</dt><dd>${tall(a.hogd22, 1)} km²</dd>` : ''}${a.hogd24 != null ? `<dt>Hogd 2024+</dt><dd>${tall(a.hogd24, 1)} km²</dd>` : ''}</dl>${a.ekstra ? '<p>Hypotese: ikke fra fusjonsmodellen.</p>' : ''}`,
      )
      // Bare kant, siden områdene overlapper. Nummeret har popupen, så trykk i kartet viser fortsatt info om ruta.
      L.rectangle(a.b, { color: '#c2410c', weight: 1 + 3 * (a.p / maks), dashArray: a.ekstra ? '4 5' : undefined, fill: false, interactive: false }).addTo(g)
      nummer([a.lat, a.lon], String(a.rank), '#7c2d12', html, a.rank > 99 ? 28 : 22).addTo(g)
    }
  },

  dn_fusjon: fusjon('alle', 'Alt bevis'),
  dn_fusjon_utenlyd: fusjon('utenlyd', 'Uten lyd og sol'),
  dn_fusjon_fly: fusjon('fly', 'Bare flyene hun så'),
  dn_fusjon_flyskog: fusjon('flyskog', 'Flyene + skog'),
  dn_fusjon_stille: fusjon('stille', 'Flyene + INGEN FLY'),
  dn_fusjon_stilleskog: fusjon('stilleskog', 'Flyene + INGEN FLY + skog'),
  dn_fusjon_utenmerker: fusjon('utenmerker', 'Uten håndmerkede flylyder'),
  dn_fusjon_utenfly: fusjon('utenfly', 'Uten fly'),
  dn_fusjon_utenflylyd: fusjon('utenflylyd', 'Uten flylyd'),

  dn_sjelden: async (g) => {
    type Topp = { lat: number; lon: number; r: number; dag: number; e2130: number; e2028: number }
    const d = await hent<Grid & { grad: number; topp: Topp[] }>('sjelden.json')
    if (!d) return
    tegnGrid(g, d, { 1: ['#50c8ff', 0.2], 2: ['#50c8ff', 0.4], 3: ['#0ea5e9', 0.65] })
    d.topp.slice(0, 12).forEach((t, k) =>
      nummer(
        [t.lat, t.lon],
        String(k + 1),
        '#0369a1',
        pop(
          `Stille himmel #${k + 1}`,
          `<dl><dt>Fly over ${d.grad}° kl. 07–18:31</dt><dd>${t.dag}</dd><dt>Høyeste fly 21:30</dt><dd>${Math.round(t.e2130)}°</dd><dt>Høyeste fly 20:28</dt><dd>${Math.round(t.e2028)}°</dd></dl>${lenker(t.lat, t.lon)}`,
        ),
        20,
      ).addTo(g),
    )
  },

  dn_flylyd: async (g) => {
    const d = await hent<Grid>('flylyd.json')
    if (d) tegnGrid(g, d, RANG_STIL)
  },

  dn_baer: async (g) => {
    const d = await hent<Grid>('baer.json')
    if (!d) return
    const stil: Record<number, [string, number]> = {}
    for (let k = 1; k <= 5; k++) {
      const v = (k - 0.5) / 5
      stil[k] = [`rgb(${Math.round(255 * v)},60,${Math.round(255 * (1 - v))})`, 0.35]
    }
    tegnGrid(g, d, stil)
  },

  dn_baerfunn: async (g) => {
    const d = await hent<{ tytte: [number, number, string][]; blaa: [number, number, string][] }>('baerfunn.json')
    if (!d) return
    for (const [liste, farge, navn] of [
      [d.tytte, '#cc0000', 'Tyttebær'],
      [d.blaa, '#0066cc', 'Blåbær'],
    ] as const) {
      for (const [la, lo, ar] of liste) {
        L.circleMarker([la, lo], { radius: 2.5, color: farge, weight: 1, fillColor: farge, fillOpacity: 0.8, bubblingMouseEvents: false })
          .bindPopup(pop(navn, `<p>Funnet ${ar}. Artsdatabanken via GBIF.</p>`))
          .addTo(g)
      }
    }
  },

  dn_orrfugl: async (g) => fugl(g, 'orr', '#cc0000'),
  dn_storfugl: async (g) => fugl(g, 'stor', '#7700aa'),

  dn_leder: async (g) => {
    const d = await hent<{ pilegrim: [number, number][][]; osterdal: [number, number][][] }>('leder.json')
    if (!d) return
    const pil = pop('Pilegrimsled', '<p>Merket pilegrimsled mot Nidaros (OpenStreetMap). Anja skrev «INGEN STIER», så kassen står neppe rett ved en merket led.</p>')
    for (const s of d.pilegrim) L.polyline(s, { color: '#cc88aa', weight: 2, opacity: 0.8, bubblingMouseEvents: false }).bindPopup(pil).addTo(g)
    const ost = pop('Østerdalsleden', '<p>Pilegrimsled fra Rena via Tynset til Trondheim (OpenStreetMap). Anja skrev «INGEN STIER».</p>')
    for (const s of d.osterdal) L.polyline(s, { color: '#f59e0b', weight: 4, opacity: 0.9, bubblingMouseEvents: false }).bindPopup(ost).addTo(g)
  },

  dn_vegkamera: async (g) => {
    type St = { navn: string; lat: number; lon: number; vei: string | null; regn: number | null; temp: number | null; rf: number | null; kam: string[] }
    const d = await hent<{ bilde: string; tid: string; stasjoner: St[] }>('vegkamera.json')
    if (!d) return
    for (const s of d.stasjoner) {
      const regn = (s.regn ?? 0) > 0
      const farge = regn ? '#2563eb' : s.regn == null ? '#94a3b8' : '#f59e0b'
      const kam = s.kam.map((id, i) => `<a target="_blank" rel="noopener" href="${esc(d.bilde + id)}">Kamera${s.kam.length > 1 ? ` ${i + 1}` : ''}</a>`).join('')
      const maling = [s.regn != null && `nedbør ${s.regn} mm/t`, s.temp != null && `${s.temp} °C`, s.rf != null && `luftfuktighet ${s.rf} %`].filter(Boolean).join(', ')
      punkt(
        [s.lat, s.lon],
        farge,
        regn ? 7 : 5,
        pop(
          esc(s.navn),
          `<p>${esc(s.vei ?? '')}${maling ? `. ${maling} (${d.tid.slice(0, 16)})` : ''}.</p><p>Kamerabildet er det siste fra Statens vegvesen, ikke fra ${d.tid.slice(8, 10)}.${d.tid.slice(5, 7)}.</p>${kam ? `<div class="lenker">${kam}</div>` : ''}`,
        ),
      ).addTo(g)
    }
  },

  dn_met: async (g) => {
    const d = await hent<{ tid: string; punkter: [number, number, number | null, number | null, number | null, number | null][] }>('met.json')
    for (const [la, lo, t, sky, regn, rf] of d?.punkter ?? []) {
      const vatt = (regn ?? 0) > 0.1
      punkt(
        [la, lo],
        vatt ? '#2563eb' : sky != null && sky > 70 ? '#a8a29e' : '#fde68a',
        5,
        pop('MET nå', `<p>${tall(t, 1)} °C, skyer ${tall(sky)} %, luftfuktighet ${tall(rf)} %. ${vatt ? '<b>Regner.</b>' : 'Tørt.'}</p><p class="pop-koord">${tid(d?.tid)}</p>`),
        '#57534e',
      ).addTo(g)
    }
  },

  dn_vaer: async (g) => {
    type St = { navn: string; lat: number; lon: number; moh: number | null; score: number | null; dugg: number | null; regn: number | null; stigning: number | null }
    const d = await hent<{ dato: string; stasjoner: St[] }>('vaer.json')
    if (!d) return
    const maks = Math.max(1, ...d.stasjoner.map((s) => s.score ?? 0))
    for (const s of d.stasjoner) {
      const q = Math.min(1, (s.score ?? 0) / maks)
      const farge = `rgb(${Math.round(80 + 175 * q)},${Math.round(207 - 150 * q)},${Math.round(151 - 100 * q)})`
      punkt(
        [s.lat, s.lon],
        farge,
        5,
        pop(
          esc(s.navn),
          `<dl>${s.moh != null ? `<dt>Høyde</dt><dd>${s.moh} moh</dd>` : ''}<dt>Likhet med kameraet</dt><dd>${tall(s.score, 2)}</dd>${s.dugg != null ? `<dt>Duggpunkt-avstand ved daggry</dt><dd>${s.dugg} °C</dd>` : ''}${s.regn != null ? `<dt>Regn 07–12</dt><dd>${s.regn} mm</dd>` : ''}${s.stigning != null ? `<dt>Temperaturstigning til 11</dt><dd>${s.stigning} °C</dd>` : ''}</dl><p class="pop-koord">Frost (MET), ${esc(d.dato)}</p>`,
        ),
        '#44403c',
      ).addTo(g)
    }
  },

  dn_flyhendelser: async (g) => {
    type Fly = { k: string; t: string | null; rute: string | null; sel: string | null; min: number | null; maks: number | null; fart: number | null; kurs: number | null; h: string; spor: [number, number][]; pek: [number, number, number] | null; lyd: [number, number, number] | null }
    const d = await hent<{ fly: Fly[] }>('flyhendelser.json')
    for (const f of d?.fly ?? []) {
      const html = pop(
        `${esc(f.k)}${f.t ? ` (${esc(f.t)})` : ''}`,
        `<p>${f.rute ? `${esc(f.rute)}. ` : ''}${f.sel ? esc(f.sel) : ''}</p><dl><dt>Hendelse</dt><dd>${esc(f.h)}</dd><dt>Høyde</dt><dd>${tall(f.min)}–${tall(f.maks)} fot</dd><dt>Fart</dt><dd>${tall(f.fart)} knop</dd><dt>Kurs</dt><dd>${tall(f.kurs)}°</dd></dl>`,
      )
      L.polyline(f.spor, { color: ALT_FARGE(f.maks), weight: 2.5, opacity: 0.85, bubblingMouseEvents: false })
        .bindTooltip(`${f.k} ${Math.round((f.maks ?? 0) / 1000)}k fot`, { sticky: true, className: 'etikett' })
        .bindPopup(html)
        .addTo(g)
      if (f.pek) punkt([f.pek[0], f.pek[1]], '#d946ef', 4.5, pop(esc(f.k), `<p>Her var flyet da hun reagerte (${tall(f.pek[2])} fot).</p>`)).addTo(g)
      if (f.lyd) punkt([f.lyd[0], f.lyd[1]], '#ef4444', 4.5, pop(esc(f.k), `<p>Her var flyet ca. 35 sek før lyden var sterkest (${tall(f.lyd[2])} fot).</p>`)).addTo(g)
    }
  },

  dn_pizza: async (g) => {
    const d = await hent<{ navn: string; lat: number; lon: number; type: string | null; kjokken: string | null; sted: string | null; tid: string | null }[]>('pizza.json')
    for (const p of d ?? []) {
      punkt([p.lat, p.lon], '#dd5500', 6, pop(esc(p.navn), `<p>${[p.sted, p.kjokken].filter(Boolean).map(esc).join(', ')}</p><p>${esc(p.tid) || 'Åpningstider ukjent'}</p>`)).addTo(g)
    }
  },

  dn_gasoner: async (g) => {
    type Omr = { rank: number; lat: number; lon: number; b: L.LatLngBoundsExpression; vei_km: number; skog: number; km2: number | null; opp: number | null; tort: number | null }
    const d = await hent<{ band: [number, number]; omrader: Omr[] }>('gasoner.json')
    if (!d) return
    for (const a of d.omrader) {
      L.imageOverlay(`${BASE}gasoner/overlay_${String(a.rank).padStart(2, '0')}.png`, a.b, { opacity: 0.85, interactive: false, pane: 'hoyde' }).addTo(g)
      L.rectangle(a.b, { color: '#1d4ed8', weight: 1, dashArray: '4 4', fill: false, interactive: false }).addTo(g)
      nummer(
        [a.lat, a.lon],
        String(a.rank),
        '#1d4ed8',
          pop(
            `Gå-sone ${a.rank}`,
            `<dl><dt>Veier i området</dt><dd>${tall(a.vei_km)} km</dd><dt>Skog ${d.band[0]}–${d.band[1]} m fra vei</dt><dd>${pst(a.skog)}</dd><dt>Oppover fra vei</dt><dd>${pst(a.opp)}</dd>${a.km2 != null ? `<dt>Kandidat-areal</dt><dd>${tall(a.km2, 1)} km²</dd>` : ''}${a.tort != null ? `<dt>Tørt</dt><dd>${pst(a.tort)}</dd>` : ''}</dl>`,
          ),
      ).addTo(g)
    }
  },

  dn_regn: async (g) => {
    const d = await hent<Grid>('regn.json')
    if (d) tegnGrid(g, d, { 1: ['#1c6fd6', 0.22], 2: ['#1c6fd6', 0.42], 3: ['#1c6fd6', 0.65] })
  },

  dn_radar: async (g) => {
    const d = await hent<{ b: L.LatLngBoundsExpression }>('radar.json')
    if (d) L.imageOverlay(`${BASE}radar.png`, d.b, { opacity: 0.7, interactive: false, pane: 'hoyde' }).addTo(g)
  },

  dn_satellitt: async (g) => {
    L.tileLayer('https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/HLS_S30_Nadir_BRDF_Adjusted_Reflectance/default/2026-09-21/GoogleMapsCompatible_Level12/{z}/{y}/{x}.png', {
      maxNativeZoom: 12,
      maxZoom: 18,
      opacity: 0.9,
      attribution: 'NASA GIBS / HLS via default.no',
    }).addTo(g)
  },
}

// Rutene ligger under de andre lagene, så de er ikke klikkbare
async function fugl(g: L.FeatureGroup, art: 'orr' | 'stor', farge: string) {
  const d = await hent<{ steg: number; orr: [number, number, number][]; stor: [number, number, number][] }>('fugl.json')
  if (!d) return
  const celler = d[art]
  const maks = Math.max(1, ...celler.map((c) => c[2]))
  const renderer = L.canvas({ padding: 0.3, pane: 'rutenett' })
  for (const [la, lo, n] of celler) {
    L.rectangle(
      [
        [la, lo],
        [la + d.steg, lo + d.steg],
      ],
      { renderer, stroke: false, fillColor: farge, fillOpacity: Math.min(0.75, 0.15 + (0.6 * Math.log(1 + n)) / Math.log(1 + maks)), interactive: false },
    ).addTo(g)
  }
}
