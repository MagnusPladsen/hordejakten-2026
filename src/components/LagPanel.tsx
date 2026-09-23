import { useEffect, useState } from 'react'
import { ChevronDown, Crosshair, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Tegnrute } from '@/components/Tegnrute'
import { LAG, MERKELAPP, type Lag, type LagId } from '@/data/lag'
import { formaterTid, lesKoordinater, type LatLon } from '@/lib/geo'
import { FAKTORER, FORHAND, type Punkt, type Vekter } from '@/lib/modell'
import { stedsnavn } from '@/lib/stedsnavn'
import { cn } from '@/lib/utils'

type Props = {
  aktive: Set<LagId>
  onVeksle: (id: LagId, pa: boolean) => void
  vekter: Vekter
  onVekter: (v: Vekter) => void
  topp: Punkt[]
  onGaTil: (pos: LatLon, zoom?: number) => void
  onSjekkPunkt: (pos: LatLon) => void
}

type Forhand = (typeof FORHAND)[number]

export function LagPanel({ aktive, onVeksle, vekter, onVekter, topp, onGaTil, onSjekkPunkt }: Props) {
  const velgForhand = (f: Forhand) => {
    onVekter(f.vekter)
    f.lag?.forEach((id) => onVeksle(id, true))
  }
  const [apen, setApen] = useState<LagId | null>(null)
  const modell = LAG[0]
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Hvor står kassen?</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Slå kartlag av og på. Trykk på et lag for å se hva fargene betyr. Trykk hvor som helst på kartet for kjøretid og detaljer.
        </p>
      </div>

      <SjekkPunkt onSjekk={onSjekkPunkt} />

      <LagKort lag={modell} pa={aktive.has('modell')} apen={apen === 'modell'} onVeksle={onVeksle} onApne={setApen}>
        <Modell vekter={vekter} onVekter={onVekter} onForhand={velgForhand} topp={topp} onGaTil={onGaTil} />
      </LagKort>

      <div className="space-y-2">
        <p className="pt-2 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Kartlag</p>
        {LAG.slice(1).map((l) => (
          <LagKort key={l.id} lag={l} pa={aktive.has(l.id)} apen={apen === l.id} onVeksle={onVeksle} onApne={setApen} />
        ))}
      </div>
    </div>
  )
}

function LagKort({
  lag,
  pa,
  apen,
  onVeksle,
  onApne,
  children,
}: {
  lag: Lag
  pa: boolean
  apen: boolean
  onVeksle: (id: LagId, pa: boolean) => void
  onApne: (id: LagId | null) => void
  children?: React.ReactNode
}) {
  const m = MERKELAPP[lag.merkelapp]
  return (
    <div className={cn('rounded-2xl border bg-card transition-colors', pa && 'border-slate-300 shadow-sm')}>
      <div className="flex items-center gap-3 p-3 pl-3.5">
        <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => onApne(apen ? null : lag.id)} aria-expanded={apen}>
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-50 ring-1 ring-slate-200">
            <Tegnrute tegn={lag.tegn[0]} className="scale-125" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-[14.5px] font-semibold">{lag.navn}</span>
              <span className={cn('shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1', m.klasse)}>{m.tekst}</span>
            </span>
            <span className="block truncate text-xs text-muted-foreground">{lag.kort}</span>
          </span>
          <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', apen && 'rotate-180')} />
        </button>
        <Switch checked={pa} onCheckedChange={(v) => onVeksle(lag.id, v)} aria-label={`Vis ${lag.navn}`} />
      </div>
      {(apen || children) && (
        <div className={cn('border-t border-dashed px-3.5 pb-3.5', !apen && !children && 'hidden')}>
          {apen && (
            <>
              <p className="mt-3 text-[13px] leading-relaxed text-slate-700">{lag.forklaring}</p>
              <ul className="mt-3 space-y-1.5">
                {lag.tegn.map((t) => (
                  <li key={t.tekst} className="flex items-center gap-2.5 text-[13px]">
                    <Tegnrute tegn={t} />
                    {t.tekst}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-muted-foreground">Kilde: {lag.kilde}</p>
            </>
          )}
          {children}
        </div>
      )}
    </div>
  )
}

function Modell({
  vekter,
  onVekter,
  onForhand,
  topp,
  onGaTil,
}: {
  vekter: Vekter
  onVekter: (v: Vekter) => void
  onForhand: (f: Forhand) => void
  topp: Punkt[]
  onGaTil: (pos: LatLon, zoom?: number) => void
}) {
  const aktivForhand = FORHAND.find((f) => JSON.stringify(f.vekter) === JSON.stringify(vekter))?.id
  const sett = (endring: Partial<Vekter>) => onVekter({ ...vekter, ...endring })

  return (
    <div className="mt-3">
      <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Velg en teori</p>
      <div className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {FORHAND.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onForhand(f)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
              aktivForhand === f.id ? 'border-primary bg-primary text-primary-foreground' : 'bg-white text-slate-700 hover:bg-slate-50',
            )}
          >
            {f.navn}
          </button>
        ))}
      </div>

      <p className="mt-4 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Topp-områder nå</p>
      <ol className="mt-1 divide-y">
        {topp.map((p, i) => (
          <li key={`${p.lat},${p.lon}`}>
            <button type="button" className="flex w-full items-center gap-3 py-2.5 text-left" onClick={() => onGaTil([p.lat, p.lon], 10)}>
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-rose-800 font-mono text-xs font-bold text-white">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <Stedsnavn lat={p.lat} lon={p.lon} />
                <span className="block font-mono text-[11px] text-muted-foreground">
                  {p.lat.toFixed(2)}, {p.lon.toFixed(2)} · {p.sek == null ? '–' : formaterTid(p.sek)}
                </span>
              </span>
              <Crosshair className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ol>

      <p className="mt-4 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Hvor mye skal hvert hint telle?</p>
      <div className="mt-1 divide-y">
        {FAKTORER.map((f) => (
          <div key={f.id} className="py-3">
            <div className="flex items-baseline justify-between gap-2">
              <label className="text-[13.5px] font-semibold" htmlFor={`vekt-${f.id}`}>
                {f.navn}
              </label>
              <span className="font-mono text-xs text-primary">{Math.round(vekter[f.id] * 100)} %</span>
            </div>
            <p className="text-xs text-muted-foreground">{f.forklaring}</p>
            <Slider id={`vekt-${f.id}`} className="mt-2.5" min={0} max={100} step={5} value={[vekter[f.id] * 100]} onValueChange={([x]) => sett({ [f.id]: x / 100 })} />
            {f.id === 'kjoretid' && vekter.kjoretid > 0 && (
              <div className="mt-3 space-y-3 rounded-xl bg-slate-50 p-3">
                <div>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Antatt kjøretid</span>
                    <span className="font-mono text-primary">{vekter.timer.toFixed(1).replace('.', ',')} t</span>
                  </div>
                  <Slider className="mt-2" min={2} max={11} step={0.5} value={[vekter.timer]} onValueChange={([x]) => sett({ timer: x })} />
                </div>
                <div>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Slingringsmonn</span>
                    <span className="font-mono text-primary">± {vekter.slingring.toFixed(2).replace('.', ',')} t</span>
                  </div>
                  <Slider className="mt-2" min={0.5} max={3} step={0.25} value={[vekter.slingring]} onValueChange={([x]) => sett({ slingring: x })} />
                </div>
              </div>
            )}
            {f.id === 'retning' && vekter.retning > 0 && (
              <label className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-xs font-medium">
                Ta med 118° mot sørøst også
                <Switch checked={vekter.retningBegge} onCheckedChange={(v) => sett({ retningBegge: v })} />
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function Stedsnavn({ lat, lon }: { lat: number; lon: number }) {
  // undefined = laster, null = fant ingen navn
  const [navn, setNavn] = useState<string | null | undefined>(undefined)
  useEffect(() => {
    let aktiv = true
    stedsnavn(lat, lon).then((n) => aktiv && setNavn(n))
    return () => {
      aktiv = false
    }
  }, [lat, lon])
  const tekst = navn === undefined ? 'Henter stedsnavn …' : navn ? `Nær ${navn}` : 'Område uten stedsnavn'
  return <span className="block truncate text-sm font-semibold">{tekst}</span>
}

/** Lim inn koordinater fra chatten og se hvordan punktet passer med hintene */
function SjekkPunkt({ onSjekk }: { onSjekk: (pos: LatLon) => void }) {
  const [tekst, setTekst] = useState('')
  const [feil, setFeil] = useState(false)
  const sjekk = (e: React.FormEvent) => {
    e.preventDefault()
    const pos = lesKoordinater(tekst)
    setFeil(!pos)
    if (pos) onSjekk(pos)
  }
  return (
    <form onSubmit={sjekk} className="rounded-2xl border bg-card p-3.5">
      <label htmlFor="sjekk-punkt" className="text-[13.5px] font-semibold">
        Sjekk et punkt
      </label>
      <p className="text-xs text-muted-foreground">Lim inn koordinater eller en Google Maps-lenke.</p>
      <div className="mt-2.5 flex gap-2">
        <Input
          id="sjekk-punkt"
          className="font-mono text-sm"
          placeholder={`61°10'43.8"N 11°15'50.1"E`}
          value={tekst}
          onChange={(e) => {
            setTekst(e.target.value)
            setFeil(false)
          }}
        />
        <Button type="submit" aria-label="Sjekk punktet">
          <Search />
        </Button>
      </div>
      {feil && <p className="mt-2 text-xs font-medium text-rose-600">Fant ikke gyldige koordinater i Norge.</p>}
    </form>
  )
}
