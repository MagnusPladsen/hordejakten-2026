// Sannsynlighetsmodellen: hver rute får en poengsum = produktet av faktorene.
// En faktor med vekt w bidrar med (1 - w + w * f), så w = 0 betyr «ignorer hintet».
import { BERGEN, DEFAULTNO, OSLO, SKYANALYSE, SKYDEKKE, SOL_I_DAG, TEORIER } from '@/data/innhold'
import type { LagId } from '@/data/lag'
import { avstand, iPolygon, tversAvstand, type LatLon } from '@/lib/geo'

export type Punkt = { lat: number; lon: number; sek: number | null; meter: number | null; snap: number }

export type Vekter = {
  kjoretid: number
  timer: number
  slingring: number
  vei: number
  skyfri: number
  retning: number
  retningBegge: boolean
  skyanalyse: number
  defaultno: number
  fly: number
  bokstaver: number
  innlandet: number
  solidag: number
  bergen: number
}

export type FaktorId = 'kjoretid' | 'vei' | 'skyfri' | 'retning' | 'skyanalyse' | 'defaultno' | 'fly' | 'bokstaver' | 'innlandet' | 'solidag' | 'bergen'

export const FAKTORER: { id: FaktorId; navn: string; forklaring: string }[] = [
  { id: 'kjoretid', navn: 'Kjøretid fra Oslo', forklaring: 'Ruter nær valgt kjøretid får høyest poeng.' },
  { id: 'vei', navn: 'Nær bilvei', forklaring: '5–10 min gange fra bilen. Ruter langt fra vei trekkes ned.' },
  { id: 'skyfri', navn: 'Utelukk blått på Windy', forklaring: 'Hun så klar himmel. 100 % = blå områder er helt utelukket.' },
  { id: 'solidag', navn: 'Sol i dag (satellitt)', forklaring: 'Anja hadde sol mens det var skyet nesten overalt. Klare områder får høyest poeng.' },
  { id: 'innlandet', navn: 'Innlandet fylke', forklaring: 'Fellesskapet er sikre på Innlandet.' },
  { id: 'bokstaver', navn: 'Bokstavene: Norheimsund', forklaring: 'Nær Norheimsund, som vervebokstavene kan stave.' },
  { id: 'retning', navn: '298°-linja fra Oslo', forklaring: 'Teori: 118° er retningen mot Oslo.' },
  { id: 'bergen', navn: '118°-linja fra Bergen', forklaring: 'Teori: Horde-skiltet peker 118° fra Horde AS i Bergen, gjennom Telemark.' },
  { id: 'skyanalyse', navn: 'Skyanalyse (Agder)', forklaring: 'Fellesskapets sky- og flykart.' },
  { id: 'fly', navn: 'Fly rett over kl. 21:29', forklaring: 'Nær sporet til et fly som var i lufta da Anja pekte opp.' },
  { id: 'defaultno', navn: 'default.no-kandidater', forklaring: 'Nær toppkandidatene deres.' },
]

/** Ferdige teorier. `lag` slås på når teorien velges. */
export const FORHAND: { id: string; navn: string; vekter: Vekter; lag?: LagId[] }[] = [
  {
    id: 'innlandet',
    navn: 'Innlandet',
    vekter: { kjoretid: 0.4, timer: 5, slingring: 2.5, vei: 0.8, skyfri: 1, retning: 0, retningBegge: false, skyanalyse: 0, defaultno: 0.3, fly: 0.5, bokstaver: 0, innlandet: 1, solidag: 0.7, bergen: 0 },
    lag: ['innlandet'],
  },
  {
    id: 'fakta',
    navn: 'Harde fakta',
    vekter: { kjoretid: 0.8, timer: 7, slingring: 2, vei: 0.8, skyfri: 1, retning: 0, retningBegge: false, skyanalyse: 0, defaultno: 0, fly: 0, bokstaver: 0, innlandet: 0, solidag: 0.7, bergen: 0 },
  },
  {
    // Ser bort fra Windy-kartet, ellers blir hele Hardanger utelukket
    id: 'norheimsund',
    navn: 'Norheimsund',
    vekter: { kjoretid: 0.6, timer: 7, slingring: 1.5, vei: 0.8, skyfri: 0, retning: 0, retningBegge: false, skyanalyse: 0, defaultno: 0, fly: 0, bokstaver: 1, innlandet: 0, solidag: 0, bergen: 0 },
    lag: ['teorier'],
  },
  {
    id: 'retning',
    navn: 'Retningsteorien',
    vekter: { kjoretid: 0.8, timer: 7, slingring: 1.5, vei: 0.8, skyfri: 1, retning: 0.9, retningBegge: false, skyanalyse: 0, defaultno: 0, fly: 0, bokstaver: 0, innlandet: 0, solidag: 0, bergen: 0 },
    lag: ['retning'],
  },
  {
    id: 'fly',
    navn: 'Flyet kl. 21:29',
    vekter: { kjoretid: 0.4, timer: 5, slingring: 2, vei: 0.8, skyfri: 1, retning: 0, retningBegge: false, skyanalyse: 0, defaultno: 0, fly: 1, bokstaver: 0, innlandet: 0, solidag: 0.7, bergen: 0 },
    lag: ['fly'],
  },
  {
    id: 'kort',
    navn: 'Kortere tur (3–5 t)',
    vekter: { kjoretid: 1, timer: 4, slingring: 1, vei: 0.8, skyfri: 1, retning: 0, retningBegge: false, skyanalyse: 0, defaultno: 0.4, fly: 0, bokstaver: 0, innlandet: 0, solidag: 0, bergen: 0 },
  },
  {
    id: 'agder',
    navn: 'Agder-teorien',
    vekter: { kjoretid: 0.5, timer: 4, slingring: 1.5, vei: 0.8, skyfri: 1, retning: 0, retningBegge: false, skyanalyse: 0.9, defaultno: 0, fly: 0, bokstaver: 0, innlandet: 0, solidag: 0, bergen: 0 },
    lag: ['skyanalyse'],
  },
  {
    id: 'defaultno',
    navn: 'Som default.no',
    vekter: { kjoretid: 0.3, timer: 3.5, slingring: 2, vei: 0.8, skyfri: 1, retning: 0, retningBegge: false, skyanalyse: 0, defaultno: 1, fly: 0, bokstaver: 0, innlandet: 0, solidag: 0, bergen: 0 },
    lag: ['defaultno'],
  },
]

const gauss = (x: number, sigma: number) => Math.exp(-0.5 * (x / sigma) ** 2)

export type Kontekst = { flyPos: LatLon[]; innlandet: LatLon[][] }

export function faktorer(p: Punkt, v: Vekter, { flyPos, innlandet: innlandetRinger }: Kontekst): Record<FaktorId, number> {
  const pos: LatLon = [p.lat, p.lon]

  const kjoretid = p.sek == null ? 0 : gauss(p.sek / 3600 - v.timer, v.slingring)
  const vei = p.snap <= 1500 ? 1 : Math.exp(-(p.snap - 1500) / 2000)
  const skyfri = SKYDEKKE.some((ring) => iPolygon(pos, ring)) ? 0 : 1

  let retning = 0
  for (const kurs of v.retningBegge ? [298, 118] : [298]) {
    const { tvers, langs } = tversAvstand(OSLO, kurs, pos)
    if (langs <= 0) continue
    const sigma = Math.max(8, langs * Math.tan((5 * Math.PI) / 180))
    retning = Math.max(retning, gauss(tvers, sigma))
  }

  const norheimsund = TEORIER.find((t) => t.id === 'norheimsund')!
  const bokstaver = gauss(avstand(pos, norheimsund.pos), 20)
  const fraBergen = tversAvstand(BERGEN, 118, pos)
  const bergen = fraBergen.langs > 0 ? gauss(fraBergen.tvers, Math.max(8, fraBergen.langs * Math.tan((5 * Math.PI) / 180))) : 0
  const skyanalyse = gauss(avstand(pos, SKYANALYSE.senter), 35)
  const defaultno = Math.max(...DEFAULTNO.map((k) => gauss(avstand(pos, k.pos), 25)))

  // Pekte rett opp: flyet var trolig innen noen få km horisontalt. 10 km gir rom for tidsusikkerhet.
  let flyKm = Infinity
  if (v.fly > 0) for (const f of flyPos) flyKm = Math.min(flyKm, avstand(pos, f))
  const fly = flyPos.length ? gauss(flyKm, 10) : 1

  const solidag = SOL_I_DAG.some((r) => iPolygon(pos, r)) ? 1 : 0
  const innlandet = innlandetRinger.length ? (innlandetRinger.some((r) => iPolygon(pos, r)) ? 1 : 0) : 1

  return { kjoretid, vei, skyfri, retning, skyanalyse, defaultno, fly, bokstaver, innlandet, solidag, bergen }
}

export function poeng(f: Record<FaktorId, number>, v: Vekter): number {
  let s = 1
  for (const id of Object.keys(f) as FaktorId[]) {
    const w = v[id]
    s *= 1 - w + w * f[id]
  }
  return s
}

export type Resultat = {
  poeng: Float64Array
  /** Andel av rutene som har høyere poeng (0 = best) */
  andel: Float64Array
}

export function beregn(punkter: Punkt[], v: Vekter, ktx: Kontekst): Resultat {
  const n = punkter.length
  const s = new Float64Array(n)
  for (let i = 0; i < n; i++) s[i] = poeng(faktorer(punkter[i], v, ktx), v)
  const orden = Array.from({ length: n }, (_, i) => i).sort((a, b) => s[b] - s[a])
  const andel = new Float64Array(n)
  // Ruter som er så godt som utelukket skal aldri havne i en toppklasse, selv om mange har samme poeng
  const terskel = (orden.length ? s[orden[0]] : 0) * 0.01
  orden.forEach((idx, r) => (andel[idx] = s[idx] > terskel ? r / n : 1))
  return { poeng: s, andel }
}

/** Klasse 0–3 for fargen på kartet, eller -1 når ruta ikke skal vises */
export function klasse(andel: number): number {
  if (andel < 0.02) return 0
  if (andel < 0.05) return 1
  if (andel < 0.1) return 2
  if (andel < 0.25) return 3
  return -1
}

/** De beste områdene, minst `minKm` fra hverandre */
export function toppOmrader(punkter: Punkt[], res: Resultat, antall = 6, minKm = 40): number[] {
  const orden = Array.from({ length: punkter.length }, (_, i) => i).sort((a, b) => res.poeng[b] - res.poeng[a])
  const valgt: number[] = []
  for (const i of orden) {
    const p: LatLon = [punkter[i].lat, punkter[i].lon]
    if (valgt.every((j) => avstand(p, [punkter[j].lat, punkter[j].lon]) >= minKm)) valgt.push(i)
    if (valgt.length >= antall) break
  }
  return valgt
}
