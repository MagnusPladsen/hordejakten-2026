// Sannsynlighetsmodellen: hver rute får en poengsum = produktet av faktorene.
// En faktor med vekt w bidrar med (1 - w + w * f), så w = 0 betyr «ignorer hintet».
import { BERGEN, DEFAULTNO, OSLO, SKYANALYSE, SKYDEKKE, SOL_I_DAG, TAAKE, TEORIER } from '@/data/innhold'
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
  utelukket: number
}

export type FaktorId = 'kjoretid' | 'vei' | 'skyfri' | 'retning' | 'skyanalyse' | 'defaultno' | 'fly' | 'bokstaver' | 'innlandet' | 'solidag' | 'bergen' | 'utelukket'

export const FAKTORER: { id: FaktorId; navn: string; forklaring: string }[] = [
  { id: 'kjoretid', navn: 'Kjøretid fra Oslo', forklaring: 'Usikkert: hun sov og vet ikke hvor lenge de kjørte. Ruter nær valgt kjøretid får høyest poeng.' },
  { id: 'vei', navn: 'Nær bilvei', forklaring: '5–10 min gange fra bilen. Ruter langt fra vei trekkes ned.' },
  { id: 'skyfri', navn: 'Utelukk skyer og tåke', forklaring: 'Hun så klar himmel. 100 % = blått på Windy og tåka i Odal er helt utelukket.' },
  { id: 'solidag', navn: 'Sol i dag (satellitt)', forklaring: 'Anja hadde sol mens det var skyet nesten overalt. Klare områder får høyest poeng.' },
  { id: 'utelukket', navn: 'Fellesskapets utelukkingskart', forklaring: 'Utelukker rødt, rosa (ingen sopp) og lyseblått (fjellbjørk) fra kartet i chatten.' },
  { id: 'innlandet', navn: 'Innlandet fylke', forklaring: 'Fellesskapet er sikre på Innlandet.' },
  { id: 'bokstaver', navn: 'Bokstavene: Norheimsund', forklaring: 'Nær Norheimsund, som vervebokstavene kan stave.' },
  { id: 'retning', navn: '298°-linja fra Oslo', forklaring: 'Teori: 118° er retningen mot Oslo.' },
  { id: 'bergen', navn: '118°-linja fra Bergen', forklaring: 'Teori: Horde-skiltet peker 118° fra Horde AS i Bergen, gjennom Telemark.' },
  { id: 'skyanalyse', navn: 'Skyanalyse (Agder)', forklaring: 'Fellesskapets sky- og flykart.' },
  { id: 'fly', navn: 'Fly rett over kl. 21:29', forklaring: 'Nær sporet til et fly som var i lufta da Anja pekte opp.' },
  { id: 'defaultno', navn: 'default.no-kandidater', forklaring: 'Nær toppkandidatene deres.' },
]

/** Ferdige teorier. `lag` slås på når teorien velges. */
export const FORHAND: { id: string; navn: string; beskrivelse: string; vekter: Vekter; lag?: LagId[] }[] = [
  {
    id: 'alt',
    navn: 'Alt vi har',
    beskrivelse: 'Alle hintene samlet: vær, sol i dag, flyet, Innlandet og default.no. Ikke kjøretid, fordi den er usikker.',
    vekter: { kjoretid: 0, timer: 7, slingring: 2, vei: 0.8, skyfri: 1, retning: 0, retningBegge: false, skyanalyse: 0, defaultno: 0.3, fly: 0.6, bokstaver: 0, innlandet: 0.5, solidag: 0.4, bergen: 0, utelukket: 0.8 },
  },
  {
    id: 'fakta',
    navn: 'Bare bekreftet',
    beskrivelse: 'Bare det som er bekreftet: nær bilvei og klar himmel der hun var. Ikke kjøretid, fordi hun sov og ikke vet hvor lenge de kjørte.',
    vekter: { kjoretid: 0, timer: 7, slingring: 2, vei: 0.8, skyfri: 1, retning: 0, retningBegge: false, skyanalyse: 0, defaultno: 0, fly: 0, bokstaver: 0, innlandet: 0, solidag: 0, bergen: 0, utelukket: 0 },
  },
  {
    id: 'innlandet',
    navn: 'Innlandet',
    beskrivelse: 'Bare Innlandet fylke, uten områdene som var blå på Windy.',
    vekter: { kjoretid: 0, timer: 5, slingring: 2.5, vei: 0.8, skyfri: 1, retning: 0, retningBegge: false, skyanalyse: 0, defaultno: 0.3, fly: 0.5, bokstaver: 0, innlandet: 1, solidag: 0.7, bergen: 0, utelukket: 0 },
    lag: ['innlandet'],
  },
  {
    // Ser bort fra Windy-kartet, ellers blir hele Hardanger utelukket
    id: 'norheimsund',
    navn: 'Norheimsund',
    beskrivelse: 'Tester bokstav-teorien. Ser bort fra Windy-kartet.',
    vekter: { kjoretid: 0, timer: 7, slingring: 1.5, vei: 0.8, skyfri: 0, retning: 0, retningBegge: false, skyanalyse: 0, defaultno: 0, fly: 0, bokstaver: 1, innlandet: 0, solidag: 0, bergen: 0, utelukket: 0 },
    lag: ['teorier'],
  },
  {
    id: 'retning',
    navn: 'Retningsteorien',
    beskrivelse: 'Tester at 118° på tavla peker fra kassen mot Oslo.',
    vekter: { kjoretid: 0.3, timer: 7, slingring: 1.5, vei: 0.8, skyfri: 1, retning: 0.9, retningBegge: false, skyanalyse: 0, defaultno: 0, fly: 0, bokstaver: 0, innlandet: 0, solidag: 0, bergen: 0, utelukket: 0 },
    lag: ['retning'],
  },
  {
    id: 'fly',
    navn: 'Flyet kl. 21:29',
    beskrivelse: 'Nær flyene som var i lufta da Anja pekte rett opp.',
    vekter: { kjoretid: 0, timer: 5, slingring: 2, vei: 0.8, skyfri: 1, retning: 0, retningBegge: false, skyanalyse: 0, defaultno: 0, fly: 1, bokstaver: 0, innlandet: 0, solidag: 0.7, bergen: 0, utelukket: 0 },
    lag: ['fly'],
  },
  {
    id: 'kort',
    navn: 'Kortere tur (3–5 t)',
    beskrivelse: 'En kortere kjøretur, 3–5 t fra Oslo.',
    vekter: { kjoretid: 1, timer: 4, slingring: 1, vei: 0.8, skyfri: 1, retning: 0, retningBegge: false, skyanalyse: 0, defaultno: 0.4, fly: 0, bokstaver: 0, innlandet: 0, solidag: 0, bergen: 0, utelukket: 0 },
  },
  {
    id: 'agder',
    navn: 'Agder-teorien',
    beskrivelse: 'Skyanalysen og ekornet i Froland.',
    vekter: { kjoretid: 0, timer: 4, slingring: 1.5, vei: 0.8, skyfri: 1, retning: 0, retningBegge: false, skyanalyse: 0.9, defaultno: 0, fly: 0, bokstaver: 0, innlandet: 0, solidag: 0, bergen: 0, utelukket: 0 },
    lag: ['skyanalyse'],
  },
  {
    id: 'defaultno',
    navn: 'Som default.no',
    beskrivelse: 'Nær default.no sine toppkandidater.',
    vekter: { kjoretid: 0, timer: 3.5, slingring: 2, vei: 0.8, skyfri: 1, retning: 0, retningBegge: false, skyanalyse: 0, defaultno: 1, fly: 0, bokstaver: 0, innlandet: 0, solidag: 0, bergen: 0, utelukket: 0 },
    lag: ['defaultno'],
  },
]

const gauss = (x: number, sigma: number) => Math.exp(-0.5 * (x / sigma) ** 2)

export type Kontekst = { flyPos: LatLon[]; innlandet: LatLon[][]; utelukket?: Set<string> }

type Faste = Omit<Record<FaktorId, number>, 'kjoretid' | 'retning'>

// Faktorene som ikke avhenger av vektene regnes bare én gang per rute og kontekst
const fasteCache = new WeakMap<Kontekst, WeakMap<Punkt, Faste>>()

/** Nøkkel for en rute i utelukkingskartet (0,05° × 0,1°) */
export const utelukkNokkel = (lat: number, lon: number) => `${(Math.round(lat / 0.05) * 0.05).toFixed(2)},${(Math.round(lon / 0.1) * 0.1).toFixed(1)}`

function fasteFaktorer(p: Punkt, { flyPos, innlandet: innlandetRinger, utelukket: utelukkSett }: Kontekst): Faste {
  const pos: LatLon = [p.lat, p.lon]
  const vei = p.snap <= 1500 ? 1 : Math.exp(-(p.snap - 1500) / 2000)
  const skyfri = [...SKYDEKKE, ...TAAKE].some((ring) => iPolygon(pos, ring)) ? 0 : 1
  const norheimsund = TEORIER.find((t) => t.id === 'norheimsund')!
  const bokstaver = gauss(avstand(pos, norheimsund.pos), 20)
  const fraBergen = tversAvstand(BERGEN, 118, pos)
  const bergen = fraBergen.langs > 0 ? gauss(fraBergen.tvers, Math.max(8, fraBergen.langs * Math.tan((5 * Math.PI) / 180))) : 0
  const skyanalyse = gauss(avstand(pos, SKYANALYSE.senter), 35)
  const defaultno = Math.max(...DEFAULTNO.map((k) => gauss(avstand(pos, k.pos), 25)))
  // Pekte rett opp: flyet var trolig innen noen få km horisontalt. 10 km gir rom for tidsusikkerhet.
  let flyKm = Infinity
  for (const f of flyPos) flyKm = Math.min(flyKm, avstand(pos, f))
  const fly = flyPos.length ? gauss(flyKm, 10) : 1
  const solidag = SOL_I_DAG.some((r) => iPolygon(pos, r)) ? 1 : 0
  const innlandet = innlandetRinger.length ? (innlandetRinger.some((r) => iPolygon(pos, r)) ? 1 : 0) : 1
  // Punktene ligger på 0,1° × 0,2°; sjekk midten og de fire nabo-rutene i utelukkingskartet
  let utelukket = 1
  if (utelukkSett?.size) {
    const naboer = [[0, 0], [0.05, 0], [-0.05, 0], [0, 0.1], [0, -0.1]]
    const ute = naboer.filter(([a, b]) => utelukkSett.has(utelukkNokkel(p.lat + a, p.lon + b))).length
    utelukket = 1 - ute / naboer.length
  }
  return { vei, skyfri, skyanalyse, defaultno, fly, bokstaver, innlandet, solidag, bergen, utelukket }
}

export function faktorer(p: Punkt, v: Vekter, ktx: Kontekst): Record<FaktorId, number> {
  let perPunkt = fasteCache.get(ktx)
  if (!perPunkt) fasteCache.set(ktx, (perPunkt = new WeakMap()))
  let faste = perPunkt.get(p)
  if (!faste) perPunkt.set(p, (faste = fasteFaktorer(p, ktx)))

  const kjoretid = p.sek == null ? 0 : gauss(p.sek / 3600 - v.timer, v.slingring)
  let retning = 0
  for (const kurs of v.retningBegge ? [298, 118] : [298]) {
    const { tvers, langs } = tversAvstand(OSLO, kurs, [p.lat, p.lon])
    if (langs <= 0) continue
    const sigma = Math.max(8, langs * Math.tan((5 * Math.PI) / 180))
    retning = Math.max(retning, gauss(tvers, sigma))
  }
  return { ...faste, kjoretid, retning }
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
  /** Poeng delt på beste rute (1 = like godt som den beste, 0 = utelukket) */
  relativ: Float64Array
}

export function beregn(punkter: Punkt[], v: Vekter, ktx: Kontekst): Resultat {
  const n = punkter.length
  const s = new Float64Array(n)
  for (let i = 0; i < n; i++) s[i] = poeng(faktorer(punkter[i], v, ktx), v)
  let maks = 0
  for (let i = 0; i < n; i++) if (s[i] > maks) maks = s[i]
  const relativ = new Float64Array(n)
  for (let i = 0; i < n; i++) relativ[i] = maks > 0 ? s[i] / maks : 0
  return { poeng: s, relativ }
}

/**
 * Klasse 0–3 for fargen på kartet, eller -1 når ruta ikke skal vises.
 * Bygger på hvor godt ruta passer sammenlignet med den beste, så like gode ruter får samme farge.
 */
export function klasse(relativ: number): number {
  if (relativ >= 0.9) return 0
  if (relativ >= 0.6) return 1
  if (relativ >= 0.35) return 2
  if (relativ >= 0.15) return 3
  return -1
}

/** De beste områdene, minst `minKm` fra hverandre */
export function toppOmrader(punkter: Punkt[], res: Resultat, antall = 6, minKm = 40): number[] {
  const orden = Array.from({ length: punkter.length }, (_, i) => i).sort((a, b) => res.poeng[b] - res.poeng[a])
  const valgt: number[] = []
  for (const i of orden) {
    if (res.relativ[i] < 0.01) break
    const p: LatLon = [punkter[i].lat, punkter[i].lon]
    if (valgt.every((j) => avstand(p, [punkter[j].lat, punkter[j].lon]) >= minKm)) valgt.push(i)
    if (valgt.length >= antall) break
  }
  return valgt
}
