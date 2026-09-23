// Teoriene om hvor kassen står, og hvor godt hvert hint passer med hver teori.
// Prosentene regnes som i et enkelt Bayes-oppsett: forhåndsvekt × produktet av hint-faktorene,
// normalisert til 100 %. En faktor over 1 betyr at hintet støtter teorien, under 1 at det taler imot.
import { SKYDEKKE, SOL_I_DAG, TAAKE } from '@/data/innhold'
import { iPolygon, type LatLon } from '@/lib/geo'

export type TeoriId = 'loten' | 'rena' | 'ringsaker' | 'solor' | 'gjovik' | 'roros' | 'valdres' | 'agder' | 'hardanger' | 'annet'

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
  /** Forhåndsvekt før hintene. «Annet sted» dekker resten av landet og starter 4× høyere, fordi teori-sirklene er små. */
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
    id: 'ringsaker',
    navn: 'Ringsaker (Tretopphyttene)',
    etikett: 'Ringsaker',
    kort: 'Ekorn-logo og Prøysens kommune',
    senter: [60.9748, 10.9167],
    radiusKm: 15,
    kjoretid: 2.0,
    prior: 1,
    farge: '#16a34a',
  },
  {
    id: 'solor',
    navn: 'Flisa og Haslemoen (Solør)',
    etikett: 'Solør',
    kort: 'Furumo mot Finnskogen, nedlagt leir på Haslemoen',
    senter: [60.64, 11.95],
    radiusKm: 20,
    kjoretid: 2.55,
    prior: 1,
    farge: '#ea580c',
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
    prior: 4,
    farge: '#64748b',
  },
]

export type Bevis = {
  id: string
  /** 'folk' = det folk i chatten og på Discord sier, ikke noe vi har sett selv. Teller bare i «Alt vi har». */
  kilde?: 'folk'
  tittel: string
  forklaring: string
  /** Av som standard for tolkninger mange er uenige i */
  standardPa: boolean
  faktor: (t: Teori) => number
}

const gauss = (x: number, sigma: number) => Math.exp(-0.5 * (x / sigma) ** 2)
const tabell = (verdier: Partial<Record<TeoriId, number>>) => (t: Teori) => verdier[t.id] ?? 1

/** Andel av teori-området som ligger innenfor de gitte polygonene (punkter i et rutenett innenfor sirkelen) */
function andelInnenfor(t: Teori, ringer: LatLon[][]): number {
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
      if (ringer.some((r) => iPolygon(p, r))) klart++
    }
  }
  return klart / alle
}

export const BEVIS: Bevis[] = [
  {
    id: 'kjoretid',
    tittel: 'Kjøretid ca. 7 t (hun sov)',
    forklaring: 'Ikke et fakta: Anja tror hun sov ca. 7 t, men sier hun ikke vet hvor lenge de kjørte (Børsen). Av som standard.',
    standardPa: false,
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
    tittel: 'Blått på Windy og tåka i Odal er utelukket',
    forklaring: 'Anja så klar himmel. Teorien trekkes ned etter hvor stor del av området som var blått (skyer eller nedbør).',
    standardPa: true,
    faktor: (t) => (t.id === 'annet' ? 0.7 : 0.05 + 0.95 * (1 - andelInnenfor(t, [...SKYDEKKE, ...TAAKE]))),
  },
  {
    id: 'solidag',
    tittel: 'Sol i dag mens det var skyet nesten overalt',
    forklaring:
      'På satellitt 23.09 var det bare klart Kongsvinger–Rena mot Sverige, i deler av Vestfold og rundt Trondheim–Ålesund. Teorien løftes etter hvor stor del av området som var klart. Grovt tegnet fra en beskrivelse. Obs: noen mener sollyset på streamen kan være falskt. Tror du det, slå av dette hintet.',
    standardPa: true,
    faktor: (t) => (t.id === 'annet' ? 0.6 : 0.4 + 1.2 * andelInnenfor(t, SOL_I_DAG)),
  },
  {
    // Soloppgang 22.09 (NOAA-formel, flat horisont): Solør 06:55, Røros 06:57, Løten/Rena 06:58, Ringsaker 06:59,
    // Gjøvik 07:00, Valdres 07:06, Agder 07:08, Hardanger 07:18
    id: 'soloppgang',
    tittel: 'Sola var oppe før kl. 07 (Anja)',
    forklaring: 'Bare mulig øst for ca. 11° øst disse dagene. Skiller ikke mellom de østlige stedene (1–4 min forskjell), men utelukker nesten vest.',
    standardPa: true,
    faktor: tabell({ gjovik: 0.9, valdres: 0.5, agder: 0.4, hardanger: 0.2, annet: 0.7 }),
  },
  {
    // Sola rett i sør 13:02–13:08. Beregnet soltid-middag: Solør 13:05, Løten 13:07, Rena/Røros 13:08,
    // Ringsaker 13:09, Gjøvik 13:10, Valdres 13:16, Agder 13:17, Hardanger 13:28
    id: 'solmiddag',
    tittel: 'Sola i sør kl. 13:02–13:08 (lengdegrad 11–12° øst)',
    forklaring: 'Solvinkelen kl. 13:20 gir lengdegraden. Måleusikkerheten er noen minutter, så de østlige stedene passer like godt. Bygger på sollyset i bildet, som kan være falskt.',
    standardPa: true,
    faktor: tabell({ ringsaker: 0.95, gjovik: 0.9, valdres: 0.4, agder: 0.3, hardanger: 0.1, annet: 0.6 }),
  },
  {
    id: 'bokstaver',
    tittel: 'Vervebokstavene = NORHEIMSUND?',
    forklaring: 'Bokstavene mangler én N for å bli NORHEIMSUND, mens HORDE MINUS går opp uten rest. Derfor teller det bare litt.',
    standardPa: true,
    faktor: tabell({ hardanger: 2 }),
  },
  {
    id: 'fly',
    tittel: 'Flyet NOZ56U rett over kl. 21:29',
    forklaring:
      'Hun pekte nesten rett opp. Flyet var i ca. 24 000 fot, så kassen står trolig innen ca. 5 km fra sporet der flyet var da: mellom Løten og Elverum. Det kan ha vært et annet fly.',
    standardPa: true,
    faktor: tabell({ loten: 3, rena: 1.3, ringsaker: 1.2, solor: 0.7, gjovik: 0.8, roros: 0.7, valdres: 0.8, agder: 0.6, hardanger: 0.6, annet: 0.7 }),
  },
  {
    id: 'defaultno',
    tittel: 'default.no sin fusjonsmodell',
    forklaring: 'Nr. 1 er Rena/Åmot, nr. 2 Risør/Gjerstad. Flyet er allerede med i modellen deres, så dette teller mindre for å unngå dobbelttelling.',
    standardPa: true,
    faktor: tabell({ rena: 1.5, loten: 1.2, ringsaker: 1.2, agder: 1.3, valdres: 1.1, roros: 1.1, hardanger: 0.8 }),
  },
  {
    id: 'terreng',
    tittel: 'Furumo, lyng, bærlyng og tømmerdrift',
    forklaring: 'Typisk for Østerdalen, Røros og indre Agder. Mindre typisk for Vestlandet.',
    standardPa: true,
    faktor: tabell({ rena: 1.5, loten: 1.4, ringsaker: 1.3, solor: 1.5, gjovik: 1.2, roros: 1.3, agder: 1.3, valdres: 1.1, hardanger: 0.6 }),
  },
  {
    id: 'konsensus',
    kilde: 'folk',
    tittel: 'Nesten alle i chatten er sikre på Innlandet',
    forklaring: '«Det er null tvil, været, sola, skogen og alt.» Bygger mest på de samme hintene som over, så den teller lite for å unngå dobbelttelling.',
    standardPa: true,
    faktor: tabell({ loten: 1.2, rena: 1.2, ringsaker: 1.2, solor: 1.2, gjovik: 1.2, roros: 1.1, valdres: 1.1 }),
  },
  {
    id: 'gjovikvaer',
    kilde: 'folk',
    tittel: 'Vær og sol passer i Gjøvik',
    forklaring: 'Noen i fellesskapet mener vær og solgang på streamen passer med Gjøvik. Ikke dokumentert, så det teller lite.',
    standardPa: true,
    faktor: tabell({ gjovik: 1.5 }),
  },
  {
    id: 'folk_digeras',
    kilde: 'folk',
    tittel: 'Flere tipper Digeråsen (Løten/Åmot)',
    forklaring: 'Flere i chatten mener Digeråsen «er så klink». Ligger i Rena/Åmot-området, 34 km fra Løten-sirkelen.',
    standardPa: true,
    faktor: tabell({ rena: 1.4, loten: 1.1 }),
  },
  {
    id: 'folk_flisa',
    kilde: 'folk',
    tittel: 'Én tipper Flisa og Haslemoen',
    forklaring: '«Nær Rena, men ikke helt. Kanskje mer i området Flisa?»',
    standardPa: true,
    faktor: tabell({ solor: 1.2 }),
  },
  {
    id: 'folk_tretopp',
    kilde: 'folk',
    tittel: 'Noen peker på Tretopphyttene',
    forklaring: 'Ekorn-logoen til Tretopphyttene i Ringsaker.',
    standardPa: true,
    faktor: tabell({ ringsaker: 1.2 }),
  },
  {
    id: 'folk_ingenhytte',
    kilde: 'folk',
    tittel: 'Horde unngår hytter i år',
    forklaring: 'Folk fant bookingene sist, og Anja var et sted uten vinduer og wifi. Trekker ned Tretopphytte-teorien i Ringsaker.',
    standardPa: true,
    faktor: tabell({ ringsaker: 0.8 }),
  },
  {
    id: 'folk_benny',
    kilde: 'folk',
    tittel: '«Reven heter Benny» (Benningstad i Løten)',
    forklaring: 'Gården Benningstad i Løten ligner navnet. Trolig tilfeldig, så det teller lite.',
    standardPa: true,
    faktor: tabell({ loten: 1.05 }),
  },
  {
    id: 'proysen',
    tittel: 'Rev og kråke: «Reven og kråka» (Prøysen)',
    forklaring: 'Alf Prøysen er fra Ringsaker, nabokommunen til Hamar og Løten.',
    standardPa: true,
    faktor: tabell({ ringsaker: 1.5, loten: 1.3, rena: 1.1 }),
  },
  {
    id: 'ekorn',
    tittel: 'Ekornet (Froland, Tretopphyttene)',
    forklaring: 'Froland har et ekorn i kommunevåpenet, og Tretopphyttene har et ekorn som logo. Men ekorn finnes overalt, så det kan like gjerne bare bety at det er ekorn der kassen står. Teller lite.',
    standardPa: true,
    faktor: tabell({ agder: 1.1, ringsaker: 1.1 }),
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
    tittel: 'Skiltet (118°) peker mot Oslo',
    forklaring: 'Anja sier skiltet peker 118°. Peker det mot Oslo, ligger kassen på 298°-linja fra Oslo, gjennom Valdres. De fleste tror det heller viser veien inn.',
    standardPa: false,
    faktor: tabell({ valdres: 1.8 }),
  },
]

export type Modus = 'hint' | 'alt'

/** Hintene som er på som standard i hver modus */
export function standardBevis(modus: Modus): Set<string> {
  return new Set(BEVIS.filter((b) => b.standardPa && (modus === 'alt' || b.kilde !== 'folk')).map((b) => b.id))
}

/** Prosent per teori for de valgte hintene */
export function sannsynligheter(aktive: Set<string>): Record<TeoriId, number> {
  const raa = TEORIER_LISTE.map((t) => BEVIS.filter((b) => aktive.has(b.id)).reduce((s, b) => s * b.faktor(t), t.prior))
  const sum = raa.reduce((a, b) => a + b, 0)
  return Object.fromEntries(TEORIER_LISTE.map((t, i) => [t.id, (raa[i] / sum) * 100])) as Record<TeoriId, number>
}
