import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Layers, LocateFixed, Navigation } from 'lucide-react'
import { toast } from 'sonner'

import { Ark, type Fane, type Hoyde } from '@/components/Ark'
import { HintPanel } from '@/components/HintPanel'
import { Kart, type Bakgrunn, type KartApi } from '@/components/Kart'
import { LagPanel } from '@/components/LagPanel'
import { Legende } from '@/components/Legende'
import { StreamPanel } from '@/components/StreamPanel'
import { TavlePanel } from '@/components/TavlePanel'
import { TeoriPanel } from '@/components/TeoriPanel'
import { Toaster } from '@/components/ui/sonner'
import { HINT, STEDER, STREAM, TEORIER, type Hint } from '@/data/innhold'
import type { LagId } from '@/data/lag'
import { sannsynligheter, standardBevis, type Modus, type Teori } from '@/data/teorier'
import { posisjonerRundtPeking, type FlyData } from '@/lib/fly'
import type { LatLon } from '@/lib/geo'
import { beregn, FORHAND, toppOmrader, type Kontekst, type Punkt, type Vekter } from '@/lib/modell'
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
  const [aktive, setAktive] = useState<Set<LagId>>(() => new Set<LagId>(['modell', 'teoriomrader', 'skydekke', 'solidag', 'utenfor']))
  const [vekter, setVekter] = useState<Vekter>(FORHAND[0].vekter)
  const [modus, setModus] = useState<Modus>('alt')
  const [aktiveBevis, setAktiveBevis] = useState<Set<string>>(() => standardBevis('alt'))
  const [bakgrunn, setBakgrunn] = useState<Bakgrunn>('gra')
  const [fane, setFane] = useState<Fane>('teorier')
  const [hoyde, setHoyde] = useState<Hoyde>('halv')
  const [feltPos, setFeltPos] = useState<LatLon | null>(null)
  const [minPos, setMinPos] = useState<LatLon | null>(null)

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
    fetch(`${base}data/fly_2130.json`)
      .then((r) => r.json() as Promise<FlyData>)
      .then(setFlyData)
      .catch(() => {})
  }, [])

  const kontekst = useMemo<Kontekst>(
    () => ({
      flyPos: flyData ? posisjonerRundtPeking(flyData) : [],
      innlandet: innlandet ? innlandet.coordinates.map((poly) => poly[0].map(([lon, lat]) => [lat, lon] as LatLon)) : [],
    }),
    [flyData, innlandet],
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
      for (const id of h.lag ?? []) veksle(id, true)
      const sted = [...STEDER, ...TEORIER].find((s) => s.id === h.fokus)
      if (!desktop) setHoyde('lav')
      setTimeout(() => {
        if (sted) kart.current?.flyTil(sted.pos, 9)
        else if (h.lag?.[0] && h.lag[0] !== 'felt') kart.current?.visLag(h.lag[0])
      }, 60)
    },
    [desktop, veksle],
  )

  const visTeori = useCallback(
    (t: Teori) => {
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
    [desktop, veksle],
  )

  const gaTil = useCallback(
    (pos: LatLon, zoom?: number) => {
      if (!desktop) setHoyde('lav')
      kart.current?.flyTil(pos, zoom)
    },
    [desktop],
  )

  const finnMeg = () => {
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
    const pa = !aktive.has('felt')
    veksle('felt', pa)
    if (pa) {
      const pos = minPos ?? kart.current?.sentrum()
      if (pos) {
        setFeltPos(pos)
        kart.current?.flyTil(pos, 14)
      }
      toast('Dra P-markøren til en parkering', { description: 'Det grønne feltet viser hvor kassen bør ligge: ca. 120° fra bilen, 300–900 m, oppover.' })
    }
  }

  const byttBakgrunn = () => {
    const neste = BAKGRUNN_REKKE[(BAKGRUNN_REKKE.indexOf(bakgrunn) + 1) % BAKGRUNN_REKKE.length]
    setBakgrunn(neste)
    toast(BAKGRUNN_NAVN[neste])
  }

  const venstre = desktop ? 'left-[27.5rem]' : 'left-3'

  return (
    <div className="fixed inset-0 overflow-hidden">
      <Kart
        ref={kart}
        polstring={desktop ? { venstre: 420, bunn: 0 } : { venstre: 0, bunn: Math.round(window.innerHeight * 0.5) }}
        punkter={punkter}
        norge={norge}
        flyData={flyData}
        innlandet={innlandet}
        kontekst={kontekst}
        prosent={prosent}
        resultat={resultat}
        vekter={vekter}
        aktive={aktive}
        bakgrunn={bakgrunn}
        feltPos={feltPos}
        onFeltFlytt={setFeltPos}
        onPopup={() => !desktop && setHoyde('lav')}
        minPos={minPos}
      />

      <header className={cn('pointer-events-none fixed top-[calc(env(safe-area-inset-top)+0.75rem)] right-3 z-[1000] flex items-center justify-between gap-2', venstre)}>
        <div className="pointer-events-auto flex items-center gap-2.5 rounded-full border bg-white/95 py-1.5 pr-4 pl-1.5 shadow-lg shadow-black/5 backdrop-blur">
          <span className="grid size-8 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">H</span>
          <div className="leading-tight">
            <h1 className="text-[15px] font-semibold tracking-tight">Hordejakten 2026</h1>
            <p className="text-[11px] text-muted-foreground">Hvor står kassen?</p>
          </div>
        </div>
        <a
          href={STREAM.url}
          target="_blank"
          rel="noopener"
          className="pointer-events-auto flex items-center gap-2 rounded-full bg-[#e5007e] px-3.5 py-2 text-xs font-bold tracking-wider text-white shadow-lg shadow-fuchsia-900/20"
        >
          <span className="live-puls size-2 rounded-full bg-white" />
          LIVE
        </a>
      </header>

      <Legende
        aktive={aktive}
        className={cn('fixed top-[calc(env(safe-area-inset-top)+4.5rem)] z-[999]', venstre)}
        onMer={() => {
          setFane('lag')
          if (!desktop) setHoyde('full')
        }}
      />

      <div className="fixed top-[calc(env(safe-area-inset-top)+4.5rem)] right-3 z-[1000] flex flex-col gap-2">
        {[
          { ikon: LocateFixed, navn: 'Min posisjon', gjor: finnMeg, pa: !!minPos },
          { ikon: Navigation, navn: 'Søkesektor fra parkering', gjor: veksleFelt, pa: aktive.has('felt') },
          { ikon: Layers, navn: `Bakgrunn: ${BAKGRUNN_NAVN[bakgrunn]}`, gjor: byttBakgrunn, pa: bakgrunn !== 'gra' },
        ].map(({ ikon: Ikon, navn, gjor, pa }) => (
          <button
            key={navn}
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
                if (!desktop) setHoyde('lav')
                kart.current?.visPunkt(pos)
              }}
            />
          ),
          hint: <HintPanel onVisPaKart={visPaKart} onGaTil={gaTil} />,
          tavla: <TavlePanel />,
          stream: <StreamPanel />,
        }}
      />
      <Toaster position="top-center" theme="light" />
    </div>
  )
}
