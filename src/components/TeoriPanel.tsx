import { useState } from 'react'
import { ArrowDown, ArrowUp, ChevronDown, Crosshair, ExternalLink, X } from 'lucide-react'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { SISTE_NYTT } from '@/data/innhold'
import { BEVIS, TEORIER_LISTE, type Bevis, type Modus, type Teori, type TeoriId } from '@/data/teorier'
import { cn } from '@/lib/utils'

type Props = {
  modus: Modus
  onModus: (m: Modus) => void
  prosent: Record<TeoriId, number>
  aktiveBevis: Set<string>
  onVeksleBevis: (id: string, pa: boolean) => void
  onVisTeori: (t: Teori) => void
}

const INTRO_NOKKEL = 'hordejakten-intro-lukket'

/** Hvilke aktive hint som løfter og trekker ned en teori mest */
function utslagFor(t: Teori, aktive: Bevis[]) {
  const alle = aktive.map((b) => ({ b, f: b.faktor(t) })).filter(({ f }) => Math.abs(Math.log(f)) > 0.05)
  const opp = alle.filter(({ f }) => f > 1).sort((a, b) => b.f - a.f)
  const ned = alle.filter(({ f }) => f < 1).sort((a, b) => a.f - b.f)
  return { opp, ned }
}

/** Kort versjon av hint-tittelen til «For/Mot»-linja */
function kortTittel(b: Bevis) {
  return b.tittel.replace(/\s*\(.*?\)\s*/g, ' ').split(': ')[0].trim()
}

export function TeoriPanel({ modus, onModus, prosent, aktiveBevis, onVeksleBevis, onVisTeori }: Props) {
  const rangert = [...TEORIER_LISTE].sort((a, b) => prosent[b.id] - prosent[a.id])
  const iModus = BEVIS.filter((b) => modus === 'alt' || b.kilde !== 'folk')
  const aktive = iModus.filter((b) => aktiveBevis.has(b.id))
  const [apen, setApen] = useState<TeoriId | null>(null)

  return (
    <div className="space-y-4">
      <SisteNytt />
      <Intro />

      <div>
        <h2 className="text-xl font-semibold tracking-tight">Hvor står kassen?</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Prosenten viser hvor godt hver teori passer med alle hintene samlet. Trykk på en teori for å se hvorfor.
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-1.5">
        <div className="grid grid-cols-2 gap-1" role="radiogroup" aria-label="Hva skal telle?">
          {(
            [
              { id: 'alt', navn: 'Alt vi har', tekst: 'Hint + det folk sier' },
              { id: 'hint', navn: 'Bare hint', tekst: 'Det vi har sett selv' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={modus === m.id}
              onClick={() => onModus(m.id)}
              className={cn('rounded-xl px-3 py-2 text-left transition-colors', modus === m.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-50')}
            >
              <span className="block text-[14.5px] font-semibold">{m.navn}</span>
              <span className={cn('block text-[12px]', modus === m.id ? 'text-slate-300' : 'text-muted-foreground')}>{m.tekst}</span>
            </button>
          ))}
        </div>
        <p className="px-2 pt-2 pb-1 text-[13px] leading-relaxed text-muted-foreground">
          {modus === 'alt'
            ? 'Regner med alle hintene og det folk i chatten og på Discord mener, som tips om Digeråsen, Flisa og Tretopphyttene. Folkemeninger teller litt, ikke mye.'
            : 'Regner bare med det vi har sett selv: tavla, streamen, appen, vær og flydata. Det folk i chatten mener, er ikke med.'}
        </p>
      </div>


      <ol className="space-y-2">
        {rangert.map((t, i) => {
          const p = prosent[t.id]
          const { opp, ned } = utslagFor(t, aktive)
          const erApen = apen === t.id
          return (
            <li key={t.id} className={cn('rounded-2xl border bg-card', i === 0 && 'border-slate-300 shadow-sm')}>
              <button type="button" className="w-full p-3.5 text-left" onClick={() => setApen(erApen ? null : t.id)} aria-expanded={erApen}>
                <div className="flex items-center gap-3">
                  <span className="w-14 shrink-0 font-mono text-xl font-semibold tabular-nums" style={{ color: t.farge }}>
                    {p < 1 ? '<1' : Math.round(p)}%
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] leading-snug font-semibold">{t.navn}</p>
                    <p className="text-[13px] text-muted-foreground">
                      {t.kort}
                      {t.kjoretid != null && ` · ${t.kjoretid.toFixed(1).replace('.', ',')} t fra Oslo`}
                    </p>
                  </div>
                  <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', erApen && 'rotate-180')} />
                </div>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(1, p)}%`, background: t.farge }} />
                </div>
                {!erApen && (opp.length > 0 || ned.length > 0) && (
                  <p className="mt-2 text-[13.5px] leading-snug text-slate-600">
                    {opp.length > 0 && (
                      <>
                        <span className="font-semibold text-emerald-700">For:</span> {opp.slice(0, 2).map(({ b }) => kortTittel(b)).join(', ')}
                      </>
                    )}
                    {opp.length > 0 && ned.length > 0 && ' · '}
                    {ned.length > 0 && (
                      <>
                        <span className="font-semibold text-rose-700">Mot:</span> {kortTittel(ned[0].b)}
                      </>
                    )}
                  </p>
                )}
              </button>
              {erApen && (
                <div className="border-t border-dashed px-3.5 pt-3 pb-3.5">
                  {opp.length === 0 && ned.length === 0 && <p className="text-[13px] text-muted-foreground">Ingen av hintene som er på, sier noe spesielt om denne teorien.</p>}
                  <ul className="space-y-1.5">
                    {[...opp, ...ned].map(({ b, f }) => (
                      <li key={b.id} className="flex items-start gap-2 text-[13.5px] leading-snug">
                        {f > 1 ? <ArrowUp className="mt-0.5 size-3.5 shrink-0 text-emerald-600" /> : <ArrowDown className="mt-0.5 size-3.5 shrink-0 text-rose-600" />}
                        <span className="min-w-0 flex-1">{b.tittel}</span>
                        <span className={cn('shrink-0 font-mono text-[12px] font-semibold', f > 1 ? 'text-emerald-700' : 'text-rose-700')}>
                          ×{f < 0.1 ? f.toFixed(2) : f.toFixed(1)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {t.senter && (
                    <Button size="sm" variant="outline" className="mt-3" onClick={() => onVisTeori(t)}>
                      <Crosshair /> Vis på kartet
                    </Button>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ol>
      <p className="px-1 text-[13px] leading-relaxed text-muted-foreground">Prosentene er et anslag basert på skjønn, ikke fasit. Se «Hvordan regnes prosenten ut?» under.</p>

      <Accordion type="single" collapsible className="rounded-2xl border bg-card px-4">
        <AccordionItem value="hint" className="border-none">
          <AccordionTrigger className="py-3.5">
            <span>
              <span className="block text-[15px] font-semibold">Juster hvilke hint som teller</span>
              <span className="block text-xs font-normal text-muted-foreground">
                {aktive.length} av {iModus.length} er med. Slå av det du ikke tror på.
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="divide-y">
              {iModus.map((b) => {
                const pa = aktiveBevis.has(b.id)
                return (
                  <label key={b.id} className={cn('flex cursor-pointer items-start justify-between gap-3 py-3', !pa && 'opacity-60')}>
                    <span className="min-w-0">
                      <span className="block text-[14.5px] leading-snug font-semibold">
                        {b.tittel}
                        {b.kilde === 'folk' && <span className="ml-1.5 rounded bg-violet-50 px-1 py-px text-[11px] font-semibold text-violet-700 ring-1 ring-violet-200">Folk sier</span>}
                      </span>
                      <span className="mt-0.5 block text-[13px] leading-relaxed text-muted-foreground">{b.forklaring}</span>
                    </span>
                    <Switch checked={pa} onCheckedChange={(v) => onVeksleBevis(b.id, v)} aria-label={b.tittel} />
                  </label>
                )
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="metode" className="border-t">
          <AccordionTrigger className="py-3.5 text-[15px] font-semibold">Hvordan regnes prosenten ut?</AccordionTrigger>
          <AccordionContent className="space-y-2 text-[14.5px] leading-relaxed text-slate-600">
            <p>Alle teoriene starter likt. «Et helt annet sted» starter fire ganger så høyt, fordi teori-sirklene er små og resten av landet er stort.</p>
            <p>
              Hvert hint gir en faktor per teori. ×2 betyr at hintet gjør teorien dobbelt så sannsynlig, ×0,5 halvparten så sannsynlig. Faktorene ganges sammen, og alt
              skaleres til 100 %.
            </p>
            <p>Faktorene er skjønn, ikke fasit. De viktigste er flyet Anja pekte på og været.</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

/** Kort bruksanvisning første gang man åpner siden */
function Intro() {
  const [synlig, setSynlig] = useState(() => {
    try {
      return localStorage.getItem(INTRO_NOKKEL) !== '1'
    } catch {
      return true
    }
  })
  if (!synlig) return null
  const lukk = () => {
    setSynlig(false)
    try {
      localStorage.setItem(INTRO_NOKKEL, '1')
    } catch {
      // Privat modus o.l.: introen vises igjen neste gang
    }
  }
  return (
    <div className="relative rounded-2xl bg-slate-900 p-4 pr-10 text-white">
      <button type="button" onClick={lukk} className="absolute top-1 right-1 grid size-11 place-items-center text-slate-400 hover:text-white" aria-label="Lukk">
        <X className="size-4" />
      </button>
      <p className="text-[16px] font-semibold">Slik bruker du kartet</p>
      <ol className="mt-2 space-y-1.5 text-[14.5px] leading-snug text-slate-200">
        <li>
          <b className="text-white">Teorier</b> viser hvor kassen mest sannsynlig står, i prosent.
        </li>
        <li>
          <b className="text-white">Kart</b> lar deg velge hva du ser. Trykk på kartet for detaljer om et sted.
        </li>
        <li>
          <b className="text-white">Hint</b> samler alle hint, koder og hva folk tror.
        </li>
      </ol>
      <button type="button" onClick={lukk} className="mt-3 min-h-11 rounded-full bg-white px-5 text-[14.5px] font-semibold text-slate-900">
        Skjønner
      </button>
    </div>
  )
}

/** Siste nytt: det nyeste står stort og tydelig, de eldre kort under */
function SisteNytt() {
  const [alle, setAlle] = useState(false)
  const [nyest, ...resten] = SISTE_NYTT
  const eldre = alle ? resten : resten.slice(0, 3)
  if (!nyest) return null
  return (
    <section className="overflow-hidden rounded-2xl bg-[#e5007e] text-white shadow-lg shadow-fuchsia-900/20" aria-labelledby="siste-nytt">
      <div className="p-4">
        <div className="flex items-center gap-2">
          <span className="live-puls size-2 rounded-full bg-white" />
          <p id="siste-nytt" className="text-[12px] font-bold tracking-[0.14em] uppercase">
            Siste nytt · {nyest.tid}
          </p>
        </div>
        <p className="mt-2 text-[17px] leading-snug font-semibold">{nyest.tittel}</p>
        <p className="mt-1.5 text-[14.5px] leading-relaxed text-fuchsia-50">{nyest.tekst}</p>
        {nyest.lenke && (
          <a
            href={nyest.lenke.url}
            target="_blank"
            rel="noopener"
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-[14.5px] font-semibold text-[#9d0056]"
          >
            {nyest.lenke.tekst} <ExternalLink className="size-4" />
          </a>
        )}
      </div>
      {eldre.length > 0 && (
        <ul className="divide-y divide-white/20 border-t border-white/20 bg-black/10">
          {eldre.map((n) => (
            <li key={n.tittel} className="px-4 py-2.5 text-[13.5px] leading-snug">
              <span className="font-semibold">{n.tittel}.</span> <span className="text-fuchsia-100">{n.tekst}</span>
            </li>
          ))}
          {resten.length > 3 && (
            <li>
              <button type="button" onClick={() => setAlle((a) => !a)} className="min-h-11 w-full px-4 text-left text-[13.5px] font-semibold underline underline-offset-2">
                {alle ? 'Vis færre' : `Vis ${resten.length - 3} eldre`}
              </button>
            </li>
          )}
        </ul>
      )}
    </section>
  )
}
