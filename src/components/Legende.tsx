import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'

import { LAG, type LagId } from '@/data/lag'
import { Tegnrute } from '@/components/Tegnrute'
import { cn } from '@/lib/utils'

/** Flytende «Hva ser jeg?»-boks med tegnforklaring for lagene som er på */
/** Liten ×-knapp som skjuler laget. Synlig ved hover på PC, alltid synlig på mobil (ingen hover der). */
function Fjern({ navn, onFjern }: { navn: string; onFjern: () => void }) {
  return (
    <button
      type="button"
      onClick={onFjern}
      aria-label={`Skjul «${navn}» fra kartet`}
      title="Skjul fra kartet"
      className="-my-1 ml-auto grid size-7 shrink-0 place-items-center rounded-full text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
    >
      <X className="size-3.5" />
    </button>
  )
}

export function Legende({ aktive, onMer, onFjern, kompakt, className, stil }: { aktive: Set<LagId>; onMer: () => void; onFjern: (id: LagId) => void; kompakt?: boolean; className?: string; stil?: React.CSSProperties }) {
  const [apen, setApen] = useState(false)
  const synlige = LAG.filter((l) => aktive.has(l.id) && l.id !== 'utenfor')

  return (
    <div style={stil} className={cn('w-[min(60vw,15.5rem)] rounded-2xl border bg-white/95 shadow-lg shadow-black/5 backdrop-blur', className)}>
      <button type="button" onClick={() => setApen((a) => !a)} className="flex min-h-11 w-full items-center justify-between gap-2 px-3" aria-expanded={apen}>
        <span className="text-[12px] font-semibold tracking-[0.1em] text-slate-600 uppercase">
          Hva ser jeg?{kompakt && !apen && synlige.length > 0 && <span className="ml-1 text-primary">({synlige.length})</span>}
        </span>
        <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', apen && 'rotate-180')} />
      </button>
      <div className={cn('max-h-[40vh] overflow-y-auto px-3', kompakt && !apen ? 'hidden' : 'pb-3')}>
        {synlige.length === 0 && <p className="text-[13px] text-muted-foreground">Ingen kartlag er på.</p>}
        {!apen && (
          <ul className="space-y-1.5">
            {synlige.map((l) => (
              <li key={l.id} className="group flex items-center gap-2 text-xs font-medium">
                <Tegnrute tegn={l.tegn[0]} />
                <span className="truncate">{l.navn}</span>
                <Fjern navn={l.navn} onFjern={() => onFjern(l.id)} />
              </li>
            ))}
          </ul>
        )}
        {apen && (
          <div className="space-y-3">
            {synlige.map((l) => (
              <div key={l.id} className="group">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold">{l.navn}</p>
                  <Fjern navn={l.navn} onFjern={() => onFjern(l.id)} />
                </div>
                <ul className="mt-1 space-y-1">
                  {l.tegn.map((t) => (
                    <li key={t.tekst} className="flex items-center gap-2 text-[12px] leading-tight text-slate-600">
                      <Tegnrute tegn={t} />
                      {t.tekst}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <button type="button" onClick={onMer} className="min-h-11 text-[14px] font-semibold text-primary">
              Mer forklaring →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
