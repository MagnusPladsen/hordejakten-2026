import { useEffect, useMemo, useState } from 'react'
import { Crosshair, Shuffle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { LatLon } from '@/lib/geo'
import { cn } from '@/lib/utils'

type Data = {
  bokstaver: string
  fasit: string
  hele_en: string[]
  hele_no: string[]
  ord_no: string[]
  ord_en: string[]
  steder: { navn: string; pos: LatLon; type: string }[]
  alle_ord: string[]
}

const telle = (s: string) => {
  const m = new Map<string, number>()
  for (const c of s) m.set(c, (m.get(c) ?? 0) + 1)
  return m
}

/** Finner en tilfeldig kombinasjon av hele ord som bruker alle bokstavene nøyaktig én gang */
function tilfeldigKombinasjon(bokstaver: string, ord: string[]): string[] | null {
  const liste = [...ord].sort(() => Math.random() - 0.5)
  const start = Date.now()
  const sok = (rest: Map<string, number>, valgt: string[]): string[] | null => {
    if ([...rest.values()].every((v) => v === 0)) return valgt
    if (valgt.length >= 4 || Date.now() - start > 400) return null
    for (const o of liste) {
      const c = telle(o)
      if ([...c].every(([k, v]) => (rest.get(k) ?? 0) >= v)) {
        const ny = new Map(rest)
        for (const [k, v] of c) ny.set(k, ny.get(k)! - v)
        const r = sok(ny, [...valgt, o])
        if (r) return r
      }
    }
    return null
  }
  return sok(telle(bokstaver), [])
}

function Brikke({ children, uthevet }: { children: React.ReactNode; uthevet?: boolean }) {
  return (
    <span className={cn('inline-block rounded-md border px-2 py-1 font-mono text-[13px] font-semibold tracking-wide', uthevet ? 'border-primary bg-primary/10' : 'bg-white')}>
      {children}
    </span>
  )
}

/** Tavla 25.09: «THILPRTE OESHF». Alle ord og kombinasjoner, pluss en generator */
export function Anagram({ onGaTil }: { onGaTil: (pos: LatLon, zoom?: number) => void }) {
  const [data, setData] = useState<Data | null>(null)
  const [kombo, setKombo] = useState<string[] | null>(null)
  const [eget, setEget] = useState('')

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/shoplifter.json`)
      .then((r) => r.json() as Promise<Data>)
      .then(setData)
      .catch(() => setData(null))
  }, [])

  const sjekk = useMemo(() => {
    if (!data) return null
    const q = eget.toUpperCase().replace(/[^A-ZÆØÅ]/g, '')
    if (!q) return null
    const pott = telle(data.bokstaver)
    const c = telle(q)
    const mangler = [...c].filter(([k, v]) => (pott.get(k) ?? 0) < v).map(([k, v]) => k.repeat(v - (pott.get(k) ?? 0)))
    const rest = [...pott].map(([k, v]) => k.repeat(Math.max(0, v - (c.get(k) ?? 0)))).join('')
    return { ok: mangler.length === 0, mangler: mangler.join(''), rest }
  }, [eget, data])

  if (!data) return <p className="text-sm text-muted-foreground">Laster ord …</p>

  const lag = () => setKombo(tilfeldigKombinasjon(data.bokstaver, data.alle_ord))

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-50 p-3">
        <p className="text-[13px] text-muted-foreground">Bokstavene på tavla 25.09</p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {[...data.bokstaver].map((b, i) => (
            <Brikke key={i}>{b}</Brikke>
          ))}
        </div>
        <p className="mt-2 text-[14px]">
          Går nøyaktig opp i <b>{data.fasit}</b>, trolig en hilsen til BobTheShoplifter på Discord, som har laget default.no.
        </p>
      </div>

      <div className="rounded-xl border-2 border-primary/40 p-3">
        <p className="text-[15px] font-semibold">Generator</p>
        <p className="text-[13px] text-muted-foreground">Trykk for å stokke bokstavene til en ny kombinasjon av hele ord (norsk og engelsk). Alle 13 bokstavene brukes nøyaktig én gang.</p>
        <Button className="mt-2.5 w-full" onClick={lag}>
          <Shuffle /> Lag en ny kombinasjon
        </Button>
        {kombo && (
          <p className="mt-3 text-center font-mono text-xl font-bold tracking-wider" aria-live="polite">
            {kombo.join(' ')}
          </p>
        )}
        {kombo === null && <p className="mt-2 text-center text-[13px] text-muted-foreground">Trykk på knappen for å starte.</p>}
        <label className="mt-4 block text-[13.5px] font-semibold" htmlFor="anagram-eget">
          Test et eget ord
        </label>
        <Input id="anagram-eget" className="mt-1 font-mono uppercase" placeholder="f.eks. PRESTHOLT" value={eget} onChange={(e) => setEget(e.target.value)} />
        {sjekk && (
          <p className={cn('mt-1.5 text-[13.5px]', sjekk.ok ? 'text-emerald-700' : 'text-red-700')}>
            {sjekk.ok ? `Passer. Bokstaver igjen: ${sjekk.rest || 'ingen, det går nøyaktig opp!'}` : `Passer ikke. Mangler: ${sjekk.mangler}`}
          </p>
        )}
      </div>

      <div>
        <p className="text-[14px] font-semibold">Hele kombinasjoner (engelsk)</p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {data.hele_en.slice(0, 24).map((f) => (
            <Brikke key={f}>{f}</Brikke>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[14px] font-semibold">Hele kombinasjoner (norsk)</p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {data.hele_no.slice(0, 24).map((f) => (
            <Brikke key={f}>{f}</Brikke>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[14px] font-semibold">Lengste ord</p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {[...data.ord_no.slice(0, 14), ...data.ord_en.slice(0, 10)].map((o) => (
            <Brikke key={o}>{o}</Brikke>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[14px] font-semibold">Stedsnavn i Norge som kan staves</p>
        <p className="text-[12.5px] text-muted-foreground">Trykk for å se stedet på kartet.</p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {data.steder.slice(0, 20).map((s) => (
            <button key={s.navn + s.pos.join()} type="button" onClick={() => onGaTil(s.pos, 12)} className="inline-flex min-h-9 items-center gap-1 rounded-md border bg-white px-2 font-mono text-[13px] font-semibold hover:bg-slate-50">
              <Crosshair className="size-3" /> {s.navn}
            </button>
          ))}
        </div>
      </div>
      <p className="text-[12px] text-muted-foreground">Ordlister: LibreOffice nb_NO og OpenSubtitles-frekvens (norsk), Google 20k (engelsk). Stedsnavn: GeoNames.</p>
    </div>
  )
}
