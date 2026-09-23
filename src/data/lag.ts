// Kartlagene: navn, farger og forklaring. Fargene brukes både på kartet og i tegnforklaringen.

export type LagId =
  | 'modell'
  | 'kjoretid'
  | 'retning'
  | 'skydekke'
  | 'skyanalyse'
  | 'defaultno'
  | 'steder'
  | 'teorier'
  | 'fly'
  | 'felt'
  | 'utenfor'

export type Merkelapp = 'fakta' | 'beregnet' | 'tolkning' | 'teori'

export type Tegn = {
  stil: 'fyll' | 'linje' | 'stiplet' | 'ring' | 'prikk' | 'rute'
  farge: string
  tekst: string
}

export type Lag = {
  id: LagId
  navn: string
  kort: string
  merkelapp: Merkelapp
  forklaring: string
  tegn: Tegn[]
  kilde: string
}

export const FARGE = {
  modell: ['#9f1239', '#f43f5e', '#fb923c', '#fde68a'],
  kjoretid: ['#ccfbf1', '#99f6e4', '#5eead4', '#2dd4bf', '#0d9488', '#115e59'],
  langtFraVei: '#94a3b8',
  retning: '#7c3aed',
  skydekke: '#64748b',
  skyanalyse: '#2563eb',
  defaultno: '#111827',
  steder: '#e5007e',
  tidligere: '#64748b',
  teorier: '#d97706',
  fly: '#0284c7',
  felt: '#16a34a',
  utenfor: '#0f172a',
}

export const KJORETID_KLASSER = [
  { fra: 4, til: 5 },
  { fra: 5, til: 6 },
  { fra: 6, til: 7 },
  { fra: 7, til: 8 },
  { fra: 8, til: 9 },
  { fra: 9, til: 11 },
]

export const MERKELAPP: Record<Merkelapp, { tekst: string; klasse: string }> = {
  fakta: { tekst: 'Fakta', klasse: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  beregnet: { tekst: 'Beregnet', klasse: 'bg-sky-50 text-sky-700 ring-sky-200' },
  tolkning: { tekst: 'Tolkning', klasse: 'bg-amber-50 text-amber-800 ring-amber-200' },
  teori: { tekst: 'Teori', klasse: 'bg-violet-50 text-violet-700 ring-violet-200' },
}

export const LAG: Lag[] = [
  {
    id: 'modell',
    navn: 'Sannsynlighetskart',
    kort: 'Alle hint vektet sammen',
    merkelapp: 'beregnet',
    forklaring:
      'Hver rute (ca. 11 × 11 km) får en poengsum ut fra hintene du slår på i modellen under. Jo mørkere rødfarge, jo bedre passer ruta med hintene. Du bestemmer selv hvor mye hvert hint skal telle.',
    tegn: [
      { stil: 'fyll', farge: FARGE.modell[0], tekst: 'Topp 2 % av rutene' },
      { stil: 'fyll', farge: FARGE.modell[1], tekst: 'Topp 2–5 %' },
      { stil: 'fyll', farge: FARGE.modell[2], tekst: 'Topp 5–10 %' },
      { stil: 'fyll', farge: FARGE.modell[3], tekst: 'Topp 10–25 %' },
    ],
    kilde: 'Egen modell. Kjøretider fra OSRM (OpenStreetMap).',
  },
  {
    id: 'kjoretid',
    navn: 'Kjøretid fra Oslo',
    kort: 'Hvor langt kommer man på ~7 t?',
    merkelapp: 'beregnet',
    forklaring:
      'Faktisk kjøretid med bil fra Oslo sentrum til hver rute, beregnet langs veinettet. Grå ruter ligger mer enn 3 km fra nærmeste bilvei. OSRM regner ofte litt tregere enn Google, så se på tallene som ±30 min.',
    tegn: [
      { stil: 'fyll', farge: FARGE.kjoretid[0], tekst: '4–5 t' },
      { stil: 'fyll', farge: FARGE.kjoretid[1], tekst: '5–6 t' },
      { stil: 'fyll', farge: FARGE.kjoretid[2], tekst: '6–7 t' },
      { stil: 'fyll', farge: FARGE.kjoretid[3], tekst: '7–8 t' },
      { stil: 'fyll', farge: FARGE.kjoretid[4], tekst: '8–9 t' },
      { stil: 'fyll', farge: FARGE.kjoretid[5], tekst: 'Over 9 t' },
      { stil: 'fyll', farge: FARGE.langtFraVei, tekst: 'Over 3 km fra bilvei' },
    ],
    kilde: 'OSRM (router.project-osrm.org), beregnet 23.09.',
  },
  {
    id: 'retning',
    navn: '118° / 298° fra Oslo',
    kort: 'Linja fra «ØST CA 118»',
    merkelapp: 'teori',
    forklaring:
      'Hvis «118° øst» er retningen fra kassen mot Oslo, ligger kassen et sted på den heltrukne linja nordvest for Oslo (298°). Det skraverte feltet viser ±5° usikkerhet. Den stiplede delen mot sørøst (118°) er med for fullstendighet, men er under 2 t fra Oslo. Mest sannsynlig gjelder tallet bare retningen fra kassen til parkeringen.',
    tegn: [
      { stil: 'linje', farge: FARGE.retning, tekst: '298° (nordvest) fra Oslo' },
      { stil: 'stiplet', farge: FARGE.retning, tekst: '118° (sørøst) fra Oslo' },
      { stil: 'rute', farge: FARGE.retning, tekst: '±5° usikkerhet' },
    ],
    kilde: 'Tavla («ØST CA 118»).',
  },
  {
    id: 'skydekke',
    navn: 'Skydekke',
    kort: 'Hun så klar himmel, her var det skyet',
    merkelapp: 'tolkning',
    forklaring:
      'Grovt tegnet ut fra Windy-skykartet. Anja skrev «KLAR HIMMEL» samme kveld, så områder med tett skydekke er mindre sannsynlige. Tidspunktet for skjermbildet er ukjent.',
    tegn: [{ stil: 'rute', farge: FARGE.skydekke, tekst: 'Tett skydekke (mindre sannsynlig)' }],
    kilde: 'Windy.com (ECMWF), skjermbilde fra fellesskapet.',
  },
  {
    id: 'skyanalyse',
    navn: 'Skyanalyse (Agder)',
    kort: 'Fellesskapets sky- og flykart',
    merkelapp: 'teori',
    forklaring:
      'Et kart laget ut fra når Anja sa det var skyet og når fly gikk over. Soner for kl. 12, 15–17 og 19–20 overlapper i indre Agder. Den fylte sirkelen er «møtepunktet» og den ytre ringen usikkerheten. Kjøretiden hit er bare ca. 4 t.',
    tegn: [
      { stil: 'fyll', farge: FARGE.skyanalyse, tekst: 'Møtepunkt' },
      { stil: 'ring', farge: FARGE.skyanalyse, tekst: 'Usikkerhet (ca. 45 km)' },
    ],
    kilde: 'Delt bilde fra fellesskapet. Plassert omtrentlig.',
  },
  {
    id: 'defaultno',
    navn: 'Kandidater fra default.no',
    kort: 'Toppruter i deres fusjonsmodell',
    merkelapp: 'beregnet',
    forklaring:
      'De fem beste rutene i default.no sin modell (fly, vær, satellitt, fuglelyd, skog). Ringen er 10 km. Merk at nr. 1 bare er ca. 3,5 t fra Oslo, mens Anja tror hun sov ca. 7 t.',
    tegn: [
      { stil: 'prikk', farge: FARGE.defaultno, tekst: 'Kandidat (nummer = rangering)' },
      { stil: 'ring', farge: FARGE.defaultno, tekst: '10 km-radius' },
    ],
    kilde: 'default.no, 22.09 kl. 16:42.',
  },
  {
    id: 'steder',
    navn: 'Steder fra hint',
    kort: 'Horde AS, Bjørneparken, Prøysen …',
    merkelapp: 'fakta',
    forklaring:
      'Steder som hintene peker på. Rosa punkter er fra hint, det hvite er startpunktet i Oslo, og grå ruter er der kassen ble funnet i 2023 og 2024.',
    tegn: [
      { stil: 'prikk', farge: FARGE.steder, tekst: 'Sted fra hint' },
      { stil: 'prikk', farge: '#ffffff', tekst: 'Start (Oslo)' },
      { stil: 'rute', farge: FARGE.tidligere, tekst: 'Tidligere funnsted' },
    ],
    kilde: 'Hint-listen.',
  },
  {
    id: 'teorier',
    navn: 'Teorier fra fellesskapet',
    kort: 'Norheimsund, Froland, Lillehammer …',
    merkelapp: 'teori',
    forklaring: 'Ubekreftede teorier som går rundt. Overstreket betyr at et annet hint taler imot.',
    tegn: [{ stil: 'prikk', farge: FARGE.teorier, tekst: 'Teori (ubekreftet)' }],
    kilde: 'Praktiskinfo.no, Discord og TikTok.',
  },
  {
    id: 'fly',
    navn: 'Fly i lufta kl. 21:29',
    kort: 'Anja pekte rett opp og skrev «FLY»',
    merkelapp: 'tolkning',
    forklaring:
      'Sporene til alle 49 fly som var i lufta 21:28–21:34 (ekte tid). Prikkene viser hvor hvert fly var da Anja pekte opp. Kassen bør ligge nær et spor. Det tykke sporet er NOZ56U (Oslo–Bodø), beste treff hos default.no, og ringen er 10 km rundt der det var. Svake spor er fly under 3000 fot.',
    tegn: [
      { stil: 'linje', farge: FARGE.fly, tekst: 'Flyspor 21:28–21:34' },
      { stil: 'prikk', farge: FARGE.fly, tekst: 'Posisjon da hun pekte opp' },
      { stil: 'ring', farge: FARGE.fly, tekst: 'NOZ56U, 10 km' },
    ],
    kilde: 'ADS-B fra adsb.lol (via default.no). Streamen er 45 sek forsinket.',
  },
  {
    id: 'felt',
    navn: 'Søkesektor fra parkering',
    kort: 'For deg som leter i felt',
    merkelapp: 'tolkning',
    forklaring:
      'Plasser markøren på en parkering eller skogsbilvei. Sektoren viser hvor kassen bør ligge hvis parkeringen er 118° fra kassen: mot 298° (±20°), 300–900 m unna, oppover. Dra markøren for å flytte den.',
    tegn: [
      { stil: 'rute', farge: FARGE.felt, tekst: 'Søkesektor (300–900 m)' },
      { stil: 'prikk', farge: FARGE.felt, tekst: 'Parkering (dra meg)' },
    ],
    kilde: 'Tavla («ØST CA 118», 5–10 min gange).',
  },
  {
    id: 'utenfor',
    navn: 'Utenfor Norge',
    kort: 'Kassen står i Norge',
    merkelapp: 'fakta',
    forklaring: 'Ifølge vilkårene står kassen et sted i Norge. Alt utenfor er skyggelagt.',
    tegn: [{ stil: 'fyll', farge: FARGE.utenfor, tekst: 'Utenfor Norge' }],
    kilde: 'Vilkårene til Hordejakten.',
  },
]

export const LAG_ETTER_ID = Object.fromEntries(LAG.map((l) => [l.id, l])) as Record<LagId, Lag>
