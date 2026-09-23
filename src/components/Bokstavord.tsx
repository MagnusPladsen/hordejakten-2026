import { useEffect, useMemo, useState } from 'react'
import { Crosshair, Shuffle } from 'lucide-react'

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

type Data = { kilde: string; alleTi: string[]; ord: string[]; alleOrd: string[]; lange: string[]; steder: Sted[] }

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

      {data && <Generator data={data} />}

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

type Modus = 'alle' | 'ord' | 'sted'

/** Trykk for å få et nytt tilfeldig ord eller en setning av bokstavene */
function Generator({ data }: { data: Data }) {
  const [modus, setModus] = useState<Modus>('alle')
  const [resultat, setResultat] = useState<{ tekst: string; rest: string; info?: string } | null>(null)
  const [antall, setAntall] = useState(0)

  const generer = (m: Modus = modus) => {
    const tilfeldig = <T,>(liste: T[]) => liste[Math.floor(Math.random() * liste.length)]
    if (m === 'alle') {
      setResultat({ tekst: tilfeldig(data.alleTi), rest: '' })
    } else if (m === 'ord') {
      const ord = tilfeldig(data.alleOrd.filter((w) => w.length >= 3))
      setResultat({ tekst: ord, rest: restBokstaver(ord) })
    } else {
      const s = tilfeldig(data.steder)
      setResultat({ tekst: s.navn.toUpperCase(), rest: s.rest, info: s.teori ? `nær ${s.teori}` : undefined })
    }
    setAntall((a) => a + 1)
  }

  const valg: { id: Modus; navn: string }[] = [
    { id: 'alle', navn: 'Alle 10 bokstaver' },
    { id: 'ord', navn: 'Ett ord' },
    { id: 'sted', navn: 'Stedsnavn' },
  ]

  return (
    <section className="rounded-2xl border-2 border-primary/40 bg-white p-4">
      <p className="text-[15px] font-semibold">Ordgenerator</p>
      <p className="text-[13px] text-muted-foreground">Trykk for å få et nytt ord eller en setning laget av bokstavene.</p>
      <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1" role="radiogroup" aria-label="Hva skal genereres?">
        {valg.map((v) => (
          <button
            key={v.id}
            type="button"
            role="radio"
            aria-checked={modus === v.id}
            onClick={() => {
              setModus(v.id)
              generer(v.id)
            }}
            className={cn('min-h-11 rounded-lg px-1 text-[13px] font-semibold', modus === v.id ? 'bg-white shadow-sm' : 'text-slate-600')}
          >
            {v.navn}
          </button>
        ))}
      </div>
      <div className="mt-3 grid min-h-24 place-items-center rounded-xl bg-slate-900 px-3 py-4 text-center" aria-live="polite">
        {resultat ? (
          <div key={antall} className="animate-in fade-in zoom-in-95 duration-200">
            <p className="font-mono text-[24px] leading-tight font-bold tracking-wider text-white">{resultat.tekst}</p>
            {(resultat.rest || resultat.info) && (
              <p className="mt-1.5 font-mono text-[13px] text-slate-300">
                {resultat.info && <span>{resultat.info}</span>}
                {resultat.info && resultat.rest && ' · '}
                {resultat.rest && <span>Rest: {resultat.rest}</span>}
              </p>
            )}
          </div>
        ) : (
          <p className="text-[14px] text-slate-400">Trykk på knappen under</p>
        )}
      </div>
      <Button className="mt-3 h-12 w-full text-[15px]" onClick={() => generer()}>
        <Shuffle /> Generer nytt ord
      </Button>
    </section>
  )
}

const BOKSTAVSETT = 'NORHEIMSUD'.split('')

function restBokstaver(ord: string) {
  const igjen = [...BOKSTAVSETT]
  for (const b of ord) {
    const i = igjen.indexOf(b)
    if (i >= 0) igjen.splice(i, 1)
  }
  return igjen.join(' ')
}
