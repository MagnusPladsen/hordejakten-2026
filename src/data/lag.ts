// Kartlagene: navn, farger og forklaring. Fargene brukes både på kartet og i tegnforklaringen.

export type LagId =
  | 'modell'
  | 'hintmarkorer'
  | 'teoriomrader'
  | 'innlandet'
  | 'kjoretid'
  | 'retning'
  | 'skydekke'
  | 'utelukket'
  | 'solidag'
  | 'skyanalyse'
  | 'defaultno'
  | 'steder'
  | 'teorier'
  | 'fly'
  | 'felt'
  | 'hytter'
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
  skydekke: '#2563eb',
  solidag: '#eab308',
  innlandet: '#e11d48',
  skyanalyse: '#2563eb',
  defaultno: '#111827',
  steder: '#e5007e',
  tidligere: '#64748b',
  teorier: '#d97706',
  fly: '#0284c7',
  felt: '#16a34a',
  hytter: '#92400e',
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
      'Hver rute (ca. 11 × 11 km) får en poengsum ut fra fokuset du har valgt i Kart-fanen. Fargen viser hvor godt ruta passer sammenlignet med den beste ruta. Er mange ruter like gode, får de samme farge. Ruter uten farge passer dårlig eller er utelukket.',
    tegn: [
      { stil: 'fyll', farge: FARGE.modell[0], tekst: 'Passer svært godt (over 90 % av beste)' },
      { stil: 'fyll', farge: FARGE.modell[1], tekst: 'Passer godt (60–90 %)' },
      { stil: 'fyll', farge: FARGE.modell[2], tekst: 'Passer middels (35–60 %)' },
      { stil: 'fyll', farge: FARGE.modell[3], tekst: 'Passer litt (15–35 %)' },
    ],
    kilde: 'Egen modell. Kjøretider fra OSRM (OpenStreetMap).',
  },
  {
    id: 'hintmarkorer',
    navn: 'Hint på kartet',
    kort: 'Alle hint og tips som peker på et sted',
    merkelapp: 'fakta',
    forklaring:
      'En markør for hvert hint, tips og det folk sier som handler om et bestemt sted. Oransje = hint, lilla = det folk sier, rød kant = siste nytt. Tallet viser hvor mange ting som hører til stedet. Trykk på markøren for å lese, og «Les hele hintet» for å åpne hintkortet. Hint som ikke handler om et sted (for eksempel tallene på genseren) har ingen markør.',
    tegn: [
      { stil: 'prikk', farge: '#ea580c', tekst: 'Hint' },
      { stil: 'prikk', farge: '#7c3aed', tekst: 'Det folk sier' },
      { stil: 'ring', farge: '#e5007e', tekst: 'Siste nytt' },
    ],
    kilde: 'Hint-fanen og «Hva folk tror».',
  },
  {
    id: 'teoriomrader',
    navn: 'Teoriene',
    kort: 'Områdene med sannsynlighet i prosent',
    merkelapp: 'beregnet',
    forklaring:
      'Hver sirkel er en teori om hvor kassen står. Prosenten er regnet ut fra hintene du har slått på i Teorier-fanen. Større tall og tykkere kant betyr mer sannsynlig.',
    tegn: [
      { stil: 'ring', farge: '#e11d48', tekst: 'Teori-område med prosent' },
    ],
    kilde: 'Teorier-fanen.',
  },
  {
    id: 'innlandet',
    navn: 'Innlandet fylke',
    kort: 'Der fellesskapet leter nå',
    merkelapp: 'tolkning',
    forklaring: 'Grensen for Innlandet fylke. Fellesskapet er nå sikre på at kassen står her. Velg «Innlandet» i modellen for å vekte det.',
    tegn: [{ stil: 'rute', farge: FARGE.innlandet, tekst: 'Innlandet fylke' }],
    kilde: 'Fylkesgrenser fra Kartverket (forenklet).',
  },
  {
    id: 'kjoretid',
    navn: 'Kjøretid fra Oslo',
    kort: 'Hvor langt kommer man på ~7 t?',
    merkelapp: 'beregnet',
    forklaring:
      'Faktisk kjøretid med bil fra Oslo sentrum til hver rute, beregnet langs veinettet. Grå ruter ligger mer enn 3 km fra nærmeste bilvei. OSRM regner ofte litt tregere enn Google, så se på tallene som ±30 min. Anja sov og vet ikke hvor lenge de kjørte, så bruk laget som en pekepinn.',
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
    navn: 'Retningslinjer (118°)',
    kort: 'Fra Oslo og fra Horde i Bergen',
    merkelapp: 'teori',
    forklaring:
      'Hvis «118° øst» er retningen fra kassen mot Oslo, ligger kassen et sted på den heltrukne linja nordvest for Oslo (298°). Det skraverte feltet viser ±5° usikkerhet. Den stiplede delen mot sørøst (118°) er med for fullstendighet, men er under 2 t fra Oslo. Mest sannsynlig gjelder tallet bare retningen fra kassen til parkeringen. Den turkise linja er 118° fra Horde AS i Bergen (5008), gjennom Telemark.',
    tegn: [
      { stil: 'linje', farge: FARGE.retning, tekst: '298° (nordvest) fra Oslo' },
      { stil: 'stiplet', farge: FARGE.retning, tekst: '118° (sørøst) fra Oslo' },
      { stil: 'rute', farge: FARGE.retning, tekst: '±5° usikkerhet' },
      { stil: 'linje', farge: '#0891b2', tekst: '118° fra Horde AS i Bergen' },
      { stil: 'stiplet', farge: '#0891b2', tekst: 'Samme linje korrigert for misvisning (ca. 123°)' },
    ],
    kilde: 'Tavla («ØST CA 118 · RETNING SKILT»).',
  },
  {
    id: 'skydekke',
    navn: 'Skyer og tåke (utelukket)',
    kort: 'Hun så klar himmel, her var det skyer',
    merkelapp: 'tolkning',
    forklaring:
      'Områdene som var blå på Windy-kartet samme periode som Anja skrev «KLAR HIMMEL». De er utelukket i sannsynlighetskartet. Tegnet for hånd fra skjermbildet, så kantene er omtrentlige (±10 km). Båndet fra Lillehammer mot Sverige er mest usikkert.',
    tegn: [
      { stil: 'rute', farge: FARGE.skydekke, tekst: 'Blått på Windy = utelukket' },
      { stil: 'rute', farge: '#64748b', tekst: 'Tåke i morges 23.09 (Odal–Jessheim)' },
    ],
    kilde: 'Windy.com, skjermbilde fra fellesskapet.',
  },
  {
    id: 'utelukket',
    navn: 'Utelukket av fellesskapet',
    kort: 'Fjellbjørk og annet',
    merkelapp: 'tolkning',
    forklaring:
      'Kartet fellesskapet har laget 23.09. Rødt er utelukket, og lyseblått er utelukket fordi det vokser fjellbjørk der. Det som står igjen er stripa Hamar–Løten–Rena–Koppang, Ringsakfjellet/Rudshøgda og Gjøvik/Toten. Stedfestet fra et bilde, så kantene er omtrentlige (±10 km).',
    tegn: [
      { stil: 'fyll', farge: '#dc2626', tekst: 'Utelukket' },
      { stil: 'fyll', farge: '#22d3ee', tekst: 'Fjellbjørk' },
    ],
    kilde: 'Delt i chatten 23.09.',
  },
  {
    id: 'solidag',
    navn: 'Sol i dag (satellitt)',
    kort: 'Klart her, skyet nesten alle andre steder',
    merkelapp: 'tolkning',
    forklaring:
      'Områdene som var klare på satellittbildet 23.09 mens Anja hadde sol. Tegnet grovt ut fra en beskrivelse (Kongsvinger–Rena mot Sverige, deler av Vestfold, Trondheim–Ålesund), ikke fra selve bildet. Stiplet kant betyr usikker.',
    tegn: [{ stil: 'rute', farge: FARGE.solidag, tekst: 'Klart på satellitt 23.09' }],
    kilde: 'Satellittbilde, beskrevet av fellesskapet.',
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
      { stil: 'ring', farge: FARGE.defaultno, tekst: 'Terrengtreff (vei, furu, relieff)' },
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
      'Sporene til alle 49 fly som var i lufta 21:28–21:34 (ekte tid). Prikkene viser hvor hvert fly var da Anja pekte opp. Kassen bør ligge nær et spor. De to tykke sporene er flyene nærmest: NOZ56U nordover over Løten og NOZ9EG sørover over Ringsakfjellet. Ringene er 10 km rundt der de var. Svake spor er fly under 3000 fot.',
    tegn: [
      { stil: 'linje', farge: FARGE.fly, tekst: 'Flyspor 21:28–21:34' },
      { stil: 'prikk', farge: FARGE.fly, tekst: 'Posisjon da hun pekte opp' },
      { stil: 'ring', farge: FARGE.fly, tekst: 'NOZ56U og NOZ9EG, 10 km' },
    ],
    kilde: 'ADS-B fra adsb.lol (via default.no). Streamen er 45 sek forsinket.',
  },
  {
    id: 'felt',
    navn: 'Søkesektor fra parkering',
    kort: 'For deg som leter i felt',
    merkelapp: 'tolkning',
    forklaring:
      'Plasser markøren på en parkering eller skogsbilvei. Skiltet står vest-nordvest for kassen og peker 118–120° mot den. Kommer du fra bilen, ligger kassen altså mot ca. 120° (±20°), 300–900 m unna, oppover. Dra markøren for å flytte den.',
    tegn: [
      { stil: 'rute', farge: FARGE.felt, tekst: 'Søkesektor (300–900 m)' },
      { stil: 'prikk', farge: FARGE.felt, tekst: 'Parkering (dra meg)' },
    ],
    kilde: 'Tavla («ØST CA 118 · RETNING SKILT», 5–10 min gange).',
  },
  {
    id: 'hytter',
    navn: 'Utleide hytter (Tretopphyttene)',
    kort: 'Kan teamet bo her?',
    merkelapp: 'teori',
    forklaring: 'De 8 hyttene til Tretopphyttene i Ringsaker. Mørk nål = opptatt hele jakten (Bjørkhytta). Lys nål = delvis opptatt 23.–27.09. Alle er sjekket av en i chatten, uten funn.',
    tegn: [
      { stil: 'prikk', farge: FARGE.hytter, tekst: 'Opptatt hele perioden' },
      { stil: 'prikk', farge: '#d6a57a', tekst: 'Delvis opptatt' },
    ],
    kilde: 'tretopphytter.no, bookingkalender 23.09.',
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

/** Lagene gruppert slik de vises i Kart-fanen */
export const GRUPPER: { navn: string; forklaring: string; ider: LagId[] }[] = [
  { navn: 'Hovedkart', forklaring: 'Hvor kassen mest sannsynlig står, og hvor hintene peker.', ider: ['hintmarkorer', 'modell', 'teoriomrader'] },
  { navn: 'Vær og terreng', forklaring: 'Anja har hatt klar himmel og sol, og ser vanlig skog. Her passer det ikke.', ider: ['utelukket', 'skydekke', 'solidag'] },
  { navn: 'Fly, retning og kjøretid', forklaring: 'Flyet hun pekte på, 118°-linjene og hvor langt man kommer fra Oslo.', ider: ['fly', 'retning', 'kjoretid'] },
  { navn: 'Steder og teorier', forklaring: 'Stedene hintene og folk i chatten peker på.', ider: ['teorier', 'hytter', 'steder', 'defaultno', 'innlandet', 'skyanalyse'] },
  { navn: 'Annet', forklaring: 'Verktøy og bakgrunn.', ider: ['felt', 'utenfor'] },
]
