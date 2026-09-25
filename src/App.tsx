import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Layers, LocateFixed, Navigation } from 'lucide-react'
import { toast } from 'sonner'

import { Ark, type Fane, type Hoyde } from '@/components/Ark'
import { HintPanel } from '@/components/HintPanel'
import { Kart, type Hoyde891, type Bakgrunn, type KartApi } from '@/components/Kart'
import { LagPanel } from '@/components/LagPanel'
import { Legende } from '@/components/Legende'
import { SpillPanel } from '@/components/SpillPanel'
import { AnalysePanel } from '@/components/AnalysePanel'
import { StreamPanel } from '@/components/StreamPanel'
import { TavlePanel } from '@/components/TavlePanel'
import { TeoriPanel } from '@/components/TeoriPanel'
import { Toaster } from '@/components/ui/sonner'
import { HINT, STEDER, STREAM, TEORIER, type Hint } from '@/data/innhold'
import type { LagId } from '@/data/lag'
import { sannsynligheter, standardBevis, type Modus, type Teori } from '@/data/teorier'
import { posisjonerRundtPeking, type FlyData } from '@/lib/fly'
import type { LatLon } from '@/lib/geo'
import { beregn, FORHAND, toppOmrader, utelukkNokkel, type Kontekst, type Punkt, type Vekter } from '@/lib/modell'
import { cn } from '@/lib/utils'

const BAKGRUNN_REKKE: Bakgrunn[] = ['gra', 'topo', 'satellitt']
const BAKGRUNN_NAVN: Record<Bakgrunn, string> = { gra: 'Gråtonekart', topo: 'Topografisk kart', satellitt: 'Satellittbilde' }

type Drivetime = { punkter: [number, number, number | null, number | null, number][] }

function useMediaQuery(sporring: string) {
  const [treff, setTreff] = useState(() => window.matchMedia(sporring).matches)
  useEffect(() => {
    const mq = window.matchMedia(sporring)
    const oppdater = () => setTreff(mq.matches)
    mq.addEventListener('change', oppdater)
    return () => mq.removeEventListener('change', oppdater)
  }, [sporring])
  return treff
}

export default function App() {
  const desktop = useMediaQuery('(min-width: 1024px)')
  const kart = useRef<KartApi>(null)

  const [punkter, setPunkter] = useState<Punkt[] | null>(null)
  const [norge, setNorge] = useState<GeoJSON.MultiPolygon | null>(null)
  const [flyData, setFlyData] = useState<FlyData | null>(null)
  const [innlandet, setInnlandet] = useState<GeoJSON.MultiPolygon | null>(null)
  const [utelukket, setUtelukket] = useState<[number, number, string][] | null>(null)
  const [hoyde891, setHoyde891] = useState<Hoyde891 | null>(null)
  const [fellesskap891, setFellesskap891] = useState<[number, number][] | null>(null)
  const [kommuner, setKommuner] = useState<GeoJSON.FeatureCollection | null>(null)
  const [aktive, setAktive] = useState<Set<LagId>>(() => new Set<LagId>(['hintmarkorer', 'modell', 'fly', 'skydekke', 'solidag', 'utelukket', 'utenfor']))
  const [vekter, setVekter] = useState<Vekter>(FORHAND[0].vekter)
  const [modus, setModus] = useState<Modus>('alt')
  const [aktiveBevis, setAktiveBevis] = useState<Set<string>>(() => standardBevis('alt'))
  const [bakgrunn, setBakgrunn] = useState<Bakgrunn>('gra')
  // Lenkbare seksjoner: ?fane=hint, og ?fane=hint&hint=<id> for ett bestemt hint
  const FANER_OK: Fane[] = ['teorier', 'lag', 'hint', 'tavla', 'spill', 'analyse', 'stream']
  const startParam = new URLSearchParams(window.location.search)
  const [fane, setFane] = useState<Fane>(() => {
    const f = startParam.get('fane') as Fane | null
    if (f && FANER_OK.includes(f)) return f
    return startParam.get('hint') ? 'hint' : 'teorier'
  })
  // Bredt sidepanel på desktop, til kartet tas i bruk
  const [bred, setBred] = useState(true)
  const [vinduBredde, setVinduBredde] = useState(() => window.innerWidth)
  useEffect(() => {
    const oppdater = () => setVinduBredde(window.innerWidth)
    window.addEventListener('resize', oppdater)
    return () => window.removeEventListener('resize', oppdater)
  }, [])
  const SMAL = 400
  const panelBredde = desktop ? (bred ? Math.max(SMAL, Math.min(900, Math.round(vinduBredde * 0.58), vinduBredde - 480)) : SMAL) : 0
  /** Kartet tas i bruk: smalt panel igjen */
  const tilKartet = useCallback(() => setBred(false), [])
  const [hoyde, setHoyde] = useState<Hoyde>('halv')
  const [feltPos, setFeltPos] = useState<LatLon | null>(null)
  const [minPos, setMinPos] = useState<LatLon | null>(null)
  // Hint som skal åpnes i Hint-fanen (fra en markør på kartet). Telleren gjør at samme hint kan åpnes flere ganger.
  const [apneHint, setApneHint] = useState<{ id: string; n: number } | null>(() => {
    const h = startParam.get('hint')
    return h ? { id: h, n: 1 } : null
  })

  useEffect(() => {
    const base = import.meta.env.BASE_URL
    fetch(`${base}data/drivetime.json`)
      .then((r) => r.json() as Promise<Drivetime>)
      .then((d) => setPunkter(d.punkter.map(([lat, lon, sek, meter, snap]) => ({ lat, lon, sek, meter, snap }))))
      .catch(() => toast.error('Klarte ikke å laste kjøretidsdataene'))
    fetch(`${base}data/norge.json`)
      .then((r) => r.json())
      .then((d) => setNorge(d.geometry))
      .catch(() => {})
    fetch(`${base}data/innlandet.json`)
      .then((r) => r.json())
      .then((d) => setInnlandet(d.geometry))
      .catch(() => {})
    fetch(`${base}data/kommunevurdering.json`)
      .then((r) => r.json())
      .then(setKommuner)
      .catch(() => {})
    fetch(`${base}data/utelukket.json`)
      .then((r) => r.json())
      .then((d) => setUtelukket(d.celler))
      .catch(() => {})
    fetch(`${base}data/hoyde891.json`)
      .then((r) => r.json() as Promise<Hoyde891>)
      .then(setHoyde891)
      .catch(() => {})
    fetch(`${base}data/fellesskap891.json`)
      .then((r) => r.json())
      .then((d) => setFellesskap891(d.celler))
      .catch(() => {})
    fetch(`${base}data/fly_2130.json`)
      .then((r) => r.json() as Promise<FlyData>)
      .then(setFlyData)
      .catch(() => {})
  }, [])

  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('fane', fane)
    if (fane !== 'hint') url.searchParams.delete('hint')
    window.history.replaceState(null, '', url)
  }, [fane])

  const kontekst = useMemo<Kontekst>(
    () => ({
      flyPos: flyData ? posisjonerRundtPeking(flyData) : [],
      innlandet: innlandet ? innlandet.coordinates.map((poly) => poly[0].map(([lon, lat]) => [lat, lon] as LatLon)) : [],
      utelukket: new Set((utelukket ?? []).map(([la, lo]) => utelukkNokkel(la, lo))),
    }),
    [flyData, innlandet, utelukket],
  )
  const resultat = useMemo(() => (punkter ? beregn(punkter, vekter, kontekst) : null), [punkter, vekter, kontekst])
  const prosent = useMemo(() => sannsynligheter(aktiveBevis), [aktiveBevis])
  const topp = useMemo(() => (punkter && resultat ? toppOmrader(punkter, resultat).map((i) => punkter[i]) : []), [punkter, resultat])

  const veksle = useCallback((id: LagId, pa: boolean) => {
    setAktive((a) => {
      const ny = new Set(a)
      if (pa) ny.add(id)
      else ny.delete(id)
      return ny
    })
    if (id === 'felt') setFeltPos(pa ? (kart.current?.sentrum() ?? null) : null)
  }, [])

  const visPaKart = useCallback(
    (h: Hint) => {
      tilKartet()
      for (const id of h.lag ?? []) veksle(id, true)
      // Hint som ikke er bekreftet, vises bare i «Alle hint og tips»
      if ((h.pos || h.fokus) && h.status !== 'bekreftet' && h.status !== 'lost') veksle('hintmarkorer_alle', true)
      const sted = [...STEDER, ...TEORIER].find((s) => s.id === h.fokus)
      if (!desktop) setHoyde('lav')
      setTimeout(() => {
        if (sted) kart.current?.flyTil(sted.pos, 9)
        else if (h.lag?.[0] && h.lag[0] !== 'felt') kart.current?.visLag(h.lag[0])
      }, 60)
    },
    [desktop, veksle, tilKartet],
  )

  const visTeori = useCallback(
    (t: Teori) => {
      tilKartet()
      if (!t.senter) return
      veksle('teoriomrader', true)
      const forhand = FORHAND.find((f) => f.id === t.forhand)
      if (forhand) {
        setVekter(forhand.vekter)
        forhand.lag?.forEach((id) => veksle(id, true))
      }
      if (!desktop) setHoyde('lav')
      kart.current?.flyTil(t.senter, 8)
    },
    [desktop, veksle, tilKartet],
  )

  const gaTil = useCallback(
    (pos: LatLon, zoom?: number) => {
      tilKartet()
      if (!desktop) setHoyde('lav')
      kart.current?.flyTil(pos, zoom)
    },
    [desktop, tilKartet],
  )

  const finnMeg = () => {
    tilKartet()
    if (!navigator.geolocation) return toast.error('Nettleseren støtter ikke posisjon')
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pos: LatLon = [p.coords.latitude, p.coords.longitude]
        setMinPos(pos)
        kart.current?.flyTil(pos, 13)
      },
      () => toast.error('Fikk ikke tilgang til posisjonen din'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const veksleFelt = () => {
    tilKartet()
    const pa = !aktive.has('felt')
    veksle('felt', pa)
    if (pa) {
      const pos = minPos ?? kart.current?.sentrum()
      if (pos) {
        setFeltPos(pos)
        kart.current?.flyTil(pos, 14)
      }
      toast('Dra P-markøren til en parkering', { description: 'Det grønne feltet viser hvor kassen bør ligge: ca. 300° (nordvest) fra bilen, 300–900 m, oppover.' })
    }
  }

  const byttBakgrunn = () => {
    const neste = BAKGRUNN_REKKE[(BAKGRUNN_REKKE.indexOf(bakgrunn) + 1) % BAKGRUNN_REKKE.length]
    setBakgrunn(neste)
    toast(BAKGRUNN_NAVN[neste])
  }

  const venstre = desktop ? '' : 'left-3'
  const venstreStil = desktop ? { left: panelBredde + 28, transition: 'left 300ms ease-out' } : undefined

  return (
    <div className="fixed inset-0 overflow-hidden">
      <Kart
        ref={kart}
        polstring={desktop ? { venstre: 420, bunn: 0 } : { venstre: 0, bunn: Math.round(window.innerHeight * 0.5) }}
        onKartBruk={tilKartet}
        punkter={punkter}
        norge={norge}
        flyData={flyData}
        innlandet={innlandet}
        utelukket={utelukket}
        hoyde891={hoyde891}
        fellesskap891={fellesskap891}
        kommuner={kommuner}
        kontekst={kontekst}
        prosent={prosent}
        resultat={resultat}
        vekter={vekter}
        aktive={aktive}
        bakgrunn={bakgrunn}
        feltPos={feltPos}
        onFeltFlytt={setFeltPos}
        onPopup={() => !desktop && setHoyde('lav')}
        onApneHint={(id) => {
          setFane('hint')
          if (!desktop) setHoyde('full')
          setApneHint((a) => ({ id, n: (a?.n ?? 0) + 1 }))
        }}
        minPos={minPos}
      />

      <header style={venstreStil} className={cn('pointer-events-none fixed top-[calc(env(safe-area-inset-top)+0.75rem)] right-3 z-[1000] flex items-center justify-between gap-2', venstre)}>
        <div className="pointer-events-auto flex items-center gap-2.5 rounded-full border bg-white/95 py-1.5 pr-4 pl-1.5 shadow-lg shadow-black/5 backdrop-blur">
          <span className="grid size-8 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">H</span>
          <div className="leading-tight">
            <h1 className="text-[16px] font-semibold tracking-tight">Hordejakten 2026</h1>
            <p className="text-[12px] text-muted-foreground" aria-live="polite">{punkter ? 'Hvor står kassen?' : 'Laster kartdata …'}</p>
          </div>
        </div>
        <a
          href={STREAM.url}
          target="_blank"
          rel="noopener"
          className="pointer-events-auto flex items-center gap-2 rounded-full bg-[#dc2626] px-3.5 py-2 text-xs font-bold tracking-wider text-white shadow-lg shadow-red-900/20"
        >
          <span className="live-puls size-2 rounded-full bg-white" />
          LIVE
        </a>
      </header>

      <Legende
        aktive={aktive}
        onFjern={(id) => veksle(id, false)}
        kompakt={!desktop}
        stil={venstreStil}
        className={cn('fixed top-[calc(env(safe-area-inset-top)+4.5rem)] z-[999]', venstre)}
        onMer={() => {
          setFane('lag')
          if (!desktop) setHoyde('full')
        }}
      />

      <div className="fixed top-[calc(env(safe-area-inset-top)+4.5rem)] right-3 z-[1000] flex flex-col gap-2">
        {[
          { id: 'gps', ikon: LocateFixed, navn: 'Min posisjon', gjor: finnMeg, pa: !!minPos },
          { id: 'felt', ikon: Navigation, navn: 'Søkesektor fra parkering', gjor: veksleFelt, pa: aktive.has('felt') },
          { id: 'bakgrunn', ikon: Layers, navn: `Bakgrunn: ${BAKGRUNN_NAVN[bakgrunn]}`, gjor: byttBakgrunn, pa: bakgrunn !== 'gra' },
        ].map(({ id, ikon: Ikon, navn, gjor, pa }) => (
          <button
            key={id}
            type="button"
            onClick={gjor}
            title={navn}
            aria-label={navn}
            aria-pressed={pa}
            className={cn(
              'grid size-11 place-items-center rounded-xl border bg-white/95 text-slate-700 shadow-lg shadow-black/5 backdrop-blur transition-colors',
              pa && 'border-primary bg-primary text-primary-foreground',
            )}
          >
            <Ikon className="size-5" />
          </button>
        ))}
      </div>

      <Ark
        fane={fane}
        onFane={setFane}
        hoyde={hoyde}
        onHoyde={setHoyde}
        desktop={desktop}
        bred={bred}
        onBred={setBred}
        bredde={panelBredde}
        antallHint={HINT.length}
        innhold={{
          teorier: (
            <TeoriPanel
              modus={modus}
              onModus={(m) => {
                setModus(m)
                setAktiveBevis(standardBevis(m))
              }}
              prosent={prosent}
              aktiveBevis={aktiveBevis}
              onVisTeori={visTeori}
              onVeksleBevis={(id, pa) =>
                setAktiveBevis((a) => {
                  const ny = new Set(a)
                  if (pa) ny.add(id)
                  else ny.delete(id)
                  return ny
                })
              }
            />
          ),
          lag: (
            <LagPanel
              aktive={aktive}
              onVeksle={veksle}
              vekter={vekter}
              onVekter={setVekter}
              topp={topp}
              onGaTil={gaTil}
              onSjekkPunkt={(pos) => {
                tilKartet()
                if (!desktop) setHoyde('lav')
                kart.current?.visPunkt(pos)
              }}
            />
          ),
          hint: <HintPanel onVisPaKart={visPaKart} onGaTil={gaTil} apneHint={apneHint} />,
          tavla: <TavlePanel />,
          spill: <SpillPanel />,
          analyse: (
            <AnalysePanel
              onVisKommuner={() => {
                tilKartet()
                veksle('kommuner', true)
                if (!desktop) setHoyde('lav')
                // Zoom til der de «usikre» (åpne) kommunene ligger: Innlandet og Telemark
                setTimeout(() => kart.current?.flyTil([60.9, 10.3], 6), 80)
              }}
            />
          ),
          stream: <StreamPanel />,
        }}
      />
      <Toaster position="top-center" theme="light" />
    </div>
  )
}
