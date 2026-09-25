// Hvor skogen ligner «35 % bjørk, 25 % gran, 40 % furu» (tavla 25.09 kl. 18:13).
// Andeler regnet ut fra NIBIOs SR16-kart. Dataene hentes først når laget slås på.
import L from 'leaflet'

import type { LagId } from '@/data/lag'

type Data = { dlat: number; dlon: number; celler: [number, number, number, number, number, number][] }

let data: Promise<Data | null> | null = null
const hent = () => (data ??= fetch(`${import.meta.env.BASE_URL}data/treslag.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null))

export const TRESLAG_KLASSER = [
  { min: 0.85, farge: '#166534', tekst: 'Svært lik (over 85 %)' },
  { min: 0.75, farge: '#16a34a', tekst: 'Lik (75–85 %)' },
  { min: 0.65, farge: '#86efac', tekst: 'Litt lik (65–75 %)' },
]

const pst = (x: number) => `${Math.round(x * 100)} %`

export const TRESLAG_LASTERE: Partial<Record<LagId, (g: L.FeatureGroup) => Promise<void>>> = {
  treslag: async (g) => {
    const d = await hent()
    if (!d) return
    const renderer = L.canvas({ padding: 0.3, pane: 'hoyde' })
    for (const [la, lo, poeng, furu, gran, lauv] of d.celler) {
      const k = TRESLAG_KLASSER.find((x) => poeng >= x.min)
      if (!k) continue
      L.rectangle(
        [
          [la - d.dlat / 2, lo - d.dlon / 2],
          [la + d.dlat / 2, lo + d.dlon / 2],
        ],
        { renderer, stroke: false, fillColor: k.farge, fillOpacity: 0.55 },
      )
        .bindPopup(
          `<div class="pop"><h5>Skogen her: ${pst(poeng)} lik</h5><p>Furu ${pst(furu)} · gran ${pst(gran)} · lauv (mest bjørk) ${pst(lauv)}.</p><p>Anja skrev: furu 40 %, gran 25 %, bjørk 35 %.</p><p class="kilde">Kilde: NIBIO SR16 (dominerende treslag per bestand).</p></div>`,
        )
        .addTo(g)
    }
  },
}
