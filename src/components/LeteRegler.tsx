import { useState } from 'react'
import { ChevronDown, ExternalLink, TriangleAlert } from 'lucide-react'

import { cn } from '@/lib/utils'

const DRONE: { tittel: string; tekst: string }[] = [
  {
    tittel: 'Registrer deg som droneoperatør',
    tekst: 'Veier dronen 250 g eller mer, eller har den kamera (og er ikke et leketøy), må du registrere deg hos Luftfartstilsynet på flydrone.no. Du får en operatør-ID som skal stå synlig på dronen.',
  },
  {
    tittel: 'Ta kompetansebeviset (A1/A3)',
    tekst: 'For droner på 250 g eller mer må du ha bestått det gratis nettkurset og prøven A1/A3 på flydrone.no før du flyr. Tyngre droner nær folk krever i tillegg A2.',
  },
  {
    tittel: 'Maks 120 m og alltid i synsvidde',
    tekst: 'Du skal ikke fly høyere enn 120 m over bakken, og du skal alltid kunne se dronen med egne øyne. Å fly langt inn over skogen med bare skjermen å gå etter er ikke lov.',
  },
  {
    tittel: 'Sjekk om det er flyforbud der',
    tekst: 'Nær flyplasser, over skytefelt og militære områder som Regionfelt Østlandet ved Rena, og i mange naturreservater er det forbudt eller krever tillatelse. Mange verneforskrifter forbyr lavtflyging under 300 m og start og landing, og det gjelder også droner. Sjekk kartet i appen Ninox Drone eller på flydrone.no før du letter.',
  },
  {
    tittel: 'Personvern',
    tekst: 'Ikke film eller legg ut folk som kan kjennes igjen uten at de sier ja, og ikke fly inn over hus, hytter og hager. Det gjelder også andre som leter.',
  },
]

const LETING: string[] = [
  'Det er jaktsesong. Elgjakta starter i mye av Innlandet i slutten av september. Gå med synlige klær (gjerne oransje), hold deg unna der det jaktes, og ikke skremm viltet.',
  'Allemannsretten gjelder i utmark, men ikke på innmark, i hager eller ved hytter. Respekter bommer og private veier: du kan gå forbi en bom, men ikke kjøre.',
  'Kassen står ikke i farlig terreng. Ikke ta sjanser, si fra hvor du går, og ha med lys og varme klær.',
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
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href="https://luftfartstilsynet.no/droner/" target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-1.5 rounded-full border bg-white px-4 text-[14px] font-semibold text-slate-800 hover:bg-slate-50">
                Luftfartstilsynet: droner <ExternalLink className="size-4" />
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
            Dette er en kort oppsummering, ikke juridisk rådgivning. Reglene kan endre seg, så sjekk alltid Luftfartstilsynet før du flyr. Brudd kan gi bot.
          </p>
        </div>
      )}
    </section>
  )
}
