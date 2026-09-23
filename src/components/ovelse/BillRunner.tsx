import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from 'react'

import armFarSrc from '@/assets/kodejakten/alf-arm-far.webp'
import armNearSrc from '@/assets/kodejakten/alf-arm-near.webp'
import headSrc from '@/assets/kodejakten/alf-head.webp'
import legBackSrc from '@/assets/kodejakten/alf-leg-back.webp'
import legFrontSrc from '@/assets/kodejakten/alf-leg-front.webp'
import torsoSrc from '@/assets/kodejakten/alf-torso.webp'

/**
 * Øvingsversjon av spill 2, «Bill Runner», bygd etter originalen (LopAlf,
 * AlfFigur, Kasse, spillTema, SpillOverlay og SpillRamme). Scenen er 400 × 230
 * enheter og skaleres til bredden; alt inni står i enheter, som i originalen.
 *
 * Fysikken og kollisjonsregelen er de samme som i det ekte spillet. Banen sendes
 * av serveren i det ekte spillet, så her lages den med samme regler som den
 * evige delen av spillet, fra et fast frø: lik hver gang.
 */

// ---- Scenen (samme tall som i originalen) ----
const STAGE_W = 400
const STAGE_H = 230
const GROUND_Y = 196
const ALF_HEIGHT = 112
/** Der kollisjonsboksen starter på scenen, og hvor mye figuren stikker ut til venstre. */
const ALF_X = 70
const ALF_FIGURE_OFFSET = 5
const JUMP_HEIGHT = 80
const OBSTACLE_H = 34

// ---- Farten ----
const SPEED_START = 230
const SPEED_AT_GOAL = 400
const SPEED_MAX = 760
const SCORE_UNIT = 5
/** Lengre pauser skal ikke bli ett kjempesteg. */
const MAX_FRAME_MS = 50
const GROUND_TICK = 40
const SKOG_PARALLAKSE = 0.28

// ---- Banen (serverens tall i det ekte spillet; tilnærmet her) ----
/** Hvor langt ett hopp varer, i enheter løpt. */
const JUMP = 140
/** Bredden på Alfs kollisjonsboks. Figuren rekker fra ALF_X − 5 til ≈ ALF_X + 27. */
const RUNNER = 26
/**
 * Avledet av hopphøyden og regninghøyden: den delen av hoppet i hver ende der
 * Alf ennå er lavere enn en regning. 4·H·u(1−u) ≥ h  ⇒  u ≥ (1 − √(1 − h/H)) / 2.
 */
const MARGIN = Math.round((JUMP * (1 - Math.sqrt(1 - OBSTACLE_H / JUMP_HEIGHT))) / 2)
const GOAL = 6000
/** Innløpet: så langt ut står den første regningen. */
const RUN_IN = 600
const WIDTHS = [22, 40, 40, 58]
const SEED = 0x5eed2
const SPEED_GAIN = (SPEED_AT_GOAL - SPEED_START) / GOAL

// ---- Fargene fra Hordes palett (constants/colors) ----
const C = {
  WHITE_100: '#f2f2f2',
  WHITE_80: '#D9D9D9',
  TRUE_WHITE: '#FFFFFF',
  BLACK_40: '#bdbdbd',
  CORAL_100: '#FF5E32',
  CORAL_120: '#F43906',
  PEACH_100: '#FFD1BA',
  ORANGE_100: '#ff9900',
  YELLOW_100: '#FFD80E',
  YELLOW_60: '#ffe456',
  LIME_100: '#CAD58A',
  DARK_GREEN_120: '#0B361C',
  DARK_GREEN_100: '#014639',
  DARK_GREEN_80: '#C9F1B4',
}

/** Hex + alfa, som MUI sin `alpha`. */
const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1, 7), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

// ---- Temaet for spill 2: skumringen ----
const ACCENT = C.CORAL_100
const CABINET = '#190B16'
const FIELD =
  'linear-gradient(180deg, #2A1140 0%, #4A1743 30%, #8D2440 52%, #D8432F 70%, #FF7A3C 80%, #FFAE5C 85%, #FFAE5C 100%)'
const SKOG_FARGE = '#1B0C1F'
const BAKKE_FARGE = '#170A16'

/** Merkevarens display-snitt står først; mangler det, tar systemets tyngste over. */
const DISPLAY_FONT = '"Erlik", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'

const TEKST = {
  title: 'Bill Runner',
  instruction: 'Tapp for å hoppe over regningene. Kom deg helt fram til kassen uten å snuble.',
  solvedTitle: 'Alf kom seg til kassen!',
  practice: 'Klart! Dette var bare øving – koden får du bare i det ekte spillet.',
  tapToStart: 'Tapp for å starte',
  tapToRetry: 'Au! Tapp for å prøve igjen',
  paused: 'Pause – tapp for å fortsette',
  attempt: 'Forsøk',
  jump: 'Hopp',
  score: 'Poeng',
  best: 'Beste',
  again: 'Spill igjen',
}

const BEST_KEY = 'ovelse-billrunner-beste'

type Obstacle = { x: number; w: number }
type Phase = 'ready' | 'running' | 'paused' | 'hit' | 'goal'

type Run = {
  distance: number
  /** Der siste hopp startet. Han er i lufta til distance ≥ lastJump + JUMP. */
  lastJump: number
  nextObstacle: number
  lastTimestamp: number | null
}

const freshRun = (): Run => ({
  distance: 0,
  lastJump: Number.NEGATIVE_INFINITY,
  nextObstacle: 0,
  lastTimestamp: null,
})

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Banen: samme generator som den evige delen i originalen (bredder 22/40/40/58,
 * avstand fra start til start mellom JUMP + 10 og et tak som krymper med
 * avstanden), bare regnet bakover fra kassen og med fast frø.
 */
function lagBane(): Obstacle[] {
  const rand = mulberry32(SEED)
  const out: Obstacle[] = []
  let x = RUN_IN
  while (x < GOAL - 250) {
    out.push({ x, w: WIDTHS[Math.floor(rand() * WIDTHS.length)] })
    const gapMax = Math.max(JUMP + 50, 440 - (x - GOAL) * 0.015)
    const gap = JUMP + 10 + rand() * (gapMax - JUMP - 10)
    x = Math.round(x + gap)
  }
  return out
}

const BANE = lagBane()

const scoreOf = (distance: number) => Math.floor(distance / SCORE_UNIT)
const padScore = (score: number) => String(score).padStart(5, '0')

const readBest = () => {
  try {
    return Number(window.localStorage.getItem(BEST_KEY)) || 0
  } catch {
    return 0
  }
}

const writeBest = (best: number) => {
  try {
    window.localStorage.setItem(BEST_KEY, String(best))
  } catch {
    // Sperret lager: poengsummen overlever ikke en reload.
  }
}

// ---- Skogen: en flis som gjentas (samme trær som spillTema.skogFlis) ----
const SKOG_W = 180
const SKOG_H = 52
const TRAER = [
  { x: 2, w: 28, h: 36 },
  { x: 26, w: 22, h: 24 },
  { x: 44, w: 36, h: 47 },
  { x: 76, w: 24, h: 29 },
  { x: 96, w: 30, h: 39 },
  { x: 120, w: 20, h: 22 },
  { x: 136, w: 34, h: 45 },
  { x: 152, w: 26, h: 31 },
]
const SKOG_PATH = [
  ...TRAER.map(({ x, w, h }) => `M${x} ${SKOG_H}L${x + w / 2} ${SKOG_H - h}L${x + w} ${SKOG_H}Z`),
  `M0 ${SKOG_H - 6}h${SKOG_W}v6H0Z`,
].join('')
/** Nok fliser til å dekke scenen også når de er forskjøvet en hel flis. */
const SKOG_FLISER = Math.ceil(STAGE_W / SKOG_W) + 1

// ---- Alf-dukken (alfGeometry + AlfFigur) ----
const FIGURE_ASPECT = 0.28764
const NECK = { x: 0.48485, y: 0.31062 }
const SHOULDER_NEAR = { x: 0.73278, y: 0.32647 }
const SHOULDER_FAR = { x: 0.26446, y: 0.32647 }
const HIP_BACK = { x: 0.39945, y: 0.58637 }
const HIP_FRONT = { x: 0.72452, y: 0.58637 }
const HIPS = { x: 0.4986, y: 0.63946 }
const pct = (value: number) => `${Number((value * 100).toFixed(3))}%`
const origin = (point: { x: number; y: number }) => `${pct(point.x)} ${pct(point.y)}`

/** Ett fullt beinpar. */
const STRIDE_MS = 420
/** Med vilje ikke et multiplum av STRIDE_MS: hodet drifter i forhold til kroppen. */
const HEAD_MS = 520
const FAR_SIDE = 'brightness(0.78)'

const swing = (degrees: number, sign: 1 | -1) =>
  `0%, 100% { transform: rotate(${sign * degrees}deg); } 50% { transform: rotate(${-sign * degrees}deg); }`

const KEYFRAMES = `
@keyframes brAlfLegBack { ${swing(20, 1)} }
@keyframes brAlfLegFront { ${swing(20, -1)} }
@keyframes brAlfArmFar { ${swing(8, -1)} }
@keyframes brAlfArmNear { ${swing(8, 1)} }
@keyframes brAlfHead { 0%, 100% { transform: rotate(-5deg) translateY(0); } 50% { transform: rotate(5deg) translateY(-1.2%); } }
@keyframes brAlfTorso { 0%, 100% { transform: rotate(-1.5deg); } 50% { transform: rotate(1.5deg); } }
@keyframes brAlfBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3.5%); } }
@media (prefers-reduced-motion: reduce) { .brAlfAnim { animation: none !important; } }
`

type PartProps = {
  src: string
  name: string
  ms: number
  pivot: { x: number; y: number }
  far?: boolean
}

const Part = ({ src, name, ms, pivot, far }: PartProps) => (
  <img
    src={src}
    alt=""
    aria-hidden
    draggable={false}
    className="brAlfAnim"
    style={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      maxWidth: 'none',
      transformOrigin: origin(pivot),
      willChange: 'transform',
      filter: far ? FAR_SIDE : undefined,
      animation: `${name} ${ms}ms ease-in-out infinite`,
      animationPlayState: 'var(--alf-play, running)',
    }}
  />
)

/** Alf som løpende bobblehead-dukke: seks deler som roterer om hvert sitt dreiepunkt. */
const AlfFigur = ({ height, running, fallen }: { height: number; running: boolean; fallen: boolean }) => (
  <div
    aria-hidden
    style={
      {
        position: 'relative',
        height: `${height}px`,
        width: `${height * FIGURE_ASPECT}px`,
        transformOrigin: '50% 100%',
        transform: fallen ? 'rotate(-16deg) translateX(-6%)' : 'none',
        transition: 'transform 220ms ease-out',
        ...(running ? {} : { '--alf-play': 'paused' }),
      } as CSSProperties
    }
  >
    <div
      className="brAlfAnim"
      style={{
        position: 'absolute',
        inset: 0,
        willChange: 'transform',
        animation: `brAlfBob ${STRIDE_MS / 2}ms ease-in-out infinite`,
        animationPlayState: 'var(--alf-play, running)',
      }}
    >
      {/* Z-ordenen fra originalen: overkroppen øverst, den dekker skjøtene. */}
      <Part src={legBackSrc} name="brAlfLegBack" ms={STRIDE_MS} pivot={HIP_BACK} far />
      <Part src={legFrontSrc} name="brAlfLegFront" ms={STRIDE_MS} pivot={HIP_FRONT} />
      <Part src={armFarSrc} name="brAlfArmFar" ms={STRIDE_MS} pivot={SHOULDER_FAR} far />
      <Part src={armNearSrc} name="brAlfArmNear" ms={STRIDE_MS} pivot={SHOULDER_NEAR} />
      <Part src={headSrc} name="brAlfHead" ms={HEAD_MS} pivot={NECK} />
      <Part src={torsoSrc} name="brAlfTorso" ms={STRIDE_MS * 2} pivot={HIPS} />
    </div>
  </div>
)

// ---- Regningen: to ark med en rød betalingsfrist-stripe ----
const Regning = ({ x, w }: Obstacle) => (
  <div
    style={{
      position: 'absolute',
      left: `${x}px`,
      top: `${GROUND_Y - OBSTACLE_H}px`,
      width: `${w}px`,
      height: `${OBSTACLE_H}px`,
    }}
  >
    <div
      style={{
        position: 'absolute',
        inset: '0 0 3px 3px',
        background: C.WHITE_80,
        borderRadius: '2px',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.45)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: '3px 3px 0 0',
        background: C.TRUE_WHITE,
        borderRadius: '2px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '3px',
          right: '3px',
          top: '5px',
          height: '4px',
          background: C.CORAL_100,
          borderRadius: '1px',
        }}
      />
      <div style={{ position: 'absolute', left: '3px', right: '6px', top: '14px', height: '2px', background: C.BLACK_40 }} />
      <div style={{ position: 'absolute', left: '3px', right: '10px', top: '20px', height: '2px', background: C.BLACK_40 }} />
    </div>
  </div>
)

// ---- Kassen Alf er på vei mot ----
const KASSE_W = 48
const KASSE_H = 40
const HALO = 34

const Kasse = ({ x, ground }: { x: number; ground: number }) => {
  const id = `kasseLys-${useId().replace(/:/g, '')}`
  return (
    <svg
      viewBox={`${-HALO} ${-HALO} ${KASSE_W + HALO * 2} ${KASSE_H + HALO * 2}`}
      width={KASSE_W + HALO * 2}
      height={KASSE_H + HALO * 2}
      style={{
        position: 'absolute',
        left: `${x - HALO}px`,
        top: `${ground - KASSE_H - HALO}px`,
        display: 'block',
        pointerEvents: 'none',
        maxWidth: 'none',
      }}
      aria-hidden
    >
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor={C.YELLOW_100} stopOpacity={0.55} />
          <stop offset="55%" stopColor={C.YELLOW_100} stopOpacity={0.14} />
          <stop offset="100%" stopColor={C.YELLOW_100} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={KASSE_W / 2} cy={KASSE_H / 2} r={KASSE_W / 2 + HALO} fill={`url(#${id})`} />
      <rect x={2} y={10} width={44} height={30} rx={4} fill={C.DARK_GREEN_100} stroke={C.LIME_100} strokeWidth={1.5} />
      <rect x={0} y={6} width={48} height={10} rx={3} fill={C.YELLOW_100} />
      <circle cx={24} cy={27} r={4} fill={C.YELLOW_100} />
      <rect x={22.4} y={27} width={3.2} height={7} fill={C.YELLOW_100} />
    </svg>
  )
}

// ---- Teksten på brettet (SpillOverlay) ----
const SpillOverlay = ({ text, color }: { text: string; color: string }) => {
  if (!text) return null
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <p
        className="text-[18px] sm:text-[20px]"
        style={{
          margin: 0,
          maxWidth: '84%',
          padding: '16px 32px',
          borderRadius: '999px',
          color: C.TRUE_WHITE,
          textAlign: 'center',
          fontWeight: 700,
          lineHeight: 1.6,
          background: alpha('#000000', 0.62),
          border: `2px solid ${alpha(color, 0.85)}`,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          boxShadow: `0 0 28px ${alpha(color, 0.4)}`,
        }}
      >
        {text}
      </p>
    </div>
  )
}

const isEditable = (el: EventTarget | null) =>
  el instanceof HTMLElement &&
  (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(el.tagName))

export function BillRunnerOvelse() {
  const [phase, setPhase] = useState<Phase>('ready')
  const [attempts, setAttempts] = useState(0)
  const [best, setBest] = useState(0)

  const phaseRef = useRef<Phase>('ready')
  const runRef = useRef<Run>(freshRun())
  const bestRef = useRef(0)
  const frameRef = useRef<number | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const alfRef = useRef<HTMLDivElement>(null)
  const groundRef = useRef<HTMLDivElement>(null)
  const skogRef = useRef<SVGGElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const scoreRef = useRef<HTMLSpanElement>(null)

  const setPhaseBoth = useCallback((next: Phase) => {
    phaseRef.current = next
    setPhase(next)
  }, [])

  /** Alt som endres hvert bilde skrives rett i DOM-en, ikke via React-state. */
  const paint = useCallback(() => {
    const run = runRef.current
    const airborne = run.distance < run.lastJump + JUMP
    let lift = 0
    if (airborne) {
      const u = (run.distance - run.lastJump) / JUMP
      lift = -4 * JUMP_HEIGHT * u * (1 - u)
    }
    if (worldRef.current) worldRef.current.style.transform = `translateX(${-run.distance}px)`
    if (alfRef.current) {
      alfRef.current.style.transform = `translateY(${lift}px)`
      // Beina står stille i svevet.
      alfRef.current.style.setProperty('--alf-play', airborne ? 'paused' : 'running')
    }
    if (groundRef.current) groundRef.current.style.backgroundPositionX = `${-(run.distance % GROUND_TICK)}px`
    if (skogRef.current) {
      skogRef.current.setAttribute('transform', `translate(${-((run.distance * SKOG_PARALLAKSE) % SKOG_W)} 0)`)
    }
    if (progressRef.current) progressRef.current.style.transform = `scaleX(${Math.min(1, run.distance / GOAL)})`
    if (scoreRef.current) scoreRef.current.textContent = padScore(scoreOf(run.distance))
  }, [])

  const rememberBest = useCallback((score: number) => {
    if (score <= bestRef.current) return
    bestRef.current = score
    setBest(score)
    writeBest(score)
  }, [])

  const frame = useCallback(
    (timestamp: number) => {
      frameRef.current = null
      if (phaseRef.current !== 'running') return
      const run = runRef.current
      const dt = run.lastTimestamp === null ? 0 : Math.min(MAX_FRAME_MS, timestamp - run.lastTimestamp)
      run.lastTimestamp = timestamp

      const speed = Math.min(SPEED_MAX, SPEED_START + SPEED_GAIN * run.distance)
      run.distance += (speed * dt) / 1000

      // I det han når neste regning avgjøres det, med serverens regel.
      const obstacle = BANE[run.nextObstacle]
      if (obstacle && run.distance > obstacle.x - RUNNER) {
        const s = run.lastJump
        const cleared = s + MARGIN <= obstacle.x - RUNNER && obstacle.x + obstacle.w <= s + JUMP - MARGIN
        if (!cleared) {
          paint()
          rememberBest(scoreOf(run.distance))
          setPhaseBoth('hit')
          setAttempts((n) => n + 1)
          return
        }
        run.nextObstacle += 1
      }

      if (run.distance >= GOAL) {
        run.distance = GOAL
        paint()
        rememberBest(scoreOf(GOAL))
        setPhaseBoth('goal')
        return
      }

      paint()
      frameRef.current = window.requestAnimationFrame(frame)
    },
    [paint, rememberBest, setPhaseBoth],
  )

  const loop = useCallback(() => {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current)
    frameRef.current = window.requestAnimationFrame(frame)
  }, [frame])

  const start = useCallback(() => {
    runRef.current = freshRun()
    paint()
    setPhaseBoth('running')
    loop()
  }, [loop, paint, setPhaseBoth])

  const tap = useCallback(() => {
    const current = phaseRef.current
    if (current === 'ready' || current === 'hit') {
      start()
      return
    }
    if (current === 'paused') {
      runRef.current.lastTimestamp = null
      setPhaseBoth('running')
      loop()
      return
    }
    if (current !== 'running') return
    const run = runRef.current
    // Ett hopp om gangen: ikke før han har landet.
    if (run.distance >= run.lastJump + JUMP) {
      run.lastJump = Math.round(run.distance)
    }
  }, [loop, setPhaseBoth, start])

  const playAgain = useCallback(() => {
    start()
    viewportRef.current?.focus({ preventScroll: true })
  }, [start])

  useEffect(() => {
    bestRef.current = readBest()
    setBest(bestRef.current)
  }, [])

  // Scenen er STAGE_W enheter bred og skaleres til visningens bredde.
  useEffect(() => {
    const viewport = viewportRef.current
    const stage = stageRef.current
    if (!viewport || !stage) return undefined
    const fit = () => {
      stage.style.transform = `scale(${viewport.clientWidth / STAGE_W})`
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [])

  // Tastatur, fanebytte og opprydding.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== ' ' && event.key !== 'ArrowUp') return
      const onStage = event.target === viewportRef.current
      const live = phaseRef.current === 'running' || phaseRef.current === 'paused'
      if (!onStage && (!live || isEditable(event.target))) return
      event.preventDefault()
      tap()
    }
    const onVisibility = () => {
      if (document.hidden && phaseRef.current === 'running') {
        if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
        setPhaseBoth('paused')
      }
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('visibilitychange', onVisibility)
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }, [setPhaseBoth, tap])

  const overlay =
    phase === 'ready' ? TEKST.tapToStart : phase === 'hit' ? TEKST.tapToRetry : phase === 'paused' ? TEKST.paused : ''

  return (
    // Kabinettet (SpillRamme): en mørk flate i spillets farge, med lysstripe langs toppen.
    <section
      className="relative mx-auto flex w-full max-w-[520px] flex-col gap-5 overflow-hidden p-5 sm:p-7"
      style={{
        background: CABINET,
        borderRadius: '20px',
        border: `1px solid ${alpha(ACCENT, 0.28)}`,
        boxShadow: `0 28px 70px -40px ${alpha(ACCENT, 0.9)}, inset 0 1px 0 ${alpha(C.TRUE_WHITE, 0.07)}`,
      }}
    >
      <style>{KEYFRAMES}</style>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          zIndex: 1,
          background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`,
          opacity: 0.85,
        }}
      />

      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex items-center gap-2.5">
          <h2
            style={{
              margin: 0,
              fontFamily: DISPLAY_FONT,
              fontWeight: 900,
              fontSize: '24px',
              lineHeight: 1.33,
              color: C.WHITE_100,
            }}
          >
            {TEKST.title}
          </h2>
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-bold tracking-[0.08em] uppercase"
            style={{ color: ACCENT, border: `1px solid ${alpha(ACCENT, 0.5)}`, background: alpha(ACCENT, 0.12) }}
          >
            Øving
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '16px', lineHeight: 1.6, color: alpha(C.WHITE_100, 0.7) }}>
          {TEKST.instruction}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div
          aria-hidden
          style={{ height: '4px', borderRadius: '2px', background: alpha('#000000', 0.35), overflow: 'hidden' }}
        >
          <div
            ref={progressRef}
            style={{
              height: '100%',
              background: ACCENT,
              transformOrigin: '0 50%',
              transform: 'scaleX(0)',
              boxShadow: `0 0 10px ${ACCENT}`,
            }}
          />
        </div>

        <div
          ref={viewportRef}
          role="button"
          tabIndex={0}
          aria-label={TEKST.jump}
          onPointerDown={(event) => {
            if (event.button !== 0) return
            event.preventDefault()
            viewportRef.current?.focus({ preventScroll: true })
            tap()
          }}
          className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2f2f2]"
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: `${STAGE_W} / ${STAGE_H}`,
            overflow: 'hidden',
            borderRadius: '16px',
            background: FIELD,
            border: `1px solid ${alpha(ACCENT, 0.25)}`,
            cursor: 'pointer',
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <div
            ref={stageRef}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: `${STAGE_W}px`,
              height: `${STAGE_H}px`,
              transformOrigin: '0 0',
            }}
          >
            {/* Sola går ned bak skogen. Står stille: den er uendelig langt unna. */}
            <div
              style={{
                position: 'absolute',
                left: '252px',
                top: '106px',
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${C.YELLOW_60} 0%, ${C.ORANGE_100} 55%, ${C.CORAL_120} 100%)`,
                boxShadow: `0 0 60px 24px ${alpha(C.CORAL_100, 0.45)}`,
              }}
            />
            {/* Skogen, i silhuett og saktere enn bakken. Flisene står i én SVG som
                skyves, ikke som CSS-bakgrunn: en skalert bakgrunnsflis blør bunnraden
                inn som en tynn strek langs toppen. */}
            <svg
              aria-hidden
              width={SKOG_W * SKOG_FLISER}
              height={SKOG_H}
              viewBox={`0 0 ${SKOG_W * SKOG_FLISER} ${SKOG_H}`}
              style={{ position: 'absolute', left: 0, top: `${GROUND_Y - SKOG_H}px`, display: 'block', maxWidth: 'none' }}
            >
              <g ref={skogRef}>
                {Array.from({ length: SKOG_FLISER }, (_, i) => (
                  <path key={i} transform={`translate(${i * SKOG_W} 0)`} fill={SKOG_FARGE} d={SKOG_PATH} />
                ))}
              </g>
            </svg>
            {/* Bakken, med streker som ruller forbi */}
            <div
              style={{ position: 'absolute', left: 0, right: 0, top: `${GROUND_Y}px`, bottom: 0, background: BAKKE_FARGE }}
            />
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${GROUND_Y}px`,
                height: '2px',
                background: ACCENT,
                boxShadow: `0 0 12px ${alpha(ACCENT, 0.8)}`,
              }}
            />
            <div
              ref={groundRef}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${GROUND_Y + 8}px`,
                height: '3px',
                backgroundImage: `repeating-linear-gradient(90deg, ${alpha(ACCENT, 0.45)} 0 10px, transparent 10px ${GROUND_TICK}px)`,
              }}
            />

            {/* Verden flyttes mot venstre etter hvor langt han har løpt; Alf står stille. */}
            <div
              ref={worldRef}
              style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: 0, willChange: 'transform' }}
            >
              {BANE.map(({ x, w }) => (
                <Regning key={x} x={x + ALF_X} w={w} />
              ))}
              <Kasse x={GOAL + ALF_X} ground={GROUND_Y} />
            </div>

            <div
              ref={alfRef}
              style={{
                position: 'absolute',
                left: `${ALF_X - ALF_FIGURE_OFFSET}px`,
                top: `${GROUND_Y - ALF_HEIGHT}px`,
                willChange: 'transform',
              }}
            >
              <AlfFigur height={ALF_HEIGHT} running={phase === 'running'} fallen={phase === 'hit'} />
            </div>

            {/* Poengtavla: gull, som kassen. */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: '10px',
                right: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '16px',
                  lineHeight: 1.6,
                  color: alpha(C.WHITE_100, 0.6),
                  letterSpacing: '0.1em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {TEKST.best} {padScore(best)}
              </p>
              <p
                style={{
                  margin: 0,
                  fontFamily: DISPLAY_FONT,
                  fontWeight: 900,
                  color: C.YELLOW_100,
                  letterSpacing: '0.04em',
                  textShadow: `0 0 12px ${alpha(C.YELLOW_100, 0.55)}`,
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: '30px',
                  lineHeight: 1,
                }}
              >
                <span ref={scoreRef}>{padScore(0)}</span>
              </p>
            </div>
          </div>

          <SpillOverlay text={overlay} color={phase === 'hit' ? C.PEACH_100 : ACCENT} />
        </div>

        <p
          aria-live="polite"
          style={{ margin: 0, minHeight: '26px', fontSize: '16px', lineHeight: 1.6, color: alpha(C.WHITE_100, 0.6) }}
        >
          {attempts > 0 ? `${TEKST.attempt} ${attempts + 1}` : ''}
        </p>
      </div>

      {/* Gratulasjonen (GratulererModal), her over kabinettet i stedet for over hele siden. */}
      {phase === 'goal' && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center overflow-y-auto p-3"
          style={{ background: alpha(C.DARK_GREEN_120, 0.8) }}
        >
          <div
            role="dialog"
            aria-labelledby="billrunner-klart"
            className="flex w-full max-w-[400px] flex-col gap-5 p-6 sm:p-7"
            style={{
              background: C.DARK_GREEN_100,
              backgroundImage: `radial-gradient(120% 70% at 50% 0%, ${alpha(C.LIME_100, 0.22)} 0%, transparent 70%)`,
              color: C.WHITE_100,
              borderRadius: '20px',
              border: `1px solid ${alpha(C.LIME_100, 0.5)}`,
              boxShadow: `0 0 60px ${alpha(C.LIME_100, 0.25)}`,
            }}
          >
            <div className="flex flex-col gap-1.5">
              <h3
                id="billrunner-klart"
                style={{
                  margin: 0,
                  fontFamily: DISPLAY_FONT,
                  fontWeight: 900,
                  fontSize: '24px',
                  lineHeight: 1.33,
                  color: C.LIME_100,
                }}
              >
                {TEKST.solvedTitle}
              </h3>
              <p style={{ margin: 0, fontSize: '16px', lineHeight: 1.6 }}>{TEKST.practice}</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: alpha(C.WHITE_100, 0.75) }}>
                {TEKST.score}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '32px',
                  fontWeight: 600,
                  lineHeight: 1.1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {scoreOf(GOAL)}
              </p>
            </div>
            <button
              type="button"
              onClick={playAgain}
              className="w-full cursor-pointer rounded-full bg-[#CAD58A] transition-colors hover:bg-[#C9F1B4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2f2f2]"
              style={{ minHeight: '52px', fontWeight: 600, fontSize: '16px', color: C.DARK_GREEN_120 }}
            >
              {TEKST.again}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
