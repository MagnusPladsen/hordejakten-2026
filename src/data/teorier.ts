// Teoriene om hvor kassen står, og hvor godt hvert hint passer med hver teori.
// Prosentene regnes som i et enkelt Bayes-oppsett: forhåndsvekt × produktet av hint-faktorene,
// normalisert til 100 %. En faktor over 1 betyr at hintet støtter teorien, under 1 at det taler imot.
import { SKYDEKKE } from '@/data/innhold'
import { iPolygon, type LatLon } from '@/lib/geo'

export type TeoriId = 'loten' | 'rena' | 'gjovik' | 'roros' | 'valdres' | 'agder' | 'hardanger' | 'annet'

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
    id: 'loten',
    navn: 'Løten og Elverum (under flyet)',
    etikett: 'Løten',
    kort: 'Der NOZ56U var da Anja pekte opp',
    senter: [60.87, 11.25],
    radiusKm: 20,
    kjoretid: 1.75,
    prior: 1,
    farge: '#be123c',
    forhand: 'fly',
  },
  {
    id: 'rena',
    navn: 'Rena og Åmot (Østerdalen)',
    etikett: 'Rena',
    kort: 'default.no sin toppkandidat',
    senter: [61.35, 11.1],
    radiusKm: 35,
    kjoretid: 3.2,
    prior: 1,
    farge: '#e11d48',
    forhand: 'innlandet',
  },
  {
    id: 'gjovik',
    navn: 'Gjøvik og Toten',
    etikett: 'Gjøvik',
    kort: 'Vær og sol skal passe her',
    senter: [60.8, 10.6],
    radiusKm: 25,
    kjoretid: 2.1,
    prior: 1,
    farge: '#c026d3',
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

/** Andel av teori-området som ikke var blått på Windy (punkter i et rutenett innenfor sirkelen) */
function andelKlart(t: Teori): number {
  if (!t.senter) return 1
  const [la, lo] = t.senter
  const dLat = t.radiusKm / 111
  const dLon = dLat / Math.cos((la * Math.PI) / 180)
  let klart = 0
  let alle = 0
  for (let i = -7; i <= 7; i++) {
    for (let j = -7; j <= 7; j++) {
      if (i * i + j * j > 49) continue
      const p: LatLon = [la + (i / 7) * dLat, lo + (j / 7) * dLon]
      alle++
      if (!SKYDEKKE.some((r) => iPolygon(p, r))) klart++
    }
  }
  return klart / alle
}

export const BEVIS: Bevis[] = [
  {
    id: 'kjoretid',
    tittel: 'Kjøretid ca. 7 t (hun sov)',
    forklaring: 'Svakt hint: hun vet ikke hvor lenge de kjørte. Områder nær 7 t får litt høyere vekt.',
    standardPa: true,
    faktor: (t) => (t.kjoretid == null ? 1 : 0.5 + 0.5 * gauss(t.kjoretid - 7, 2)),
  },
  {
    id: 'mandag',
    tittel: 'Hentet mandag kl. 04:00, ikke søndag',
    forklaring:
      'Børsen skriver at hun ble hentet «klokka fire på natta» og har sittet i buret «siden mandag morgen». Streamen startet 06:50. Var det mandag, var kjøreturen under ca. 3 t. Tavla sier søndag, så dette er av som standard.',
    standardPa: false,
    faktor: (t) => (t.kjoretid == null ? 0.7 : t.kjoretid <= 2.5 ? 1.5 : t.kjoretid <= 3.3 ? 0.8 : 0.1),
  },
  {
    id: 'blatt',
    tittel: 'Blått på Windy-kartet er utelukket',
    forklaring: 'Anja så klar himmel. Teorien trekkes ned etter hvor stor del av området som var blått (skyer eller nedbør).',
    standardPa: true,
    faktor: (t) => (t.id === 'annet' ? 0.7 : 0.05 + 0.95 * andelKlart(t)),
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
    tittel: 'Flyet NOZ56U rett over kl. 21:29',
    forklaring:
      'Hun pekte nesten rett opp. Flyet var i ca. 24 000 fot, så kassen står trolig innen ca. 5 km fra sporet der flyet var da: mellom Løten og Elverum. Det kan ha vært et annet fly.',
    standardPa: true,
    faktor: tabell({ loten: 4, rena: 1.3, gjovik: 0.8, roros: 0.7, valdres: 0.8, agder: 0.6, hardanger: 0.6, annet: 0.7 }),
  },
  {
    id: 'defaultno',
    tittel: 'default.no sin fusjonsmodell',
    forklaring: 'Nr. 1 er Rena/Åmot, nr. 2 Risør/Gjerstad. Flyet er allerede med i modellen deres, så dette teller mindre for å unngå dobbelttelling.',
    standardPa: true,
    faktor: tabell({ rena: 1.5, loten: 1.2, agder: 1.3, valdres: 1.1, roros: 1.1, hardanger: 0.8 }),
  },
  {
    id: 'terreng',
    tittel: 'Furumo, lyng, bærlyng og tømmerdrift',
    forklaring: 'Typisk for Østerdalen, Røros og indre Agder. Mindre typisk for Vestlandet.',
    standardPa: true,
    faktor: tabell({ rena: 1.5, loten: 1.4, gjovik: 1.2, roros: 1.3, agder: 1.3, valdres: 1.1, hardanger: 0.6 }),
  },
  {
    id: 'konsensus',
    tittel: 'Fellesskapet er sikre på Innlandet',
    forklaring: 'Bygger mest på de samme hintene som over (fly, default.no, terreng), så den teller lite for å unngå dobbelttelling.',
    standardPa: true,
    faktor: tabell({ loten: 1.2, rena: 1.2, gjovik: 1.2, roros: 1.1, valdres: 1.1 }),
  },
  {
    id: 'gjovikvaer',
    tittel: 'Vær og sol passer i Gjøvik',
    forklaring: 'Noen i fellesskapet mener vær og solgang på streamen passer med Gjøvik. Ikke dokumentert, så det teller lite.',
    standardPa: true,
    faktor: tabell({ gjovik: 1.5 }),
  },
  {
    id: 'proysen',
    tittel: 'Rev og kråke: «Reven og kråka» (Prøysen)',
    forklaring: 'Alf Prøysen er fra Ringsaker, nabokommunen til Hamar og Løten.',
    standardPa: true,
    faktor: tabell({ loten: 1.3, rena: 1.1 }),
  },
  {
    id: 'ekorn',
    tittel: 'Ekornet (Froland)',
    forklaring: 'Froland har et sølvfarget ekorn på grønn bunn i kommunevåpenet (bekreftet).',
    standardPa: true,
    faktor: tabell({ agder: 1.3 }),
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
