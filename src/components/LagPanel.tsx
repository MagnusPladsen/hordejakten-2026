import { useEffect, useState } from 'react'
import { Check, Crosshair, Search } from 'lucide-react'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tegnrute } from '@/components/Tegnrute'
import { GRUPPER, LAG, LAG_ETTER_ID, MERKELAPP, type LagId } from '@/data/lag'
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

function Seksjon({ tittel, tekst, children }: { tittel: string; tekst?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-4">
      <h3 className="text-[16px] font-semibold">{tittel}</h3>
      {tekst && <p className="mt-0.5 text-[14.5px] leading-relaxed text-muted-foreground">{tekst}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}

export function LagPanel({ aktive, onVeksle, vekter, onVekter, topp, onGaTil, onSjekkPunkt }: Props) {
  const velgForhand = (f: Forhand) => {
    onVekter(f.vekter)
    onVeksle('modell', true)
    f.lag?.forEach((id) => onVeksle(id, true))
  }
  const synlige = LAG.filter((l) => aktive.has(l.id) && l.id !== 'utenfor')

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Kartet</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Velg hva kartet skal vektlegge og hva du vil se. Trykk hvor som helst på kartet for å se kjøretid, vær og hvor godt stedet passer.
        </p>
      </div>

      <Seksjon tittel="1. Velg fokus for det røde kartet" tekst="Rødt på kartet er der kassen passer best med det du velger her. Mørkere rødt passer bedre.">
        <Teorivalg vekter={vekter} onForhand={velgForhand} />
        <BesteOmrader topp={topp} onGaTil={onGaTil} />
        <Accordion type="single" collapsible className="mt-2 border-t">
          <AccordionItem value="avansert" className="border-none">
            <AccordionTrigger className="text-[14.5px] text-muted-foreground">Avansert: bestem selv hvor mye hvert hint teller</AccordionTrigger>
            <AccordionContent>
              <Vekting vekter={vekter} onVekter={onVekter} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Seksjon>

      <Seksjon tittel="2. Hva vil du se på kartet?" tekst="Trykk for å slå av og på.">
        <div className="space-y-4">
          {GRUPPER.map((g) => (
            <div key={g.navn}>
              <p className="text-[14.5px] font-semibold">{g.navn}</p>
              <p className="text-[13px] text-muted-foreground">{g.forklaring}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {g.ider.map((id) => {
                  const l = LAG_ETTER_ID[id]
                  const pa = aktive.has(id)
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={pa}
                      onClick={() => onVeksle(id, !pa)}
                      className={cn(
                        'flex min-h-11 items-center gap-1.5 rounded-full border py-2 pr-3 pl-2 text-[13.5px] font-medium transition-colors',
                        pa ? 'border-slate-900 bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-50',
                      )}
                    >
                      {pa ? <Check className="size-3.5" /> : <Tegnrute tegn={l.tegn[0]} className="size-3" />}
                      {l.navn}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </Seksjon>

      <Seksjon tittel="Hva betyr fargene?" tekst={synlige.length ? 'Forklaring for lagene som er på nå.' : 'Ingen lag er på.'}>
        <div className="divide-y">
          {synlige.map((l) => (
            <div key={l.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-2">
                <p className="text-[14.5px] font-semibold">{l.navn}</p>
                <span className={cn('rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1', MERKELAPP[l.merkelapp].klasse)}>{MERKELAPP[l.merkelapp].tekst}</span>
              </div>
              <ul className="mt-1.5 space-y-1">
                {l.tegn.map((t) => (
                  <li key={t.tekst} className="flex items-center gap-2.5 text-[13.5px]">
                    <Tegnrute tegn={t} />
                    {t.tekst}
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-600">{l.forklaring}</p>
            </div>
          ))}
        </div>
      </Seksjon>

      <SjekkPunkt onSjekk={onSjekkPunkt} />
    </div>
  )
}

function Teorivalg({ vekter, onForhand }: { vekter: Vekter; onForhand: (f: Forhand) => void }) {
  const aktiv = FORHAND.find((f) => JSON.stringify(f.vekter) === JSON.stringify(vekter))?.id
  const [alle, setAlle] = useState(false)
  // Vis de fire første, pluss den valgte hvis den ligger lenger ned
  const synlige = alle ? FORHAND : FORHAND.filter((f, i) => i < 4 || f.id === aktiv)
  return (
    <div className="space-y-1.5" role="radiogroup" aria-label="Fokus">
      {synlige.map((f) => {
        const valgt = aktiv === f.id
        return (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={valgt}
            onClick={() => onForhand(f)}
            className={cn(
              'flex w-full items-start gap-3 rounded-xl border p-2.5 text-left transition-colors',
              valgt ? 'border-primary bg-primary/8' : 'bg-white hover:bg-slate-50',
            )}
          >
            <span className={cn('mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border-2', valgt ? 'border-primary' : 'border-slate-300')}>
              {valgt && <span className="size-2 rounded-full bg-primary" />}
            </span>
            <span className="min-w-0">
              <span className="block text-[14.5px] font-semibold">{f.navn}</span>
              <span className="block text-[13px] leading-snug text-muted-foreground">{f.beskrivelse}</span>
            </span>
          </button>
        )
      })}
      {FORHAND.length > synlige.length || alle ? (
        <button type="button" className="flex min-h-11 w-full items-center px-1 text-[14.5px] font-semibold text-primary" onClick={() => setAlle((a) => !a)}>
          {alle ? 'Vis færre' : `Vis ${FORHAND.length - synlige.length} flere`}
        </button>
      ) : null}
      {!aktiv && <p className="px-1 text-[13px] text-muted-foreground">Egen vekting er i bruk (se Avansert).</p>}
    </div>
  )
}

function BesteOmrader({ topp, onGaTil }: { topp: Punkt[]; onGaTil: (pos: LatLon, zoom?: number) => void }) {
  const [alle, setAlle] = useState(false)
  if (!topp.length) return null
  return (
    <div className="mt-4">
      <p className="text-[14.5px] font-semibold">Beste områder med dette fokuset</p>
      <p className="text-[13px] text-muted-foreground">Trykk for å gå dit på kartet.</p>
      <ol className="mt-1 divide-y">
        {(alle ? topp : topp.slice(0, 3)).map((p, i) => (
          <li key={`${p.lat},${p.lon}`}>
            <button type="button" className="flex w-full items-center gap-3 py-2.5 text-left" onClick={() => onGaTil([p.lat, p.lon], 10)}>
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-red-800 font-mono text-xs font-bold text-white">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <Stedsnavn lat={p.lat} lon={p.lon} />
                <span className="block text-[12px] text-muted-foreground">{p.sek == null ? 'Ukjent kjøretid' : `${formaterTid(p.sek)} fra Oslo`}</span>
              </span>
              <Crosshair className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ol>
      {topp.length > 3 && (
        <button type="button" className="flex min-h-11 w-full items-center text-[14.5px] font-semibold text-primary" onClick={() => setAlle((a) => !a)}>
          {alle ? 'Vis færre' : `Vis alle ${topp.length}`}
        </button>
      )}
    </div>
  )
}

function Vekting({ vekter, onVekter }: { vekter: Vekter; onVekter: (v: Vekter) => void }) {
  const sett = (endring: Partial<Vekter>) => onVekter({ ...vekter, ...endring })
  return (
    <div>
      <p className="text-[13px] leading-relaxed text-muted-foreground">0 % betyr at hintet ikke teller. 100 % betyr at steder som ikke passer, blir helt utelukket.</p>
      <div className="mt-1 divide-y">
        {FAKTORER.map((f) => (
          <div key={f.id} className="py-3">
            <div className="flex items-baseline justify-between gap-2">
              <label className="text-[14.5px] font-semibold" htmlFor={`vekt-${f.id}`}>
                {f.navn}
              </label>
              <span className="font-mono text-xs text-primary">{Math.round(vekter[f.id] * 100)} %</span>
            </div>
            <p className="text-[13px] text-muted-foreground">{f.forklaring}</p>
            <Slider id={`vekt-${f.id}`} className="mt-2.5" min={0} max={100} step={5} value={[vekter[f.id] * 100]} onValueChange={([x]) => sett({ [f.id]: x / 100 })} />
            {f.id === 'kjoretid' && vekter.kjoretid > 0 && (
              <div className="mt-3 space-y-3 rounded-xl bg-slate-50 p-3">
                <div>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Antatt kjøretid</span>
                    <span className="font-mono text-primary">{vekter.timer.toFixed(1).replace('.', ',')} t</span>
                  </div>
                  <Slider className="mt-2" min={1} max={11} step={0.5} value={[vekter.timer]} onValueChange={([x]) => sett({ timer: x })} />
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
    <form onSubmit={sjekk} className="rounded-2xl border bg-card p-4">
      <label htmlFor="sjekk-punkt" className="text-[16px] font-semibold">
        Sjekk et punkt
      </label>
      <p className="mt-0.5 text-[14.5px] text-muted-foreground">Har noen delt koordinater? Lim dem inn, eller en Google Maps-lenke.</p>
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
      {feil && <p className="mt-2 text-xs font-medium text-red-600">Fant ikke gyldige koordinater i Norge.</p>}
    </form>
  )
}
