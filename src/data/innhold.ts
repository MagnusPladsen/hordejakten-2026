// Alt innhold som ikke er beregnet: hint, tavle-logg, steder og soner.
// Koordinater er [lat, lon]. «ca.» betyr at punktet er et omtrentlig anslag.
import type { LatLon } from '@/lib/geo'
import type { LagId } from '@/data/lag'

export const STREAM = {
  videoId: 'EQHgfmZicc8',
  url: 'https://www.youtube.com/watch?v=EQHgfmZicc8',
  chat: 'https://www.youtube.com/live_chat?v=EQHgfmZicc8&is_popout=1',
  forsinkelseSek: 45,
}

export const OSLO: LatLon = [59.9139, 10.7522]

export type Status = 'lost' | 'bekreftet' | 'tolkning' | 'usikker' | 'apen'

export const STATUS: Record<Status, { tekst: string; klasse: string }> = {
  lost: { tekst: 'Løst', klasse: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  bekreftet: { tekst: 'Bekreftet', klasse: 'bg-sky-50 text-sky-700 ring-sky-200' },
  tolkning: { tekst: 'Tolkning', klasse: 'bg-amber-50 text-amber-800 ring-amber-200' },
  usikker: { tekst: 'Usikker', klasse: 'bg-slate-100 text-slate-600 ring-slate-200' },
  apen: { tekst: 'Uløst', klasse: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200' },
}

export type Hint = {
  id: string
  tittel: string
  status: Status
  kilde: string
  dato?: string
  tekst: string
  betydning: string
  /** Kartlag som slås på når man trykker «Vis på kartet» */
  lag?: LagId[]
  /** Sted (id fra STEDER/TEORIER) som kartet zoomer til */
  fokus?: string
  lenke?: string
  kompass?: boolean
  anagram?: boolean
}

export const HINT: Hint[] = [
  {
    id: 'reise',
    tittel: 'Reisen: fra Oslo søndag kl. 04:00',
    status: 'bekreftet',
    kilde: 'Tavla + Anja',
    dato: '21.09',
    tekst: 'Anja ble hentet i Oslo søndag 20.09 kl. 04:00. Hun tror hun sov ca. 7 timer i bilen og vet ikke hvor hun er. Kun bil, ingen ferge, usikker på tunneler.',
    betydning: 'Gir en kjøretidsring rundt Oslo. Hun sov, så kjøretiden er usikker. Velg antatt kjøretid og slingringsmonn i modellen.',
    lag: ['kjoretid', 'modell'],
  },
  {
    id: 'retning118',
    tittel: '«ØST CA 118» på tavla',
    status: 'tolkning',
    kilde: 'Tavla + kompasstegning',
    tekst: 'Anja skrev «ØST CA 118» og tegnet et kompass på tavla. Fellesskapet tolker det som retningen fra kassen til parkeringen (øst-sørøst). Kameraet står ca. 73°.',
    betydning: 'Står du på parkeringen, ligger kassen mot ca. 298° (vest-nordvest), 5–10 min oppover. Hvis 118° i stedet er retningen mot Oslo, ligger kassen på linja nordvest for Oslo (Valdres og Sogn).',
    lag: ['retning'],
    kompass: true,
  },
  {
    id: 'terje',
    tittel: 'Kode 5008 (kredittskår + «terje»)',
    status: 'lost',
    kilde: 'Horde-appen',
    tekst: 'Trykk «Kredittskår», hold fingeren på tallet og skriv «terje». Da kommer «Du fant et hint! 5008».',
    betydning: '5008 er postnummeret til Horde AS i Bergen (Lars Hilles gate 20A). Det kan også være koden til en av låsene.',
    lag: ['steder'],
    fokus: 'horde',
  },
  {
    id: 'genser',
    tittel: 'Tallene på genseren = GJELDFRI',
    status: 'lost',
    kilde: 'Stream',
    tekst: '7 10 5 12 / 4 6 18 9 med A=1 gir G J E L / D F R I.',
    betydning: 'Et kampanjeord. Sier ingenting om stedet.',
  },
  {
    id: 'morse',
    tittel: 'Morsekode på buksa = PREMIE',
    status: 'lost',
    kilde: 'Stream',
    tekst: 'Prikkene og strekene nedover buksa er morse for «PREMIE».',
    betydning: 'Et kampanjeord. Sier ingenting om stedet.',
  },
  {
    id: 'caesar',
    tittel: 'Bokstavene på buksa (MT WI JO FP YJ …)',
    status: 'lost',
    kilde: 'Stream',
    dato: '23.09',
    tekst: 'Cæsar-chiffer med forskyvning 5: MT→HO, WI→RD, JO→EJ, FP→AK, YJ→TE … = HORDEJAKTEN@… (en e-postadresse).',
    betydning: 'En minikonkurranse (20 000 Horde-poeng til første løser). Sier ingenting om stedet.',
  },
  {
    id: 'bokstaver',
    tittel: 'Bokstaver ved verving',
    status: 'apen',
    kilde: 'Horde-appen («Verv en venn»)',
    tekst: 'Etter å ha vervet noen får man opp bokstaver. Bekreftet sett så langt: I S N D O R U E M H. Flere kan komme.',
    betydning: 'Trolig et anagram. «MINUS HORDE» er foreslått. Test egne ord under.',
    anagram: true,
  },
  {
    id: 'dyr',
    tittel: 'Rev, ekorn og kråke i boksen',
    status: 'tolkning',
    kilde: 'Stream',
    dato: '23.09',
    tekst: 'Det har kommet en rev, et ekorn og en kråke inn i boksen. 23.09 ble det satt en rev inn i buret.',
    betydning: 'Kan peke på «What does the fox say» (Ylvis) eller «Reven og kråka» (Alf Prøysen fra Ringsaker). I visa er ostebiten det tredje elementet. Froland har ekorn i kommunevåpenet.',
    lag: ['steder', 'teorier'],
    fokus: 'proysen',
  },
  {
    id: 'ekorn',
    tittel: '«Verv en venn» → «Hint-hint» med ekorn',
    status: 'bekreftet',
    kilde: 'Horde-appen',
    tekst: 'Trykk «Verv en venn» i appen. På slutten dukker det opp «Hint-hint» med bilde av et ekorn.',
    betydning: 'Ekornet går igjen i flere teorier (Froland, Lillehammer, ordspill på «nøtt»).',
    lag: ['teorier'],
  },
  {
    id: 'and',
    tittel: 'En and i YouTube-video (ett bilde)',
    status: 'bekreftet',
    kilde: 'YouTube _KVnuWlzVsE',
    tekst: 'En and dukker opp i ett enkelt bilde helt nederst til høyre, ca. 00:15, mens Anja står på hendene.',
    betydning: 'Enda et dyr i rekken rev, ekorn, kråke og and.',
    lenke: 'https://www.youtube.com/watch?v=_KVnuWlzVsE&t=13s',
  },
  {
    id: 'skilt',
    tittel: 'Horde-skilt med hender som peker mot venstre',
    status: 'usikker',
    kilde: 'Stream',
    dato: '23.09',
    tekst: 'Foran kassen står et «Horde»-skilt båret av to hender, og det peker mot venstre i bildet.',
    betydning: 'Kameraet ser mot sørvest, så venstre i bildet er omtrent sørøst. Hva håndsymbolene betyr er ikke løst.',
  },
  {
    id: 'bjorneparken',
    tittel: 'Reklamefargene ligner Bjørneparken',
    status: 'tolkning',
    kilde: 'Horde-reklame',
    tekst: 'Magenta og lysegrønt i Hordes reklame er nesten identisk med logoen og parkkartet til Bjørneparken i Flå.',
    betydning: 'En mulig pekepinn mot Flå og Hallingdal.',
    lag: ['steder'],
    fokus: 'bjorneparken',
  },
  {
    id: 'ikkeoy',
    tittel: 'Finn.no-annonse: «Ikke en øy»',
    status: 'bekreftet',
    kilde: 'Finn.no',
    tekst: 'En annonse på Finn.no har løsningen «Ikke en øy».',
    betydning: 'Kassen står ikke på en øy. Det stemmer med «INGEN FERGE» på tavla og taler mot Nøtterøy-teorien.',
    lag: ['teorier'],
    fokus: 'notteroy',
  },
  {
    id: 'kodejakten',
    tittel: 'Kodejakten (fire minispill)',
    status: 'apen',
    kilde: 'horde.no/secret/kodejakten',
    tekst: 'Et spill med fire minispill som skal gi en firesifret kode til en av låsene når det åpner.',
    betydning: 'Gir en kode, ikke et sted.',
    lenke: 'https://horde.no/secret/kodejakten',
  },
  {
    id: 'hohoh',
    tittel: '«Ho Ho Hint Hint»: 072 og 500',
    status: 'usikker',
    kilde: 'Horde-side',
    tekst: '072 er de siste sifrene i premien fra 2024 (1 093 072 kr). 500 er poengene man får for å verve.',
    betydning: 'Uklart om dette gjelder 2026-jakten.',
  },
  {
    id: 'skyer',
    tittel: 'Klar himmel mens kysten var skyet',
    status: 'tolkning',
    kilde: 'Tavla (19:00 og 19:50) + Windy',
    dato: '21.09',
    tekst: 'Anja skrev «INGEN SKYER NÅ» og «KLAR HIMMEL». Samme periode viser skykartet tett skydekke langs kysten fra Stad til Trøndelag.',
    betydning: 'Skyede områder er mindre sannsynlige. Tidspunktet for skjermbildet er ukjent, så sonen er grovt tegnet.',
    lag: ['skydekke'],
  },
  {
    id: 'skyanalyse',
    tittel: 'Skyanalyse-kartet (rødt, grønt, rosa og blått)',
    status: 'usikker',
    kilde: 'Fellesskapet',
    dato: '22.09',
    tekst: 'Et kart basert på når Anja sa det var skyet, og når det gikk fly over henne. Rødt er kl. 12, grønt kl. 19–20 og rosa kl. 15–17 (22.09). Hvitt er fly sett, og blått er møtepunktet i Agder.',
    betydning: 'Peker mot indre Agder (Birkenes og Froland). Derfra er det bare ca. 4 t å kjøre fra Oslo, som strider mot 7 t i bilen. Ikke bekreftet.',
    lag: ['skyanalyse'],
  },
  {
    id: 'fly',
    tittel: 'Fly sett og hørt kl. 21:30',
    status: 'tolkning',
    kilde: 'Tavla («FLY») + ADS-B (default.no)',
    dato: '21.09',
    tekst: 'Anja pekte opp og skrev «FLY» ca. 21:30 streamtid. Beste treff i flydataene er NOZ56U fra Oslo til Bodø, i stigning.',
    betydning: 'Streamen er 45 sek forsinket (bekreftet), så ekte tid er ca. 21:29. Ruten Oslo–Bodø går nordover over Hedmark.',
    lag: ['fly'],
  },
  {
    id: 'terreng',
    tittel: 'Terrenget: kupert, lyng, fire store steiner',
    status: 'bekreftet',
    kilde: 'Tavla',
    dato: '21.09',
    tekst: '5–10 min å gå fra bilen, oppover. Kupert terreng, mye lyng og furuskog. Fire store steiner, en presenning og mer åpen skog til høyre for henne.',
    betydning: 'Leter du i felt: 400–800 m fra en skogsbilvei, oppover, på lyngdekt furumo.',
    lag: ['felt'],
  },
]

/** Svar Anja har skrevet på tavla. Tider er streamtid (45 sek forsinket). */
export const TAVLE: { t: string; tekst: string }[] = [
  { t: '21.09 18:31', tekst: 'INGEN FLY · INGEN SKYTING · OSLO, SØN KL 04.00 · CA 5–10 MIN Å GÅ FRA BIL' },
  { t: '21.09 18:36', tekst: 'INGEN FERGE · KUN BIL · VET IKKE ANG. TUNELLER' },
  { t: '21.09 18:38', tekst: 'TROR DET VAR OPPOVER · SISTE 5–10 MIN' },
  { t: '21.09 18:44', tekst: 'KUPERT TERRENG · MYE LYNG · HØRER IKKE MYE FRA BOKSEN' },
  { t: '21.09 18:48', tekst: 'LIVE 07:00 · NEI, SER KUN SKOG OG KAMERA FRA BOKS' },
  { t: '21.09 18:57', tekst: 'PRESENNING · MER ÅPEN SKOG TIL HØYRE FOR MEG' },
  { t: '21.09 19:00', tekst: 'INGEN SKYER NÅ · SNART SOLNEDGANG' },
  { t: '21.09 19:32', tekst: 'IKKE MØRKT ENDA · FINT VÆR' },
  { t: '21.09 19:35', tekst: 'CA 12 °C (DAGEN) · NÅ CA 8–11 °C' },
  { t: '21.09 19:38', tekst: '4 STORE STEINER, KUN STEIN DER' },
  { t: '21.09 19:47', tekst: 'MØRKT NÅ' },
  { t: '21.09 19:50', tekst: 'KLAR HIMMEL' },
  { t: '21.09 21:30', tekst: 'FLY (pekte opp, litt mot sørøst)' },
  { t: 'Ukjent', tekst: 'ØST CA 118 · RETNING S…? (siste ord uklart)' },
  { t: 'Ukjent', tekst: 'VIL DERE SE EN BACKFLIP?' },
  { t: '23.09 09:33', tekst: 'DET GÅR FINT · TAKK SOM SPØR ♡' },
]

export type Sted = {
  id: string
  navn: string
  pos: LatLon
  info: string
  type: 'start' | 'hint' | 'tidligere' | 'teori'
  utelukket?: boolean
}

export const STEDER: Sted[] = [
  { id: 'oslo', navn: 'Oslo (start)', pos: OSLO, type: 'start', info: 'Anja ble hentet her søndag 20.09 kl. 04:00.' },
  { id: 'horde', navn: 'Horde AS, 5008 Bergen', pos: [60.3896, 5.3297], type: 'hint', info: 'Koden 5008 er postnummeret til Horde AS (Lars Hilles gate 20A).' },
  { id: 'bjorneparken', navn: 'Bjørneparken, Flå (ca.)', pos: [60.426, 9.464], type: 'hint', info: 'Reklamefargene til Horde ligner Bjørneparken sine.' },
  { id: 'proysen', navn: 'Prøysenhuset, Rudshøgda (ca.)', pos: [60.8903, 10.718], type: 'hint', info: 'Alf Prøysen skrev «Reven og kråka». Rev og kråke har vært i boksen.' },
  { id: 'tokke', navn: '2023: Tokke (område)', pos: [59.444, 7.989], type: 'tidligere', info: 'Hordejakten 2023 ble funnet i Tokke i Telemark. Skog, bil og litt gange.' },
  { id: 'kongsberg', navn: '2024: Kongsberg-området', pos: [59.668, 9.65], type: 'tidligere', info: 'Hordejakten 2024 ble funnet i Kongsberg-området i Buskerud. Skog.' },
]

export const TEORIER: Sted[] = [
  { id: 'froland', navn: 'Froland (ekorn i kommunevåpenet)', pos: [58.53, 8.63], type: 'teori', info: 'Ekorn-hintet og skyanalysen peker hit, men kjøretiden fra Oslo er bare ca. 4 t.' },
  { id: 'lillehammer', navn: 'Lillehammer (ekorn-maskot)', pos: [61.115, 10.466], type: 'teori', info: 'Ubekreftet teori om ekorn som maskot.' },
  { id: 'notteroy', navn: 'Nøtterøy (utelukket)', pos: [59.21, 10.42], type: 'teori', utelukket: true, info: 'Ordspill på «nøtt», men «Ikke en øy» og «ingen ferge» taler mot.' },
]

/** Toppkandidater fra default.no sin fusjonsmodell (22.09 kl. 12:41) */
export const DEFAULTNO: { nr: number; pos: LatLon; navn: string; p: string }[] = [
  { nr: 1, pos: [61.45, 11.0], navn: 'Østerdalen (Elverum)', p: '4,7 % innen 10 km' },
  { nr: 2, pos: [61.1, 11.0], navn: 'Sør for Løten og Koppang', p: '3,1 % innen 10 km' },
  { nr: 3, pos: [61.75, 8.4], navn: 'Indre Oppland', p: '2,2 % innen 10 km' },
  { nr: 4, pos: [61.1, 11.6], navn: 'Østre Innlandet', p: '2,5 % innen 10 km' },
  { nr: 5, pos: [60.9, 8.9], navn: 'Valdres og Hallingdal', p: '1,4 % innen 10 km' },
]

/** Skyanalyse-kartet. Møtepunktet er lest av bildet, ±15 km. */
export const SKYANALYSE = { senter: [58.7, 8.27] as LatLon, indreKm: 12, ytreKm: 45 }

/** Grovt tegnet fra Windy-skjermbildet (ECMWF skydekke). Tidspunkt ukjent. */
export const SKYDEKKE: LatLon[][] = [
  [[62.3, 4.6], [62.4, 6.3], [62.7, 7.3], [62.95, 8.2], [63.2, 9.2], [63.1, 10.2], [63.0, 11.3], [63.3, 12.1], [64.0, 12.6], [65.0, 13.2], [66.0, 13.5], [66.0, 11.5], [65.0, 10.5], [64.2, 9.2], [63.6, 7.8], [63.0, 6.0], [62.5, 4.4]],
  [[58.9, 5.1], [59.8, 4.6], [61.0, 4.3], [62.3, 4.6], [62.0, 4.95], [61.2, 4.85], [60.5, 4.95], [59.8, 5.15], [59.0, 5.45]],
]

/** Flyruten Oslo lufthavn → Bodø (NOZ56U ble sett ca. 21:30) */
export const FLYRUTE = { fra: [60.1939, 11.1004] as LatLon, til: [67.2692, 14.3653] as LatLon }

export const BOKSTAVER = ['I', 'S', 'N', 'D', 'O', 'R', 'U', 'E', 'M', 'H']

export const FAKTA = [
  { verdi: '1 116 897 kr', tekst: 'Premie' },
  { verdi: '45 sek', tekst: 'Forsinkelse på streamen' },
  { verdi: '3 låser', tekst: '2 på kassen, 1 på døra' },
  { verdi: '5–10 min', tekst: 'Gange fra bilen, oppover' },
]
