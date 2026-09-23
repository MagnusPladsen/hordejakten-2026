// Teoriene om hvor kassen står, og hvor godt hvert hint passer med hver teori.
// Prosentene regnes som i et enkelt Bayes-oppsett: forhåndsvekt × produktet av hint-faktorene,
// normalisert til 100 %. En faktor over 1 betyr at hintet støtter teorien, under 1 at det taler imot.
import { SKYDEKKE } from '@/data/innhold'
import { iPolygon, type LatLon } from '@/lib/geo'

export type TeoriId = 'innlandet' | 'roros' | 'valdres' | 'agder' | 'hardanger' | 'annet'

export type Teori = {
  id: TeoriId
  navn: string
  /** Kort navn til etiketten på kartet */
  etikett: string
  kort: string
  senter: LatLon | null
  radiusKm: number
  /** Kjøretid fra Oslo til senteret (OSRM), timer */
  kjoretid: number | null
  /** Forhåndsvekt før hintene. «Annet sted» dekker resten av landet og starter høyere. */
  prior: number
  farge: string
  /** Teorien i modellen som passer best */
  forhand?: string
}

export const TEORIER_LISTE: Teori[] = [
  {
    id: 'innlandet',
    navn: 'Østerdalen (Innlandet)',
    etikett: 'Østerdalen',
    kort: 'Rena, Åmot og Elverum',
    senter: [61.35, 11.1],
    radiusKm: 55,
    kjoretid: 3.2,
    prior: 1,
    farge: '#e11d48',
    forhand: 'innlandet',
  },
  {
    id: 'roros',
    navn: 'Nord-Østerdalen og Røros',
    etikett: 'Røros',
    kort: 'Holtålen, Røros og Tynset',
    senter: [62.7, 11.2],
    radiusKm: 50,
    kjoretid: 6.7,
    prior: 1,
    farge: '#f97316',
  },
  {
    id: 'valdres',
    navn: 'Valdres og Hallingdal',
    etikett: 'Valdres',
    kort: 'Fagernes, Gol og Flå',
    senter: [60.85, 9.2],
    radiusKm: 50,
    kjoretid: 3.2,
    prior: 1,
    farge: '#7c3aed',
    forhand: 'retning',
  },
  {
    id: 'agder',
    navn: 'Indre Agder',
    etikett: 'Agder',
    kort: 'Froland, Gjerstad og Vegårshei',
    senter: [58.65, 8.8],
    radiusKm: 50,
    kjoretid: 3.5,
    prior: 1,
    farge: '#2563eb',
    forhand: 'agder',
  },
  {
    id: 'hardanger',
    navn: 'Norheimsund og Hardanger',
    etikett: 'Hardanger',
    kort: 'Kvam, ca. 1 t fra Bergen',
    senter: [60.3707, 6.1453],
    radiusKm: 35,
    kjoretid: 6.55,
    prior: 1,
    farge: '#0d9488',
    forhand: 'norheimsund',
  },
  {
    id: 'annet',
    navn: 'Et helt annet sted',
    etikett: 'Annet',
    kort: 'Resten av landet',
    senter: null,
    radiusKm: 0,
    kjoretid: null,
    prior: 2,
    farge: '#64748b',
  },
]

export type Bevis = {
  id: string
  tittel: string
  forklaring: string
  /** Av som standard for tolkninger mange er uenige i */
  standardPa: boolean
  faktor: (t: Teori) => number
}

const gauss = (x: number, sigma: number) => Math.exp(-0.5 * (x / sigma) ** 2)
const tabell = (verdier: Partial<Record<TeoriId, number>>) => (t: Teori) => verdier[t.id] ?? 1

export const BEVIS: Bevis[] = [
  {
    id: 'kjoretid',
    tittel: 'Kjøretid ca. 7 t (hun sov)',
    forklaring: 'Svakt hint: hun vet ikke hvor lenge de kjørte. Områder nær 7 t får litt høyere vekt.',
    standardPa: true,
    faktor: (t) => (t.kjoretid == null ? 1 : 0.5 + 0.5 * gauss(t.kjoretid - 7, 2)),
  },
  {
    id: 'blatt',
    tittel: 'Blått på Windy-kartet er utelukket',
    forklaring: 'Anja så klar himmel. Områder som var blå (skyer eller nedbør) på Windy-kartet er utelukket.',
    standardPa: true,
    faktor: (t) => (t.senter && SKYDEKKE.some((r) => iPolygon(t.senter!, r)) ? 0.05 : t.id === 'annet' ? 0.7 : 1),
  },
  {
    id: 'bokstaver',
    tittel: 'Vervebokstavene = NORHEIMSUND?',
    forklaring: 'N O R H E I M S U D mangler bare én N for å bli NORHEIMSUND. Sterkt hvis det stemmer.',
    standardPa: true,
    faktor: tabell({ hardanger: 4 }),
  },
  {
    id: 'fly',
    tittel: 'Flyet NOZ56U over Løten kl. 21:29',
    forklaring: 'Beste treff for flyet Anja så rett over seg. Peker mot Hedmark.',
    standardPa: true,
    faktor: tabell({ innlandet: 2.5, roros: 0.8, valdres: 0.8, agder: 0.6, hardanger: 0.6, annet: 0.8 }),
  },
  {
    id: 'defaultno',
    tittel: 'default.no sin fusjonsmodell',
    forklaring: 'Nr. 1 er Rena/Åmot, nr. 2 Agder. Bygger på fly, vær, satellitt og skog.',
    standardPa: true,
    faktor: tabell({ innlandet: 2, agder: 1.5, valdres: 1.2, roros: 1.1, hardanger: 0.8 }),
  },
  {
    id: 'terreng',
    tittel: 'Furumo, lyng, bærlyng og tømmerdrift',
    forklaring: 'Typisk for Østerdalen, Røros og indre Agder. Mindre typisk for Vestlandet.',
    standardPa: true,
    faktor: tabell({ innlandet: 1.5, roros: 1.3, agder: 1.3, valdres: 1.1, hardanger: 0.6 }),
  },
  {
    id: 'konsensus',
    tittel: 'Fellesskapet er sikre på Innlandet',
    forklaring: 'De fleste som leter peker nå mot Innlandet. Teller litt, men er ikke et hint i seg selv.',
    standardPa: true,
    faktor: tabell({ innlandet: 1.5, roros: 1.2, valdres: 1.2 }),
  },
  {
    id: 'proysen',
    tittel: 'Rev og kråke: «Reven og kråka» (Prøysen)',
    forklaring: 'Alf Prøysen er fra Ringsaker i Innlandet.',
    standardPa: true,
    faktor: tabell({ innlandet: 1.3 }),
  },
  {
    id: 'ekorn',
    tittel: 'Ekornet (Froland, Lillehammer)',
    forklaring: 'Froland har ekorn i kommunevåpenet. Lillehammer har en ekorn-teori.',
    standardPa: true,
    faktor: tabell({ agder: 1.2, innlandet: 1.1 }),
  },
  {
    id: 'bjorneparken',
    tittel: 'Reklamefarger som Bjørneparken (Flå)',
    forklaring: 'Magenta og grønt som i Bjørneparken i Hallingdal.',
    standardPa: true,
    faktor: tabell({ valdres: 1.4 }),
  },
  {
    id: 'bergen',
    tittel: 'Kode 5008 = Horde AS i Bergen',
    forklaring: 'Kan peke mot Vestlandet, eller bare være en av kodene.',
    standardPa: true,
    faktor: tabell({ hardanger: 1.3 }),
  },
  {
    id: 'skyanalyse',
    tittel: 'Skyanalyse-kartet (Agder)',
    forklaring: 'Fellesskapets sky- og flykart. Usikker metode.',
    standardPa: false,
    faktor: tabell({ agder: 2 }),
  },
  {
    id: 'retning',
    tittel: '118° er retningen mot Oslo',
    forklaring: 'Da ligger kassen på 298°-linja fra Oslo, gjennom Valdres. De fleste tror 118° gjelder parkeringen.',
    standardPa: false,
    faktor: tabell({ valdres: 1.8 }),
  },
]

/** Prosent per teori for de valgte hintene */
export function sannsynligheter(aktive: Set<string>): Record<TeoriId, number> {
  const raa = TEORIER_LISTE.map((t) => BEVIS.filter((b) => aktive.has(b.id)).reduce((s, b) => s * b.faktor(t), t.prior))
  const sum = raa.reduce((a, b) => a + b, 0)
  return Object.fromEntries(TEORIER_LISTE.map((t, i) => [t.id, (raa[i] / sum) * 100])) as Record<TeoriId, number>
}
