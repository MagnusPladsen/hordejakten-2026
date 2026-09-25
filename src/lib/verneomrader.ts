// Verneområder og om jakt er lov der, lest fra hver verneforskrift. Dataene hentes først når laget slås på.
import L from 'leaflet'

import type { LagId } from '@/data/lag'

export type Jakt = 'forbudt' | 'delvis' | 'tillatt' | 'ukjent'

type Egenskaper = { navn: string; verneform: string; jakt: Jakt; setning: string; url: string }

export const JAKT_STIL: Record<Jakt, { farge: string; tekst: string; stil: L.PathOptions }> = {
  forbudt: { farge: '#be123c', tekst: 'All jakt forbudt', stil: { color: '#9f1239', weight: 1.5, fillColor: '#e11d48', fillOpacity: 0.4 } },
  delvis: { farge: '#be185d', tekst: 'Jakt delvis forbudt (bare noen arter eller perioder)', stil: { color: '#e11d48', weight: 1, fillColor: '#fda4af', fillOpacity: 0.3 } },
  tillatt: { farge: '#64748b', tekst: 'Jakt tillatt etter vanlige regler', stil: { color: '#64748b', weight: 1, fill: true, fillOpacity: 0.02 } },
  ukjent: { farge: '#7c3aed', tekst: 'Uklart, les forskriften', stil: { color: '#7c3aed', weight: 1.2, dashArray: '4 4', fillOpacity: 0.05 } },
}

const esc = (t: unknown) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

const VERNEFORM: Record<string, string> = {
  Naturreservat: 'Naturreservat',
  Nasjonalpark: 'Nasjonalpark',
  Landskapsvernomraade: 'Landskapsvernområde',
  LandskapsvernomraadePlantelivsfredning: 'Landskapsvernområde med plantelivsfredning',
  LandskapsvernomraadeDyrelivsfredning: 'Landskapsvernområde med dyrelivsfredning',
  LandskapsvernomraadeBiotopvern: 'Landskapsvernområde med biotopvern',
  Naturminne: 'Naturminne',
  Dyrefredningsomrade: 'Dyrefredningsområde',
  Dyrelivsfredning: 'Dyrelivsfredning',
  Plantefredningsomraade: 'Plantefredningsområde',
  Plantelivsfredning: 'Plantelivsfredning',
  Biotopvern: 'Biotopvern',
  BiotopvernVilt: 'Biotopvern (vilt)',
}

type Data = GeoJSON.FeatureCollection<GeoJSON.Geometry, Egenskaper>

let data: Promise<Data | null> | null = null
const hent = (): Promise<Data | null> =>
  (data ??= fetch(`${import.meta.env.BASE_URL}data/verneomrader_jakt.json`)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null))

function popup(p: Egenskaper) {
  const s = JAKT_STIL[p.jakt]
  return `<div class="pop"><h5>${esc(p.navn)}</h5><p>${esc(VERNEFORM[p.verneform] ?? p.verneform)}</p><p style="margin-top:6px;font-weight:650;color:${s.farge}">${esc(s.tekst)}</p>${
    p.setning ? `<p style="margin-top:6px">«${esc(p.setning)}»</p>` : p.jakt === 'tillatt' ? '<p style="margin-top:6px">Forskriften fredet ikke dyrelivet og nevner ikke jakt.</p>' : ''
  }${p.url ? `<div class="lenker"><a target="_blank" rel="noopener" href="${esc(p.url)}">Les verneforskriften</a></div>` : ''}<p class="kilde">Kilde: Miljødirektoratet og Lovdata. Sjekk alltid forskriften selv.</p></div>`
}

function lag(bare?: Jakt[]) {
  return async (g: L.FeatureGroup) => {
    const d = await hent()
    if (!d) {
      data = null
      throw new Error('Fant ikke verneområdene')
    }
    // Strengeste klasse øverst, så den er lett å trykke på
    const rekke: Jakt[] = ['tillatt', 'ukjent', 'delvis', 'forbudt']
    const f = d.features.filter((x) => !bare || bare.includes(x.properties.jakt)).sort((a, b) => rekke.indexOf(a.properties.jakt) - rekke.indexOf(b.properties.jakt))
    L.geoJSON({ ...d, features: f } as Data, {
      bubblingMouseEvents: false,
      style: (x) => JAKT_STIL[(x?.properties as Egenskaper).jakt].stil,
      onEachFeature: (x, l) => {
        const p = x.properties as Egenskaper
        l.bindTooltip(p.navn, { sticky: true, className: 'etikett' }).bindPopup(popup(p), { maxWidth: 300 })
      },
    }).addTo(g)
  }
}

export const VERN_LASTERE: Partial<Record<LagId, (g: L.FeatureGroup) => Promise<void>>> = {
  jaktfritt: lag(),
  jaktfritt_bare: lag(['forbudt']),
}
