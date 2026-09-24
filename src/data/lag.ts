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
  | 'hoyde891'
  | 'dn_hoyde'
  | 'dn_vei'
  | 'dn_plan'
  | 'dn_avvist'
  | 'dn_notater'
  | 'coop'
  | 'dn_skytefelt'
  | 'dn_hogst'
  | 'dn_steder'
  | 'dn_omrader'
  | 'dn_gasoner'
  | 'dn_leder'
  | 'dn_baer'
  | 'dn_baerfunn'
  | 'dn_orrfugl'
  | 'dn_storfugl'
  | 'dn_pizza'
  | 'dn_flyhendelser'
  | 'dn_sjelden'
  | 'dn_flylyd'
  | 'dn_regn'
  | 'dn_radar'
  | 'dn_met'
  | 'dn_vaer'
  | 'dn_vegkamera'
  | 'dn_satellitt'
  | 'dn_fusjon'
  | 'dn_fusjon_utenlyd'
  | 'dn_fusjon_fly'
  | 'dn_fusjon_flyskog'
  | 'dn_fusjon_stille'
  | 'dn_fusjon_stilleskog'
  | 'dn_fusjon_utenmerker'
  | 'dn_fusjon_utenfly'
  | 'dn_fusjon_utenflylyd'
  | 'fellesskap891'
  | 'kommuner'
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
  modell: ['#991b1b', '#ef4444', '#fb923c', '#fde68a'],
  kjoretid: ['#ccfbf1', '#99f6e4', '#5eead4', '#2dd4bf', '#0d9488', '#115e59'],
  langtFraVei: '#94a3b8',
  retning: '#7c3aed',
  skydekke: '#2563eb',
  solidag: '#eab308',
  innlandet: '#dc2626',
  skyanalyse: '#2563eb',
  defaultno: '#111827',
  steder: '#dc2626',
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
      { stil: 'ring', farge: '#dc2626', tekst: 'Siste nytt' },
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
      { stil: 'ring', farge: '#ef4444', tekst: 'Teori-område med prosent' },
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
    id: 'hoyde891',
    navn: '810–891 moh nær vei',
    kort: '2,7 eiffeltårn, høyst 900 m fra vei',
    merkelapp: 'beregnet',
    forklaring:
      'Horde AI svarer «2,7 eiffeltårn stablet oppå hverandre» på HORDEMINUS. Eiffeltårnet er 300 m uten antenne og 330 m med, så det blir 810 eller 891 m (875 m med 324 m, høyden fra 2000 til 2022). Rutene viser skog og mark mellom 790 og 911 moh som ligger høyst 900 m fra en bilvei eller skogsbilvei, så man rekker å bære kassen dit på 5–10 min. Sterk farge betyr at veien ligger mot sørøst, slik Anja skrev («KOM FRA DEN VEIEN ←», ca. 130°). Svak farge betyr at det bare er vei i andre retninger. Høyde fra Kartverket (1 m-modell) i et rutenett på ca. 500 m, veier fra OpenStreetMap.',
    tegn: [
      { stil: 'rute', farge: '#6d28d9', tekst: 'Ca. 810 moh (790–830)' },
      { stil: 'rute', farge: '#a78bfa', tekst: '830–860 moh' },
      { stil: 'rute', farge: '#1d4ed8', tekst: 'Ca. 875–891 moh (860–911)' },
    ],
    kilde: 'Kartverket høydedata og OpenStreetMap. Tallet fra Horde AI i appen 24.09.',
  },
  {
    id: 'dn_hoyde',
    navn: 'default.no: 800–900 moh',
    kort: 'Høydebåndet for 2,7 eiffeltårn',
    merkelapp: 'beregnet',
    forklaring: 'Terreng 800–900 moh (oransje) og 780–920 moh (gult) fra Kartverkets 100 m-modell, laget av default.no. 2,7 eiffeltårn er 810–891 m avhengig av om tårnet regnes som 300, 324 eller 330 m.',
    tegn: [
      { stil: 'fyll', farge: '#f97316', tekst: '800–900 moh' },
      { stil: 'fyll', farge: '#facc15', tekst: '780–920 moh' },
    ],
    kilde: 'default.no/map.php, hentet 24.09 kl. 18:36. Takk til default.no.',
  },
  {
    id: 'dn_vei',
    navn: 'default.no: 800–900 m fra vei',
    kort: 'Hvis 891 er en avstand',
    merkelapp: 'beregnet',
    forklaring: 'Den andre lesningen av 891: steder som ligger 800–900 m fra nærmeste vei. Rødt = alle kjørbare veier inkludert skogsbilvei og traktorvei (OpenStreetMap), gult = bare offentlig vei. Laget av default.no, uten fly- og skogfilter.',
    tegn: [
      { stil: 'fyll', farge: '#dc2626', tekst: 'Alle kjørbare veier' },
      { stil: 'fyll', farge: '#facc15', tekst: 'Bare offentlig vei' },
    ],
    kilde: 'default.no/map.php, hentet 24.09. Takk til default.no.',
  },
  {
    id: 'dn_plan',
    navn: 'default.no: letestopp',
    kort: '40 rangerte steder å sjekke',
    merkelapp: 'tolkning',
    forklaring: 'Letelista til default.no: 40 steder rangert etter hvor godt de passer (skog, furu, stigning, fly, lite hus). Trykk på et nummer for å se parkering, gangavstand og retning.',
    tegn: [{ stil: 'prikk', farge: '#0f766e', tekst: 'Letestopp (nummer = rangering)' }],
    kilde: 'default.no/map.php («plan», laget 24.09 kl. 17:04). Takk til default.no.',
  },
  {
    id: 'dn_avvist',
    navn: 'default.no: avviste områder',
    kort: 'Sjekket og forkastet, med grunn',
    merkelapp: 'tolkning',
    forklaring: 'Områder default.no har sjekket og forkastet, for eksempel fordi flyene hun så ikke kan ha vært høyt nok der, eller fordi det regnet der mens glasset var tørt.',
    tegn: [{ stil: 'prikk', farge: '#64748b', tekst: 'Avvist område' }],
    kilde: 'default.no/map.php. Takk til default.no.',
  },
  {
    id: 'dn_notater',
    navn: 'default.no: feltnotater',
    kort: 'Bommer, private veier og sjekkede steder',
    merkelapp: 'fakta',
    forklaring: 'Notater fra folk som har vært ute og lett: bommer, private veier og steder som er sjekket til fots.',
    tegn: [{ stil: 'prikk', farge: '#1e293b', tekst: 'Feltnotat' }],
    kilde: 'default.no/map.php. Takk til default.no.',
  },
  {
    id: 'coop',
    navn: 'Coop-butikker',
    kort: '«Dressing fra Coop»',
    merkelapp: 'fakta',
    forklaring: 'Anja skrev at pizzadressingen var fra Coop. Kartet viser Coop-butikker i området (Extra, Prix, Mega, Obs). Coop finnes nesten overalt, så dette sier mest om hvor mannskapet kan ha handlet.',
    tegn: [{ stil: 'prikk', farge: '#00843d', tekst: 'Coop-butikk' }],
    kilde: 'OpenStreetMap via default.no. Takk til default.no.',
  },
  {
    id: 'dn_skytefelt',
    navn: 'Skytefelt',
    kort: '«INGEN SKYTING»',
    merkelapp: 'fakta',
    forklaring: 'Forsvarets skyte- og øvingsfelt i Innlandet, blant annet Rødsmoen, Regionfelt Østlandet og Terningmoen. Anja skrev «INGEN SKYTING», og man skal uansett ikke gå inn her. default.no regner feltene som utelukket.',
    tegn: [{ stil: 'stiplet', farge: '#b91c1c', tekst: 'Skytefelt (ikke gå inn)' }],
    kilde: 'default.no/map.php (hentet 24.09 kl. 18:36). Takk til default.no. Feltene er fra Forsvarsbygg via Geonorge.',
  },
  {
    id: 'dn_hogst',
    navn: 'Hogst',
    kort: '«Det har vært hogd der jeg gikk»',
    merkelapp: 'fakta',
    forklaring: 'Flater som er hogd de siste årene, i de 34 områdene default.no har sjekket. Anja skrev at det har vært hogd der hun gikk, så kassen kan stå nær en fersk hogstflate. Svart strek er jernbane (tømmertog). Stiplet ramme viser hvor det finnes data.',
    tegn: [
      { stil: 'fyll', farge: '#ffd23c', tekst: 'Hogd 2016 eller senere' },
      { stil: 'fyll', farge: '#ff7814', tekst: 'Hogd 2022 eller senere' },
      { stil: 'fyll', farge: '#e61414', tekst: 'Hogd 2024–25' },
      { stil: 'linje', farge: '#282828', tekst: 'Jernbane' },
    ],
    kilde: 'default.no/map.php (hentet 24.09 kl. 18:36). Takk til default.no. Hogstdata fra Global Forest Watch.',
  },
  {
    id: 'dn_steder',
    navn: 'Konkrete steder',
    kort: 'Vei, 5–10 min opp, furu, riktig relieff',
    merkelapp: 'beregnet',
    forklaring: 'default.no sitt stedsøk: steder 5–10 min gange oppover fra vei, med furu, terreng som ligner bildet (sett mot ca. 219°) og riktig solhorisont. Grønne prikker er de 126 beste stedene. Trykk for vei, høyde og stigning.',
    tegn: [
      { stil: 'prikk', farge: '#16a34a', tekst: 'Konkret sted' },
      { stil: 'fyll', farge: '#e62828', tekst: 'Sterkt treff' },
      { stil: 'fyll', farge: '#fac828', tekst: 'Mulig treff' },
      { stil: 'fyll', farge: '#286ee6', tekst: 'Riktig avstand fra vei' },
    ],
    kilde: 'default.no/map.php (hentet 24.09 kl. 18:36). Takk til default.no.',
  },
  {
    id: 'dn_omrader',
    navn: 'Søkeområder',
    kort: '34 områder med andel av sannsynligheten',
    merkelapp: 'beregnet',
    forklaring: 'Områdene default.no har søkt gjennom, ca. 24 × 24 km. Tykkere kant betyr større andel av sannsynligheten i fusjonsmodellen. Stiplet kant er en hypotese som ikke kommer fra modellen. Trykk på nummeret for km² med sterke og mulige steder, furu og hogst.',
    tegn: [{ stil: 'rute', farge: '#ea580c', tekst: 'Søkeområde (nummer = rangering)' }],
    kilde: 'default.no/map.php (hentet 24.09 kl. 18:36). Takk til default.no.',
  },
  {
    id: 'dn_gasoner',
    navn: 'Gå-soner fra vei',
    kort: 'Skog 200–700 m fra vei',
    merkelapp: 'beregnet',
    forklaring: 'Skog som ligger 200–700 m fra vei i seks områder, altså en kort gåtur inn. Rødt er målt fra ordentlig vei, blått fra alle veier inkludert traktorvei.',
    tegn: [
      { stil: 'fyll', farge: '#c81e1e', tekst: 'Fra ordentlig vei' },
      { stil: 'fyll', farge: '#1e64dc', tekst: 'Fra alle veier' },
    ],
    kilde: 'default.no/map.php (hentet 24.09 kl. 18:36). Takk til default.no.',
  },
  {
    id: 'dn_leder',
    navn: 'Pilegrimsleder',
    kort: '«INGEN STIER»',
    merkelapp: 'fakta',
    forklaring: 'Merkede pilegrimsleder mot Nidaros. Den tykke er Østerdalsleden (Rena–Tynset–Trondheim). Anja skrev «INGEN STIER», så kassen står neppe rett ved en merket led.',
    tegn: [
      { stil: 'linje', farge: '#f59e0b', tekst: 'Østerdalsleden' },
      { stil: 'linje', farge: '#cc88aa', tekst: 'Andre pilegrimsleder' },
    ],
    kilde: 'default.no/map.php (hentet 24.09 kl. 18:36). Takk til default.no. Ledene er fra OpenStreetMap.',
  },
  {
    id: 'dn_baer',
    navn: 'Tyttebær eller blåbær',
    kort: 'Tørr lynghei eller blåbærskog',
    merkelapp: 'beregnet',
    forklaring: 'Andel tyttebær og røsslyng mot blåbær, ut fra funn i Artsdatabanken, glattet over ca. 12 km. Rødt er tørr furumo med tyttebær og lyng, blått er frodigere blåbærskog. Et svakt bevis i default.no sin modell.',
    tegn: [
      { stil: 'fyll', farge: 'rgb(230,60,26)', tekst: 'Mest tyttebær og lyng' },
      { stil: 'fyll', farge: 'rgb(128,60,128)', tekst: 'Blandet' },
      { stil: 'fyll', farge: 'rgb(26,60,230)', tekst: 'Mest blåbær' },
    ],
    kilde: 'default.no/map.php (hentet 24.09 kl. 18:36). Takk til default.no. Funn fra Artsdatabanken via GBIF.',
  },
  {
    id: 'dn_baerfunn',
    navn: 'Bærfunn',
    kort: 'Enkeltfunn av tyttebær og blåbær',
    merkelapp: 'fakta',
    forklaring: 'Registrerte funn av tyttebær og blåbær 2015–2026 i Innlandet (ca. 8 400 funn). Viser mest hvor folk har registrert, ikke nødvendigvis hvor det vokser mest.',
    tegn: [
      { stil: 'prikk', farge: '#cc0000', tekst: 'Tyttebær' },
      { stil: 'prikk', farge: '#0066cc', tekst: 'Blåbær' },
    ],
    kilde: 'default.no/map.php (hentet 24.09 kl. 18:36). Takk til default.no. Artsdatabanken via GBIF.',
  },
  {
    id: 'dn_orrfugl',
    navn: 'Orrfugl',
    kort: 'Lyden 24.09 kan være orrfuglspill',
    merkelapp: 'fakta',
    forklaring: 'Hvor det er registrert orrfugl 2015–2026, i ruter på ca. 2 × 1 km. Sterkere farge betyr flere funn. default.no mener en lyd på streamen 24.09 kan være orrfugl som spiller.',
    tegn: [{ stil: 'fyll', farge: '#cc0000', tekst: 'Orrfugl (sterkere = flere funn)' }],
    kilde: 'default.no/map.php (hentet 24.09 kl. 18:36). Takk til default.no. Artsdatabanken via GBIF.',
  },
  {
    id: 'dn_storfugl',
    navn: 'Storfugl',
    kort: 'Funn av storfugl',
    merkelapp: 'fakta',
    forklaring: 'Hvor det er registrert storfugl 2015–2026, i ruter på ca. 2 × 1 km. Sterkere farge betyr flere funn.',
    tegn: [{ stil: 'fyll', farge: '#7700aa', tekst: 'Storfugl (sterkere = flere funn)' }],
    kilde: 'default.no/map.php (hentet 24.09 kl. 18:36). Takk til default.no. Artsdatabanken via GBIF.',
  },
  {
    id: 'dn_pizza',
    navn: 'Pizzasteder',
    kort: 'Pizza på tavla',
    merkelapp: 'fakta',
    forklaring: 'Pizzasteder og restauranter med pizza i området, fra OpenStreetMap. Sier mest om hvor mannskapet kan ha spist.',
    tegn: [{ stil: 'prikk', farge: '#dd5500', tekst: 'Pizzasted' }],
    kilde: 'default.no/map.php (hentet 24.09 kl. 18:36). Takk til default.no. OpenStreetMap.',
  },
  {
    id: 'dn_flyhendelser',
    navn: 'Fly ved hendelsene',
    kort: '21.09 21:30, 22.09 20:33 og 20:35',
    merkelapp: 'fakta',
    forklaring: 'Alle 253 fly som var i lufta de tre gangene Anja reagerte på fly. Fargen viser høyden: mørk = lavt, lys gul = høyt. Rosa prikk er der flyet var da hun reagerte, rød prikk er der det var rett før lyden var sterkest (bare 21.09).',
    tegn: [
      { stil: 'linje', farge: 'rgb(253,231,37)', tekst: 'Høyt fly (ca. 40 000 fot)' },
      { stil: 'linje', farge: 'rgb(68,1,84)', tekst: 'Lavt fly' },
      { stil: 'prikk', farge: '#d946ef', tekst: 'Der flyet var da hun reagerte' },
      { stil: 'prikk', farge: '#ef4444', tekst: 'Rett før lyden toppet' },
    ],
    kilde: 'default.no/map.php (hentet 24.09 kl. 18:36). Takk til default.no. ADS-B fra adsb.lol.',
  },
  {
    id: 'dn_sjelden',
    navn: 'Stille himmel',
    kort: '«INGEN FLY» om dagen, fly 21:30',
    merkelapp: 'beregnet',
    forklaring: 'Anja skrev «INGEN FLY» kl. 18:31 21.09, men så et fly 21:30. Lyseblått er der få fly gikk over 40° over horisonten kl. 07–18:31, men der flyet 21:30 var høyt nok. Sterkere blått passer bedre. Tallene er de beste rutene i det sannsynlige området.',
    tegn: [
      { stil: 'fyll', farge: '#0ea5e9', tekst: 'Passer godt' },
      { stil: 'fyll', farge: '#50c8ff', tekst: 'Passer litt' },
      { stil: 'prikk', farge: '#0369a1', tekst: 'Beste ruter (nummer)' },
    ],
    kilde: 'default.no/map.php (hentet 24.09 kl. 18:36). Takk til default.no. ADS-B fra adsb.lol.',
  },
  {
    id: 'dn_flylyd',
    navn: 'Flylyd-match',
    kort: 'Hørte fly mot fly i lufta',
    merkelapp: 'beregnet',
    forklaring: 'default.no har sammenlignet 21 flylyder på streamen med flyene som var i lufta. Rødt er der lyden passer best med flyene. Obs: lyden kan være spilt av på nytt i loop, se Analyse-fanen.',
    tegn: [
      { stil: 'fyll', farge: '#ff1e14', tekst: 'Beste 2 %' },
      { stil: 'fyll', farge: '#ff9614', tekst: 'Topp 15 %' },
      { stil: 'fyll', farge: '#ffdc14', tekst: 'Topp 40 %' },
    ],
    kilde: 'default.no/map.php (hentet 24.09 kl. 18:36). Takk til default.no.',
  },
  {
    id: 'dn_regn',
    navn: 'Regn siden søndag',
    kort: 'Kameraet har vært tørt',
    merkelapp: 'fakta',
    forklaring: 'Regn siden søndag 21.09 kl. 06:50, fra 831 værstasjoner og 76 radarbilder. Glasset foran kameraet har vært tørt hele tiden, så blå områder passer dårlig.',
    tegn: [
      { stil: 'fyll', farge: '#1c6fd6', tekst: 'Over 6 mm' },
      { stil: 'fyll', farge: '#6ea3e6', tekst: '0,3–6 mm' },
    ],
    kilde: 'default.no/map.php (hentet 24.09 kl. 18:36). Takk til default.no. Frost (MET) og radar.',
  },
  {
    id: 'dn_radar',
    navn: 'Nedbørsradar 24.09',
    kort: 'Radarbilde kl. 18:35',
    merkelapp: 'fakta',
    forklaring: 'Nedbørsradaren fra MET 24.09 kl. 18:35, samme som på yr.no. Grønt er lett regn, gult og rødt er kraftig. Et øyeblikksbilde, ikke oppdatert.',
    tegn: [
      { stil: 'fyll', farge: '#3caa3c', tekst: 'Lett' },
      { stil: 'fyll', farge: '#ffe600', tekst: 'Moderat' },
      { stil: 'fyll', farge: '#dc1414', tekst: 'Kraftig' },
    ],
    kilde: 'default.no/map.php (hentet 24.09 kl. 18:36). Takk til default.no. Radar fra MET.',
  },
  {
    id: 'dn_met',
    navn: 'MET-vær 24.09',
    kort: 'Temperatur, skyer og regn kl. 18',
    merkelapp: 'fakta',
    forklaring: 'Været i 81 punkter 24.09 ca. kl. 18 fra MET. Blått regner, grått er mer enn 70 % skyer, gult er klarere.',
    tegn: [
      { stil: 'prikk', farge: '#2563eb', tekst: 'Regner' },
      { stil: 'prikk', farge: '#a8a29e', tekst: 'Overskyet' },
      { stil: 'prikk', farge: '#fde68a', tekst: 'Klarere' },
    ],
    kilde: 'default.no/map.php (hentet 24.09 kl. 18:36). Takk til default.no. MET.',
  },
  {
    id: 'dn_vaer',
    navn: 'Værstasjoner',
    kort: 'Dugg og regn mot kameraet',
    merkelapp: 'beregnet',
    forklaring: 'De 400 værstasjonene default.no sammenligner med kameraet: dugg ved daggry, regn om morgenen og hvor fort det blir varmt. Rødt ligner mest på det kameraet viser.',
    tegn: [
      { stil: 'prikk', farge: 'rgb(255,57,51)', tekst: 'Ligner mest' },
      { stil: 'prikk', farge: 'rgb(80,207,151)', tekst: 'Ligner lite' },
    ],
    kilde: 'default.no/map.php (hentet 24.09 kl. 18:36). Takk til default.no. Frost (MET).',
  },
  {
    id: 'dn_vegkamera',
    navn: 'Veikameraer',
    kort: '533 kameraer med vær',
    merkelapp: 'fakta',
    forklaring: 'Statens vegvesens værstasjoner og kameraer. Blått hadde nedbør 24.09 ca. kl. 18:30, gult var tørt, grått måler ikke nedbør. Trykk for å åpne kamerabildet (det siste bildet, ikke fra 24.09).',
    tegn: [
      { stil: 'prikk', farge: '#2563eb', tekst: 'Nedbør' },
      { stil: 'prikk', farge: '#f59e0b', tekst: 'Tørt' },
      { stil: 'prikk', farge: '#94a3b8', tekst: 'Måler ikke nedbør' },
    ],
    kilde: 'default.no/map.php (hentet 24.09 kl. 18:36). Takk til default.no. Statens vegvesen.',
  },
  {
    id: 'dn_satellitt',
    navn: 'Satellitt 21.09',
    kort: 'Sentinel-2, 30 m',
    merkelapp: 'fakta',
    forklaring: 'Satellittbilde fra 21.09 (Sentinel-2 via NASA), den klareste dagen default.no fant (ca. 22 % skyer rundt Evenstad). Oppløsningen er 30 m, så enkelttrær synes ikke, men hogstflater og myr gjør det.',
    tegn: [{ stil: 'fyll', farge: '#4d7c0f', tekst: 'Satellittbilde' }],
    kilde: 'default.no/map.php (hentet 24.09 kl. 18:36). Takk til default.no. NASA GIBS (HLS).',
  },
  {
    id: 'dn_fusjon',
    navn: 'Fusjon: alt bevis',
    kort: 'default.no sin hovedmodell',
    merkelapp: 'beregnet',
    forklaring: 'default.no sin hovedmodell for hele Norge: flyene hun så, «INGEN FLY», regn, vær, satellittskyer, skog, furu, bær, skytefelt og kjøretid, vektet sammen. Rutene er ca. 5 × 5 km. Rødt er de beste 2 %. Trykk på et nummer for hvor mye av sannsynligheten som ligger innen 10 og 25 km.',
    tegn: [
      { stil: 'fyll', farge: '#ff1e14', tekst: 'Beste 2 % av rutene' },
      { stil: 'fyll', farge: '#ff9614', tekst: 'Topp 15 %' },
      { stil: 'fyll', farge: '#ffdc14', tekst: 'Topp 40 %' },
      { stil: 'prikk', farge: '#dc2626', tekst: 'Toppområder (nummer = rangering)' },
    ],
    kilde: 'default.no/map.php (hentet 24.09 kl. 18:36). Takk til default.no.',
  },
  {
    id: 'dn_fusjon_utenlyd',
    navn: 'Fusjon: uten lyd og sol',
    kort: 'Bare det hun skrev og viste',
    merkelapp: 'beregnet',
    forklaring: 'default.no sin fusjonsmodell med bare noen av bevisene: de tre flyene hun så, INGEN FLY, regn, vær, skog og kjøretid, uten lyd og sol. Rutene er ca. 5 × 5 km. Fargen viser hvor godt ruta passer sammenlignet med resten av Norge.',
    tegn: [
      { stil: 'fyll', farge: '#ff1e14', tekst: 'Beste 2 % av rutene' },
      { stil: 'fyll', farge: '#ff9614', tekst: 'Topp 15 %' },
      { stil: 'fyll', farge: '#ffdc14', tekst: 'Topp 40 %' },
      { stil: 'prikk', farge: '#dc2626', tekst: 'Toppområder (nummer = rangering)' },
    ],
    kilde: 'default.no/map.php (hentet 24.09 kl. 18:36). Takk til default.no.',
  },
  {
    id: 'dn_fusjon_fly',
    navn: 'Fusjon: bare flyene',
    kort: 'De tre flyene hun så',
    merkelapp: 'beregnet',
    forklaring: 'default.no sin fusjonsmodell med bare noen av bevisene: bare de tre flyene hun så (21.09 21:30, 22.09 20:33 og 20:35). Rutene er ca. 5 × 5 km. Fargen viser hvor godt ruta passer sammenlignet med resten av Norge.',
    tegn: [
      { stil: 'fyll', farge: '#ff1e14', tekst: 'Beste 2 % av rutene' },
      { stil: 'fyll', farge: '#ff9614', tekst: 'Topp 15 %' },
      { stil: 'fyll', farge: '#ffdc14', tekst: 'Topp 40 %' },
      { stil: 'prikk', farge: '#dc2626', tekst: 'Toppområder (nummer = rangering)' },
    ],
    kilde: 'default.no/map.php (hentet 24.09 kl. 18:36). Takk til default.no.',
  },
  {
    id: 'dn_fusjon_flyskog',
    navn: 'Fusjon: fly + skog',
    kort: 'Flyene, skog, skyer og kjøretid',
    merkelapp: 'beregnet',
    forklaring: 'default.no sin fusjonsmodell med bare noen av bevisene: de tre flyene, skog, satellittskyer og kjøretid. Rutene er ca. 5 × 5 km. Fargen viser hvor godt ruta passer sammenlignet med resten av Norge.',
    tegn: [
      { stil: 'fyll', farge: '#ff1e14', tekst: 'Beste 2 % av rutene' },
      { stil: 'fyll', farge: '#ff9614', tekst: 'Topp 15 %' },
      { stil: 'fyll', farge: '#ffdc14', tekst: 'Topp 40 %' },
      { stil: 'prikk', farge: '#dc2626', tekst: 'Toppområder (nummer = rangering)' },
    ],
    kilde: 'default.no/map.php (hentet 24.09 kl. 18:36). Takk til default.no.',
  },
  {
    id: 'dn_fusjon_stille',
    navn: 'Fusjon: fly + INGEN FLY',
    kort: 'Flyene og stille dag',
    merkelapp: 'beregnet',
    forklaring: 'default.no sin fusjonsmodell med bare noen av bevisene: de tre flyene og «INGEN FLY» om dagen. Rutene er ca. 5 × 5 km. Fargen viser hvor godt ruta passer sammenlignet med resten av Norge.',
    tegn: [
      { stil: 'fyll', farge: '#ff1e14', tekst: 'Beste 2 % av rutene' },
      { stil: 'fyll', farge: '#ff9614', tekst: 'Topp 15 %' },
      { stil: 'fyll', farge: '#ffdc14', tekst: 'Topp 40 %' },
      { stil: 'prikk', farge: '#dc2626', tekst: 'Toppområder (nummer = rangering)' },
    ],
    kilde: 'default.no/map.php (hentet 24.09 kl. 18:36). Takk til default.no.',
  },
  {
    id: 'dn_fusjon_stilleskog',
    navn: 'Fusjon: fly + INGEN FLY + skog',
    kort: 'Uten regn og vær',
    merkelapp: 'beregnet',
    forklaring: 'default.no sin fusjonsmodell med bare noen av bevisene: de tre flyene, «INGEN FLY», skog, skyer og kjøretid, uten regn og vær. Rutene er ca. 5 × 5 km. Fargen viser hvor godt ruta passer sammenlignet med resten av Norge.',
    tegn: [
      { stil: 'fyll', farge: '#ff1e14', tekst: 'Beste 2 % av rutene' },
      { stil: 'fyll', farge: '#ff9614', tekst: 'Topp 15 %' },
      { stil: 'fyll', farge: '#ffdc14', tekst: 'Topp 40 %' },
      { stil: 'prikk', farge: '#dc2626', tekst: 'Toppområder (nummer = rangering)' },
    ],
    kilde: 'default.no/map.php (hentet 24.09 kl. 18:36). Takk til default.no.',
  },
  {
    id: 'dn_fusjon_utenmerker',
    navn: 'Fusjon: uten flylyd-merking',
    kort: 'Alt unntatt håndmerket lyd',
    merkelapp: 'beregnet',
    forklaring: 'default.no sin fusjonsmodell med bare noen av bevisene: alt unntatt flylydene folk har merket for hånd. Rutene er ca. 5 × 5 km. Fargen viser hvor godt ruta passer sammenlignet med resten av Norge.',
    tegn: [
      { stil: 'fyll', farge: '#ff1e14', tekst: 'Beste 2 % av rutene' },
      { stil: 'fyll', farge: '#ff9614', tekst: 'Topp 15 %' },
      { stil: 'fyll', farge: '#ffdc14', tekst: 'Topp 40 %' },
      { stil: 'prikk', farge: '#dc2626', tekst: 'Toppområder (nummer = rangering)' },
    ],
    kilde: 'default.no/map.php (hentet 24.09 kl. 18:36). Takk til default.no.',
  },
  {
    id: 'dn_fusjon_utenfly',
    navn: 'Fusjon: uten fly',
    kort: 'Regn, vær, skog og kjøretid',
    merkelapp: 'beregnet',
    forklaring: 'default.no sin fusjonsmodell med bare noen av bevisene: ingen flydata, bare regn, vær, skog, satellittskyer og kjøretid (nesten flatt). Rutene er ca. 5 × 5 km. Fargen viser hvor godt ruta passer sammenlignet med resten av Norge.',
    tegn: [
      { stil: 'fyll', farge: '#ff1e14', tekst: 'Beste 2 % av rutene' },
      { stil: 'fyll', farge: '#ff9614', tekst: 'Topp 15 %' },
      { stil: 'fyll', farge: '#ffdc14', tekst: 'Topp 40 %' },
      { stil: 'prikk', farge: '#dc2626', tekst: 'Toppområder (nummer = rangering)' },
    ],
    kilde: 'default.no/map.php (hentet 24.09 kl. 18:36). Takk til default.no.',
  },
  {
    id: 'dn_fusjon_utenflylyd',
    navn: 'Fusjon: uten flylyd (eldre)',
    kort: 'Eldre kjøring',
    merkelapp: 'beregnet',
    forklaring: 'default.no sin fusjonsmodell med bare noen av bevisene: alt unntatt flylyd, fra en eldre kjøring. Rutene er ca. 5 × 5 km. Fargen viser hvor godt ruta passer sammenlignet med resten av Norge.',
    tegn: [
      { stil: 'fyll', farge: '#ff1e14', tekst: 'Beste 2 % av rutene' },
      { stil: 'fyll', farge: '#ff9614', tekst: 'Topp 15 %' },
      { stil: 'fyll', farge: '#ffdc14', tekst: 'Topp 40 %' },
      { stil: 'prikk', farge: '#dc2626', tekst: 'Toppområder (nummer = rangering)' },
    ],
    kilde: 'default.no/map.php (hentet 24.09 kl. 18:36). Takk til default.no.',
  },
  {
    id: 'fellesskap891',
    navn: 'Fellesskapets 800–900 moh-kart',
    kort: 'Høyde + fly + skog, utenfor skytefelt',
    merkelapp: 'tolkning',
    forklaring:
      'Kartet noen i fellesskapet laget 24.09: 800–900 moh, der flyene Anja så passer over, med skog og utenfor skytefelt. Det meste ligger vest for Rena, mellom Rena og Evenstad/Koppang. Stedfestet fra bildet, ca. ±500 m.',
    tegn: [{ stil: 'fyll', farge: '#e11d1d', tekst: 'Passer med høyde, fly og skog' }],
    kilde: 'Delt i chatten 24.09.',
  },
  {
    id: 'utelukket',
    navn: 'Utelukket av fellesskapet',
    kort: 'Fjellbjørk og annet',
    merkelapp: 'tolkning',
    forklaring:
      'Kartet fellesskapet har laget 23.09. Rødt er utelukket, og lyseblått er utelukket fordi det vokser fjellbjørk der. Det som står igjen er stripa Hamar–Løten–Rena–Koppang, Ringsakfjellet/Rudshøgda og Gjøvik/Toten. Stedfestet fra et bilde, så kantene er omtrentlige (±10 km). Bildet dekket bare Østlandet, så alt vest for det (Vestlandet og vestre Agder) er fylt inn som utelukket her.',
    tegn: [
      { stil: 'fyll', farge: '#b91c1c', tekst: 'Utelukket' },
      { stil: 'fyll', farge: '#22d3ee', tekst: 'Fjellbjørk' },
    ],
    kilde: 'Delt i chatten 23.09.',
  },
  {
    id: 'kommuner',
    navn: 'Kommunevurdering (Vercel)',
    kort: 'Usikkert, lite sannsynlig, utelukket',
    merkelapp: 'tolkning',
    forklaring:
      'Hver kommune vurdert av administratoren på hordejakten.vercel.app, et uavhengig fanprosjekt. Grønt = usikkert (fortsatt åpent), grått = lite sannsynlig, rødt = utelukket. Ingen kommune er satt til «sannsynlig» ennå. Hentet 23.09.',
    tegn: [
      { stil: 'fyll', farge: '#4d9b73', tekst: 'Usikkert (åpent)' },
      { stil: 'fyll', farge: '#64748b', tekst: 'Lite sannsynlig' },
      { stil: 'fyll', farge: '#b91c1c', tekst: 'Utelukket' },
    ],
    kilde: 'hordejakten.vercel.app (kreditt til dem).',
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
      'Plasser markøren på en parkering eller skogsbilvei. Anja skrev «KOM FRA DEN VEIEN» med pil mot venstre i bildet, som er ca. 130° (sørøst) fra kassen. Skiltet pekte samme vei (118–120°). Fra bilen ligger kassen altså mot ca. 300° (±25°, nordvest), 300–900 m unna, oppover og uten sti. Dra markøren for å flytte den.',
    tegn: [
      { stil: 'rute', farge: FARGE.felt, tekst: 'Søkesektor (300–900 m)' },
      { stil: 'prikk', farge: FARGE.felt, tekst: 'Parkering (dra meg)' },
    ],
    kilde: 'Tavla («KOM FRA DEN VEIEN ←», «ØST CA 118 · RETNING SKILT», 5–10 min gange).',
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
  { navn: 'Høyden (2,7 eiffeltårn)', forklaring: '810 eller 891 moh, nær vei. Eller 891 m fra vei.', ider: ['hoyde891', 'fellesskap891', 'dn_hoyde', 'dn_vei'] },
  { navn: 'Fra default.no', forklaring: 'Letestopp, steder, avviste områder og feltnotater. Takk til default.no.', ider: ['dn_plan', 'dn_steder', 'dn_omrader', 'dn_avvist', 'dn_notater', 'coop', 'dn_pizza'] },
  { navn: 'default.no: terreng og skog', forklaring: 'Skytefelt, hogst, stier, bær og fugl. Takk til default.no.', ider: ['dn_skytefelt', 'dn_hogst', 'dn_leder', 'dn_gasoner', 'dn_baer', 'dn_baerfunn', 'dn_orrfugl', 'dn_storfugl', 'dn_satellitt'] },
  { navn: 'default.no: fly og vær', forklaring: 'Flyene hun så, stille himmel, regn og vær. Takk til default.no.', ider: ['dn_flyhendelser', 'dn_sjelden', 'dn_flylyd', 'dn_regn', 'dn_radar', 'dn_met', 'dn_vaer', 'dn_vegkamera'] },
  { navn: 'default.no: modeller', forklaring: 'Fusjonsmodellen med ulike bevis slått av og på. Slå på én om gangen. Takk til default.no.', ider: ['dn_fusjon', 'dn_fusjon_utenlyd', 'dn_fusjon_fly', 'dn_fusjon_flyskog', 'dn_fusjon_stille', 'dn_fusjon_stilleskog', 'dn_fusjon_utenmerker', 'dn_fusjon_utenfly', 'dn_fusjon_utenflylyd'] },
  { navn: 'Vær og terreng', forklaring: 'Anja har hatt klar himmel og sol, og ser vanlig skog. Her passer det ikke.', ider: ['utelukket', 'kommuner', 'skydekke', 'solidag'] },
  { navn: 'Fly, retning og kjøretid', forklaring: 'Flyet hun pekte på, 118°-linjene og hvor langt man kommer fra Oslo.', ider: ['fly', 'retning', 'kjoretid'] },
  { navn: 'Steder og teorier', forklaring: 'Stedene hintene og folk i chatten peker på.', ider: ['teorier', 'hytter', 'steder', 'defaultno', 'innlandet', 'skyanalyse'] },
  { navn: 'Annet', forklaring: 'Verktøy og bakgrunn.', ider: ['felt', 'utenfor'] },
]
