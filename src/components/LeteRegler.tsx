import { useState } from 'react'
import { ChevronDown, ExternalLink, TriangleAlert } from 'lucide-react'

import { cn } from '@/lib/utils'

type Kilde = { tekst: string; url: string }

const DRONEREGLER = 'https://luftfartstilsynet.no/droner/droneregler/droneregler/'

const DRONE: { tittel: string; tekst: string; kilde?: Kilde }[] = [
  {
    tittel: 'Registrer deg og merk dronen',
    tekst: 'De aller fleste må registrere seg som droneoperatør på flydrone.no og betale et gebyr. Operatørnummeret skal stå på dronen. Unntak: droner under 250 g uten kamera, og droner som er CE-merket som leketøy.',
    kilde: { tekst: 'Luftfartstilsynet: droneregler', url: DRONEREGLER },
  },
  {
    tittel: 'Ta dronelappen (A1/A3)',
    tekst: 'Du må bestå nettkurset og eksamen for A1/A3 på flydrone.no før du flyr. Er dronen under 250 g og har kamera, må du registrere deg, men trenger ikke kurs og eksamen. A2 krever en egen eksamen på trafikkstasjonen.',
    kilde: { tekst: 'Luftfartstilsynet: droneregler', url: DRONEREGLER },
  },
  {
    tittel: 'Du må være minst 16 år',
    tekst: 'Unntak er leketøydroner og selvbygde droner under 250 g. Er du under 16 og har tatt kurs og eksamen, kan du fly med veiledning fra noen over 16 som også har det.',
    kilde: { tekst: 'Luftfartstilsynet: åpen kategori', url: DRONEREGLER },
  },
  {
    tittel: 'Ha ansvarsforsikring',
    tekst: 'Alle droner må være ansvarsforsikret, unntatt droner under 250 g og leketøydroner.',
    kilde: { tekst: 'Luftfartstilsynet: forsikring', url: `${DRONEREGLER}#forsikring` },
  },
  {
    tittel: 'Maks 120 m og alltid i synsvidde',
    tekst: 'Dronen skal være maks 120 m fra nærmeste punkt på bakken, og du skal hele tiden kunne se den selv. Flyr du med skjerm eller videobriller (FPV), må du ha en observatør ved siden av deg som ser dronen.',
    kilde: { tekst: 'Luftfartstilsynet: åpen kategori', url: DRONEREGLER },
  },
  {
    tittel: 'Vit hvor du ikke får fly',
    tekst: 'Det er forbudt å fly nærmere enn 5 km fra en flyplass uten tillatelse fra tårnet, og over eller nær militære områder som Regionfelt Østlandet ved Rena. Hold deg også unna der politi, brannvesen eller redningstjeneste er i innsats.',
    kilde: { tekst: 'Lovdata: forskrift om ubemannede luftfartøyer § 7', url: 'https://lovdata.no/forskrift/2024-11-01-2777/§7' },
  },
  {
    tittel: 'Verneområder og dyreliv',
    tekst: 'Droner er som hovedregel forbudt i nasjonalparker og mange naturreservater. Sjekk verneforskriften for området i Naturbase før du flyr. Å forstyrre dyrelivet unødig er alltid forbudt i naturreservater, og ellers skal unødig jaging av vilt unngås.',
    kilde: { tekst: 'Miljødirektoratet: droner i naturen', url: 'https://www.miljodirektoratet.no/ansvarsomrader/vernet-natur/regler-for-droner-i-naturen/' },
  },
  {
    tittel: 'Personvern',
    tekst: 'Ikke film folk i hjemmet eller hagen deres uten lov, og spør alltid før du legger ut bilder eller video der noen kan kjennes igjen. Det gjelder også andre som leter.',
    kilde: { tekst: 'Datatilsynet: privat bruk av droner', url: 'https://www.datatilsynet.no/personvern-pa-ulike-omrader/overvaking-og-sporing/droner---hva-er-lov/privat-bruk-av-droner/' },
  },
]

const LETING: string[] = [
  'Det er jaktsesong. Småviltjakta startet 10. september, og elgjakta starter 25. september der kommunen åpner for den (noen steder først 5. oktober). Gå med synlige klær (gjerne oransje), vis hensyn der det jaktes, og ikke skremm viltet.',
  'Allemannsretten lar deg gå fritt i utmark. På innmark, som gårdstun, hustomter, hager, rundt hytter og på dyrket mark, gjelder den ikke. Er en privat vei stengt med bom eller skilt, kan du gå eller sykle forbi, men ikke kjøre.',
  'Kjør sakte og se etter elg. 25.09 ble det meldt om 11 elgpåkjørsler på én time rundt Elverum. Elgjakta gjør elgen urolig, og den krysser veiene særlig i skumringen og i mørket.',
  'Alf sa på TikTok-live 25.09 at man kanskje må gå litt, men aldri gjøre noe farlig, som å krysse en elv. Ser veien farlig ut, er det feil vei. Og husk at det er jaktsesong: gå i tydelige klær.',
  'Kassen står ikke i farlig terreng. Ikke ta sjanser, si fra hvor du går, og ha med lys og varme klær.',
  'Kommer flere til kassen samtidig, blir det kø. Klarer du ikke å åpne låsene, får du 5 timers karantene (Alf på TikTok-live 25.09). Ha kodene klare før du drar.',
  'Vær grei mot Anja og andre som leter. Ikke rør eller flytt kassen hvis du finner den: følg Hordes regler.',
]

/** Advarsel og regler for droner og leting, vist der folk planlegger å dra ut */
export function LeteRegler({ className }: { className?: string }) {
  const [apen, setApen] = useState(false)
  return (
    <section className={cn('overflow-hidden rounded-2xl border-2 border-amber-300 bg-amber-50', className)} aria-labelledby="lete-regler">
      <button type="button" onClick={() => setApen((a) => !a)} aria-expanded={apen} className="flex w-full items-start gap-3 p-4 text-left">
        <TriangleAlert className="mt-0.5 size-6 shrink-0 text-amber-600" />
        <span className="min-w-0 flex-1">
          <span id="lete-regler" className="block text-[16px] font-semibold text-amber-950">
            Før du drar ut: droner er regulert ved lov
          </span>
          <span className="mt-0.5 block text-[14px] leading-snug text-amber-900">
            Vil du lete med drone, må du som regel være registrert og ha kompetansebevis fra Luftfartstilsynet, og mange steder er det flyforbud. Trykk for reglene.
          </span>
        </span>
        <ChevronDown className={cn('mt-1 size-5 shrink-0 text-amber-700 transition-transform', apen && 'rotate-180')} />
      </button>
      {apen && (
        <div className="space-y-4 border-t border-amber-200 bg-white/70 p-4">
          <div>
            <p className="text-[13px] font-semibold tracking-wider text-amber-800 uppercase">Droner (Luftfartstilsynet)</p>
            <ol className="mt-2 space-y-2.5">
              {DRONE.map((r, i) => (
                <li key={r.tittel} className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-amber-500 text-[12px] font-bold text-white">{i + 1}</span>
                  <span className="text-[14px] leading-relaxed text-slate-700">
                    <b className="text-slate-900">{r.tittel}.</b> {r.tekst}
                    {r.kilde && (
                      <a href={r.kilde.url} target="_blank" rel="noopener" className="mt-0.5 flex w-fit items-center gap-1 text-[12.5px] text-amber-800 underline underline-offset-2 hover:text-amber-950">
                        Kilde: {r.kilde.tekst} <ExternalLink className="size-3" />
                      </a>
                    )}
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={DRONEREGLER} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-1.5 rounded-full border bg-white px-4 text-[14px] font-semibold text-slate-800 hover:bg-slate-50">
                Luftfartstilsynet: droneregler <ExternalLink className="size-4" />
              </a>
              <a href="https://training.caa.no/Hvor_kan_du_fly_drone_og_modellfly/" target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-1.5 rounded-full border bg-white px-4 text-[14px] font-semibold text-slate-800 hover:bg-slate-50">
                Hvor kan du fly drone? <ExternalLink className="size-4" />
              </a>
              <a href="https://flydrone.no" target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-1.5 rounded-full border bg-white px-4 text-[14px] font-semibold text-slate-800 hover:bg-slate-50">
                flydrone.no: registrering og kurs <ExternalLink className="size-4" />
              </a>
            </div>
          </div>
          <div>
            <p className="text-[13px] font-semibold tracking-wider text-amber-800 uppercase">Når du leter i skogen</p>
            <ul className="mt-2 space-y-1.5">
              {LETING.map((t) => (
                <li key={t} className="flex gap-2 text-[14px] leading-relaxed text-slate-700">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-500" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[12.5px] leading-snug text-muted-foreground">
            Dette er en kort oppsummering, ikke juridisk rådgivning. Dronereglene er sjekket mot{' '}
            <a href={DRONEREGLER} target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-foreground">
              Luftfartstilsynet
            </a>{' '}
            24.09.2026. Reglene kan endre seg, så sjekk alltid selv før du flyr. Brudd kan gi bot.
          </p>
        </div>
      )}
    </section>
  )
}
