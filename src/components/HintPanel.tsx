import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Crosshair, ExternalLink, Link2, MapPinned } from 'lucide-react'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bokstavord } from '@/components/Bokstavord'
import { BESTE_KODER, BOKSTAVER, FOLK_TROR, HINT, KODER, SIKRE_FAKTA, SJANSE, STATUS, STEDER, TEORIER, type Hint } from '@/data/innhold'
import type { LatLon } from '@/lib/geo'
import { cn } from '@/lib/utils'

const FILTRE = [
  { id: 'alle', navn: 'Alle', test: () => true },
  { id: 'bekreftet', navn: 'Bekreftet', test: (h: Hint) => h.status === 'bekreftet' || h.status === 'lost' },
  { id: 'ikke', navn: 'Ikke bekreftet', test: (h: Hint) => h.status === 'tolkning' || h.status === 'usikker' || h.status === 'apen' },
  { id: 'sted', navn: 'Om stedet', test: (h: Hint) => !!h.lag?.length },
] as const

const STATUSKANT: Record<Hint['status'], string> = {
  lost: 'border-l-emerald-400',
  bekreftet: 'border-l-sky-400',
  tolkning: 'border-l-amber-400',
  usikker: 'border-l-slate-300',
  apen: 'border-l-red-400',
}

export function HintPanel({
  onVisPaKart,
  onGaTil,
  apneHint,
}: {
  onVisPaKart: (h: Hint) => void
  onGaTil: (pos: LatLon, zoom?: number) => void
  apneHint?: { id: string; n: number } | null
}) {
  const [filter, setFilter] = useState<(typeof FILTRE)[number]['id']>('alle')
  const [markert, setMarkert] = useState<string | null>(null)
  const tidtaker = useRef<number | undefined>(undefined)
  const liste = HINT.filter(FILTRE.find((f) => f.id === filter)!.test)

  // Hopp til et hint-kort og blink det kort, så man ser hvilket det var
  const [kopiert, setKopiert] = useState<string | null>(null)
  const kopierLenke = (id: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set('fane', 'hint')
    url.searchParams.set('hint', id)
    navigator.clipboard?.writeText(url.toString()).catch(() => {})
    window.history.replaceState(null, '', url)
    setKopiert(id)
    window.setTimeout(() => setKopiert((k) => (k === id ? null : k)), 1800)
  }

  const gaTilHint = (id: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set('fane', 'hint')
    url.searchParams.set('hint', id)
    window.history.replaceState(null, '', url)
    setFilter('alle')
    setMarkert(id)
    requestAnimationFrame(() => document.getElementById(`hint-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
    window.clearTimeout(tidtaker.current)
    tidtaker.current = window.setTimeout(() => setMarkert(null), 2200)
  }

  // Åpnet fra en markør på kartet: vent til fanen er tegnet, så hopp til kortet
  useEffect(() => {
    if (!apneHint) return
    const t = window.setTimeout(() => gaTilHint(apneHint.id), 350)
    return () => window.clearTimeout(t)
    // gaTilHint er stabil nok; vi vil bare reagere på nye åpninger
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [apneHint])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Hint og koder</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Alt vi vet så langt. Hvert hint sier hva vi har sett, og hva det betyr for hvor kassen står.
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {(Object.keys(STATUS) as Hint['status'][]).map((st) => (
            <span key={st} className={cn('rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1', STATUS[st].klasse)}>
              {STATUS[st].tekst}
            </span>
          ))}
        </div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          Bekreftet betyr at vi vet at det er sagt eller sett. Hva det betyr kan likevel være tolkning. Tolkning er noens forklaring, Usikker er rykter, og Uløst er ikke knekt ennå.
        </p>
      </div>
      <section className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 p-4">
        <h3 className="text-[16px] font-semibold">Dette vet vi sikkert</h3>
        <ul className="mt-2 space-y-2">
          {SIKRE_FAKTA.map((f) => (
            <li key={f} className="flex items-start gap-2 text-[14.5px] leading-snug">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              {f}
            </li>
          ))}
        </ul>
      </section>
      <Oppsummering onGaTil={onGaTil} onHint={gaTilHint} />
      <p className="pt-2 text-[12px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Alle hint</p>
      <div className="sticky -top-4 z-10 -mx-4 flex flex-wrap gap-1.5 border-b bg-background/95 px-4 py-2.5 backdrop-blur">
        {FILTRE.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              'min-h-11 rounded-full border px-3.5 py-2 text-[13.5px] font-semibold transition-colors',
              filter === f.id ? 'border-slate-900 bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50',
            )}
          >
            {f.navn} <span className="opacity-60">{HINT.filter(f.test).length}</span>
          </button>
        ))}
      </div>
      <div className="grid items-start gap-2.5 @3xl:grid-cols-2">
        {liste.map((h) => (
          <article
            key={h.id}
            id={`hint-${h.id}`}
            className={cn('scroll-mt-4 rounded-2xl border border-l-4 bg-card p-4 transition-shadow duration-500', STATUSKANT[h.status], markert === h.id && 'ring-4 ring-primary/40')}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[16px] leading-snug font-semibold">{h.tittel}</h3>
              <span className={cn('shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1', STATUS[h.status].klasse)}>{STATUS[h.status].tekst}</span>
            </div>
            <p className="mt-2 text-[14.5px] leading-relaxed text-slate-600">{h.tekst}</p>
            <p className="mt-2 text-[14.5px] leading-relaxed">
              <span className="font-semibold text-primary">Betyr: </span>
              {h.betydning}
            </p>
            {h.kompass && <Kompass />}
            {h.anagram && <Anagram />}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[12px] text-muted-foreground">
                {h.dato && `${h.dato} · `}
                {h.kilde}
              </span>
              <div className="flex gap-1.5">
                <Button variant="ghost" size="sm" onClick={() => kopierLenke(h.id)} aria-label={`Kopier lenke til «${h.tittel}»`}>
                  <Link2 /> {kopiert === h.id ? 'Kopiert!' : 'Lenke'}
                </Button>
                {h.lenke && (
                  <Button asChild variant="outline" size="sm">
                    <a href={h.lenke} target="_blank" rel="noopener">
                      Åpne <ExternalLink />
                    </a>
                  </Button>
                )}
                {h.lag && (
                  <Button size="sm" onClick={() => onVisPaKart(h)}>
                    <MapPinned /> Vis på kartet
                  </Button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

/** Skisse av kassen sett ovenfra: kamera 41° (NØ) filmer mot ca. 221°, skiltet står VNV og peker 118–120° mot kassen */
function Kompass() {
  const pil = (grader: number, r: number) => {
    const a = ((grader - 90) * Math.PI) / 180
    return [100 + r * Math.cos(a), 100 + r * Math.sin(a)]
  }
  const [kx, ky] = pil(41, 64)
  const [kpx, kpy] = pil(41, 44)
  const [sx, sy] = pil(298, 62)
  const [spx, spy] = pil(298, 30)
  const [bx, by] = pil(298, 80)
  return (
    <figure className="mt-3 rounded-xl bg-slate-50 p-3">
      <svg viewBox="0 0 200 200" className="mx-auto block w-full max-w-[230px]" role="img" aria-label="Kompass-skisse av kassen">
        <circle cx="100" cy="100" r="86" fill="#fff" stroke="#cbd5e1" />
        {Array.from({ length: 36 }, (_, i) => {
          const [x1, y1] = pil(i * 10, i % 9 === 0 ? 76 : 81)
          const [x2, y2] = pil(i * 10, 86)
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth={i % 9 === 0 ? 1.6 : 0.8} />
        })}
        {[['N', 0], ['Ø', 90], ['S', 180], ['V', 270]].map(([t, g]) => {
          const [x, y] = pil(g as number, 66)
          return (
            <text key={t} x={x} y={y + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a">
              {t}
            </text>
          )
        })}
        <line x1={bx} y1={by} x2={sx} y2={sy} stroke="#16a34a" strokeWidth="2" strokeDasharray="4 4" />
        <line x1={sx} y1={sy} x2={spx} y2={spy} stroke="#ea580c" strokeWidth="3" markerEnd="url(#pilspiss)" />
        <rect x={sx - 7} y={sy - 4} width="14" height="8" rx="2" fill="#ea580c" />
        <line x1={kx} y1={ky} x2={kpx} y2={kpy} stroke="#0284c7" strokeWidth="2" markerEnd="url(#pilspiss-bla)" />
        <circle cx={kx} cy={ky} r="5" fill="#0284c7" />
        <rect x="88" y="90" width="24" height="20" rx="3" fill="#0f172a" transform="rotate(-17 100 100)" />
        <defs>
          <marker id="pilspiss" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0 0 10 5 0 10z" fill="#ea580c" />
          </marker>
          <marker id="pilspiss-bla" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0 0 10 5 0 10z" fill="#0284c7" />
          </marker>
        </defs>
      </svg>
      <figcaption className="mt-2 space-y-1 text-xs text-slate-600">
        <p className="flex items-center gap-2"><span className="size-2.5 rounded-sm bg-orange-600" /> Skiltet står vest-nordvest og peker 118–120° mot kassen</p>
        <p className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-sky-600" /> Kameraet står 41° (nordøst) og filmer mot ca. 221°</p>
        <p className="flex items-center gap-2"><span className="h-0.5 w-2.5 bg-green-600" /> Veien inn kommer trolig fra vest-nordvest</p>
      </figcaption>
    </figure>
  )
}

/** Sjekker om et ord kan lages av de bekreftede bokstavene (hver bokstav én gang) */
function Anagram() {
  const [ord, setOrd] = useState('')
  const { brukt, mangler } = useMemo(() => {
    const igjen = [...BOKSTAVER]
    const brukt = new Set<number>()
    const mangler: string[] = []
    for (const tegn of ord.toUpperCase().replace(/[^A-ZÆØÅ]/g, '')) {
      const i = igjen.findIndex((b, j) => b === tegn && !brukt.has(j))
      if (i < 0) mangler.push(tegn)
      else brukt.add(i)
    }
    return { brukt, mangler }
  }, [ord])
  const lengde = ord.replace(/[^A-Za-zÆØÅæøå]/g, '').length

  return (
    <div className="mt-3 rounded-xl bg-slate-50 p-3">
      <div className="flex flex-wrap gap-1.5">
        {BOKSTAVER.map((b, i) => (
          <span
            key={i}
            className={cn(
              'grid h-9 w-8 place-items-center rounded-lg border bg-white font-mono text-sm font-bold transition-colors',
              brukt.has(i) && 'border-primary bg-primary text-primary-foreground',
            )}
          >
            {b}
          </span>
        ))}
      </div>
      <Input className="mt-3 bg-white font-mono uppercase" placeholder="Prøv et ord, f.eks. NORHEIMSUND" value={ord} onChange={(e) => setOrd(e.target.value)} />
      {lengde > 0 && (
        <p className={cn('mt-2 text-xs font-medium', mangler.length ? 'text-red-600' : 'text-emerald-700')}>
          {mangler.length
            ? `Mangler: ${mangler.join(' ')} (kan komme i senere bokstaver)`
            : lengde === BOKSTAVER.length
              ? 'Bruker alle bokstavene!'
              : `Går opp. ${BOKSTAVER.length - lengde} bokstaver til overs.`}
        </p>
      )}
    </div>
  )
}

/** Kort oppsummert: alle kodekandidater og hva folk tror */
function HintLenker({ ider, onHint }: { ider?: string[]; onHint: (id: string) => void }) {
  if (!ider?.length) return null
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {ider.map((id) => {
        const h = HINT.find((x) => x.id === id)
        if (!h) return null
        return (
          <button
            key={id}
            type="button"
            onClick={() => onHint(id)}
            className="min-h-10 max-w-full truncate rounded-lg bg-slate-100 px-2.5 py-2 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-200"
          >
            → {h.tittel}
          </button>
        )
      })}
    </div>
  )
}

function Oppsummering({ onGaTil, onHint }: { onGaTil: (pos: LatLon, zoom?: number) => void; onHint: (id: string) => void }) {
  const posFor = (f: (typeof FOLK_TROR)[number]) => f.pos ?? [...STEDER, ...TEORIER].find((s) => s.id === f.fokus)?.pos
  return (
    <div className="space-y-3">
      <section className="rounded-2xl border-2 border-primary/40 bg-card p-4">
        <h3 className="text-[16px] font-semibold">Mest sannsynlige koder</h3>
        <p className="mt-0.5 text-[13px] text-muted-foreground">3 låser: 2 hengelåser med 4 siffer på pengeboksen, og 1 elektronisk lås med 5 siffer på døra for å slippe ut Anja. Vår beste gjetning:</p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {BESTE_KODER.map((b) => (
            <div key={b.las} className="rounded-xl bg-slate-50 p-3">
              <p className="text-[12px] font-semibold tracking-wider text-muted-foreground uppercase">{b.las}</p>
              <p className={cn('mt-1 font-mono font-bold tracking-wider', b.kode.length > 4 ? 'text-base' : 'text-2xl')}>{b.kode}</p>
              <p className="mt-1.5 text-[13.5px] leading-snug text-slate-600">{b.hvorfor}</p>
              {b.reserve && <p className="mt-1.5 text-[13.5px] leading-snug font-medium text-slate-800">Reserve: {b.reserve}</p>}
            </div>
          ))}
        </div>
      </section>
      <Accordion type="multiple" className="rounded-2xl border bg-card px-4">
        <AccordionItem value="koder">
          <AccordionTrigger className="py-3.5">
            <Tittel tittel="Alle koder" tekst={`${KODER.length} kandidater, sortert etter hvor sannsynlige de er`} />
          </AccordionTrigger>
          <AccordionContent>
        <ul className="divide-y">
          {[...KODER].sort((a, b) => ['hoy', 'middels', 'lav'].indexOf(a.sjanse) - ['hoy', 'middels', 'lav'].indexOf(b.sjanse)).map((k) => (
            <li key={k.kode} className="flex items-start gap-3 py-2.5">
              <div className="w-14 shrink-0">
                <p className="font-mono text-base font-semibold tracking-wider">{k.kode}</p>
                <span className={cn('mt-1 inline-block rounded px-1 py-px text-[11px] font-bold tracking-wide uppercase', SJANSE[k.sjanse].klasse)}>{SJANSE[k.sjanse].tekst}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] leading-snug text-slate-600">{k.kilde}</p>
                <HintLenker ider={k.hint} onHint={onHint} />
              </div>
              <span className={cn('shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1', STATUS[k.status].klasse)}>{STATUS[k.status].tekst}</span>
            </li>
          ))}
        </ul>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="bokstaver">
          <AccordionTrigger className="py-3.5">
            <Tittel tittel="Bokstavene: alle ord og teorier" tekst={`${BOKSTAVER.join(' ')}: teorier, stedsnavn og alle ord de kan bli`} />
          </AccordionTrigger>
          <AccordionContent>
            <Bokstavord onGaTil={onGaTil} lenker={(ider) => <HintLenker ider={ider} onHint={onHint} />} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="folk" className="border-none">
          <AccordionTrigger className="py-3.5">
            <Tittel tittel="Hva folk tror" tekst={`${FOLK_TROR.length} teorier og tips fra chatten, Discord og default.no`} />
          </AccordionTrigger>
          <AccordionContent>
        <ul className="divide-y">
          {FOLK_TROR.map((f) => {
            const pos = posFor(f)
            return (
              <li key={f.tekst} className="flex items-start gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-semibold">{f.tekst}</p>
                  <p className="text-[13.5px] leading-snug text-slate-600">{f.hvem}</p>
                  <HintLenker ider={f.hint} onHint={onHint} />
                </div>
                {pos && (
                  <Button variant="outline" size="icon-sm" onClick={() => onGaTil(pos, 10)} aria-label={`Vis ${f.tekst} på kartet`}>
                    <Crosshair />
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

function Tittel({ tittel, tekst }: { tittel: string; tekst: string }) {
  return (
    <span className="min-w-0">
      <span className="block text-[16px] font-semibold">{tittel}</span>
      <span className="block text-xs font-normal text-muted-foreground">{tekst}</span>
    </span>
  )
}
