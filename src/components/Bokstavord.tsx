import { useEffect, useMemo, useState } from 'react'
import { Crosshair } from 'lucide-react'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BOKSTAV_LESNINGER, BOKSTAVER, type Lesning } from '@/data/innhold'
import type { LatLon } from '@/lib/geo'
import { cn } from '@/lib/utils'

type Sted = {
  navn: string
  lengde: number
  antall: number
  pos: LatLon
  teori: string | null
  km: number | null
  rest: string
  restOrd: string[]
}

type Data = { kilde: string; alleTi: string[]; ord: string[]; lange: string[]; steder: Sted[] }

const STYRKE: Record<Lesning['styrke'], { tekst: string; klasse: string }> = {
  sterk: { tekst: 'Sterk', klasse: 'bg-emerald-600 text-white' },
  middels: { tekst: 'Middels', klasse: 'bg-amber-500 text-white' },
  svak: { tekst: 'Svak', klasse: 'bg-slate-300 text-slate-700' },
}

function Ordbrikke({ children, uthevet }: { children: React.ReactNode; uthevet?: boolean }) {
  return (
    <span className={cn('inline-block rounded-md border px-2 py-1 font-mono text-[13px] font-semibold tracking-wide', uthevet ? 'border-primary bg-primary/10' : 'bg-white')}>
      {children}
    </span>
  )
}

/** Alt som kan staves med vervebokstavene: teorier, stedsnavn og ord */
export function Bokstavord({ onGaTil, lenker }: { onGaTil: (pos: LatLon, zoom?: number) => void; lenker: (ider: string[]) => React.ReactNode }) {
  const [data, setData] = useState<Data | null>(null)
  const [sok, setSok] = useState('')

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/bokstaver.json`)
      .then((r) => r.json() as Promise<Data>)
      .then(setData)
      .catch(() => setData(null))
  }, [])

  const filtrer = useMemo(() => {
    const q = sok.trim().toUpperCase()
    return (liste: string[]) => (q ? liste.filter((x) => x.toUpperCase().includes(q)) : liste)
  }, [sok])

  // Mest sannsynlige områder først, samme rekkefølge som i Teorier-fanen
  const REKKE = ['Løten/Elverum', 'Rena/Åmot', 'Solør', 'Ringsaker', 'Gjøvik/Toten', 'Røros', 'Valdres', 'Agder', 'Hardanger']
  const iOmrader = (data?.steder.filter((s) => s.teori) ?? []).sort((a, b) => REKKE.indexOf(a.teori!) - REKKE.indexOf(b.teori!))
  const andreSteder = data?.steder.filter((s) => !s.teori) ?? []

  return (
    <div className="space-y-4">
      <p className="text-[13.5px] leading-relaxed text-slate-600">
        Bokstavene fra «Verv en venn»: <b className="font-mono">{BOKSTAVER.join(' ')}</b>. Ikke i riktig rekkefølge, og hver bokstav kan bare brukes én gang.
        Mellomrom er lov.
      </p>

      <div>
        <p className="text-[14.5px] font-semibold">Teorier</p>
        <ul className="mt-1 divide-y">
          {BOKSTAV_LESNINGER.map((b) => (
            <li key={b.ord} className="py-2.5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-mono text-[15px] font-semibold tracking-wide">{b.ord}</p>
                <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[11px] font-bold uppercase', STYRKE[b.styrke].klasse)}>{STYRKE[b.styrke].tekst}</span>
              </div>
              <p className="mt-0.5 text-[13.5px] leading-snug text-slate-600">{b.forklaring}</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {lenker(b.hint)}
                {b.pos && (
                  <Button variant="outline" size="sm" className="mt-1.5" onClick={() => onGaTil(b.pos!, 11)}>
                    <Crosshair /> Vis på kartet
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {!data && <p className="text-[13px] text-muted-foreground">Laster ordlister …</p>}
      {data && (
        <>
          <Input placeholder="Søk i ord og stedsnavn …" value={sok} onChange={(e) => setSok(e.target.value)} className="font-mono uppercase" aria-label="Søk i ord og stedsnavn" />
          <Accordion type="multiple" className="rounded-xl border bg-slate-50 px-3">
            <AccordionItem value="steder-omrader">
              <AccordionTrigger className="py-3 text-[14.5px] font-semibold">Stedsnavn i teori-områdene ({iOmrader.length})</AccordionTrigger>
              <AccordionContent>
                <p className="mb-2 text-[13px] text-muted-foreground">Stedsnavn som kan staves med bokstavene og ligger i et av teori-områdene. Resten er bokstavene som blir til overs.</p>
                <ul className="divide-y">
                  {iOmrader
                    .filter((s) => filtrer([s.navn]).length)
                    .map((s) => (
                      <li key={s.navn + s.pos.join()} className="flex items-center gap-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[14.5px] font-semibold">
                            {s.navn} <span className="font-normal text-muted-foreground">· nær {s.teori}</span>
                          </p>
                          <p className="font-mono text-[12.5px] text-slate-600">
                            Rest: {s.rest || '–'}
                            {s.restOrd.length > 0 && ` → ${s.restOrd.join(', ')}`}
                          </p>
                        </div>
                        <Button variant="outline" size="icon-sm" onClick={() => onGaTil(s.pos, 12)} aria-label={`Vis ${s.navn} på kartet`}>
                          <Crosshair />
                        </Button>
                      </li>
                    ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="alle-ti">
              <AccordionTrigger className="py-3 text-[14.5px] font-semibold">Bruker alle ti bokstavene ({data.alleTi.length})</AccordionTrigger>
              <AccordionContent>
                <p className="mb-2 text-[13px] text-muted-foreground">Setninger på 1–3 ord som bruker nøyaktig alle bokstavene. Vanligste ord først.</p>
                <div className="flex flex-wrap gap-1.5">
                  {filtrer(data.alleTi).map((f) => (
                    <Ordbrikke key={f} uthevet={f === 'HODER MINUS' || f.includes('MINUS')}>
                      {f}
                    </Ordbrikke>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="lange">
              <AccordionTrigger className="py-3 text-[14.5px] font-semibold">Lengste ord ({data.lange.length})</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-1.5">
                  {filtrer(data.lange).map((w) => (
                    <Ordbrikke key={w}>{w}</Ordbrikke>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="ord">
              <AccordionTrigger className="py-3 text-[14.5px] font-semibold">Alle vanlige ord ({data.ord.length})</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-1.5">
                  {filtrer(data.ord).map((w) => (
                    <Ordbrikke key={w}>{w}</Ordbrikke>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="steder" className="border-none">
              <AccordionTrigger className="py-3 text-[14.5px] font-semibold">Alle andre stedsnavn ({andreSteder.length})</AccordionTrigger>
              <AccordionContent>
                <ul className="divide-y">
                  {andreSteder
                    .filter((s) => filtrer([s.navn]).length)
                    .map((s) => (
                      <li key={s.navn + s.pos.join()} className="flex items-center gap-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[14.5px] font-semibold">{s.navn}</p>
                          <p className="font-mono text-[12.5px] text-slate-600">
                            Rest: {s.rest || '–'}
                            {s.restOrd.length > 0 && ` → ${s.restOrd.join(', ')}`}
                          </p>
                        </div>
                        <Button variant="outline" size="icon-sm" onClick={() => onGaTil(s.pos, 12)} aria-label={`Vis ${s.navn} på kartet`}>
                          <Crosshair />
                        </Button>
                      </li>
                    ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <p className="text-[12px] text-muted-foreground">{data.kilde}</p>
        </>
      )}
    </div>
  )
}
