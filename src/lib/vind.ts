// Vind kl. 17:49 den 23.09, da Anja skrev «vindstille». Dataene hentes først når laget slås på.
import L from 'leaflet'

import type { LagId } from '@/data/lag'

type Vind = { tid: string; dlat: number; dlon: number; celler: [number, number, number, number][] }

let data: Promise<Vind | null> | null = null
const hent = () => (data ??= fetch(`${import.meta.env.BASE_URL}data/vind.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null))

/** Farge og tekst per vindstyrke (m/s i 10 m høyde) */
export const VIND_KLASSER = [
  { maks: 2, farge: '#10b981', tekst: 'Under 2 m/s: passer med «vindstille»', opasitet: 0.18 },
  { maks: 4, farge: '#94a3b8', tekst: '2–4 m/s: mulig i le inne i skogen', opasitet: 0.22 },
  { maks: Infinity, farge: '#475569', tekst: 'Over 4 m/s: passer dårlig', opasitet: 0.45 },
]

export const VIND_LASTERE: Partial<Record<LagId, (g: L.FeatureGroup) => Promise<void>>> = {
  vind: async (g) => {
    const d = await hent()
    if (!d) return
    const renderer = L.canvas({ padding: 0.3, pane: 'rutenett' })
    for (const [la, lo, v, kast] of d.celler) {
      const k = VIND_KLASSER.find((x) => v < x.maks)!
      L.rectangle(
        [
          [la - d.dlat / 2, lo - d.dlon / 2],
          [la + d.dlat / 2, lo + d.dlon / 2],
        ],
        { renderer, stroke: false, fillColor: k.farge, fillOpacity: k.opasitet },
      )
        .bindPopup(
          `<div class="pop"><h5>Vind kl. 17:49 den 23.09</h5><p>${v.toLocaleString('nb-NO')} m/s, kast ${kast.toLocaleString('nb-NO')} m/s (10 m over bakken).</p><p>${k.tekst}.</p><p class="kilde">Modellvind fra open-meteo (MET Nordic).</p></div>`,
        )
        .addTo(g)
    }
  },
}
