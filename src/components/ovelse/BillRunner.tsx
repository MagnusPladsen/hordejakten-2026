import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Øvingsversjon av spill 2, «Bill Runner». Fysikken, målene og kollisjonsregelen
 * er de samme som i det ekte spillet (LopAlf): scenen er 400 × 230 enheter,
 * farten øker lineært med avstanden fra SPEED_START til SPEED_AT_GOAL ved kassen,
 * og et hopp klarer en regning bare hvis hele regningen er under Alf mens han er
 * i lufta. Banen sendes av serveren i det ekte spillet, så her lages den med
 * samme regler som den evige delen av spillet, fra et fast frø: lik hver gang.
 */

// ---- Scenen (samme tall som i originalen) ----
const STAGE_W = 400
const STAGE_H = 230
const GROUND_Y = 196
const ALF_HEIGHT = 112
/** Der kollisjonsboksen starter på scenen, og hvor mye figuren stikker ut til venstre. */
const ALF_X = 70
const ALF_FIGURE_OFFSET = 5
const FIGURE_W = ALF_HEIGHT * 0.28764
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
const STRIDE_MS = 420
const HEAD_MS = 520

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

// ---- Kassen ----
const KASSE_W = 48
const KASSE_H = 40
const HALO = 34

// ---- Farger (skumringen i spill 2) ----
const ACCENT = '#FF5E57'
const PEACH = '#FFB199'
const YELLOW = '#FFD23F'
const SKOG_FARGE = '#1B0C1F'
const BAKKE_FARGE = '#170A16'
const SKY_STOPS: [number, string][] = [
  [0, '#2A1140'],
  [0.3, '#4A1743'],
  [0.52, '#8D2440'],
  [0.7, '#D8432F'],
  [0.8, '#FF7A3C'],
  [0.85, '#FFAE5C'],
  [1, '#FFAE5C'],
]

const BEST_KEY = 'ovelse-billrunner-beste'

type Obstacle = { x: number; w: number }
type Phase = 'ready' | 'running' | 'paused' | 'hit' | 'goal'

type Run = {
  distance: number
  /** Der siste hopp startet. Han er i lufta til distance ≥ lastJump + JUMP. */
  lastJump: number
  nextObstacle: number
  lastTimestamp: number | null
  /** Klokka for beina: går bare når han løper på bakken. */
  legT: number
  headT: number
}

const freshRun = (): Run => ({
  distance: 0,
  lastJump: Number.NEGATIVE_INFINITY,
  nextObstacle: 0,
  lastTimestamp: null,
  legT: 0,
  headT: 0,
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

// ---- Skogen: en flis som gjentas, trekanter i silhuett ----
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

let skogPath: Path2D | null = null
const skog = () => {
  if (skogPath) return skogPath
  const p = new Path2D()
  for (const { x, w, h } of TRAER) {
    p.moveTo(x, SKOG_H)
    p.lineTo(x + w / 2, SKOG_H - h)
    p.lineTo(x + w, SKOG_H)
    p.closePath()
  }
  p.rect(0, SKOG_H - 6, SKOG_W, 6)
  skogPath = p
  return p
}

// ---- Tegning ----

function drawBackground(ctx: CanvasRenderingContext2D, k: number, distance: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, STAGE_H)
  for (const [o, c] of SKY_STOPS) sky.addColorStop(o, c)
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, STAGE_W, STAGE_H)

  // Sola, som står stille bak skogen
  const sx = 252 + 38
  const sy = 106 + 38
  const glow = ctx.createRadialGradient(sx, sy, 30, sx, sy, 38 + 24 + 40)
  glow.addColorStop(0, 'rgba(255,94,87,0.45)')
  glow.addColorStop(1, 'rgba(255,94,87,0)')
  ctx.fillStyle = glow
  ctx.fillRect(sx - 110, sy - 110, 220, 220)
  const sun = ctx.createRadialGradient(sx, sy, 0, sx, sy, 38)
  sun.addColorStop(0, '#FFE58C')
  sun.addColorStop(0.55, '#FF8A3D')
  sun.addColorStop(1, '#C9372C')
  ctx.fillStyle = sun
  ctx.beginPath()
  ctx.arc(sx, sy, 38, 0, Math.PI * 2)
  ctx.fill()

  // Skogen ruller saktere enn bakken
  const path = skog()
  ctx.fillStyle = SKOG_FARGE
  let off = -((distance * SKOG_PARALLAKSE) % SKOG_W)
  for (; off < STAGE_W; off += SKOG_W) {
    ctx.save()
    ctx.translate(off, GROUND_Y - SKOG_H)
    ctx.fill(path)
    ctx.restore()
  }

  // Bakken
  ctx.fillStyle = BAKKE_FARGE
  ctx.fillRect(0, GROUND_Y, STAGE_W, STAGE_H - GROUND_Y)
  ctx.save()
  ctx.shadowColor = 'rgba(255,94,87,0.8)'
  ctx.shadowBlur = 12 * k
  ctx.fillStyle = ACCENT
  ctx.fillRect(0, GROUND_Y, STAGE_W, 2)
  ctx.restore()
  ctx.fillStyle = 'rgba(255,94,87,0.45)'
  for (let x = -(distance % GROUND_TICK); x < STAGE_W; x += GROUND_TICK) {
    ctx.fillRect(x, GROUND_Y + 8, 10, 3)
  }
}

function drawBill(ctx: CanvasRenderingContext2D, k: number, left: number, w: number) {
  const top = GROUND_Y - OBSTACLE_H
  // Bakre ark
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.45)'
  ctx.shadowBlur = 6 * k
  ctx.shadowOffsetY = 2 * k
  ctx.fillStyle = '#E4DED6'
  ctx.beginPath()
  ctx.roundRect(left + 3, top, w - 3, OBSTACLE_H - 3, 2)
  ctx.fill()
  ctx.restore()
  // Fremre ark
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.roundRect(left, top + 3, w - 3, OBSTACLE_H - 3, 2)
  ctx.fill()
  const inner = w - 3
  ctx.fillStyle = ACCENT
  ctx.fillRect(left + 3, top + 3 + 5, Math.max(0, inner - 6), 4)
  ctx.fillStyle = '#A7A2A8'
  ctx.fillRect(left + 3, top + 3 + 14, Math.max(0, inner - 9), 2)
  ctx.fillRect(left + 3, top + 3 + 20, Math.max(0, inner - 13), 2)
}

function drawKasse(ctx: CanvasRenderingContext2D, left: number) {
  const top = GROUND_Y - KASSE_H
  const cx = left + KASSE_W / 2
  const cy = top + KASSE_H / 2
  const r = KASSE_W / 2 + HALO
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
  halo.addColorStop(0, 'rgba(255,210,63,0.55)')
  halo.addColorStop(0.55, 'rgba(255,210,63,0.14)')
  halo.addColorStop(1, 'rgba(255,210,63,0)')
  ctx.fillStyle = halo
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#123F2F'
  ctx.strokeStyle = '#B6E24B'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(left + 2, top + 10, 44, 30, 4)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = YELLOW
  ctx.beginPath()
  ctx.roundRect(left, top + 6, 48, 10, 3)
  ctx.fill()
  // Myntspor i lokket og et nøkkelhull
  ctx.fillStyle = '#123F2F'
  ctx.fillRect(left + 16, top + 10, 16, 2)
  ctx.fillStyle = YELLOW
  ctx.beginPath()
  ctx.arc(cx, top + 27, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillRect(cx - 1.6, top + 27, 3.2, 7)
}

/** Alf som en enkel løper med stort, rundt hode. Figuren står i en boks på FIGURE_W × ALF_HEIGHT. */
function drawAlf(
  ctx: CanvasRenderingContext2D,
  lift: number,
  legT: number,
  headT: number,
  fallen: boolean,
) {
  const H = ALF_HEIGHT
  const left = ALF_X - ALF_FIGURE_OFFSET
  const bottom = GROUND_Y + lift
  const cx = left + FIGURE_W / 2

  ctx.save()
  if (fallen) {
    ctx.translate(cx, bottom)
    ctx.rotate((-16 * Math.PI) / 180)
    ctx.translate(-cx - FIGURE_W * 0.06, -bottom)
  }
  const stride = (legT % STRIDE_MS) / STRIDE_MS
  const swing = Math.cos(stride * Math.PI * 2)
  // Hoppet i kroppen: to ganger per steg
  const bob = -((1 - Math.cos(stride * Math.PI * 4)) / 2) * 0.035 * H
  const top = bottom - H + bob

  const hipY = top + 0.6 * H
  const shoulderY = top + 0.34 * H
  const legLen = bottom - hipY - 2
  const armLen = 0.26 * H

  const limb = (x: number, y: number, len: number, deg: number, color: string, width: number) => {
    const a = (deg * Math.PI) / 180
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.sin(a) * len, y + Math.cos(a) * len)
    ctx.stroke()
  }

  // Bortre bein og arm i skygge
  limb(cx - 2, hipY, legLen, 22 * swing, '#1E1830', 7)
  limb(cx - 3, shoulderY, armLen, -30 * swing, '#1F4C3E', 5)

  // Overkroppen
  ctx.fillStyle = '#2E7A5E'
  ctx.beginPath()
  ctx.roundRect(cx - 9, top + 0.3 * H, 18, 0.34 * H, 7)
  ctx.fill()

  // Nærmeste bein og arm
  limb(cx + 2, hipY, legLen, -22 * swing, '#2B2340', 7)
  limb(cx + 3, shoulderY, armLen, 30 * swing, '#3A9373', 5)

  // Hodet vugger i sin egen takt
  const wobble = Math.cos(((headT % HEAD_MS) / HEAD_MS) * Math.PI * 2) * 5
  const headR = 15
  const headY = top + 0.165 * H
  ctx.save()
  ctx.translate(cx, top + 0.31 * H)
  ctx.rotate((wobble * Math.PI) / 180)
  ctx.translate(-cx, -(top + 0.31 * H))
  ctx.fillStyle = '#F1C7A0'
  ctx.beginPath()
  ctx.arc(cx, headY, headR, 0, Math.PI * 2)
  ctx.fill()
  // Håret
  ctx.fillStyle = '#4A3526'
  ctx.beginPath()
  ctx.arc(cx, headY, headR, Math.PI * 1.05, Math.PI * 1.95)
  ctx.closePath()
  ctx.fill()
  // Ansiktet ser framover (mot høyre)
  ctx.fillStyle = '#1B0C1F'
  ctx.beginPath()
  ctx.arc(cx + 6, headY - 1, 1.8, 0, Math.PI * 2)
  ctx.arc(cx - 1, headY - 1, 1.8, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#1B0C1F'
  ctx.lineWidth = 1.4
  ctx.beginPath()
  if (fallen) ctx.arc(cx + 3, headY + 9, 3.5, Math.PI * 1.15, Math.PI * 1.85)
  else ctx.arc(cx + 3, headY + 4, 4.5, Math.PI * 0.2, Math.PI * 0.8)
  ctx.stroke()
  ctx.restore()

  ctx.restore()
}

function drawHud(ctx: CanvasRenderingContext2D, k: number, score: number, best: number) {
  ctx.save()
  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, monospace'
  ctx.fillText(`BESTE ${padScore(best)}`, STAGE_W - 16, 10)
  ctx.shadowColor = 'rgba(255,210,63,0.55)'
  ctx.shadowBlur = 12 * k
  ctx.fillStyle = YELLOW
  ctx.font = '900 26px ui-monospace, SFMono-Regular, Menlo, monospace'
  ctx.fillText(padScore(score), STAGE_W - 16, 25)
  ctx.restore()
}

// ---- Komponenten ----

const isEditable = (el: EventTarget | null) =>
  el instanceof HTMLElement &&
  (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(el.tagName))

export function BillRunnerOvelse() {
  const [phase, setPhase] = useState<Phase>('ready')
  const [attempts, setAttempts] = useState(0)

  const phaseRef = useRef<Phase>('ready')
  const runRef = useRef<Run>(freshRun())
  const bestRef = useRef(0)
  const frameRef = useRef<number | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  const setPhaseBoth = useCallback((next: Phase) => {
    phaseRef.current = next
    setPhase(next)
  }, [])

  const paint = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || canvas.width === 0) return
    const run = runRef.current
    const k = canvas.width / STAGE_W
    ctx.setTransform(k, 0, 0, k, 0, 0)

    drawBackground(ctx, k, run.distance)

    // Verden flyttes mot venstre etter hvor langt han har løpt; Alf står stille.
    const shift = ALF_X - run.distance
    for (let i = Math.max(0, run.nextObstacle - 3); i < BANE.length; i++) {
      const o = BANE[i]
      const left = o.x + shift
      if (left > STAGE_W) break
      if (left + o.w < 0) continue
      drawBill(ctx, k, left, o.w)
    }
    const kasseLeft = GOAL + shift
    if (kasseLeft - HALO < STAGE_W) drawKasse(ctx, kasseLeft)

    const airborne = run.distance < run.lastJump + JUMP
    let lift = 0
    if (airborne) {
      const u = (run.distance - run.lastJump) / JUMP
      lift = -4 * JUMP_HEIGHT * u * (1 - u)
    }
    drawAlf(ctx, lift, run.legT, run.headT, phaseRef.current === 'hit')
    drawHud(ctx, k, scoreOf(run.distance), bestRef.current)

    if (progressRef.current) {
      progressRef.current.style.transform = `scaleX(${Math.min(1, run.distance / GOAL)})`
    }
  }, [])

  const rememberBest = useCallback((score: number) => {
    if (score <= bestRef.current) return
    bestRef.current = score
    writeBest(score)
  }, [])

  const frame = useCallback(
    (timestamp: number) => {
      frameRef.current = null
      if (phaseRef.current !== 'running') return
      const run = runRef.current
      const dt =
        run.lastTimestamp === null ? 0 : Math.min(MAX_FRAME_MS, timestamp - run.lastTimestamp)
      run.lastTimestamp = timestamp

      const speed = Math.min(SPEED_MAX, SPEED_START + SPEED_GAIN * run.distance)
      run.distance += (speed * dt) / 1000
      run.headT += dt
      // Beina står stille i svevet.
      if (run.distance >= run.lastJump + JUMP) run.legT += dt

      // I det han når neste regning avgjøres det, med serverens regel.
      const obstacle = BANE[run.nextObstacle]
      if (obstacle && run.distance > obstacle.x - RUNNER) {
        const s = run.lastJump
        const cleared = s + MARGIN <= obstacle.x - RUNNER && obstacle.x + obstacle.w <= s + JUMP - MARGIN
        if (!cleared) {
          rememberBest(scoreOf(run.distance))
          phaseRef.current = 'hit'
          paint()
          setPhaseBoth('hit')
          setAttempts((n) => n + 1)
          return
        }
        run.nextObstacle += 1
      }

      if (run.distance >= GOAL) {
        run.distance = GOAL
        rememberBest(scoreOf(GOAL))
        phaseRef.current = 'goal'
        paint()
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
    setPhaseBoth('running')
    paint()
    loop()
  }, [loop, paint, setPhaseBoth])

  const restart = useCallback(() => {
    start()
    stageRef.current?.focus({ preventScroll: true })
  }, [start])

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

  // Lerretet følger bredden, skarpt på høy DPI.
  useEffect(() => {
    bestRef.current = readBest()
    const stage = stageRef.current
    const canvas = canvasRef.current
    if (!stage || !canvas) return undefined
    const fit = () => {
      const dpr = window.devicePixelRatio || 1
      const w = stage.clientWidth
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(((w * STAGE_H) / STAGE_W) * dpr))
      paint()
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [paint])

  // Tastatur, fanebytte og opprydding.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== ' ' && event.key !== 'ArrowUp') return
      const onStage = event.target === stageRef.current
      const live = phaseRef.current === 'running' || phaseRef.current === 'paused'
      if (!onStage && (!live || isEditable(event.target))) return
      event.preventDefault()
      if (phaseRef.current === 'goal') return
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

  const stopTap = (event: ReactPointerEvent) => event.stopPropagation()

  return (
    <div className="mx-auto flex w-full max-w-[520px] flex-col gap-2">
      <div className="h-1 overflow-hidden rounded-full bg-black/35" aria-hidden>
        <div
          ref={progressRef}
          className="h-full origin-left bg-[#FF5E57] shadow-[0_0_10px_#FF5E57]"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>

      <div
        ref={stageRef}
        role="button"
        tabIndex={0}
        aria-label="Hopp"
        onPointerDown={(event) => {
          if (event.button !== 0) return
          event.preventDefault()
          stageRef.current?.focus({ preventScroll: true })
          tap()
        }}
        className={cn(
          'relative w-full cursor-pointer overflow-hidden rounded-2xl border border-[#FF5E57]/25 bg-[#2A1140] select-none',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
        )}
        style={{
          aspectRatio: `${STAGE_W} / ${STAGE_H}`,
          touchAction: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" aria-hidden />

        {(phase === 'ready' || phase === 'paused') && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p
              className="max-w-[84%] rounded-full border-2 border-[#FF5E57]/85 bg-black/60 px-6 py-3 text-center text-base font-bold text-white backdrop-blur-sm sm:text-lg"
              style={{ boxShadow: '0 0 28px rgba(255,94,87,0.4)' }}
            >
              {phase === 'ready' ? 'Trykk for å starte' : 'Pause – trykk for å fortsette'}
            </p>
          </div>
        )}

        {phase === 'hit' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3">
            <p
              className="max-w-[84%] rounded-full border-2 bg-black/60 px-5 py-2 text-center text-sm font-bold text-white backdrop-blur-sm sm:text-base"
              style={{ borderColor: PEACH, boxShadow: `0 0 28px ${PEACH}66` }}
            >
              Au! Alf snublet i en regning.
            </p>
            <Button size="lg" onPointerDown={stopTap} onClick={restart}>
              Prøv igjen
            </Button>
          </div>
        )}

        {phase === 'goal' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/35 p-3">
            <div
              onPointerDown={stopTap}
              className="flex max-w-[92%] cursor-default flex-col items-center gap-2.5 rounded-2xl border-2 border-[#FFD23F]/80 bg-black/70 px-4 py-3 text-center text-white backdrop-blur-sm"
              style={{ boxShadow: '0 0 28px rgba(255,210,63,0.35)' }}
            >
              <p className="text-sm font-semibold leading-snug sm:text-base">
                Klart! Dette var bare øving – koden får du bare i det ekte spillet.
              </p>
              <Button size="lg" onClick={restart}>
                Spill igjen
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="min-h-5 text-xs text-muted-foreground" aria-live="polite">
        {attempts > 0 ? `Forsøk ${attempts + 1}` : 'Samme bane hver gang. Trykk, mellomrom eller pil opp for å hoppe.'}
      </p>
    </div>
  )
}
