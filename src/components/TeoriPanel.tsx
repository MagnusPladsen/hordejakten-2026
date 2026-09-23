import { ArrowDown, ArrowUp, Crosshair, Minus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { BEVIS, TEORIER_LISTE, type Teori, type TeoriId } from '@/data/teorier'
import { cn } from '@/lib/utils'

type Props = {
  prosent: Record<TeoriId, number>
  aktiveBevis: Set<string>
  onVeksleBevis: (id: string, pa: boolean) => void
  onVisTeori: (t: Teori) => void
}

export function TeoriPanel({ prosent, aktiveBevis, onVeksleBevis, onVisTeori }: Props) {
  const rangert = [...TEORIER_LISTE].sort((a, b) => prosent[b.id] - prosent[a.id])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Hvilken teori er mest sannsynlig?</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Hvert hint gjør en teori mer eller mindre sannsynlig. Slå hint av og på under, så regnes prosentene ut på nytt.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-[13px] leading-relaxed text-amber-900">
        <p className="font-semibold">Siste nytt fra chatten</p>
        <p className="mt-0.5">Flere skal allerede være ved kassen og prøve koder. Se «Mulige koder» under Hint.</p>
      </div>

      <ol className="space-y-2">
        {rangert.map((t, i) => {
          const p = prosent[t.id]
          return (
            <li key={t.id} className={cn('rounded-2xl border bg-card p-3.5', i === 0 && 'border-slate-300 shadow-sm')}>
              <div className="flex items-center gap-3">
                <span className="w-14 shrink-0 font-mono text-xl font-semibold tabular-nums" style={{ color: t.farge }}>
                  {p < 1 ? '<1' : Math.round(p)}%
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-semibold">{t.navn}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.kort}
                    {t.kjoretid != null && ` · ${t.kjoretid.toFixed(1).replace('.', ',')} t fra Oslo`}
                  </p>
                </div>
                {t.senter && (
                  <Button variant="outline" size="icon-sm" onClick={() => onVisTeori(t)} aria-label={`Vis ${t.navn} på kartet`}>
                    <Crosshair />
                  </Button>
                )}
              </div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(1, p)}%`, background: t.farge }} />
              </div>
            </li>
          )
        })}
      </ol>

      <div>
        <p className="pt-2 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Hintene som teller</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Pil opp betyr at hintet støtter teorien, pil ned at det taler imot. Vektene er skjønn, ikke fasit.
        </p>
      </div>
      <div className="divide-y rounded-2xl border bg-card">
        {BEVIS.map((b) => {
          const pa = aktiveBevis.has(b.id)
          const utslag = TEORIER_LISTE.filter((t) => t.id !== 'annet')
            .map((t) => ({ t, f: b.faktor(t) }))
            .filter(({ f }) => Math.abs(f - 1) > 0.05)
          return (
            <div key={b.id} className={cn('p-3.5 transition-opacity', !pa && 'opacity-55')}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13.5px] leading-snug font-semibold">{b.tittel}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{b.forklaring}</p>
                </div>
                <Switch checked={pa} onCheckedChange={(v) => onVeksleBevis(b.id, v)} aria-label={b.tittel} />
              </div>
              {utslag.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {utslag.map(({ t, f }) => {
                    const Ikon = f > 1 ? ArrowUp : f < 1 ? ArrowDown : Minus
                    return (
                      <span
                        key={t.id}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1',
                          f > 1 ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-rose-200',
                        )}
                      >
                        <Ikon className="size-3" />
                        {t.etikett} ×{f < 0.1 ? f.toFixed(2) : f.toFixed(1)}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Slik regnes det: hver teori starter likt («Et helt annet sted» starter dobbelt så høyt fordi det dekker resten av landet). Så ganges den med faktoren for
        hvert hint som er på, og alt skaleres til 100 %.
      </p>
    </div>
  )
}
