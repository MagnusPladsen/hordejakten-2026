// Statskogs storviltjaktfelt: her går elgjakta, med rifle. Kassen står ikke i farlig terreng,
// så slike felt er lite sannsynlige. Dataene hentes først når laget slås på.
import L from 'leaflet'

import type { LagId } from '@/data/lag'

type Data = GeoJSON.FeatureCollection<GeoJSON.Geometry, { navn: string | null }>

let data: Promise<Data | null> | null = null
const hent = () => (data ??= fetch(`${import.meta.env.BASE_URL}data/storvilt.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null))

const esc = (t: unknown) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

export const STORVILT_LASTERE: Partial<Record<LagId, (g: L.FeatureGroup) => Promise<void>>> = {
  storvilt: async (g) => {
    const d = await hent()
    if (!d) return
    L.geoJSON(d, {
      style: { color: '#b45309', weight: 1.2, fillColor: '#f59e0b', fillOpacity: 0.28, dashArray: '4 3' },
      onEachFeature: (f, lag) =>
        lag.bindPopup(
          `<div class="pop"><h5>Elgjakt: ${esc(f.properties.navn ?? 'Storviltjaktfelt')}</h5><p>Statskogs storviltjaktfelt. Her jaktes elg med rifle nå (fra 25.09). Kassen står ikke i farlig terreng, så dette området er lite sannsynlig.</p><p class="kilde">Kilde: Statskog (Geonorge)</p></div>`,
        ),
    }).addTo(g)
  },
}
