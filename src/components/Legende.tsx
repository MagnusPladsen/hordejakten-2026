import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { LAG, type LagId } from '@/data/lag'
import { Tegnrute } from '@/components/Tegnrute'
import { cn } from '@/lib/utils'

/** Flytende «Hva ser jeg?»-boks med tegnforklaring for lagene som er på */
export function Legende({ aktive, onMer, className }: { aktive: Set<LagId>; onMer: () => void; className?: string }) {
  const [apen, setApen] = useState(false)
  const synlige = LAG.filter((l) => aktive.has(l.id) && l.id !== 'utenfor')

  return (
    <div className={cn('w-[min(60vw,15.5rem)] rounded-2xl border bg-white/95 shadow-lg shadow-black/5 backdrop-blur', className)}>
      <button type="button" onClick={() => setApen((a) => !a)} className="flex w-full items-center justify-between gap-2 px-3 pt-2.5 pb-2" aria-expanded={apen}>
        <span className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Hva ser jeg?</span>
        <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', apen && 'rotate-180')} />
      </button>
      <div className="max-h-[40vh] overflow-y-auto px-3 pb-3">
        {synlige.length === 0 && <p className="text-xs text-muted-foreground">Ingen kartlag er på.</p>}
        {!apen && (
          <ul className="space-y-1.5">
            {synlige.map((l) => (
              <li key={l.id} className="flex items-center gap-2 text-xs font-medium">
                <Tegnrute tegn={l.tegn[0]} />
                <span className="truncate">{l.navn}</span>
              </li>
            ))}
          </ul>
        )}
        {apen && (
          <div className="space-y-3">
            {synlige.map((l) => (
              <div key={l.id}>
                <p className="text-xs font-semibold">{l.navn}</p>
                <ul className="mt-1 space-y-1">
                  {l.tegn.map((t) => (
                    <li key={t.tekst} className="flex items-center gap-2 text-[11.5px] leading-tight text-slate-600">
                      <Tegnrute tegn={t} />
                      {t.tekst}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <button type="button" onClick={onMer} className="text-xs font-semibold text-primary">
              Mer forklaring →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
