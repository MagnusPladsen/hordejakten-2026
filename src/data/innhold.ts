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
    tittel: 'Reisen: fra Oslo kl. 04:00, sov nesten hele veien',
    status: 'bekreftet',
    kilde: 'Tavla + Børsen-intervju',
    dato: '22.09',
    tekst: 'Anja ble hentet i Oslo kl. 04:00 (søndag ifølge tavla). Vinduene i bilen var dekket til. Hun sov store deler av turen og «aner ikke hvor lenge de kjørte». Hun tror selv det var ca. 7 timer. Kun bil, ingen ferge.',
    betydning: 'Kjøretiden er et svakt hint fordi hun sov. Viktig åpent spørsmål: tavla sier søndag, men Børsen skriver at hun har sittet i buret «siden mandag morgen». Ble hun hentet mandag 04:00, var turen under ca. 3 t (streamen startet 06:50). Slå på «Hentet mandag» i Teorier-fanen for å se utslaget.',
    lag: ['kjoretid', 'modell'],
    lenke: 'https://borsen.dagbladet.no/nyheter/anja-29-snakker-ut-absurd/85185489',
  },
  {
    id: 'bokstaver',
    tittel: 'Bokstaver ved verving',
    status: 'tolkning',
    kilde: 'Horde-appen («Verv en venn»)',
    tekst: 'Etter å ha vervet noen får man opp bokstaver. Bekreftet sett så langt, ikke i riktig rekkefølge: N O R H E I M S U D.',
    betydning: 'Alle ti bokstavene finnes i NORHEIMSUND (Kvam i Hardanger), og bare én N mangler. Det er 6,5 t å kjøre fra Oslo uten ferge, som passer med «sov ca. 7 t». Horde holder også til i Bergen, ca. 1 t unna. Test egne ord under.',
    lag: ['teorier'],
    fokus: 'norheimsund',
    anagram: true,
  },
  {
    id: 'retning118',
    tittel: '«ØST CA 118» på tavla',
    status: 'tolkning',
    kilde: 'Tavla + kompasstegning',
    tekst: 'Anja skrev «ØST CA 118» og tegnet et kompass på tavla. Fellesskapet tolker det som retningen fra kassen til parkeringen (øst-sørøst). Kameraet står nordøst for kassen og ser mot sørvest (ca. 220° ifølge solbanen).',
    betydning: 'Står du på parkeringen, ligger kassen mot ca. 298° (vest-nordvest), 5–10 min oppover. Det stemmer med to andre ting: Horde-skiltet peker mot venstre i bildet (sørøst), og «mer åpen skog til høyre for meg» er også sørøst. Hvis 118° i stedet er retningen mot Oslo, ligger kassen på linja nordvest for Oslo.',
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
    id: 'dyr',
    tittel: 'Rev, ekorn og kråke i boksen',
    status: 'tolkning',
    kilde: 'Stream',
    dato: '23.09',
    tekst: 'Det har kommet en rev, et ekorn og en kråke inn i boksen. 23.09 ble det satt en rev inn i buret.',
    betydning: 'Kan peke på «What does the fox say» (Ylvis) eller «Reven og kråka» (Alf Prøysen fra Ringsaker, nabo til Hamar og Løten). I visa er ostebiten det tredje elementet. Froland har et ekorn i kommunevåpenet.',
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
    betydning: 'Kameraet ser mot sørvest, så venstre i bildet er omtrent sørøst, samme vei som parkeringen (118°). Skiltet kan altså vise veien inn. Hva håndsymbolene betyr er ikke løst.',
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
    tittel: 'Klar himmel: alt som er blått på Windy er utelukket',
    status: 'tolkning',
    kilde: 'Tavla (19:00 og 19:50) + Windy',
    dato: '21.09',
    tekst: 'Anja skrev «INGEN SKYER NÅ» og «KLAR HIMMEL». På Windy-kartet for samme periode er hele Vestlandet, Sørlandskysten, Trøndelag og et bånd fra Lillehammer mot Sverige blått.',
    betydning: 'Blå områder er utelukket. Det tar ut Vestlandet, også Norheimsund. Østlandet, Agder-innlandet og mesteparten av Innlandet er fortsatt med.',
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
    kilde: 'Tavla («FLY») + ADS-B (adsb.lol via default.no)',
    dato: '21.09',
    tekst: 'Anja pekte rett opp kl. 21:29:38 og skrev «FLY» kl. 21:30 (streamtid). 49 fly var i lufta. Beste treff er NOZ56U (Oslo–Bodø), som var over Løten i ca. 24 000 fot.',
    betydning: 'Kassen bør ligge nær sporet til et fly som var i lufta akkurat da. Streamen er 45 sek forsinket (bekreftet). NOZ56U-treffet peker mot Hedmark, bare ca. 2 t fra Oslo.',
    lag: ['fly'],
  },
  {
    id: 'terreng',
    tittel: 'Terrenget: kupert, lyng, fire store steiner',
    status: 'bekreftet',
    kilde: 'Tavla + Børsen-intervju',
    dato: '21.09',
    tekst: 'Ca. 5–10 min fra bilen, oppover. På siste etappe hadde hun sovemaske og headset og ble båret inn i skogen. Kupert terreng, mye lyng og furuskog. Fire store steiner, en presenning og mer åpen skog til høyre for henne.',
    betydning: 'Hun ble båret, så avstanden er hennes følelse. Leter du i felt: 300–900 m fra en skogsbilvei, oppover, på lyngdekt furumo.',
    lag: ['felt'],
  },
  {
    id: 'innlandet',
    tittel: 'Fellesskapet er nå sikre på Innlandet',
    status: 'tolkning',
    kilde: 'Discord og chat',
    dato: '23.09',
    tekst: 'De fleste som leter peker nå mot Innlandet: flyet over Løten, klar himmel på Østlandet, furumo og tømmerdrift, og default.no sin topp-kandidat i Rena/Åmot.',
    betydning: 'Innlandet er egen teori og eget kartlag. Velg «Innlandet» i modellen for å se de beste rutene der.',
    lag: ['innlandet'],
  },
  {
    id: 'digeras',
    tittel: 'Tips fra fellesskapet: Digeråsen',
    status: 'usikker',
    kilde: 'Chat',
    dato: '23.09',
    tekst: 'Noen tipper 61°10\'43.84"N 11°15\'50.13"E, en skogkledd ås på 606 moh. mellom Løten og Åmot, ca. 2,5 t fra Oslo.',
    betydning: 'Passer med lyden: NOZ56U var nesten rett over (74°) kl. 21:32:50, da rumlingen var høyest. Passer ikke med pekingen: da Anja pekte opp, var flyet 45 km sør og bare 8° over horisonten. Bruk «Sjekk et punkt» i Kart-fanen for å teste slike tips.',
    lag: ['teorier', 'fly'],
    fokus: 'digeras',
  },
  {
    id: 'sofa',
    tittel: 'Horde i chatten: «glad for å sitte i sofaen inne»',
    status: 'usikker',
    kilde: '@Hordeapp i YouTube-chatten',
    dato: '23.09',
    tekst: 'Horde-kontoen skrev i chatten at vedkommende var glad for å sitte i sofaen inne.',
    betydning: 'Tyder på kaldt eller surt vær ute, men personen er trolig ikke ved kassen. Sier lite om stedet.',
  },
  {
    id: 'hytte',
    tittel: 'Ingen hytte i år, portabel do',
    status: 'tolkning',
    kilde: 'Anja + fellesskapet',
    dato: '23.09',
    tekst: 'Anja har bekreftet at doen er portabel. Fellesskapet tror Horde har droppet hytte helt i år.',
    betydning: 'Du trenger ikke lete etter en hytte eller et bygg. Se etter en åpen furumo nær en skogsbilvei, der et team kan bære inn utstyret.',
  },
  {
    id: 'koder',
    tittel: 'Mulige koder til låsene',
    status: 'apen',
    kilde: 'Appen, stream og chat',
    dato: '23.09',
    tekst: 'Kassen har 2 hengelåser og døra 1, alle med 4 siffer. Kandidater: 5008 (kredittskår + «terje»). 5528: plakaten foran kameraet ser ut til å vise kortstokker, ikke pengebunker, og en kortstokk har 52 kort, så «00» i 5008 kan være 52. 2188 (nevnt i chatten, ukjent kilde). Kodejakten gir en kode. 072 og 500 fra «Ho Ho Hint Hint».',
    betydning: 'Koder, ikke steder. Ha med alle kandidatene når du drar ut. 5528 og 2188 er ubekreftet.',
  },
  {
    id: 'plakat',
    tittel: 'Plakat: «Plutselig tilbake!»',
    status: 'usikker',
    kilde: 'Stream',
    dato: '23.09',
    tekst: 'En tegning av kassen med to hengelåser og bunker inni, med teksten «Plutselig tilbake!». Den står lent mot en trevegg. Bunkene kan være kortstokker og ikke pengebunker.',
    betydning: 'Er det kortstokker, kan det peke på tallet 52 og koden 5528 (se «Mulige koder»). Ingen kjent stedsinfo.',
  },
  {
    id: 'hintvideo',
    tittel: 'Offisiell hintvideo: «Trenger du et hint?»',
    status: 'bekreftet',
    kilde: 'YouTube H_-0LbPSu5s',
    dato: '22.09',
    tekst: 'Bare 0–3 s og 10–12 s viser selve stedet, resten er arkivbilder. Kassen står på en lav plattform i blåbær- og tyttebærlyng, med gule bjørker og høye furuer bak.',
    betydning: 'Furumo med bjørk og bærlyng: typisk for Østlandet og indre Agder, mindre typisk for kysten.',
    lenke: 'https://www.youtube.com/watch?v=H_-0LbPSu5s',
  },
  {
    id: 'tommer',
    tittel: 'Tømmerdrift i nærheten',
    status: 'usikker',
    kilde: 'Stream (via default.no)',
    tekst: 'Anja har kjent lukt av tømmer, hørt dunking og sett en lastet tømmerbil.',
    betydning: 'Aktiv hogst i nærheten. Ferske hogstflater på satellittbilder kan hjelpe når du har et kandidatområde.',
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
  {
    id: 'digeras',
    navn: 'Tips: Digeråsen (Løten/Åmot)',
    pos: [61.1788, 11.2639],
    type: 'teori',
    info: '61°10\'43.8"N 11°15\'50.1"E. Skog, 606 moh., 2 t 35 min fra Oslo. NOZ56U var rett over her kl. 21:32:50 (74°), da rumlingen var høyest. Men da Anja pekte opp (21:28:53 ekte tid) var flyet 45 km unna og bare 8° over horisonten.',
  },
  {
    id: 'gjovik',
    navn: 'Gjøvik (vær og sol passer)',
    pos: [60.795, 10.692],
    type: 'teori',
    info: 'Noen i fellesskapet mener vær og solgang passer med Gjøvik. Ca. 2 t fra Oslo.',
  },
  {
    id: 'norheimsund',
    navn: 'Norheimsund (bokstavene)',
    pos: [60.3707, 6.1453],
    type: 'teori',
    info: 'Vervebokstavene N O R H E I M S U D gir NORHEIMSUND med én N til. 6,5 t fra Oslo uten ferge, og ca. 1 t fra Horde i Bergen (5008).',
  },
  { id: 'froland', navn: 'Froland (ekorn i kommunevåpenet)', pos: [58.53, 8.63], type: 'teori', info: 'Kommunevåpenet er et sølvfarget ekorn på grønn bunn (bekreftet). Skyanalysen peker også hit. Kjøretid fra Oslo ca. 3,5 t.' },
  { id: 'lillehammer', navn: 'Lillehammer (ekorn-maskot)', pos: [61.115, 10.466], type: 'teori', info: 'Ubekreftet teori om ekorn som maskot. Ligger i det blå båndet på Windy-kartet, så det taler imot.' },
  { id: 'notteroy', navn: 'Nøtterøy (utelukket)', pos: [59.21, 10.42], type: 'teori', utelukket: true, info: 'Ordspill på «nøtt», men «Ikke en øy» og «ingen ferge» taler mot.' },
]

/** Toppkandidater fra default.no sin fusjonsmodell (22.09 kl. 16:42) */
export const DEFAULTNO: { nr: number; pos: LatLon; navn: string; p: string }[] = [
  { nr: 1, pos: [61.45, 11.1], navn: 'Rena og Åmot (Østerdalen)', p: '4,2 % innen 10 km' },
  { nr: 2, pos: [58.75, 9.3], navn: 'Risør og Gjerstad (Agder)', p: '2,2 % innen 10 km' },
  { nr: 3, pos: [61.75, 8.4], navn: 'Lom og Jotunheimen (i det blå)', p: '1,4 % innen 10 km' },
  { nr: 4, pos: [60.35, 11.2], navn: 'Nes og Eidsvoll', p: '1,2 % innen 10 km' },
  { nr: 5, pos: [61.15, 10.9], navn: 'Ringsaker (Brøttum)', p: '1,1 % innen 10 km' },
]

/** Der NOZ56U var da Anja skrev «FLY» (ekte tid ca. 21:29:50) */
export const FLY_PUNKT = { pos: [60.8705, 11.2481] as LatLon, kallesignal: 'NOZ56U', hoydeFot: 23892 }

/** Skyanalyse-kartet. Møtepunktet er lest av bildet, ±15 km. */
export const SKYANALYSE = { senter: [58.7, 8.27] as LatLon, indreKm: 12, ytreKm: 45 }

/**
 * Blå områder på Windy-kartet (skyer/nedbør) samme periode som Anja så klar himmel.
 * Tegnet for hånd ut fra skjermbildet, stedfestet med byene i bildet (feil under ca. 10 km).
 * [0] = Vestlandet, Sørlandskysten og Trøndelag. [1] = båndet fra Lillehammer mot Sverige (mest usikkert).
 */
export const SKYDEKKE: LatLon[][] = [
  [[63.685, 7.743], [63.766, 9.107], [63.966, 10.32], [64.119, 11.305], [63.953, 11.835], [63.618, 11.532], [63.347, 10.926], [63.074, 10.244], [62.833, 9.789], [62.449, 9.531], [62.061, 9.486], [61.704, 9.41], [61.379, 9.183], [61.087, 9.259], [60.867, 9.107], [60.607, 8.652], [60.533, 8.046], [60.346, 7.516], [60.044, 7.212], [59.664, 6.985], [59.279, 6.864], [58.889, 6.833], [58.574, 7.137], [58.336, 7.591], [58.177, 7.819], [58.017, 7.288], [58.257, 6.379], [58.653, 5.621], [59.356, 4.863], [60.421, 4.56], [61.452, 4.636], [62.309, 5.166], [63.074, 6.227], [63.483, 7.137]],
  [[60.94, 10.092], [61.014, 10.547], [61.596, 11.229], [62.168, 11.835], [62.729, 12.366], [63.347, 12.82], [63.719, 12.896], [63.739, 12.563], [63.005, 12.108], [62.379, 11.608], [61.812, 11.002], [61.233, 10.32], [61.051, 9.941]],
]

export const BOKSTAVER = ['N', 'O', 'R', 'H', 'E', 'I', 'M', 'S', 'U', 'D']

export const FAKTA = [
  { verdi: '1 116 897 kr', tekst: 'Premie' },
  { verdi: '45 sek', tekst: 'Forsinkelse på streamen' },
  { verdi: '3 låser', tekst: '2 på kassen, 1 på døra' },
  { verdi: '5–10 min', tekst: 'Fra bilen, båret oppover' },
]
