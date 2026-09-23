import { useEffect, useRef, useState, type ReactNode } from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export type Fane = 'teorier' | 'lag' | 'hint' | 'tavla' | 'spill' | 'analyse' | 'stream'
export type Hoyde = 'lav' | 'halv' | 'full'

const FANER: { id: Fane; navn: string }[] = [
  { id: 'teorier', navn: 'Teorier' },
  { id: 'lag', navn: 'Kart' },
  { id: 'hint', navn: 'Hint' },
  { id: 'tavla', navn: 'Tavla' },
  { id: 'spill', navn: 'Spill' },
  { id: 'analyse', navn: 'Analyse' },
  { id: 'stream', navn: 'Stream' },
]

type Props = {
  fane: Fane
  onFane: (f: Fane) => void
  hoyde: Hoyde
  onHoyde: (h: Hoyde) => void
  desktop: boolean
  /** Bredt sidepanel på desktop. Smalt (25rem) når kartet er i bruk. */
  bred: boolean
  onBred: (b: boolean) => void
  /** Bredden på panelet i piksler (desktop) */
  bredde: number
  innhold: Record<Fane, ReactNode>
  antallHint: number
}

function useVinduHoyde() {
  const [h, setH] = useState(() => window.innerHeight)
  useEffect(() => {
    const oppdater = () => setH(window.innerHeight)
    window.addEventListener('resize', oppdater)
    return () => window.removeEventListener('resize', oppdater)
  }, [])
  return h
}

/** Bunnpanel som kan dras på mobil, sidepanel på store skjermer */
export function Ark({ fane, onFane, hoyde, onHoyde, desktop, bred, onBred, bredde, innhold, antallHint }: Props) {
  const vh = useVinduHoyde()
  const hoyder: Record<Hoyde, number> = { lav: 124, halv: Math.round(vh * 0.5), full: vh - 64 }
  const arkRef = useRef<HTMLElement>(null)
  const rulleRef = useRef<HTMLDivElement>(null)

  // Ny fane starter øverst
  useEffect(() => {
    rulleRef.current?.scrollTo({ top: 0 })
  }, [fane])
  const drag = useRef<{ y0: number; h0: number; t0: number; aktiv: boolean } | null>(null)

  const settHoyde = (h: number, animer: boolean) => {
    const el = arkRef.current
    if (!el) return
    el.style.transition = animer ? 'transform .32s cubic-bezier(.2,.8,.2,1)' : 'none'
    el.style.transform = `translateY(${hoyder.full - h}px)`
  }

  useEffect(() => {
    if (!desktop) return settHoyde(hoyder[hoyde], true)
    arkRef.current?.style.removeProperty('transform')
    // settHoyde og hoyder avledes av vh, som er med her
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [desktop, hoyde, vh])

  const ned = (e: React.PointerEvent) => {
    drag.current = { y0: e.clientY, h0: hoyder[hoyde], t0: performance.now(), aktiv: false }
  }
  const flytt = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const dy = e.clientY - d.y0
    if (!d.aktiv && Math.abs(dy) < 8) return
    if (!d.aktiv) {
      d.aktiv = true
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
    settHoyde(Math.min(hoyder.full, Math.max(hoyder.lav - 40, d.h0 - dy)), false)
  }
  const opp = (e: React.PointerEvent) => {
    const d = drag.current
    drag.current = null
    if (!d?.aktiv) return
    const dy = e.clientY - d.y0
    const fart = dy / Math.max(1, performance.now() - d.t0) // px per ms, positiv = ned
    const maal = d.h0 - dy - fart * 180
    const naermest = (Object.keys(hoyder) as Hoyde[]).reduce((a, b) => (Math.abs(hoyder[b] - maal) < Math.abs(hoyder[a] - maal) ? b : a))
    onHoyde(naermest)
    settHoyde(hoyder[naermest], true)
  }

  return (
    <aside
      ref={arkRef}
      className={cn(
        'fixed z-[1001] flex flex-col bg-background shadow-[0_-10px_40px_rgb(0_0_0/0.12)]',
        desktop ? 'top-3 bottom-3 left-3 rounded-3xl border transition-[width] duration-300 ease-out' : 'inset-x-0 bottom-0 rounded-t-3xl border-t',
      )}
      style={desktop ? { width: bredde } : { height: hoyder.full }}
      aria-label="Panel"
    >
      <Tabs
        value={fane}
        onValueChange={(v) => {
          onFane(v as Fane)
          if (!desktop && hoyde === 'lav') onHoyde('halv')
        }}
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        <div
          className={cn('shrink-0 border-b px-3 pb-2.5', desktop ? 'pt-3' : 'touch-none pt-2')}
          onPointerDown={desktop ? undefined : ned}
          onPointerMove={desktop ? undefined : flytt}
          onPointerUp={desktop ? undefined : opp}
          onPointerCancel={desktop ? undefined : opp}
        >
          {!desktop && (
            <button
              type="button"
              className="mx-auto -mt-1 mb-1 grid h-7 w-24 place-items-center"
              aria-label="Endre høyde på panelet"
              onClick={() => onHoyde(hoyde === 'lav' ? 'halv' : hoyde === 'halv' ? 'full' : 'lav')}
            >
              <span className="h-1.5 w-11 rounded-full bg-slate-300" />
            </button>
          )}
          <div className="flex items-center gap-2">
          <TabsList className="grid h-11 min-w-0 flex-1 grid-cols-7">
            {FANER.map((f) => (
              <TabsTrigger key={f.id} value={f.id} className="h-full px-0 text-[12px]">
                {f.navn}
                {f.id === 'hint' && <span className="ml-0.5 font-mono text-[10px] text-primary">{antallHint}</span>}
              </TabsTrigger>
            ))}
          </TabsList>
          {desktop && (
            <button
              type="button"
              onClick={() => onBred(!bred)}
              className="grid size-11 shrink-0 place-items-center rounded-xl border bg-white text-slate-600 hover:bg-slate-50"
              aria-label={bred ? 'Gjør panelet smalere' : 'Gjør panelet bredere'}
              title={bred ? 'Gjør panelet smalere' : 'Gjør panelet bredere'}
            >
              {bred ? <PanelLeftClose className="size-5" /> : <PanelLeftOpen className="size-5" />}
            </button>
          )}
          </div>
        </div>
        <div
          ref={rulleRef}
          className="@container min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4"
          // På mobil er arket alltid fullt høyt og skjøvet ned, så bunnen må kunne scrolles opp i synsfeltet
          style={{ paddingBottom: desktop ? 24 : hoyder.full - hoyder[hoyde] + 32 }}
        >
          {FANER.map((f) => (
            <TabsContent key={f.id} value={f.id} className="mt-0">
              {innhold[f.id]}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </aside>
  )
}
