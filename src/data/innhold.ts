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
/** Horde AS, Lars Hilles gate 20A, 5008 Bergen */
export const BERGEN: LatLon = [60.3896, 5.3297]

export type Status = 'lost' | 'bekreftet' | 'tolkning' | 'usikker' | 'apen'

export const STATUS: Record<Status, { tekst: string; klasse: string }> = {
  lost: { tekst: 'Løst', klasse: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  bekreftet: { tekst: 'Bekreftet', klasse: 'bg-sky-50 text-sky-700 ring-sky-200' },
  tolkning: { tekst: 'Tolkning', klasse: 'bg-amber-50 text-amber-800 ring-amber-200' },
  usikker: { tekst: 'Usikker', klasse: 'bg-slate-100 text-slate-600 ring-slate-200' },
  apen: { tekst: 'Uløst', klasse: 'bg-red-50 text-red-700 ring-red-200' },
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
  /** Eget kartpunkt for hintet når det ikke har et `fokus`-sted */
  pos?: LatLon
  lenke?: string
  kompass?: boolean
  anagram?: boolean
}

export const HINT: Hint[] = [
  {
    id: 'solidag',
    pos: [60.75, 11.85],
    tittel: 'Sol hos Anja, skyet over mesteparten av Norge',
    status: 'tolkning',
    kilde: 'Satellittbilde (fellesskapet)',
    dato: '23.09',
    tekst: 'Tidligere i dag var det skyer over store deler av Norge på satellitt, mens Anja hadde sol. Klart var det fra Kongsvinger opp til Rena på siden mot Sverige, i deler av Vestfold og rundt Trondheim–Ålesund.',
    betydning: 'Kassen står trolig i et av de klare områdene. Det peker mot Kongsvinger–Elverum–Rena, som passer med flyet over Løten. Fredrikstad, Sarpsborg og Halden var overskyet hele dagen og er ute. Trondheim–Ålesund var blått på Windy tidligere, og det er uklart hvilke deler av Vestfold som var klare.',
    lag: ['solidag'],
  },
  {
    id: 'benny',
    tittel: '«Reven heter Benny»',
    status: 'usikker',
    kilde: 'Tavla',
    dato: '23.09',
    tekst: 'Anja skrev at kosedyr-reven i boksen heter Benny.',
    betydning: 'Kan være et navnehint. Bare ett stedsnavn i Norge starter med «Benny»: Bennyøy, en holme i Nome (Telemark), 3,4 km fra 118°-linja fra Horde i Bergen. I Løten finnes gården Benningstad, 10 km fra flyet. Begge kan være tilfeldigheter, og Bennyøy er en øy.',
    lag: ['teorier', 'retning'],
    fokus: 'bennyoy',
  },
  {
    id: 'tretopp',
    tittel: 'Tretopphyttene i Ringsaker (sjekket, ikke der)',
    status: 'usikker',
    kilde: 'Chat + default.no. Takk til default.no.',
    dato: '23.09',
    tekst: 'Tretopphyttene (Danseråsvegen 173, Brumunddal) har et ekorn som logo, i grønt. Noen mener det er hintet bak ekornet i appen.',
    betydning: 'Oppdatering: én i chatten har sjekket alle Tretopphyttene og Prøysenstua, uten funn. Flere mistenkte hyttene tidligere. Det andre flyet, NOZ9EG, passerte ca. 3 km fra Tretopphyttene kl. 21:31, og default.no har en kandidat i Ringsaker. Mot: Anja var et sted uten vinduer og wifi, og Horde unngår trolig hytter i år.',
    lag: ['teorier'],
    fokus: 'tretopp',
    lenke: 'https://tretopphytter.no/',
  },
  {
    id: 'lysfake',
    tittel: 'Er sollyset på streamen falskt?',
    status: 'usikker',
    kilde: 'Chat + Dagbladet-video + default.no. Takk til default.no.',
    dato: '23.09',
    tekst: 'Tidlig om morgenen, da nattkameraet ble skrudd av, var det skyer og grått. Neste sekund var det plutselig sol og den «AI»-looken streamen har nå. I Dagbladet-videoen fra stedet er det mindre sol, og lyset faller ikke likt som på streamen.',
    betydning: 'Taler imot: default.no regnet ut kameraretningen fra sola alene (219–220°), og Anja skrev senere «KAMERA 41 ØST» (filmer mot ca. 221°). To uavhengige målinger stemmer, så sollyset ser ekte ut. Bildet kan likevel være filtrert i farger. Anjas egne ord («KLAR HIMMEL») påvirkes ikke. Lyden er allerede vist å være delvis avspilt på nytt, se default.no.',
  },
  {
    id: 'haslemoen',
    tittel: 'Tips fra fellesskapet: Flisa og Haslemoen',
    status: 'usikker',
    kilde: 'Chat + default.no. Takk til default.no.',
    dato: '23.09',
    tekst: '«Tror og i nærheten av Rena. Men ikke helt. Kanskje mer i området Flisa? Haslemoen har en nedlagt base.»',
    betydning: 'Ligger i det som var klart på satellitt 23.09, i typisk furumo mot Finnskogen. Men flyet Anja pekte på var ca. 40 km unna, og default.no fant at Finnskogen ikke passer med flyet. Lagt inn som egen teori (Solør).',
    lag: ['teorier', 'solidag'],
    fokus: 'haslemoen',
  },
  {
    id: 'taake',
    pos: [60.3, 11.45],
    tittel: 'Tykk tåke i Odal og på Jessheim i morges',
    status: 'tolkning',
    kilde: 'Lokal i chatten (bor i Nord-Odal)',
    dato: '23.09',
    tekst: '«Det var tykk tåke her i dag tidlig, hele veien til Sør-Odal og Jessheim», mens det ikke var tåke hos Anja.',
    betydning: 'Nord-Odal, Sør-Odal og området rundt Jessheim er utelukket. Tegnet grovt på kartet sammen med de blå Windy-områdene. Solør og Elverum ligger utenfor.',
    lag: ['skydekke'],
  },
  {
    id: 'vedkassen',
    tittel: 'Folk skal være ved kassen og prøve koder',
    status: 'usikker',
    kilde: 'Chat',
    dato: '23.09',
    tekst: '«Flere som har prøvd seg på koden ved boksen nå by the way. Vi vet hvor det her er hen.»',
    betydning: 'Stemmer det, er stedet funnet av noen, og kodene er nå det viktigste. Følg med på streamen: ser du folk komme inn i bildet, kommer de trolig fra parkeringen mot sørøst (118°).',
    lenke: 'https://www.youtube.com/watch?v=EQHgfmZicc8',
  },
  {
    id: 'reise',
    pos: [59.9139, 10.7522],
    tittel: 'Reisen: fra Oslo kl. 04:00, sov nesten hele veien',
    status: 'bekreftet',
    kilde: 'Tavla + Børsen-intervju',
    dato: '22.09',
    tekst: 'Anja ble hentet i Oslo kl. 04:00 (søndag ifølge tavla). Vinduene i bilen var dekket til. Hun sov store deler av turen og «aner ikke hvor lenge de kjørte». Hun tror selv det var ca. 7 timer. Kun bil, ingen ferge.',
    betydning: 'Kjøretiden er ikke et fakta: hun sov og vet ikke hvor lenge de kjørte. Den er derfor av som standard. Viktig åpent spørsmål: tavla sier søndag, men Børsen skriver at hun har sittet i buret «siden mandag morgen». Ble hun hentet mandag 04:00, var turen under ca. 3 t (streamen startet 06:50). Slå på «Hentet mandag» i Teorier-fanen for å se utslaget.',
    lag: ['kjoretid', 'modell'],
    lenke: 'https://borsen.dagbladet.no/nyheter/anja-29-snakker-ut-absurd/85185489',
  },
  {
    id: 'bokstaver',
    tittel: 'Bokstaver ved verving = HORDE MINUS (løst)',
    status: 'lost',
    kilde: 'Horde-appen («Verv en venn»)',
    tekst: 'Etter å ha vervet noen får man opp bokstaver. Bekreftet sett så langt, ikke i riktig rekkefølge: N O R H E I M S U D.',
    betydning: 'HORDE MINUS bruker nøyaktig alle ti bokstavene, uten rest, og nå er det bekreftet: skriver man «Hordeminus» til Horde AI, svarer den «2,7 eiffeltårn stablet oppå hverandre» (ca. 891 m, se eget hint). Én idé: «HORDEJAKTEN» minus «HORDE» = «JAKTEN», og dyrene (rev, and, kråke) er jaktbare. Prøv ordene i kredittskår-boksen i appen. NORHEIMSUND (Kvam i Hardanger) passer nesten, men mangler én N, og Hardanger var blått på Windy-kartet. Test egne ord under.',
    lag: ['teorier'],
    fokus: 'norheimsund',
    anagram: true,
  },
  {
    id: 'retning118',
    tittel: 'Horde-skiltet peker 118–120° mot kassen',
    status: 'bekreftet',
    kilde: 'Tavla («ØST CA 118 · RETNING SKILT») + kompasstegning',
    tekst: 'Anja skrev at skiltet peker ca. 118° øst-sørøst, senere «118–120 gr øst». Skissen fra fellesskapet: skiltet står vest-nordvest for kassen og peker mot den, Anja skrev senere «KAMERA 41 ØST»: kameraet står ca. 41° (nordøst) fra kassen og filmer mot ca. 221°. Korrigert for misvisning (kompass viser ca. 4° for lite på Østlandet) blir sann retning ca. 122–124°.',
    betydning: 'Skiltet viser veien inn til kassen. Folk kommer altså fra vest-nordvest: fra bilen går du ca. 120° (øst-sørøst), 5–10 min oppover. Søkesektoren i kartet bruker dette. Andre teorier: en linje fra Oslo eller fra Horde i Bergen.',
    lag: ['retning'],
    kompass: true,
  },
  {
    id: 'lyder',
    tittel: 'Lyder på streamen: tog, klokker, skudd? (lav sikkerhet)',
    status: 'usikker',
    kilde: 'default.no (lydanalyse) + chat. Takk til default.no.',
    dato: '21.09',
    tekst: 'default.no sin lydanalyse fant mulige tog (08:34, 11:29, 14:07), klokker (08:35, 14:00) og skudd (14:24, 14:54) den 21.09, alle med lav sikkerhet (0,33–0,51). I chatten sies det at Anja ikke hører tog, bil eller skyting.',
    betydning: 'Kan ikke brukes: lyden på streamen er trolig falsk og går i loop (default.no fant identiske lydbiter 22–48 t fra hverandre, og chatten sier det samme). Lyder fra streamen sier derfor ingenting om stedet. Anjas eget svar (ingen tog, bil eller skyting) teller mer: kassen står trolig et stille sted, ikke nær jernbane eller trafikkert vei.',
  },
  {
    id: 'fugler',
    tittel: 'Fuglelyder: sidensvans og furukorsnebb',
    status: 'usikker',
    kilde: 'default.no (BirdNET). Takk til default.no.',
    dato: '21.09',
    tekst: 'Fuglegjenkjenning fant granmeis, blåmeis, rødvingetrost, skjære og gråtrost, en flokk sidensvans kl. 07:36 og furukorsnebb.',
    betydning: 'Furukorsnebb passer med gammel furuskog. Sidensvans er i september mest meldt i Nord-Norge, men kan være feilgjenkjenning. Sier lite om stedet.',
  },
  {
    id: 'froland',
    tittel: 'Froland er utelukket: været stemmer ikke',
    status: 'tolkning',
    kilde: 'Fellesskapet (værdata)',
    dato: '23.09',
    tekst: 'Været i Froland samsvarer ikke med det Anja har sett og skrevet.',
    betydning: 'Froland og Agder-teorien trekkes kraftig ned. Ekornet i kommunevåpenet er ikke nok alene, ekorn finnes overalt.',
    lag: ['teorier'],
    fokus: 'froland',
  },
  {
    id: 'dnflyceller',
    pos: [60.9, 11.2],
    tittel: 'default.no: klare celler i kveld + flyrute-filter',
    status: 'tolkning',
    kilde: 'default.no (23.09). Takk til default.no.',
    dato: '23.09',
    tekst: 'default.no sin nyeste analyse: klare celler i kveld er Finnskogen (8,5 °C), Koppang (8,2 °C), Trysil (6,1 °C) og halvskyet Meråker. «Sett + hørt fly»-testen deres beholder bare ca. 10 % av landet: vestsiden av Østerdalen (Elverum–Rena–Koppang under NOZ56U/NOZ9EG), Røros–Gauldal–Meråker-korridoren og Hallingdal.',
    betydning: 'Peker mot vestre Østerdalen (Løten–Elverum–Rena–Koppang), som passer med begge flyene, klar himmel og furumo. Deres nr. 1 er nå Løten/Elverum-skogen, nr. 2 Rena–Åsta.',
    lag: ['defaultno', 'fly'],
  },
  {
    id: 'komfra',
    tittel: '«Kom fra den veien ←» og «ingen stier»',
    status: 'bekreftet',
    kilde: 'Tavla',
    dato: '24.09',
    tekst: 'Anja skrev «KOM FRA DEN VEIEN» med en pil mot venstre i bildet, og «INGEN STIER».',
    betydning: 'Kameraet filmer mot ca. 221° (to uavhengige målinger), så venstre i bildet er ca. 130° (sørøst). Horde-skiltet pekte også mot venstre i bildet, 118–120°. Da ligger bilen og veien trolig sørøst for kassen, og man går mot nordvest (ca. 300°) og oppover fra bilen til kassen. «Ingen stier» betyr at de gikk rett gjennom skogen. Søkesektoren fra parkering på kartet er snudd til ca. 300°. Merk at dette snur den gamle tolkningen, der kassen lå mot 120° fra bilen.',
    lag: ['felt'],
  },
  {
    id: 'regn1105',
    tittel: 'Regn hos Anja kl. 11:05, og regn i Rena samtidig',
    status: 'tolkning',
    kilde: 'Tavla + værdata (fra fellesskapet)',
    dato: '24.09',
    tekst: 'Anja sa at det regnet kl. 11:05 den 24.09. Ifølge fellesskapet regnet det i Rena akkurat da.',
    betydning: 'Passer med Rena og Åmot. Regnbyger dekker ofte store områder, så det utelukker ikke steder i nærheten. Ikke sjekket mot radar her: da trengs regnradar for akkurat 11:05. Streamen ligger 45 sek bak.',
    pos: [61.133, 11.367],
  },
  {
    id: 'graver',
    tittel: '«Gråvær hele dagen» (24.09)',
    status: 'bekreftet',
    kilde: 'Tavla',
    dato: '24.09',
    tekst: 'Anja skrev 24.09: «GRÅVÆR HELE DAGEN».',
    betydning: 'Etter klar himmel og sol 21.–23.09 var det overskyet hele 24.09 der kassen står. Kan sjekkes mot satellittbilder og værdata for 24.09: steder med sol store deler av dagen passer dårlig. Ikke lagt inn i modellen ennå.',
  },
  {
    id: 'hogst',
    tittel: '«Det har vært hogd tidligere der jeg gikk» (pil →)',
    status: 'bekreftet',
    kilde: 'Tavla',
    dato: '24.09',
    tekst: 'Anja skrev «DET HAR VÆRT HOGD TIDLIGERE DER JEG GIKK I GÅR, GIKK DEN VEIEN» med pil mot høyre i bildet, og «Så ingenting som ikke hører til i en skog».',
    betydning: 'Høyre i bildet er ca. 310° (nordvest), siden kameraet filmer mot ca. 221°. Det passer med «KOM FRA DEN VEIEN ←» (ca. 130°): hun kom fra sørøst og gikk mot nordvest til kassen. På veien gikk hun gjennom et gammelt hogstfelt. Let etter eldre hogstflater sørøst for mulige steder, mellom veien og kassen. Ingen bygninger eller annet uvanlig langs gåturen. Det er uklart hva «i går» viser til.',
    lag: ['felt'],
  },
  {
    id: 'ingenhytte',
    tittel: '«Ingen hytte i nærheten som jeg vet om eller ser» (17:20)',
    status: 'bekreftet',
    kilde: 'Tavla',
    dato: '24.09',
    tekst: 'Anja skrev kl. 17:20: «INGEN HYTTE I NÆRHETEN SOM JEG VET OM ELLER SER».',
    betydning: 'Taler imot teorier om at kassen står ved en hytte eller et hyttefelt, som Tretopphyttene. Det passer med skog uten stier, 5–10 min fra en vei.',
    fokus: 'tretopp',
  },
  {
    id: 'kodeniappen',
    tittel: 'Horde: «Hint til hva kodene kan være ligger i appen»',
    status: 'bekreftet',
    kilde: 'Horde i kommentarfeltet',
    dato: '24.09',
    tekst: 'En bruker spurte hvordan man finner koden på låsene. Horde svarte: «Hint til hva kodene kan være ligger i appen 💙».',
    betydning: 'Bekrefter at kodene skal finnes i appen. Det styrker kodene som kommer fra appen: 5008 (kredittskår + «terje»), 6788 (skiltnummeret LD6788 ga «ENKODE») og 0891/0810 (HORDEMINUS i Horde AI). Kodejakten ligger også i appens univers. Tall fra chatten eller plakaten teller mindre.',
  },
  {
    id: 'eiffel',
    tittel: 'HORDEMINUS i Horde AI = «2,7 eiffeltårn stablet oppå hverandre»',
    status: 'bekreftet',
    kilde: 'Horde AI i appen',
    dato: '24.09',
    tekst: 'Skriv «Hordeminus» til Horde AI i appen. Svaret er «2,7 eiffeltårn stablet oppå hverandre». Spør man hva det betyr, svarer den at det bare er frasen den har fått beskjed om å bruke for akkurat det ordet. Ber man den oppsummere, regner den selv ut 891 m (330 m) eller ca. 875 m (324 m, høyden 2000–2022) og sier at den ikke vet noe om hvor boksen er. Det er altså bare chatboten som regner, ikke et nytt hint.',
    betydning: 'Bekrefter at bokstavene N O R H E I M S U D skal bli HORDE MINUS. Eiffeltårnet er 300 m uten antenne og 330 m med. 2,7 × 300 = 810 m og 2,7 × 330 = 891 m, så begge er like aktuelle. Mest trolig står kassen ca. 810 eller 891 moh. Det kan også være en avstand, for eksempel fra bilveien, eller en kode: 0810 og 0891 har 4 siffer som hengelåsene. Slå på «810–891 moh nær vei» på kartet for å se steder i den høyden som er høyst 900 m fra vei.',
  },
  {
    id: 'soldater',
    tittel: 'Video «Ingen har funnet Anja enda..»: soldater, drone og tåke',
    status: 'usikker',
    kilde: 'HordeApp på YouTube',
    dato: '24.09',
    tekst: 'Videoen viser soldater i kamputstyr og en drone i tåke. Teksten sier: «men i år har de også plassert en kvinne i en boks med en livestream».',
    betydning: 'Trolig bare stemning, der «jakten» vises som en militær leteaksjon. Noen vil koble det til Rena leir og Regionfelt Østlandet i Åmot, men Anja skrev «INGEN SKYTING», og skytefeltene er utelukket på fellesskapets kart. Sannsynligvis samme video som globus-bildet fra Facebook. Teller ikke i modellen.',
  },
  {
    id: 'globus',
    tittel: 'Facebook-video: globus med Brunei og Malaysia',
    status: 'usikker',
    kilde: 'Hordes Facebook-video («Ingen har funnet Anja enda, men det kan endre seg kjapt»)',
    dato: '24.09',
    tekst: 'Fryser man videoen Horde la ut på Facebook, viser ett bilde en globus med «SOUTH …», «Bandar Seri Begawan», «BRUNEI» og «MALAYSIA», med glød og røyk over.',
    betydning: 'Trolig bare en globus som snurrer i videoen, altså stemning og ikke et sted. Det er ingen kjent kobling til Norge. Mulige ordlekker, som «BRUN» i BRUNEI, er rene gjetninger. Teller ikke i modellen.',
  },
  {
    id: 'enkode',
    tittel: 'Skiltnummer LD6788 i appen = «ENKODE»',
    status: 'bekreftet',
    kilde: 'Horde-appen',
    dato: '24.09',
    tekst: 'Gå til «Bil & hus» i appen og legg til kjøretøy med registreringsnummer LD6788. Da kommer «Du fant et hint! ENKODE». Funnet rett etter midnatt 24.09.',
    betydning: 'Appen har lagt inn et eget svar for akkurat dette skiltnummeret, så LD6788 er med vilje. «ENKODE» (encode, eller «én kode») kan bety at skiltnummeret skal gjøres om til en kode. Den enkleste lesningen er at 6788 er koden til en hengelås (4 siffer). Det er ikke kjent hvor skiltnummeret kommer fra, eller om det er bilen som kjørte Anja. Tolkningen er usikker.',
  },
  {
    id: 'frolandekorn',
    tittel: '«FROLAND» i ord-boksen = «Ekornet kan klatre»',
    status: 'bekreftet',
    kilde: 'Horde-appen',
    dato: '23.09',
    tekst: 'Skriv FROLAND i ord-boksen under «Kredittskår» (samme boks som «terje»). Da kommer «Du fant et hint! Ekornet kan klatre». Funnet kl. 22:27.',
    betydning: 'Horde har forutsett Froland-teorien (ekornet i kommunevåpenet) og lagt inn et eget svar. «Ekornet kan klatre» kan være et nikk om at ekornet (og kassen) er høyere opp, i skog eller i fjellet, eller at det skal videre. Det kan også bare være en fleip. Froland er fortsatt utelukket fordi været ikke stemmer. Svaret viser også at ord-boksen tar imot stedsnavn, så det er verdt å prøve navn som LØTEN, RENA, RINGSAKER og RUDSHØGDA.',
    fokus: 'froland',
  },
  {
    id: 'skiltborte',
    tittel: '«Skiltet er borte, vet ikke hvor» (19:12)',
    status: 'bekreftet',
    kilde: 'Tavla',
    dato: '23.09',
    tekst: 'Anja skrev kl. 19:12: «SKILTET ER BORTE · VET IKKE HVOR». Horde-skiltet som sto foran kassen og pekte 118–120°, er fjernet.',
    betydning: 'Horde fjernet skiltet samme kveld som fellesskapet begynte å bruke retningen det pekte i. Det kan tyde på at skiltet ga for mye bort. Retningen vi har registrert (118–120°) gjelder fortsatt: den er målt før skiltet ble tatt.',
  },
  {
    id: 'litefly',
    tittel: '«Lite med fly her · sikkert med vilt» (19:09)',
    status: 'bekreftet',
    kilde: 'Tavla',
    dato: '23.09',
    tekst: 'Anja skrev kl. 19:09: «LITE MED FLY HER» og «SIKKERT MED VILT» (siste ord er litt utydelig).',
    betydning: 'Få fly bekrefter det hun sa første dag («INGEN FLY»): kassen står ikke under en inn- eller utflygningsrute til Gardermoen, der fly går lavt og ofte. Fly i marsjhøyde, som NOZ56U over Løten, høres lite. «Sikkert med vilt» passer med skog der det jaktes (elg, rådyr, skogsfugl).',
    lag: ['fly'],
  },
  {
    id: 'fjellmark',
    pos: [61.1, 10.75],
    tittel: '«Typisk fjellmark», masse sopp, mose på steiner, ikke vann',
    status: 'bekreftet',
    kilde: 'Tavla',
    dato: '23.09',
    tekst: 'Anja skrev: «FÅR SE BITTELITE · MASSE SOPP · TYPISK FJELLMARK» og «IKKE VANN · STEIN + SOPP · MOSE PÅ STEINER». Hun ser bare litt av omgivelsene.',
    betydning: 'Fjellmark betyr høyereliggende, skrinn skog og lyng, typisk 500–900 moh. Det passer Ringsakfjellet og Sjusjøen (under flyet NOZ9EG), og åsene over Rena, Løten og Åmot (Digeråsen 606 moh., Birkebeinerveien ca. 590 moh.). Det passer dårlig med lavlandet ved Rudshøgda, Gjøvik og Toten. Ingen vann i nærheten: ikke ved et vann eller en elv.',
    lag: ['teorier'],
  },
  {
    id: 'bindfold',
    tittel: 'Bind for øynene hver gang hun forlater kassen',
    status: 'bekreftet',
    kilde: 'hordejakten.vercel.app (bekreftet-lista)',
    dato: '21.09',
    tekst: 'Anja får bind for øynene hver gang hun forlater boksen. Livestreamen starter 06:40.',
    betydning: 'Hun ser aldri omgivelsene utenfor kassen, så det hun forteller gjelder bare utsikten fra kassen. Det forklarer også «Gikk 2 min inn i skogen»: pausestedet er rundt 2 minutter unna, og hun blir ført dit med bind for øynene.',
  },
  {
    id: 'gikk2min',
    tittel: '«Gikk 2 min inn i skogen»',
    status: 'tolkning',
    kilde: 'Tavla',
    dato: '23.09',
    tekst: 'Anja skrev: «GIKK 2 MIN INN I SKOGEN».',
    betydning: 'Trolig turen til pausestedet: hun får bind for øynene hver gang hun går ut av kassen (hordejakten.vercel.app). Ellers kan det være hvor langt hun går på pause (til stedet uten vinduer og wifi), eller et nytt anslag for turen inn, kortere enn de 5–10 min hun sa før (hun ble båret med sovemaske). Er det turen inn, står kassen bare 100–200 m fra bilveien.',
  },
  {
    id: 'utelukkingskart',
    tittel: 'Utelukkingskart: fjellbjørk',
    status: 'tolkning',
    kilde: 'Fellesskapet (kart i chatten)',
    dato: '23.09',
    tekst: 'Fellesskapet har laget et kart over hva som er utelukket: rødt, og lyseblått der det vokser fjellbjørk. Det som står igjen er stripa Hamar–Løten–Rena–Koppang, Ringsakfjellet/Rudshøgda og Gjøvik/Toten. (Det rosa «ingen sopp»-laget er tatt ut, det var ikke korrekt.)',
    betydning: 'Utelukker Solør/Finnskogen, Trysil og Elverum sentrum. Åpent: Rudshøgda 100 %, Gjøvik 95 %, Rena 93 %, Ringsaker 83 %, Løten 77 %. Vises som eget kartlag og teller i Teorier-fanen.',
    pos: [61.1, 11.1],
    lag: ['utelukket'],
  },
  {
    id: 'powerbank',
    tittel: 'Powerbank-hint? (Jaktvettregel 4 + Horde Rewards)',
    status: 'usikker',
    kilde: 'Jaktvettreglene + Horde Rewards',
    dato: '23.09',
    tekst: 'Jaktvettregel 4: «Ta med deg fulladet mobiltelefon … En powerbank i lommen kan være smart.» I Horde Rewards koster «Powerbank Xtorm FS5271 27000mAh» 10 000 poeng. Displayet på bildet viser 68 %.',
    betydning: 'Noen tror tallene er koder: 5271 har 4 siffer (hengelås) og 27000 har 5 siffer (dørlåsen). Trolig tilfeldig: FS5271 er bare modellnummeret til en ekte powerbank. Verdt å prøve hvis du står ved kassen.',
  },
  {
    id: 'lydtett',
    tittel: '«LYDTETT · SOL · VINDSTILLE» (17:49)',
    status: 'bekreftet',
    kilde: 'Tavla',
    dato: '23.09',
    tekst: 'Anja skrev kl. 17:49: «LYDTETT», «SOL» og «VINDSTILLE».',
    betydning: 'Lydtett forklarer hvorfor hun ikke hører tog, bil eller skyting, og at lyden på streamen ikke kan brukes. Sol kl. 17:49 23.09 betyr at stedet ikke var overskyet på ettermiddagen, som passer med de klare områdene på satellitt (Kongsvinger–Rena). Vindstille gir et nytt værhint: sjekk vind fra værstasjoner kl. 17–18 i kandidatområdene.',
    lag: ['solidag'],
  },
  {
    id: 'kamera41',
    tittel: 'Kameraet står 41° (nordøst)',
    status: 'bekreftet',
    kilde: 'Tavla («KAMERA 41 ØST») + default.no. Takk til default.no.',
    dato: '23.09',
    tekst: 'Anja skrev «KAMERA 41 ØST». Kameraet står altså nordøst for kassen og filmer mot ca. 221° (sørvest).',
    betydning: 'Stemmer nesten helt med default.no, som regnet ut kameraretningen fra sola alene (219–220°). Da er sollyset på streamen trolig ekte, og sol-hintene (soloppgang, sola i sør, sol i dag) blir mer til å stole på.',
  },
  {
    id: 'solmiddag',
    tittel: 'Sola i sør kl. 13:02–13:08 (lengdegrad ca. 11–12° øst)',
    status: 'tolkning',
    kilde: 'Solvinkel på streamen (fellesskapet)',
    dato: '23.09',
    tekst: 'Kl. 13:20 sto sola i ca. 184° og 28–31° over horisonten. Da sto den rett i sør ca. kl. 13:02–13:08. Det skjer bare rundt 11–12° øst: Østerdalen, Solør og Trysil. Høyden passer med 59–62° nord.',
    betydning: 'Peker mot østlige Innlandet. Valdres (13:16), Agder (13:17) og Hardanger (13:28) passer dårlig. Bygger på sollyset i bildet, som noen mener kan være falskt.',
  },
  {
    id: 'soloppgang',
    tittel: 'Sola var oppe før kl. 07',
    status: 'bekreftet',
    kilde: 'Anja',
    dato: '23.09',
    tekst: 'Anja sa at sola var oppe før kl. 07.',
    betydning: 'Soloppgang før 07:00 skjer bare øst for ca. 11° øst disse dagene: Solør 06:55, Løten, Rena og Røros 06:57–06:58, Ringsaker 06:59. Valdres (07:06), Agder (07:08) og Hardanger (07:18) er for sent. I skog kommer sola enda senere, så stedet ligger trolig langt øst.',
  },
  {
    id: 'hytter',
    pos: [60.9748, 10.9167],
    tittel: 'Utleide hytter i nærheten? (Tretopphyttene)',
    status: 'usikker',
    kilde: 'Bookingkalender på tretopphytter.no',
    dato: '23.09',
    tekst: 'Tretopphyttene har 8 hytter i Ringsaker. Bjørkhytta (Danseråsen) er booket sammenhengende fra 23.09 til 11.10. Flere andre er opptatt 24.–27.09.',
    betydning: 'Trolig ikke relevant. Horde er mer forsiktige med hytter i år, fordi folk fant bookingene sist. Anja har også sagt at hun var et sted uten vinduer og wifi, mens Tretopphyttene har store vinduer og takvinduer. Hyttene ligger som et eget kartlag for sikkerhets skyld.',
    lag: ['hytter'],
    lenke: 'https://tretopphytter.no/',
  },
  {
    id: 'bergen118',
    pos: [60.3896, 5.3297],
    tittel: 'Horde-skiltet peker 118° fra Bergen?',
    status: 'tolkning',
    kilde: 'Chat',
    dato: '23.09',
    tekst: 'Noen har trukket 118°-linja fra Horde AS i Bergen (postnummer 5008) i stedet for fra Oslo. Den går forbi Odda, over søndre Hardangervidda og gjennom Telemark (Vinje, Seljord, Drangedal) til kysten ved Kragerø.',
    betydning: 'Kobler 5008 og 118° sammen. Linja går ca. 20 km fra Tokke, der kassen stod i 2023. Vestlige del var blå på Windy, men Telemark-delen er fri. Slå på «118°-linja fra Bergen» i modellen for å teste.',
    lag: ['retning'],
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
    tekst: 'Cæsar-chiffer med forskyvning 5: MT WI JO FP YJ S@ MT … blir HO RD EJ AK TE N@ HO … = HORDEJAKTEN@HO…, trolig hordejakten@horde.no (som ville stått MTWIJ.ST på buksa).',
    betydning: 'En minikonkurranse (20 000 Horde-poeng til første løser). Sier ingenting om stedet.',
  },
  {
    id: 'dyr',
    tittel: 'Rev, ekorn og kråke i boksen',
    status: 'tolkning',
    kilde: 'Stream',
    dato: '23.09',
    tekst: 'Det har kommet en rev, et ekorn og en kråke inn i boksen. 23.09 ble det satt en rev inn i buret.',
    betydning: 'Rev, kråke og ekorn er alle med i Alf Prøysens «Sirkus Mikkelikski» (Mikkel Rev, Frøken Kråke og ekornet Nøtteliten). Det peker mot Prøysen og Rudshøgda i Ringsaker. Kan også være «What does the fox say» (Ylvis).',
    lag: ['steder', 'teorier'],
    fokus: 'proysen',
  },
  {
    id: 'ekorn',
    tittel: '«Verv en venn» → «Hint-hint» med ekorn',
    status: 'bekreftet',
    kilde: 'Horde-appen',
    tekst: 'Trykk «Verv en venn» i appen. På slutten dukker det opp «Hint-hint» med bilde av et ekorn.',
    betydning: 'Ekorn finnes over hele landet, så det kan bare bety at det er ekorn der kassen står. Ekornet går likevel igjen i flere teorier (Froland, Lillehammer, Tretopphyttene, ordspill på «nøtt»). Ekorn ble også jaktet og solgt som kjøtt og pels i Innlandet, av romanifolk (tatere) og fattige bønder. Det knytter ekornet til både «jakten» og Innlandet.',
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
    tittel: 'Horde-skiltet og hendene',
    status: 'tolkning',
    kilde: 'Stream',
    dato: '23.09',
    tekst: 'Foran kassen står et «Horde»-skilt båret av to hender. Det peker mot venstre i bildet, og Anja har bekreftet at det peker ca. 118° øst-sørøst.',
    betydning: 'Skiltet står vest-nordvest for kassen og peker mot den, så det viser veien inn. Håndsymbolene er ikke løst, og hendene ser ut til å ha endret stilling i løpet av 23.09, så de kan være et hint som oppdateres. To teorier fra Discord: fingrene er romertall (den første viser VII = 7), eller binærtall der hver finger opp er 1. Begge kan gi sifre til en kode. Skiltet ble fjernet kl. 19:12 den 23.09.',
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
    id: 'spill-dart',
    tittel: 'Kodejakten, spill 4: slik løser du dartskiven',
    status: 'bekreftet',
    kilde: 'Kildekoden til Kodejakten',
    dato: '23.09',
    tekst: 'Fargene betyr: blå = pluss, gul = minus, rosa = gange, lilla = dele (lånt fra spillet Blue Prince). Start med tallet i midten, og gå utover én ring om gangen. Hvert farget felt peker på et tall (1–20) langs kanten, som brukes med ringens regnetegn. Svaret er alltid mellom 1 og 999.',
    betydning: 'Du må ha fire riktige skiver på rad. Svarer du feil, får du en ny skive og starter på null. Gjelder når Horde skrur på serveren.',
    lenke: 'https://horde.no/secret/kodejakten',
  },
  {
    id: 'spill-alle',
    tittel: 'Kodejakten: de fire spillene',
    status: 'bekreftet',
    kilde: 'Kildekoden til Kodejakten',
    dato: '23.09',
    tekst: '1) Kill the Bill: hold fingeren på skjermen for å flytte og skyte. Nivåer: Regningsbunken, Purringene og bossen Hovedkravet (1 116 897). 2) Bill Runner: tapp for å hoppe over regningene fram til kassen. 3) Flappy-Alf: tapp for å flakse gjennom regningsbunkene, åpningene blir mindre. 4) Dartskiven. Fremgangen lagres, så du kan ta pauser.',
    betydning: 'Alle fire må klares i én økt. Da viser siden «Låsen er åpen: dette er koden til den ene hengelåsen på kassen». Hjelpeknappen sier bare «Tips: Vær bedre».',
    lenke: 'https://horde.no/secret/kodejakten',
  },
  {
    id: 'regel-kontor',
    tittel: 'Horde: «Ingen på Hordekontoret vet hvor kassen er»',
    status: 'bekreftet',
    kilde: 'Jaktvettreglene (Horde)',
    tekst: '«Ingen på Hordekontoret vet hvor kassen befinner seg. Det er kun de som er på stedet med Anja som vet noe. De får du ikke tak i.»',
    betydning: 'Det nytter ikke å spørre Horde-ansatte. Hint om stedet kommer via appen, streamen og Anja.',
  },
  {
    id: 'regel-jakt',
    tittel: 'Horde: «Ikke kle deg ut som elg, hjort eller storfugl»',
    status: 'bekreftet',
    kilde: 'Jaktvettreglene (Horde)',
    tekst: '«Ikke kle deg ut som elg, hjort eller storfugl. Det er jaktsesong.»',
    betydning: 'Kassen står i skog der det jaktes. I Ringsaker er skogsfugljakta åpen 14.–24.09, og elgjakta starter fredag 25.09. Bruk synlige klær (oransje eller refleks).',
  },
  {
    id: 'regel-konvolutt',
    tittel: 'Vilkårene: konvolutt i kassen, ingen kontanter',
    status: 'bekreftet',
    kilde: 'Vilkår for Hordejakten 2026',
    tekst: 'For å vinne må du låse opp alle låsene med kodene fra appen og «følge instruksjonene du finner i konvolutten i kassen». Boksen inneholder ikke fysiske kontanter. Flere kan finne kassen samtidig: Horde har et køsystem der man prøver kodelåsene etter tur.',
    betydning: 'Premien utbetales via bankoverføring. Den som først åpner alle låsene, vinner. Å komme først fram garanterer ikke seier.',
  },
  {
    id: 'regel-anja',
    tittel: 'Horde: «Anja er på publikums lag»',
    status: 'bekreftet',
    kilde: 'Hordejakten, «Derfor gjør vi dette»',
    tekst: '«Anja kan kommunisere med omverdenen fra første minutt, om enn litt kryptisk i starten. Hun får etterhvert flere hjelpemidler å kommunisere med. Anja er på publikums lag. Hun har ikke fått noen føringer fra Horde om hva hun kan, eller ikke kan si.»',
    betydning: 'Tavla er den viktigste kilden: Anja svarer ærlig på det hun ser og hører. Stem inn nye hjelpemidler i appen, det gir henne flere måter å fortelle på.',
  },
  {
    id: 'kodejakten',
    tittel: 'Kodejakten: fire spill gir koden til én hengelås',
    status: 'bekreftet',
    kilde: 'horde.no/secret/kodejakten (kildekoden)',
    tekst: 'Fire spill: «Kill the Bill» (skyt regninger), «Bill Runner» (hopp over regninger), «Flappy-Alf» og «Dartskiven». Figuren heter Alf, med ansiktet til Horde-mannen fra videoen, ikke Alf Prøysen. Når alle fire er klart, viser siden «Låsen er åpen: Dette er koden til den ene hengelåsen på kassen.» Koden ligger ikke i nettsiden, serveren gir den først når alle fire er godkjent.',
    betydning: 'Serveren som gir koden er ikke skrudd på ennå: alle API-kall (start/verify) svarer «not_configured» (503) per 23.09. Ingen kan altså få en kode fra Kodejakten nå, uansett. Når den åpner: gir én av kodene, ikke et sted. Tips til dartskiven, fra kildekoden: blå = pluss, gul = minus, rosa = gange, lilla = dele. Start med tallet i midten og regn deg utover, ring for ring. Du må ha fire riktige på rad. Hjelpeteksten er bare «Tips: Vær bedre».',
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
    pos: [58.7, 8.27],
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
    pos: [60.8705, 11.2481],
    tittel: 'Fly sett og hørt kl. 21:30',
    status: 'tolkning',
    kilde: 'Tavla («FLY») + ADS-B (adsb.lol via default.no). Takk til default.no.',
    dato: '21.09',
    tekst: 'Anja pekte rett opp kl. 21:29:38 og skrev «FLY» kl. 21:30 (streamtid). To fly var nær: NOZ56U nordover over Løten (ca. 24 000 fot), og NOZ9EG sørover over Ringsakfjellet ved Sjusjøen (ca. 23 500 fot). NOZ9EG passerte ca. 3 km fra Tretopphyttene kl. 21:31.',
    betydning: 'Kassen står trolig under ett av de to sporene: Løten–Elverum eller Ringsaker (Sjusjøen–Brumunddal). Fellesskapet: «Eneste stedene det er sol i Norge nå + eneste stedene det fløy fly over hodet hennes 21:29.» Streamen er 45 sek forsinket.',
    lag: ['fly'],
  },
  {
    id: 'terreng',
    tittel: 'Terrenget: kupert, lyng, fire store steiner',
    status: 'bekreftet',
    kilde: 'Tavla + Børsen-intervju',
    dato: '21.09',
    tekst: 'Ca. 5–10 min fra bilen, oppover. På siste etappe hadde hun sovemaske og headset og ble båret inn i skogen. Kupert terreng, mye lyng og furuskog. Fire store steiner, en presenning og mer åpen skog til høyre for henne.',
    betydning: 'Hun hører ikke tog, bil eller skyting, og det var dugg på taket av kassen 07:00–09:40 (klar, fuktig natt). Hun ble båret, så avstanden er hennes følelse. Leter du i felt: 300–900 m fra en skogsbilvei, oppover, på lyngdekt furumo.',
    lag: ['felt'],
  },
  {
    id: 'innlandet',
    pos: [61.25, 10.95],
    tittel: 'Fellesskapet er nå sikre på Innlandet',
    status: 'tolkning',
    kilde: 'Discord og chat + default.no. Takk til default.no.',
    dato: '23.09',
    tekst: 'De fleste som leter peker nå mot Innlandet: flyet over Løten, klar himmel på Østlandet, furumo og tømmerdrift, og default.no sin topp-kandidat i Rena/Åmot. Fra chatten: «Det er null tvil, været, sola, skogen og alt.»',
    betydning: 'Innlandet er egen teori og eget kartlag. Velg «Innlandet» i modellen for å se de beste rutene der.',
    lag: ['innlandet'],
  },
  {
    id: 'rudshogda',
    tittel: 'Prøysen-teorien: Rudshøgda',
    status: 'tolkning',
    kilde: 'Fellesskapet + egne søk + default.no. Takk til default.no.',
    dato: '23.09',
    tekst: 'Mange leter nå ved Rudshøgda i Ringsaker, der Alf Prøysen vokste opp. Sammenhenger: (1) Dyrene i boksen, rev, kråke og ekorn, er alle med i Prøysens «Sirkus Mikkelikski»: Mikkel Rev, Frøken Kråke og ekornet Nøtteliten. (2) Bak Prøysenstua står Prøysenstjerna, en 27 m høy stjerne laget etter Prøysens julevers om stjerna, og Anja sier hun liker å se stjernene om natta. (3) Flyet NOZ9EG gikk ca. 6–11 km fra Prøysenstua kl. 21:31. (4) Ringsaker er default.no sin kandidat nr. 5 (Brøttum). (5) Blandingsskog med gran og bjørk, ca. 2 t fra Oslo.',
    betydning: 'Den tematisk sterkeste teorien: nesten alle dyre-hintene peker på Prøysen. Mot: da Anja pekte opp, var begge flyene ca. 30 km unna. Rudshøgda lå utenfor det som var klart på satellitt 23.09. Soloppgang ca. 07:00, akkurat på grensen. Prøysenstua er sjekket, men skogen rundt stjerna er det ikke.',
    lag: ['teorier', 'steder'],
    fokus: 'proysenstjerna',
  },
  {
    id: 'digeras',
    tittel: 'Tips fra fellesskapet: Digeråsen',
    status: 'usikker',
    kilde: 'Chat',
    dato: '23.09',
    tekst: 'Flere tipper 61°10\'43.84"N 11°15\'50.13"E og mener det «er så klink her». En skogkledd ås på 606 moh. mellom Løten og Åmot, ca. 2,5 t fra Oslo.',
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
    id: 'vinduslos',
    tittel: 'Pausestedet har ikke vinduer eller wifi',
    status: 'bekreftet',
    kilde: 'Anja',
    dato: '23.09',
    tekst: 'Anja har sagt at hun var et sted uten vinduer og uten wifi.',
    betydning: 'Trolig en container, campingvogn, telt eller lignende nær kassen, ikke en hytte. Det passer med at Horde unngår hytter i år, og ikke med Tretopphyttene, som har store vinduer.',
  },
  {
    id: 'hytte',
    tittel: 'Ingen hytte i år, portabel do',
    status: 'tolkning',
    kilde: 'Anja + fellesskapet',
    dato: '23.09',
    tekst: 'Anja har bekreftet at doen er portabel. Fellesskapet tror Horde har droppet hytte helt i år, fordi folk fant bookingene i fjor.',
    betydning: 'Du trenger ikke lete etter en hytte eller et bygg. Se etter en åpen furumo nær en skogsbilvei, der et team kan bære inn utstyret.',
  },
  {
    id: 'video2309',
    tittel: 'Ny Horde-video: «Hvordan går det med Anja?»',
    status: 'bekreftet',
    kilde: 'YouTube 1raIm3ANsAI (23.09)',
    dato: '23.09',
    tekst: 'Horde skriver: «Kjenner jeg dere riktig så vil dere overanalysere denne videoen». Videoen viser kassen forfra: blandingsskog med gran, furu og mange tynne bjørker med gule blader, flatt og mosegrodd underlag, en stige og en svart skjerm inne i kassen. «+5» står på ryggen av genseren. Nattbildene har tre lamper over kassen.',
    betydning: 'Bekrefter «+5» og blandingsskog med mye bjørk. Bjørk med gule blader passer med høstfarger i innlandet rundt 20. september. Ingen stedsnavn eller skilt synes.',
    lenke: 'https://www.youtube.com/shorts/1raIm3ANsAI',
  },
  {
    id: 'pluss5',
    tittel: '«+5» på genseren',
    status: 'apen',
    kilde: 'Stream + Horde-video 23.09',
    dato: '23.09',
    tekst: 'Genseren til Anja viser nå «+5» på ryggen. Det synes tydelig når hun står på hendene i Horde-videoen 23.09.',
    betydning: 'Uløst. Mulige lesninger: samme Cæsar-forskyvning (+5) som på buksa, brukt på et nytt hint. Eller legg 5 til en kode: 5008 + 5 = 5013, eller +5 på hvert siffer = 0553. Eller temperaturen ute, ca. +5 °C. Prøvd på genser-tallene (7 10 5 12 4 6 18 9): +5 gir LOJQIKWN og −5 gir BEZGYAMD, så det gir ingen mening der.',
  },
  {
    id: 'koder',
    tittel: 'Mulige koder til låsene',
    status: 'apen',
    kilde: 'Appen, stream og chat',
    dato: '23.09',
    tekst: 'Det er 3 låser: 2 hengelåser med 4 siffer på pengeboksen, og 1 elektronisk lås med 5 siffer på døra (for Anja). Kandidater: 5008 (kredittskår + «terje»). 5528: plakaten foran kameraet ser ut til å vise kortstokker, ikke pengebunker, og en kortstokk har 52 kort, så «00» i 5008 kan være 52. 2188 (nevnt i chatten, ukjent kilde). Hendene under Horde-skiltet kan også være sifre, som romertall (første hånd VII = 7) eller binært. Kodejakten gir en kode. 072 og 500 fra «Ho Ho Hint Hint».',
    betydning: 'Koder, ikke steder. Anja har nå skrevet at døra har en elektronisk lås med 5 siffer, i tillegg til hengelåsene med 4 siffer. Ha med alle kandidatene når du drar ut. 5528 og 2188 er ubekreftet.',
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
    kilde: 'Stream (via default.no). Takk til default.no.',
    tekst: 'Anja har kjent lukt av tømmer, hørt dunking og sett en lastet tømmerbil.',
    betydning: 'Aktiv hogst i nærheten. default.no leter innen 800 m fra en hogstflate fra 2022 eller senere, eller 400 m fra en fra 2024–25 (Global Forest Watch). Se etter ferske hogstflater på satellittbilder i kandidatområdene.',
  },
]

/** Svar Anja har skrevet på tavla, i rekkefølgen de kom (nye legges nederst). Tider er streamtid (45 sek forsinket). */
export const TAVLE: { t: string; tekst: string; bilder?: { src: string; alt: string }[] }[] = [
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
  { t: 'Ukjent', tekst: 'ØST CA 118 · RETNING SKILT (skiltet peker ca. 118°)' },
  { t: 'Ukjent', tekst: 'VIL DERE SE EN BACKFLIP?' },
  { t: '23.09 09:33', tekst: 'DET GÅR FINT · TAKK SOM SPØR ♡' },
  { t: '23.09', tekst: 'LAST NED HORDE APPEN' },
  { t: '23.09', tekst: 'REVEN HETER BENNY' },
  { t: '23.09', tekst: '118–120 GR ØST (retningen skiltet peker)' },
  { t: '23.09', tekst: 'SOLA VAR OPPE FØR 07' },
  { t: '23.09', tekst: '«+5» på genseren' },
  {
    t: '23.09',
    tekst: 'SKISSE av stedet. Beste lesning: «KAMERA» øverst, kassen i midten, «SKILT» til høyre. Ordet til venstre og nederst er ikke lesbart.',
    bilder: [
      { src: 'img/tavle-skisse.jpg', alt: 'Anja med tavla, original fra streamen' },
      { src: 'img/tavle-skisse-forsterket.jpg', alt: 'Tavla forsterket i kontrast' },
    ],
  },
  { t: '23.09', tekst: 'KAMERA 41 ØST' },
  { t: '23.09 17:49', tekst: 'LYDTETT · SOL · VINDSTILLE' },
  { t: '23.09 kveld', tekst: 'ELEKTRONISK LÅS PÅ DØRA MED 5 SIFFER' },
  { t: '23.09 kveld', tekst: 'FÅR SE BITTELITE · MASSE SOPP · TYPISK FJELLMARK' },
  { t: '23.09 kveld', tekst: 'IKKE VANN · STEIN + SOPP · MOSE PÅ STEINER' },
  { t: '23.09 kveld', tekst: 'ISH 16° (ca. 16 grader)' },
  { t: '23.09 kveld', tekst: 'GIKK 2 MIN INN I SKOGEN' },
  {
    t: '23.09 19:09',
    tekst: 'LITE MED FLY HER · SIKKERT MED VILT (siste ord litt utydelig)',
    bilder: [{ src: 'img/tavle-1909-fly-vilt.jpg', alt: 'Tavla kl. 19:09: LITE MED FLY HER' }],
  },
  {
    t: '23.09 19:12',
    tekst: 'SKILTET ER BORTE · VET IKKE HVOR',
    bilder: [{ src: 'img/tavle-1912-skilt-borte.jpg', alt: 'Tavla kl. 19:12: SKILTET ER BORTE, VET IKKE HVOR' }],
  },
  {
    t: '24.09',
    tekst: 'INGEN PIZZA ENDA',
    bilder: [{ src: 'img/tavle-ingen-pizza.jpg', alt: 'Anja i glassboksen med tavla: INGEN PIZZA ENDA' }],
  },
  {
    t: '24.09',
    tekst: 'HJELPER VELDIG AT JEG KAN SE DET DERE SKRIVER <3',
    bilder: [{ src: 'img/tavle-ser-chatten.jpg', alt: 'Anja i glassboksen med tavla: HJELPER VELDIG AT JEG KAN SE DET DERE SKRIVER' }],
  },
  {
    t: '24.09',
    tekst: 'SKAL KLARE Å HOLDE UT TIL NOEN FINNER MEG',
    bilder: [{ src: 'img/tavle-holde-ut.jpg', alt: 'Anja i glassboksen med tavla: SKAL KLARE Å HOLDE UT TIL NOEN FINNER MEG' }],
  },
  {
    t: '24.09',
    tekst: 'HJEMMELAGET PEPPERONIPIZZA · DRESSING FRA COOP · KNALLGODT',
    bilder: [{ src: 'img/tavle-pizza-coop.jpg', alt: 'Tavla: HJEMMELAGET PEPPERONIPIZZA, DRESSING FRA COOP, KNALLGODT' }],
  },
  {
    t: '24.09',
    tekst: 'JEG HAR TROA PÅ DERE',
    bilder: [{ src: 'img/tavle-troa-pa-dere.jpg', alt: 'Anja i glassboksen med tavla: JEG HAR TROA PÅ DERE' }],
  },
  {
    t: '24.09',
    tekst: 'KOM FRA DEN VEIEN ← (pil mot venstre i bildet) · INGEN STIER',
    bilder: [{ src: 'img/tavle-kom-fra-den-veien.jpg', alt: 'Anja med tavla: KOM FRA DEN VEIEN, med pil mot venstre, og INGEN STIER' }],
  },
  {
    t: '24.09',
    tekst: '(kl. 17:20) INGEN HYTTE I NÆRHETEN SOM JEG VET OM ELLER SER',
    bilder: [{ src: 'img/tavle-ingen-hytte.jpg', alt: 'Nattkamera 17:20: INGEN HYTTE I NÆRHETEN SOM JEG VET OM ELLER SER' }],
  },
  {
    t: '24.09',
    tekst: 'INGEN LYD I BOKSEN OVERHODET, JEG HAR KUN DERE Å UNDERHOLDE MEG. INGENTING ANNET',
    bilder: [{ src: 'img/tavle-ingen-lyd.jpg', alt: 'Anja med tavla: INGEN LYD I BOKSEN OVERHODET' }],
  },
  {
    t: '24.09',
    tekst: '(kl. 18:07) MAMMA <3 (svar til chatten, som savner mamma og stemte på at Anja skal ringe mamma)',
    bilder: [{ src: 'img/tavle-mamma.jpg', alt: 'Nattkamera 18:07: Anja med tavla MAMMA og et hjerte' }],
  },
  {
    t: '24.09',
    tekst: 'GRÅVÆR HELE DAGEN',
    bilder: [{ src: 'img/tavle-graver.jpg', alt: 'Anja med tavla: GRÅVÆR HELE DAGEN' }],
  },
  {
    t: '24.09',
    tekst: '(kl. 08:24) 5 SIFFER · GANSKE SIKKER (om dørlåsen)',
    bilder: [{ src: 'img/tavle-5-siffer.jpg', alt: 'Nattkamera 08:24: 5 SIFFER, GANSKE SIKKER' }],
  },
  {
    t: '24.09',
    tekst: '2x HENGELÅS 4 TALL · 1x KODELÅS 5–6 TALL · TROR 5',
    bilder: [{ src: 'img/tavle-laser.jpg', alt: 'Tavla: 2x HENGELÅS 4 TALL, 1x KODELÅS 5-6 TALL, TROR 5' }],
  },
  {
    t: '24.09',
    tekst: 'DET HAR VÆRT HOGD TIDLIGERE DER JEG GIKK I GÅR · GIKK DEN VEIEN → (pil mot høyre i bildet)',
    bilder: [{ src: 'img/tavle-hogd.jpg', alt: 'Tavla: DET HAR VÆRT HOGD TIDLIGERE DER JEG GIKK, GIKK DEN VEIEN, med pil mot høyre' }],
  },
  { t: '24.09', tekst: 'SÅ INGENTING SOM IKKE HØRER TIL I EN SKOG I GÅR · PS! HÅPER PÅ PEPPERONIPIZZA' },
  { t: '24.09', tekst: '(kl. 11:05) Anja sa at det regnet' },
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
  { id: 'kroktjennet', navn: 'Topp ca. 891 moh ved Kroktjennet, Åmot', pos: [61.2405, 11.01], type: 'hint', info: 'Tips fra fellesskapet: et punkt på 891 moh nordvest for Kroktjennet (Hemmeldalen, vest for Rena). Kartverket gir ca. 887 moh her, åpent område. Ligger inne i Hemmeldalen naturreservat, der det er strenge regler for inngrep.' },
  { id: 'bjorneparken', navn: 'Bjørneparken, Flå (ca.)', pos: [60.426, 9.464], type: 'hint', info: 'Reklamefargene til Horde ligner Bjørneparken sine.' },
  { id: 'proysen', navn: 'Prøysenstua, Rudshøgda', pos: [60.912, 10.8076], type: 'hint', info: 'Alf Prøysens barndomshjem. Dyrene i boksen (rev, kråke, ekorn) er figurer fra Prøysens «Sirkus Mikkelikski». Én i chatten har sjekket stua, men skogen rundt er ikke sjekket.' },
  { id: 'proysenstjerna', navn: 'Prøysenstjerna (ca.)', pos: [60.9115, 10.806], type: 'hint', info: '27 m høy stjerne i granskogen bak Prøysenstua, laget til Prøysen-jubileet i 2014 etter hans julevers om stjerna.' },
  { id: 'tokke', navn: '2023: Tokke (område)', pos: [59.444, 7.989], type: 'tidligere', info: 'Hordejakten 2023 ble funnet i Tokke i Telemark. Skog, bil og litt gange.' },
  { id: 'kongsberg', navn: '2024: Kongsberg-området', pos: [59.668, 9.65], type: 'tidligere', info: 'Hordejakten 2024 ble funnet i Kongsberg-området i Buskerud. Skog.' },
]

export const TEORIER: Sted[] = [
  {
    id: 'digeras',
    navn: 'Tips: Digeråsen (Løten/Åmot)',
    pos: [61.1788, 11.2639],
    type: 'teori',
    info: '61°10\'43.8"N 11°15\'50.1"E. Flere i chatten mener dette stemmer godt. Skog, 606 moh., 2 t 35 min fra Oslo, i kanten av det som var klart på satellitt 23.09. NOZ56U var rett over her kl. 21:32:50 (74°), da rumlingen var høyest. Men da Anja pekte opp (21:28:53 ekte tid) var flyet 45 km unna og bare 8° over horisonten.',
  },
  {
    id: 'benningstad',
    navn: 'Benningstad, Løten («Benny»?)',
    pos: [60.7685, 11.3575],
    type: 'teori',
    info: 'Gårdsnavn i Løten som ligner «Benny». Ca. 10 km fra der flyet NOZ56U var kl. 21:28. Trolig bare en tilfeldighet.',
  },
  {
    id: 'bennyoy',
    navn: 'Bennyøy, Nome («Benny»?)',
    pos: [59.2666, 9.1327],
    type: 'teori',
    info: 'Eneste stedsnavn i Norge som starter med «Benny». En holme i Nome, Telemark, bare 3,4 km fra 118°-linja fra Horde i Bergen. Men «Ikke en øy»-hintet taler imot.',
  },
  {
    id: 'tretopp',
    navn: 'Tips: Tretopphyttene, Ringsaker',
    pos: [60.9748, 10.9167],
    type: 'teori',
    info: 'Danseråsvegen 173, Brumunddal. Logoen er et ekorn. Ringsaker er også Prøysens kommune (Sirkus Mikkelikski). Ca. 2 t fra Oslo. NOZ56U var ca. 21 km unna (19° over horisonten) da Anja pekte opp.',
  },
  {
    id: 'haslemoen',
    navn: 'Tips: Flisa og Haslemoen',
    pos: [60.66, 11.87],
    type: 'teori',
    info: 'Noen tror det er nær Rena, men mer mot Flisa. Haslemoen har en nedlagt militærleir. Innenfor det som var klart på satellitt 23.09. Ca. 2,5 t fra Oslo. Flyet NOZ56U var ca. 40 km unna (10° over horisonten) da Anja pekte opp.',
  },
  {
    id: 'nittedalen',
    navn: 'Tips: Nittedalen',
    pos: [60.07, 10.87],
    type: 'teori',
    info: 'Nevnt i chatten. Bare 37 min fra Oslo, 58 km fra begge flyene og utenfor det som var klart i dag. Passer dårlig.',
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
  { id: 'froland', navn: 'Froland (lite sannsynlig)', pos: [58.53, 8.63], type: 'teori', utelukket: true, info: 'Været i Froland samsvarer ikke med det Anja har sett. Men appen har et eget svar når man skriver FROLAND: «Ekornet kan klatre» (23.09). Kommunevåpenet har et ekorn.' },
  { id: 'lillehammer', navn: 'Lillehammer (ekorn-maskot)', pos: [61.115, 10.466], type: 'teori', info: 'Ubekreftet teori om ekorn som maskot. Ligger i det blå båndet på Windy-kartet, så det taler imot.' },
  { id: 'notteroy', navn: 'Nøtterøy (utelukket)', pos: [59.21, 10.42], type: 'teori', utelukket: true, info: 'Ordspill på «nøtt», men «Ikke en øy» og «ingen ferge» taler mot.' },
]

/**
 * Klare områder på satellittbildet 23.09 (fellesskapet), mens det ellers var skyet over store deler av Norge og Anja hadde sol.
 * Grovt tegnet ut fra en beskrivelse, ikke fra selve bildet. [0] = Kongsvinger–Rena mot Sverige, [1] = deler av Vestfold,
 * [2] = Trondheim–Ålesund (var blått på Windy-kartet tidligere, så usikkert).
 */
export const SOL_I_DAG: LatLon[][] = [
  [[60.1, 11.85], [60.5, 11.6], [60.88, 11.35], [61.15, 11.2], [61.3, 11.35], [61.3, 12.1], [61.0, 12.45], [60.6, 12.6], [60.2, 12.55], [60.0, 12.2]],
  [[59.05, 9.95], [59.1, 10.55], [59.6, 10.45], [59.65, 10.0], [59.35, 9.8]],
  [[62.3, 5.9], [62.8, 6.2], [63.2, 8.0], [63.55, 10.0], [63.5, 10.7], [63.2, 10.6], [62.9, 9.0], [62.5, 7.2], [62.2, 6.3]],
]

/** Tykk tåke morgenen 23.09 fra Nord-Odal til Sør-Odal og Jessheim (lokal melding), mens Anja ikke hadde tåke. Grovt tegnet. */
export const TAAKE: LatLon[][] = [
  [[60.1, 11.05], [60.08, 11.4], [60.18, 11.75], [60.3, 11.85], [60.48, 11.75], [60.5, 11.4], [60.35, 11.15], [60.2, 11.0]],
]

/** Toppkandidater fra default.no sin fusjonsmodell (22.09 kl. 16:42; klare celler i kveld 23.09) */
export const DEFAULTNO: { nr: number; pos: LatLon; navn: string; p: string }[] = [
  { nr: 1, pos: [60.9, 11.2], navn: 'Løten og Elverum (skog)', p: 'Klar himmel, under flyet' },
  { nr: 2, pos: [61.3, 11.2], navn: 'Rena og Åsta', p: 'Klar himmel, under flyet' },
  { nr: 3, pos: [61.5, 11.0], navn: 'Koppang', p: '8,2 °C klart i kveld' },
  { nr: 4, pos: [60.6, 12.35], navn: 'Finnskogen (Solør)', p: '8,5 °C klart i kveld' },
  { nr: 5, pos: [61.3, 12.3], navn: 'Trysil', p: '6,1 °C klart i kveld' },
]

/** Der NOZ56U var da Anja skrev «FLY» (ekte tid ca. 21:29:50) */
export const FLY_PUNKT = { pos: [60.8705, 11.2481] as LatLon, kallesignal: 'NOZ56U', hoydeFot: 23892 }
/** Sterke terrengtreff fra default.no sitt «site finder» (vei, oppoverbakke, furu, relieff og solhorisont) */
export const DEFAULTNO_TERRENG: { navn: string; pos: LatLon; omrade: string }[] = [
  { navn: 'Birkebeinerveien', pos: [61.4495, 10.9752], omrade: 'Rena/Åmot' },
  { navn: 'Gålaveien', pos: [61.4725, 10.9677], omrade: 'Rena/Åmot' },
  { navn: 'Madsskardveien', pos: [61.4747, 11.0966], omrade: 'Rena/Åmot' },
  { navn: 'Tolvmilskogen', pos: [60.69, 12.35], omrade: 'Solør' },
  { navn: 'Kirkesjøvegen', pos: [60.358, 12.507], omrade: 'Solør/Finnskogen' },
]

/** Det andre flyet nær Anja 21:29: NOZ9EG sørover mot Gardermoen, over Ringsakfjellet (ca. 21:29:15, 23 500 fot) */
export const FLY_PUNKT2 = { pos: [61.216, 10.896] as LatLon, kallesignal: 'NOZ9EG', hoydeFot: 23500 }

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
  { verdi: '3 låser', tekst: '2 på pengeboksen (4 siffer), 1 på døra (5 siffer)' },
  { verdi: '5–10 min', tekst: 'Fra bilen, båret oppover' },
]

export type Sjanse = 'hoy' | 'middels' | 'lav'

export const SJANSE: Record<Sjanse, { tekst: string; klasse: string }> = {
  hoy: { tekst: 'Høy', klasse: 'bg-emerald-600 text-white' },
  middels: { tekst: 'Middels', klasse: 'bg-amber-500 text-white' },
  lav: { tekst: 'Lav', klasse: 'bg-slate-300 text-slate-700' },
}

/** De to mest sannsynlige kodene (kassen har 2 kodelåser), med begrunnelse */
export const BESTE_KODER: { las: string; kode: string; hvorfor: string; sjanse: Sjanse; reserve?: string }[] = [
  {
    las: 'Døra til Anja (5 siffer)',
    kode: 'Ukjent',
    hvorfor: 'Anja skrev at døra har en elektronisk lås med 5 siffer. Ingen kjent kode har 5 siffer ennå.',
    sjanse: 'lav',
    reserve: 'Kandidater med 5 siffer: 00891 eller 00810 (2,7 eiffeltårn), 27000 (powerbanken), 50085, 55285 (5008/5528 + «+5»), 07250',
  },
  {
    las: 'Hengelås 1 (boksen)',
    kode: '5008',
    hvorfor: 'Det eneste tallet appen selv kaller et hint («Du fant et hint!»), og det har 4 siffer.',
    sjanse: 'hoy',
    reserve: '0891 eller 0810 (2,7 eiffeltårn), 6788 (skiltnummeret LD6788 ga «ENKODE»), eller 5528 hvis «00» skal byttes med 52 (kortstokken)',
  },
  {
    las: 'Hengelås 2 (boksen)',
    kode: 'Kodejakten',
    hvorfor: 'Horde sier selv at Kodejakten gir koden til en av låsene. Koden er ikke kjent ennå.',
    sjanse: 'hoy',
    reserve: 'Prøv 0891, 0810, 6788, 2188 og 5528 til Kodejakten-koden er kjent',
  },
]

/** Alle kodekandidater samlet. 3 låser: 2 hengelåser (4 siffer) på pengeboksen, 1 dørlås (5 siffer) for Anja. */
export const KODER: { kode: string; kilde: string; status: Status; sjanse: Sjanse; hint: string[] }[] = [
  { kode: '5008', kilde: 'Kredittskår i appen + «terje». Også postnummeret til Horde AS i Bergen. Horde sier kodehintene ligger i appen.', status: 'bekreftet', sjanse: 'hoy', hint: ['terje', 'koder', 'kodeniappen'] },
  { kode: '0891', kilde: 'HORDEMINUS i Horde AI: «2,7 eiffeltårn» = 2,7 × 330 m (med antenne) = 891. Med 0 foran blir det 4 siffer, som en hengelås. Kan også være høyden (891 moh), eller begge deler.', status: 'tolkning', sjanse: 'middels', hint: ['eiffel', 'koder', 'kodeniappen'] },
  { kode: '8915', kilde: '891 med «+5» fra genseren satt bak (891 og 5). 4 siffer.', status: 'tolkning', sjanse: 'lav', hint: ['eiffel', 'pluss5'] },
  { kode: '0896', kilde: '891 + 5 = 896, med 0 foran.', status: 'tolkning', sjanse: 'lav', hint: ['eiffel', 'pluss5'] },
  { kode: '8105', kilde: '810 (uten antenne) med «+5» bak.', status: 'tolkning', sjanse: 'lav', hint: ['eiffel', 'pluss5'] },
  { kode: '0810', kilde: 'Samme hint, men med Eiffeltårnet uten antenne: 2,7 × 300 m = 810.', status: 'tolkning', sjanse: 'middels', hint: ['eiffel', 'koder'] },
  { kode: '6788', kilde: 'Skiltnummeret LD6788 i «Bil & hus» ga «Du fant et hint! ENKODE» (24.09). Sifrene kan være koden.', status: 'tolkning', sjanse: 'middels', hint: ['enkode', 'koder'] },
  { kode: '5528', kilde: '5008 med 52 i stedet for 00: plakaten ser ut til å vise kortstokker, og en kortstokk har 52 kort.', status: 'tolkning', sjanse: 'middels', hint: ['plakat', 'koder'] },
  { kode: '2188', kilde: 'Nevnt i chatten. Ingen vet hvor den kommer fra.', status: 'usikker', sjanse: 'middels', hint: ['koder'] },
  { kode: '7…', kilde: 'Hendene under Horde-skiltet: romertall (første hånd VII = 7) eller binært.', status: 'tolkning', sjanse: 'lav', hint: ['skilt', 'koder'] },
  { kode: '5013', kilde: '5008 + 5, hvis «+5» på genseren skal legges til koden.', status: 'tolkning', sjanse: 'lav', hint: ['pluss5', 'terje'] },
  { kode: '0553', kilde: '5008 med +5 på hvert siffer (5→0, 0→5, 0→5, 8→3).', status: 'tolkning', sjanse: 'lav', hint: ['pluss5', 'terje'] },
  { kode: '5271', kilde: 'Powerbank Xtorm FS5271 i Horde Rewards (jaktvettregel 4 nevner powerbank). Trolig bare et modellnummer.', status: 'usikker', sjanse: 'lav', hint: ['powerbank'] },
  { kode: '27000', kilde: 'Samme powerbank, 27000 mAh. 5 siffer, som dørlåsen. Trolig tilfeldig.', status: 'usikker', sjanse: 'lav', hint: ['powerbank'] },
  { kode: '072', kilde: '«Ho Ho Hint Hint»: siste sifre i premien fra 2024 (1 093 072 kr). Bare 3 siffer.', status: 'usikker', sjanse: 'lav', hint: ['hohoh'] },
  { kode: '500', kilde: '«Ho Ho Hint Hint»: poeng for å verve. Bare 3 siffer.', status: 'usikker', sjanse: 'lav', hint: ['hohoh'] },
  { kode: 'ord', kilde: 'Kredittskår-boksen tar imot ord («terje» ga 5008, «FROLAND» ga «Ekornet kan klatre»), og «Bil & hus» tar imot skiltnummer (LD6788 ga «ENKODE»). Verdt å prøve: LØTEN, RENA, RINGSAKER, RUDSHØGDA, JAKTEN, MINUSHORDE, HORDEMINUS, NORHEIMSUND.', status: 'tolkning', sjanse: 'middels', hint: ['terje', 'frolandekorn', 'enkode', 'bokstaver', 'dyr'] },
  { kode: '????', kilde: 'Kodejakten gir koden til én hengelås når alle fire spill er klart (bekreftet i kildekoden). Dartskiven: blå +, gul −, rosa ×, lilla ÷. Kodejakten (horde.no/secret/kodejakten): fire minispill gir én kode.', status: 'apen', sjanse: 'hoy', hint: ['kodejakten'] },
]

/** Hva folk i chatten og på Discord tror, kort oppsummert. `fokus` er et sted på kartet. */
export const FOLK_TROR: { tekst: string; hvem: string; fokus?: string; pos?: LatLon; hint?: string[] }[] = [
  {
    tekst: 'Topp på 891 moh ved Kroktjennet i Hemmeldalen (Åmot)',
    hvem: 'HORDE MINUS → 2,7 eiffeltårn → 891 m. Det finnes en topp på ca. 891 moh nordvest for Kroktjennet, vest for Rena. Hemmeldalen er et naturreservat med skog, myr og mye dyre- og fugleliv, og verneforskriften nevner ande- og vadefugler spesielt (passer med and-hintet). Hemmeldalen-setrene ligger sørøst for toppen, som passer med «kom fra den veien ←». Mot: det er et naturreservat med strenge regler, toppen er åpent område og ikke skog, og det går ingen bilvei innen 900 m (OpenStreetMap). Da rekker man ikke å bære kassen dit på 5–10 min.',
    fokus: 'kroktjennet',
    hint: ['eiffel', 'and', 'komfra'],
  },
  { tekst: 'Innlandet', hvem: 'De fleste, og stadig flere er sikre: «Det er null tvil, været, sola, skogen og alt.» Klar himmel på Østlandet, flyet over Løten, furumo og tømmerdrift.', hint: ['innlandet', 'fly', 'skyer'] },
  { tekst: 'Digeråsen mellom Løten og Åmot', hvem: 'Flere sier det «er så klink her». Passer med lyden av flyet, ikke med pekingen.', fokus: 'digeras', hint: ['digeras', 'fly'] },
  { tekst: 'Løten og Elverum', hvem: 'Vår modell: der flyet var da Anja pekte rett opp.', pos: [60.87, 11.25], hint: ['fly'] },
  { tekst: 'Reven heter Benny', hvem: 'Bennyøy (Nome) ligger 3,4 km fra 118°-linja fra Bergen. Benningstad (Løten) er nær flyet. Trolig tilfeldig.', fokus: 'bennyoy', hint: ['benny', 'bergen118', 'dyr'] },
  { tekst: 'Rudshøgda (Prøysen)', hvem: 'Mange leter her nå. Rev, kråke og ekorn er alle figurer i Prøysens «Sirkus Mikkelikski», og Prøysenstjerna står bak Prøysenstua.', fokus: 'proysenstjerna', hint: ['rudshogda', 'dyr', 'ekorn'] },
  { tekst: 'Rundt de to flysporene', hvem: '«Eneste stedene det er sol i Norge nå + eneste stedene det fløy fly over hodet hennes 21:29.» Løten–Elverum (NOZ56U) og Ringsaker (NOZ9EG).', pos: [61.0, 11.05], hint: ['fly', 'solidag'] },
  { tekst: 'Nittedalen', hvem: 'Nevnt i chatten. 37 min fra Oslo og langt fra flyene, så passer dårlig.', fokus: 'nittedalen' },
  { tekst: 'Tretopphyttene i Ringsaker', hvem: 'Sjekket: én i chatten har vært innom alle hyttene og Prøysenstua, uten funn. NOZ9EG gikk 3 km unna kl. 21:31.', fokus: 'tretopp', hint: ['tretopp', 'ekorn', 'dyr'] },
  { tekst: 'Flisa og Haslemoen', hvem: 'Én person: «nær Rena, men mer mot Flisa». Nedlagt leir på Haslemoen.', fokus: 'haslemoen', hint: ['haslemoen', 'solidag'] },
  { tekst: 'Rena og Åmot', hvem: 'default.no sin toppkandidat.', pos: [61.45, 11.1], hint: ['innlandet'] },
  { tekst: 'Gjøvik', hvem: 'Én person: vær og sol passer.', fokus: 'gjovik', hint: ['skyer'] },
  { tekst: 'Norheimsund', hvem: 'Bokstavene, men mangler én N. HORDE MINUS går opp uten rest, og Hardanger var blått på Windy.', fokus: 'norheimsund', hint: ['bokstaver', 'skyer'] },
  { tekst: 'Froland er lite sannsynlig, men ikke helt ute', hvem: 'Været samsvarer ikke med det Anja har sett. Men appen svarer «Ekornet kan klatre» på FROLAND, så noen mener Froland er aktuelt igjen.', fokus: 'froland', hint: ['froland', 'frolandekorn', 'ekorn', 'skyanalyse'] },
  { tekst: 'Lillehammer', hvem: 'Ekorn-maskot. Ligger i det blå båndet på Windy.', fokus: 'lillehammer', hint: ['ekorn'] },
  {
    tekst: 'MINUS HORDE = JAKTEN',
    hvem: '«HORDEJAKTEN» minus «HORDE» gir «JAKTEN». Rev, and og kråke er jaktbare dyr, så dyrene kan også handle om jakt. Prøv ordene i kredittskår-boksen i appen, der «terje» ga 5008.', hint: ['bokstaver', 'dyr', 'and'] },
  { tekst: '118° fra Bergen, gjennom Telemark', hvem: 'Anja sier skiltet peker 118°. Noen trekker linja fra Horde AS i Bergen (5008): Odda, Vinje, Seljord, Kragerø.', pos: [59.5, 8.46], hint: ['bergen118', 'terje', 'retning118'] },
  { tekst: 'Ikke Odal eller Jessheim', hvem: 'Lokal: tykk tåke der i morges, mens Anja ikke hadde tåke.', pos: [60.3, 11.45], hint: ['taake'] },
  { tekst: 'Ikke Fredrikstad, Sarpsborg eller Halden', hvem: 'Overskyet der hele dagen, mens Anja hadde sol.', hint: ['solidag'] },
  { tekst: 'Tromsø (69° nord)', hvem: 'TikTok-teori om «MINUS HORDE». Rundt 20 t fra Oslo, så lite sannsynlig.', hint: ['bokstaver'] },
  { tekst: 'Noen er alt ved kassen', hvem: 'Chatten sier flere prøver koder der nå.', hint: ['vedkassen', 'koder'] },
  { tekst: 'Sollyset er falskt', hvem: 'Noen mener bildet er filtrert. Da er hint fra sol i bildet usikre.', hint: ['lysfake', 'solidag'] },
]

/** Mulige lesninger av vervebokstavene N O R H E I M S U D */
export type Lesning = {
  ord: string
  forklaring: string
  hint: string[]
  /** Hvor sterk lesningen er: bruker alle bokstaver, gir mening med andre hint osv. */
  styrke: 'sterk' | 'middels' | 'svak'
  /** Sted på kartet lesningen peker på */
  pos?: LatLon
}

export const BOKSTAV_LESNINGER: Lesning[] = [
  {
    ord: 'HORDE MINUS',
    styrke: 'sterk',
    forklaring: 'Bekreftet: Horde AI svarer «2,7 eiffeltårn stablet oppå hverandre» på «Hordeminus». 2,7 × 330 m = 891 m, trolig høyden over havet.',
    hint: ['bokstaver', 'eiffel'],
  },
  {
    ord: 'MINUS 5 (dekod med −5)',
    styrke: 'sterk',
    forklaring: '«+5» står på genseren, og buksa er kodet med +5 (MT WI JO = HO RD EJ). «MINUS HORDE» kan være bruksanvisningen: trekk fra 5 for å dekode. HORDE +5 blir MTWIJ, som står på buksa.',
    hint: ['bokstaver', 'pluss5', 'caesar'],
  },
  {
    ord: 'JAKTEN',
    styrke: 'middels',
    forklaring: '«HORDEJAKTEN» minus «HORDE». Rev, and og kråke er jaktbare dyr, og ekorn ble før jaktet for kjøtt og pels i Innlandet. Prøv i kredittskår-boksen.',
    hint: ['bokstaver', 'dyr', 'and', 'terje'],
  },
  {
    ord: 'NORDHUE + MIS',
    styrke: 'middels',
    forklaring: 'Nordhue er et sted mellom Løten og Åmot, 14 km fra der NOZ56U var kl. 21:29. Bruker 7 av bokstavene, resten (M I S) er ikke et tydelig ord.',
    hint: ['bokstaver', 'fly'],
    pos: [60.994, 11.3382],
  },
  {
    ord: 'SMERUD + OHIN',
    styrke: 'svak',
    forklaring: 'Smerud er et sted i Solør, like ved Haslemoen og Flisa-tipset. Resten (O H I N) gir ikke et ord.',
    hint: ['bokstaver', 'haslemoen'],
    pos: [60.65, 11.7833],
  },
  {
    ord: 'DISEN + HUMOR',
    styrke: 'svak',
    forklaring: 'Bruker alle ti. Disen er et sted ved Hamar og Løten. «Humor» passer med tonen i Horde sine hint.',
    hint: ['bokstaver'],
    pos: [60.8, 11.08],
  },
  {
    ord: 'OSHEIM + RUND',
    styrke: 'svak',
    forklaring: 'Bruker alle ti. Osheim ligger nord-øst i Rena/Åmot-området.',
    hint: ['bokstaver'],
    pos: [61.4282, 11.7075],
  },
  {
    ord: 'NORDHEIM + SU',
    styrke: 'svak',
    forklaring: 'Nordheim er et vanlig gårdsnavn (169 steder i Norge), så det sier lite om hvor.',
    hint: ['bokstaver'],
  },
  {
    ord: 'NORHEIMSUND',
    styrke: 'svak',
    forklaring: 'Mangler én N. Stedet var blått på Windy-kartet.',
    hint: ['bokstaver', 'skyer'],
    pos: [60.3707, 6.1453],
  },
  {
    ord: 'HINDU MORSE',
    styrke: 'svak',
    forklaring: 'Bruker alle ti. «Morse» kobler til morsekoden på buksa (PREMIE). Trolig tilfeldig.',
    hint: ['bokstaver', 'morse'],
  },
  {
    ord: 'HUNDRE + MISO / HODER MINUS',
    styrke: 'svak',
    forklaring: 'Tall-ord i bokstavene: HUNDRE (100) og MINUS. Kan være del av en kode, for eksempel minus 100.',
    hint: ['bokstaver', 'koder'],
  },
  {
    ord: 'HUS MINE ORD / DINE HUS MOR',
    styrke: 'svak',
    forklaring: 'De vanligste ordene som bruker alle ti. Gir ingen tydelig mening, så trolig tilfeldige.',
    hint: ['bokstaver'],
  },
  {
    ord: '69° nord / Tromsø',
    styrke: 'svak',
    forklaring: 'TikTok-teori om «MINUS HORDE». Rundt 20 t fra Oslo, så lite sannsynlig.',
    hint: ['bokstaver'],
  },
]

/** Tretopphyttene i Ringsaker. `opptatt` gjelder 23.–27.09 ifølge bookingkalenderen. */
export const HYTTER: { navn: string; sted: string; pos: LatLon; opptatt: string; helePerioden?: boolean }[] = [
  { navn: 'Bjørkhytta', sted: 'Danseråsen', pos: [60.9914, 10.8841], opptatt: 'Opptatt sammenhengende 23.09–11.10', helePerioden: true },
  { navn: 'Granhytta', sted: 'Danseråsen', pos: [60.9902, 10.8866], opptatt: 'Opptatt 23.09 og 25.09–03.10' },
  { navn: 'Utsiktsredet', sted: 'Danseråsvegen', pos: [60.9748, 10.9167], opptatt: 'Opptatt 24.–26.09' },
  { navn: 'Himmelhytta', sted: 'Klufttjernet', pos: [60.9978, 10.8777], opptatt: 'Opptatt 24.–28.09' },
  { navn: 'Furuhytta', sted: 'Sør-Mesna', pos: [61.0747, 10.8309], opptatt: 'Opptatt 23.–27.09' },
  { navn: 'Forest View', sted: 'Høgbrennvegen', pos: [60.9811, 10.9401], opptatt: 'Opptatt 24., 26. og 27.09' },
  { navn: 'Lerkhytta', sted: 'Veldre (ca.)', pos: [60.93, 10.9], opptatt: 'Opptatt 25.–27.09' },
  { navn: 'Klatrehytta', sted: 'Helgøya', pos: [60.7388, 10.9798], opptatt: 'Opptatt 25.–27.09' },
]

/** Det vi vet sikkert. Holdes kort, og bare ting Anja, Horde eller bildet selv bekrefter. */
export const SIKRE_FAKTA: string[] = [
  'Kassen står i Norge, ikke på en øy og ikke i farlig terreng.',
  'Anja ble hentet i Oslo kl. 04:00, med tildekkede bilvinduer. Hun sov mesteparten og vet ikke hvor lenge de kjørte.',
  'Kun bil, ingen ferge. De siste 5–10 min ble hun båret oppover med sovemaske og headset.',
  'Skog med furu, gran og mye bjørk, lyng og bærlyng. «Typisk fjellmark», masse sopp, mose på steiner, ikke vann. Fire store steiner. Kupert rundt.',
  'Klar himmel kvelden 21.09. Sola var oppe før kl. 07.',
  'Kassen er lydtett, så hun hører lite utenfra. Sol og vindstille kl. 17:49 den 23.09.',
  'Horde-skiltet peker 118–120° mot kassen. Kameraet står ca. 41° (nordøst) fra kassen.',
  '3 låser: 2 hengelåser med 4 siffer på pengeboksen, og 1 elektronisk lås med 5 siffer på døra for Anja. Appen ga 5008 som hint.',
  'Horde har svart i kommentarfeltet at hint til hva kodene kan være, ligger i appen.',
  'Horde AI har et forhåndslaget svar på HORDEMINUS: «2,7 eiffeltårn stablet oppå hverandre». Eiffeltårnet er 300 m uten antenne og 330 m med, så 2,7 tårn er 810 eller 891 m. HORDE MINUS er de ti bokstavene fra «Verv en venn» (N O R H E I M S U D) stokket om.',
]

/** Siste nytt, nyeste først. Det øverste vises stort øverst i Teorier-fanen. */
export const SISTE_NYTT: { tid: string; tittel: string; tekst: string; lenke?: { tekst: string; url: string }; hint?: string }[] = [
  {
    tid: '24.09 kl. 11:05',
    tittel: 'Anja sa det regnet, og da regnet det i Rena',
    tekst: 'Regn hos Anja kl. 11:05 stemmer med regn i Rena samtidig, ifølge fellesskapet. Styrker Rena og Åmot litt.',
    hint: 'regn1105',
  },
  {
    tid: '24.09 kveld',
    tittel: '«Det har vært hogd der jeg gikk» med pil →: hun gikk gjennom et gammelt hogstfelt',
    tekst: 'Pila peker mot høyre i bildet (ca. 310°, nordvest). Det passer med «kom fra den veien ←» (ca. 130°): fra bilen i sørøst, gjennom et gammelt hogstfelt, mot nordvest og oppover til kassen. Hun så ingenting uvanlig på veien.',
    hint: 'hogst',
  },
  {
    tid: '24.09 kveld',
    tittel: 'Spor: topp på ca. 891 moh ved Kroktjennet i Hemmeldalen (Åmot)',
    tekst: 'Vest for Rena, inne i det røde området på fellesskapets 800–900 moh-kart. Hemmeldalen-setrene ligger sørøst for toppen, som passer med «kom fra den veien ←». Men toppen ligger inne i Hemmeldalen naturreservat og er åpent område, ikke skog. Se markøren på kartet.',
    hint: 'eiffel',
  },
  {
    tid: '24.09 kveld',
    tittel: '«Kom fra den veien ←» og «ingen stier»: bilen står trolig sørøst for kassen',
    tekst: 'Pila peker mot venstre i bildet, som er ca. 130° siden kameraet filmer mot 221°. Fra bilen går man altså mot nordvest og oppover, uten sti. Søkesektoren fra parkering er snudd. Også nytt: «Ingen hytte i nærheten som jeg vet om eller ser».',
    hint: 'komfra',
  },
  {
    tid: '24.09',
    tittel: 'Pizzaen kom: «Hjemmelaget pepperonipizza, dressing fra Coop, knallgodt»',
    tekst: 'Maten er handlet på Coop. Det sier lite alene, for Coop finnes nesten overalt i Innlandet, men det passer med en Coop-butikk innen kort kjøring fra kassen. Nye tavler i dag: «Ingen pizza enda», «Hjelper veldig at jeg kan se det dere skriver», «Skal klare å holde ut til noen finner meg».',
  },
  {
    tid: '24.09',
    tittel: 'Anja: «Hjelper veldig at jeg kan se det dere skriver <3»',
    tekst: 'Hun kan lese det chatten skriver. Spørsmål i chatten kan altså nå henne, og svarene kommer på tavla. Tidligere tavler: «INGEN PIZZA ENDA».',
  },
  {
    tid: '24.09 kveld',
    tittel: 'Horde: hint til kodene ligger i appen',
    tekst: 'Horde svarte i kommentarfeltet: «Hint til hva kodene kan være ligger i appen». Det styrker 5008, 6788 og 0891/0810. Se Hint-fanen for alle koder.',
    hint: 'kodeniappen',
  },
  {
    tid: '24.09 kl. 17:54',
    tittel: 'HORDEMINUS løst: «2,7 eiffeltårn stablet oppå hverandre» = 810 eller 891 m',
    tekst: 'Horde AI i appen svarer dette på «Hordeminus». Eiffeltårnet er 300 m uten antenne og 330 m med, så 2,7 tårn er 810 eller 891 m. Trolig høyden over havet der kassen står. Nye kartlag viser steder i den høyden nær vei, og fellesskapets 800–900 moh-kart.',
    hint: 'eiffel',
  },
  {
    tid: '24.09 kl. 00:01',
    tittel: 'Nytt app-hint: skiltnummer LD6788 gir «ENKODE»',
    tekst: 'Legg til kjøretøy LD6788 under «Bil & hus» i appen, så kommer «Du fant et hint! ENKODE». Kan bety at 6788 er en kode til en hengelås. Lagt til som kodekandidat.',
    hint: 'enkode',
  },
  {
    tid: '23.09 kl. 22:27',
    tittel: 'FROLAND i ord-boksen gir «Ekornet kan klatre»',
    tekst: 'Horde har et eget svar for Froland-teorien. Froland er fortsatt utelukket på grunn av været, men ord-boksen tar altså imot stedsnavn. Prøv flere.',
    hint: 'frolandekorn',
  },
  {
    tid: '23.09 kl. 19:12',
    tittel: 'Horde-skiltet er fjernet',
    tekst: 'Anja skrev «SKILTET ER BORTE, VET IKKE HVOR». Skiltet som pekte 118–120° er tatt bort. Retningen vi målte før gjelder fortsatt.',
    hint: 'skiltborte',
  },
  {
    tid: '23.09 kl. 19:09',
    tittel: 'Ny tavle: «Lite med fly her · sikkert med vilt»',
    tekst: 'Få fly der kassen står, altså ikke under lavtflygende ruter til Gardermoen. Og trolig mye vilt, som passer med jaktskog.',
    hint: 'litefly',
  },
  {
    tid: '23.09 kveld',
    tittel: 'Utelukkingskart: Hamar–Løten–Rena–Koppang, Ringsakfjellet og Gjøvik står igjen',
    tekst: 'Fellesskapet har utelukket områder med fjellbjørk (lyseblått). Solør, Finnskogen, Trysil og Elverum sentrum er ute. Nytt kartlag «Utelukket av fellesskapet» er på som standard.',
    hint: 'utelukkingskart',
  },
  {
    tid: '23.09 kveld',
    tittel: 'Nye tavler: «Typisk fjellmark», masse sopp, ikke vann',
    tekst: 'Anja skrev «TYPISK FJELLMARK», «MASSE SOPP», «MOSE PÅ STEINER», «IKKE VANN», ca. 16 grader og «GIKK 2 MIN INN I SKOGEN». Fjellmark peker mot høyereliggende områder, som Ringsakfjellet/Sjusjøen og åsene over Rena og Løten.',
    hint: 'fjellmark',
  },
  {
    tid: '23.09',
    tittel: 'Kodejakten er ikke aktiv ennå',
    tekst: 'Vi sjekket API-et: serveren som gir koden svarer «not_configured» (503) på alle kall. Kodejakten-spillene laster, men ingen kan få en kode fra dem før Horde skrur på serveren.',
    hint: 'kodejakten',
  },
  {
    tid: '23.09 kveld',
    tittel: 'Døra har en elektronisk lås med 5 siffer',
    tekst: 'Det er 3 låser: 2 hengelåser med 4 siffer på pengeboksen, og 1 elektronisk lås med 5 siffer på døra for å slippe ut Anja. Kodejakten gir koden til én av hengelåsene. Se «Mest sannsynlige koder» under Hint.',
    hint: 'koder',
  },
  {
    tid: '23.09 kl. 17:49',
    tittel: 'Ny tavle: «LYDTETT · SOL · VINDSTILLE»',
    tekst: 'Kassen er lydtett, så hun hører lite utenfra. Det var sol og vindstille kl. 17:49. Sammenlign med værstasjoner i kandidatområdene.',
    hint: 'lydtett',
  },
  {
    tid: '23.09 kveld',
    tittel: 'Mange leter nå ved Rudshøgda (Prøysen-teorien)',
    tekst: 'Rev, kråke og ekorn er alle med i Prøysens «Sirkus Mikkelikski», og bak Prøysenstua står den 27 m høye Prøysenstjerna. Flyet NOZ9EG gikk ca. 6–11 km unna kl. 21:31. Se «Prøysen-teorien» under Hint.',
    hint: 'rudshogda',
  },
  {
    tid: '23.09 kl. 15:30',
    tittel: 'Ny Horde-video med nye tall og bokstaver på genseren',
    tekst: 'Horde har lagt ut «Hvordan går det med Anja?». Genseren viser nå «+5» på ryggen, sammen med tallene og bokstavene. Horde skriver selv: «Kjenner jeg dere riktig så vil dere overanalysere denne videoen».',
    lenke: { tekst: 'Se videoen', url: 'https://www.youtube.com/shorts/1raIm3ANsAI' },
    hint: 'pluss5',
  },
  {
    tid: '23.09',
    tittel: 'Folk skal være ved kassen og prøve koder',
    tekst: 'Ifølge chatten har flere allerede prøvd kodene ved kassen. Se «Mest sannsynlige koder» under Hint.',
  },
]
