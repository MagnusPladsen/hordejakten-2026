import { useEffect, useRef, useState } from 'react'
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  BOSS_KIND,
  COMBO_STEP,
  LEVEL_NAMES,
  SCENE,
  SHIP,
  TICK_MS,
  createRun,
  lagRng,
  lagUtfordring,
  multiplierOf,
  stepRun,
} from './invasjonLogikk'
import type { Challenge, Enemy, Run, Status } from './invasjonLogikk'

/**
 * Øvingsversjon av spill 1, «Kill the Bill» (Regningsinvasjonen).
 *
 * Reglene ligger i `invasjonLogikk.ts` og er en tro port av det ekte spillet:
 * samme scene (400×300), fast steg på 16 ms, samme nivåer, fiender, bomber,
 * kapsler, skjold og treffbokser. Denne fila mater reglene med fingeren, musa
 * eller tastaturet og tegner resultatet på canvas med enkle former.
 */

/** Lengre pauser (fanebytte, hakk) skal ikke bli ett kjempesteg. */
const MAX_FRAME_MS = 64
/** Pusterommet med banneret mellom to nivåer. */
const LEVEL_PAUSE_MS = 1500
const MAX_PARTICLES = 240
const BEST_KEY = 'ovelse_invasjon_beste'

// ── Farger ───────────────────────────────────────────────────────────────────

const ROMMET = ['#0B2436', '#071528', '#02050D']
const CABINET = '#04101A'
const ACCENT = '#35D0BA'
const GULL = '#FFD84A'
const KORALL = '#FF6A55'
const KORALL_DYP = '#D9432F'
const HVIT = '#FFFFFF'
const SKROG = '#0F3B2C'
const PAPER = '#F7F5EE'
const PAPER_SHADE = '#CFC9B8'
const SKIN = '#F1C8A0'
const HAIR = '#5A3A22'
/** Regningenes stripe, etter type. */
const STRIPES = [KORALL, '#FF9A3D', '#FF78A9']
const FONT = "'Geist Variable', system-ui, sans-serif"

const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

// ── Typer for tegningen ──────────────────────────────────────────────────────

type Phase = 'klar' | 'spiller' | 'nivåklart' | 'tapt' | 'ferdig' | 'pause'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  fade: number
  size: number
  color: string
  spin: number
}

type Star = { x: number; y: number; r: number; o: number; drift: number }
type Toast = { text: string; x: number; y: number; life: number; color: string }

type View = {
  carry: number
  last: number | null
  particles: Particle[]
  toasts: Toast[]
  stars: Star[]
  shake: number
  flash: number
  scale: number
}

type Ui = {
  phase: Phase
  levelIndex: number
  shields: number
  score: number
  best: number
  mult: number
  progress: number
  bossFrac: number
  boss: boolean
  attempts: number
}

type Controls = {
  pointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void
  pointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void
  pointerUp: (e: ReactPointerEvent<HTMLDivElement>) => void
  keyDown: (e: ReactKeyboardEvent<HTMLDivElement>) => void
  keyUp: (e: ReactKeyboardEvent<HTMLDivElement>) => void
  retry: () => void
  playAgain: () => void
}

const padScore = (score: number) => String(score).padStart(6, '0')

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
    // Sperret lager: rekorden overlever bare til siden lastes på nytt.
  }
}

const newSeed = () => (Math.random() * 4294967296) >>> 0
const newChallenge = (): Challenge => lagUtfordring(lagRng(newSeed()))

const makeStars = (): Star[] =>
  Array.from({ length: 70 }, () => ({
    x: Math.random() * SCENE.w,
    y: Math.random() * SCENE.h,
    r: 0.4 + Math.random() * 1.2,
    o: 0.25 + Math.random() * 0.75,
    drift: 0.04 + Math.random() * 0.22,
  }))

const spark = (
  view: View,
  x: number,
  y: number,
  count: number,
  color: string,
  speed: number,
  size = 2,
) => {
  if (view.particles.length > MAX_PARTICLES) {
    view.particles.splice(0, view.particles.length - MAX_PARTICLES)
  }
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const power = speed * (0.35 + Math.random() * 0.65)
    view.particles.push({
      x,
      y,
      vx: Math.cos(angle) * power,
      vy: Math.sin(angle) * power,
      life: 1,
      fade: 1 / (16 + Math.random() * 20),
      size: size * (0.6 + Math.random()),
      color,
      spin: Math.random() * Math.PI,
    })
  }
}

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) => {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// ── Tegning ──────────────────────────────────────────────────────────────────

const drawBill = (ctx: CanvasRenderingContext2D, enemy: Enemy, tick: number) => {
  const x = enemy.x - enemy.w / 2
  const { y, w, h } = enemy
  const stripe = STRIPES[enemy.kind % STRIPES.length]
  ctx.save()
  ctx.fillStyle = PAPER_SHADE
  roundRect(ctx, x + 2, y + 2, w, h, 2)
  ctx.fill()
  ctx.fillStyle = PAPER
  roundRect(ctx, x, y, w, h, 2)
  ctx.fill()
  ctx.fillStyle = stripe
  ctx.fillRect(x + 3, y + 3, w - 6, 4)
  ctx.fillStyle = 'rgba(20, 20, 20, 0.26)'
  ctx.fillRect(x + 4, y + h - 8, w - 12, 2)
  ctx.fillRect(x + 4, y + h - 4, w - 18, 2)
  ctx.fillStyle = 'rgba(20, 20, 20, 0.5)'
  ctx.fillRect(x + 5, y + 10, 4, 3)
  ctx.fillRect(x + w - 9, y + 10, 4, 3)
  // Seige krav (to treff) har en ramme.
  if (enemy.hp > 1) {
    ctx.strokeStyle = stripe
    ctx.lineWidth = 1.4
    roundRect(ctx, x - 1.5, y - 1.5, w + 3, h + 3, 3)
    ctx.stroke()
  }
  if (tick - enemy.hitAt < 5) {
    ctx.globalAlpha = 0.85
    ctx.fillStyle = GULL
    roundRect(ctx, x, y, w, h, 2)
    ctx.fill()
  }
  ctx.restore()
}

const drawBoss = (ctx: CanvasRenderingContext2D, enemy: Enemy, tick: number) => {
  const x = enemy.x - enemy.w / 2
  const { y, w, h } = enemy
  ctx.save()
  ctx.shadowColor = KORALL
  ctx.shadowBlur = 26
  ctx.fillStyle = PAPER
  roundRect(ctx, x, y, w, h, 4)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.fillStyle = KORALL_DYP
  roundRect(ctx, x, y, w, 18, 4)
  ctx.fill()
  ctx.fillRect(x, y + 12, w, 6)
  ctx.textAlign = 'center'
  ctx.fillStyle = HVIT
  ctx.font = `700 10px ${FONT}`
  ctx.fillText('HOVEDKRAV', enemy.x, y + 13)
  ctx.fillStyle = '#17110B'
  ctx.font = `800 17px ${FONT}`
  ctx.fillText('1 116 897', enemy.x, y + 41)
  ctx.fillStyle = 'rgba(20, 20, 20, 0.28)'
  ctx.fillRect(x + 14, y + 50, w - 28, 2)
  ctx.fillRect(x + 14, y + 56, w - 46, 2)
  if (tick - enemy.hitAt < 5) {
    ctx.globalAlpha = 0.7
    ctx.fillStyle = GULL
    roundRect(ctx, x, y, w, h, 4)
    ctx.fill()
  }
  ctx.restore()
}

/** Toppen av tegningen rundt skipet (hodet står midt på treffboksen). */
const SHIP_TOP = SHIP.y + SHIP.h / 2 - 21

const drawShip = (ctx: CanvasRenderingContext2D, run: Run) => {
  const { x } = run.ship
  const top = SHIP_TOP
  const mercy = run.tick < run.ship.mercyUntil
  const blink = mercy && Math.floor(run.tick / 5) % 2 === 0
  ctx.save()
  if (blink) ctx.globalAlpha = 0.45

  // Flammen
  const flame = 6 + (run.tick % 4) * 2
  const fire = ctx.createLinearGradient(x, top + 46, x, top + 46 + flame)
  fire.addColorStop(0, GULL)
  fire.addColorStop(1, rgba(KORALL, 0))
  ctx.fillStyle = fire
  ctx.beginPath()
  ctx.moveTo(x - 7, top + 44)
  ctx.lineTo(x, top + 46 + flame)
  ctx.lineTo(x + 7, top + 44)
  ctx.closePath()
  ctx.fill()

  // Skroget
  ctx.fillStyle = SKROG
  ctx.strokeStyle = ACCENT
  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.moveTo(x - 24, top + 37)
  ctx.quadraticCurveTo(x, top + 25, x + 24, top + 37)
  ctx.quadraticCurveTo(x, top + 49, x - 24, top + 37)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Kuppelen
  ctx.fillStyle = rgba(ACCENT, 0.16)
  ctx.strokeStyle = rgba(ACCENT, 0.6)
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.ellipse(x, top + 27, 21, 25, 0, Math.PI, 0)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Alf: et rundt hode med hår, ører og smil.
  const cx = x
  const cy = top + 20
  ctx.fillStyle = SKIN
  ctx.beginPath()
  ctx.arc(cx - 15, cy + 2, 3.5, 0, Math.PI * 2)
  ctx.arc(cx + 15, cy + 2, 3.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx, cy, 15, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = HAIR
  ctx.beginPath()
  ctx.arc(cx, cy - 1, 15.5, Math.PI * 1.05, Math.PI * 1.95)
  ctx.quadraticCurveTo(cx + 6, cy - 9, cx - 2, cy - 7)
  ctx.quadraticCurveTo(cx - 9, cy - 6, cx - 15, cy - 4)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#1B1B1B'
  ctx.beginPath()
  ctx.arc(cx - 5, cy + 1, 1.8, 0, Math.PI * 2)
  ctx.arc(cx + 5, cy + 1, 1.8, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#7A3B2A'
  ctx.lineWidth = 1.4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(cx, cy + 5, 5, Math.PI * 0.15, Math.PI * 0.85)
  ctx.stroke()
  ctx.fillStyle = HAIR
  ctx.fillRect(cx - 8, cy - 3.5, 5, 1.4)
  ctx.fillRect(cx + 3, cy - 3.5, 5, 1.4)

  // Skrogets forkant ligger foran haken.
  ctx.fillStyle = SKROG
  ctx.beginPath()
  ctx.moveTo(x - 18, top + 35)
  ctx.quadraticCurveTo(x, top + 45, x + 18, top + 35)
  ctx.quadraticCurveTo(x, top + 48, x - 18, top + 35)
  ctx.fill()
  ctx.fillStyle = rgba(ACCENT, 0.9)
  ctx.fillRect(x - 12, top + 39, 24, 2)
  ctx.restore()

  // Fredningsringen etter et treff.
  if (mercy) {
    ctx.save()
    ctx.globalAlpha = 0.35 + 0.25 * ((run.tick % 12) / 12)
    ctx.strokeStyle = ACCENT
    ctx.lineWidth = 1.6
    ctx.shadowColor = ACCENT
    ctx.shadowBlur = 12
    ctx.beginPath()
    ctx.ellipse(x, SHIP.y + SHIP.h / 2, 30, 30, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }
}

const draw = (ctx: CanvasRenderingContext2D, run: Run, view: View) => {
  ctx.setTransform(view.scale, 0, 0, view.scale, 0, 0)
  if (view.shake > 0) {
    ctx.translate(
      (Math.random() - 0.5) * view.shake,
      (Math.random() - 0.5) * view.shake,
    )
  }

  const sky = ctx.createLinearGradient(0, 0, 0, SCENE.h)
  sky.addColorStop(0, ROMMET[0])
  sky.addColorStop(0.55, ROMMET[1])
  sky.addColorStop(1, ROMMET[2])
  ctx.fillStyle = sky
  ctx.fillRect(-20, -20, SCENE.w + 40, SCENE.h + 40)

  ctx.fillStyle = HVIT
  view.stars.forEach((s) => {
    s.y += s.drift
    if (s.y > SCENE.h) s.y = 0
    ctx.globalAlpha = s.o
    ctx.fillRect(s.x, s.y, s.r, s.r)
  })
  ctx.globalAlpha = 1

  // Kassen bakerst
  const kx = SCENE.w / 2
  ctx.save()
  ctx.globalAlpha = 0.45
  ctx.shadowColor = GULL
  ctx.shadowBlur = 26
  ctx.fillStyle = SKROG
  roundRect(ctx, kx - 22, 8, 44, 26, 3)
  ctx.fill()
  ctx.fillStyle = GULL
  ctx.fillRect(kx - 24, 6, 48, 7)
  ctx.fillRect(kx - 2, 18, 4, 9)
  ctx.restore()

  // Kapslene: rund = skjold, firkantet = mer ild.
  run.pickups.forEach((pickup) => {
    const shield = pickup.kind === 1
    const color = shield ? ACCENT : GULL
    const cx = pickup.x + pickup.w / 2
    const cy = pickup.y + pickup.h / 2
    ctx.save()
    ctx.shadowColor = color
    ctx.shadowBlur = 14
    ctx.fillStyle = color
    if (shield) {
      ctx.beginPath()
      ctx.arc(cx, cy, pickup.w / 2, 0, Math.PI * 2)
      ctx.fill()
    } else {
      roundRect(ctx, pickup.x, pickup.y, pickup.w, pickup.h, 5)
      ctx.fill()
    }
    ctx.shadowBlur = 0
    ctx.fillStyle = '#08131F'
    ctx.font = `800 12px ${FONT}`
    ctx.textAlign = 'center'
    ctx.fillText(shield ? '+' : '»', cx, cy + 4)
    ctx.restore()
  })

  run.enemies.forEach((enemy) => {
    if (!enemy.alive || enemy.state === 'venter') return
    if (enemy.kind === BOSS_KIND) drawBoss(ctx, enemy, run.tick)
    else drawBill(ctx, enemy, run.tick)
  })

  ctx.save()
  ctx.shadowColor = GULL
  ctx.shadowBlur = 8
  ctx.fillStyle = GULL
  run.bullets.forEach((b) => ctx.fillRect(b.x, b.y, b.w, b.h))
  ctx.restore()

  run.bombs.forEach((bomb) => {
    ctx.save()
    ctx.translate(bomb.x + bomb.w / 2, bomb.y + bomb.h / 2)
    ctx.rotate(((run.tick + bomb.x) % 60) / 9)
    ctx.fillStyle = PAPER
    ctx.fillRect(-bomb.w / 2, -bomb.h / 2, bomb.w, bomb.h)
    ctx.fillStyle = KORALL_DYP
    ctx.fillRect(-bomb.w / 2, -bomb.h / 2, bomb.w, 3)
    ctx.restore()
  })

  drawShip(ctx, run)

  view.particles.forEach((p) => {
    ctx.save()
    ctx.globalAlpha = Math.max(0, p.life)
    ctx.translate(p.x, p.y)
    ctx.rotate(p.spin)
    ctx.fillStyle = p.color
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
    ctx.restore()
  })

  view.toasts.forEach((t) => {
    ctx.save()
    ctx.globalAlpha = Math.min(1, t.life * 2)
    ctx.fillStyle = t.color
    ctx.font = `800 11px ${FONT}`
    ctx.textAlign = 'center'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
    ctx.shadowBlur = 6
    ctx.fillText(t.text, t.x, t.y)
    ctx.restore()
  })

  if (view.flash > 0) {
    ctx.globalAlpha = 1
    ctx.fillStyle = rgba(KORALL, Math.min(0.45, view.flash))
    ctx.fillRect(-20, -20, SCENE.w + 40, SCENE.h + 40)
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0)
}

/** Hendelsene fra tikket blir til gnister, rykk og blink. */
const harvest = (run: Run, view: View) => {
  run.events.forEach((event) => {
    if (event.type === 'nedskutt') {
      const stripe = STRIPES[(event.kind ?? 0) % STRIPES.length]
      spark(view, event.x, event.y, 12, PAPER, 2.6, 3)
      spark(view, event.x, event.y, 6, stripe, 2, 2.5)
      if (event.kind === BOSS_KIND) {
        spark(view, event.x, event.y, 70, GULL, 5, 4)
        view.shake = 16
      }
    } else if (event.type === 'treff') {
      spark(view, event.x, event.y, 4, GULL, 1.8, 2)
    } else if (event.type === 'truffet') {
      spark(view, event.x, event.y, 26, KORALL, 3.4, 3)
      view.shake = 11
      view.flash = 0.45
      view.toasts.push({
        text: '-1 skjold',
        x: event.x,
        y: SHIP.y - 14,
        life: 1,
        color: KORALL,
      })
    } else if (event.type === 'kapsel') {
      const shield = event.kind === 1
      spark(view, event.x, event.y, 16, shield ? ACCENT : GULL, 2.2, 2.5)
      view.toasts.push({
        text: shield ? '+1 skjold' : `Skudd ${run.ship.weapon}`,
        x: event.x,
        y: event.y,
        life: 1,
        color: shield ? ACCENT : GULL,
      })
    }
  })
}

const advanceParticles = (view: View) => {
  view.particles.forEach((p) => {
    p.x += p.vx
    p.y += p.vy
    p.vy += 0.06
    p.vx *= 0.99
    p.spin += 0.12
    p.life -= p.fade
  })
  view.particles = view.particles.filter((p) => p.life > 0)
  view.toasts.forEach((t) => {
    t.y -= 0.4
    t.life -= 0.018
  })
  view.toasts = view.toasts.filter((t) => t.life > 0)
  if (view.shake > 0) view.shake = Math.max(0, view.shake - 0.8)
  if (view.flash > 0) view.flash = Math.max(0, view.flash - 0.05)
}

const initialUi = (): Ui => ({
  phase: 'klar',
  levelIndex: 0,
  shields: SHIP.shields,
  score: 0,
  best: 0,
  mult: 1,
  progress: 0,
  bossFrac: 1,
  boss: false,
  attempts: 0,
})

const sameUi = (a: Ui, b: Ui) =>
  (Object.keys(a) as (keyof Ui)[]).every((key) => a[key] === b[key])

// ── Komponenten ──────────────────────────────────────────────────────────────

export function RegningsinvasjonenOvelse() {
  const [ui, setUi] = useState<Ui>(initialUi)
  const [banner, setBanner] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const controlsRef = useRef<Controls | null>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return undefined
    const ctx = canvas.getContext('2d')

    let challenge = newChallenge()
    let run = createRun(challenge, 0, 0)
    let phase: Phase = 'klar'
    let attempts = 0
    let best = readBest()
    let raf: number | null = null
    let timer: number | null = null
    let lastUi = initialUi()
    const input = {
      pointerId: null as number | null,
      pointerX: run.ship.x,
      left: false,
      right: false,
      fireKey: false,
    }
    const view: View = {
      carry: 0,
      last: null,
      particles: [],
      toasts: [],
      stars: makeStars(),
      shake: 0,
      flash: 0,
      scale: 1,
    }

    const syncUi = () => {
      const alive = run.enemies.filter((e) => e.alive).length
      const total = run.enemies.length
      const next: Ui = {
        phase,
        levelIndex: run.levelIndex,
        shields: run.shields,
        score: run.score,
        best,
        mult: run.combo >= COMBO_STEP ? multiplierOf(run) : 1,
        progress: total ? (total - alive) / total : 0,
        bossFrac: run.bossMaxHp ? run.bossHp / run.bossMaxHp : 1,
        boss: run.bossMaxHp > 0,
        attempts,
      }
      if (sameUi(next, lastUi)) return
      lastUi = next
      setUi(next)
    }

    const setPhase = (next: Phase) => {
      phase = next
      syncUi()
    }

    const releaseInput = () => {
      input.pointerId = null
      input.left = false
      input.right = false
      input.fireKey = false
    }

    const rememberBest = (score: number) => {
      if (score <= best) return
      best = score
      writeBest(score)
    }

    const clearTimer = () => {
      if (timer !== null) window.clearTimeout(timer)
      timer = null
    }

    const startLevel = (index: number, score: number) => {
      clearTimer()
      run = createRun(challenge, index, score)
      input.pointerX = run.ship.x
      view.carry = 0
      view.last = null
      view.particles = []
      view.toasts = []
      setBanner('')
      setPhase(document.hidden ? 'pause' : 'spiller')
    }

    const finishLevel = () => {
      rememberBest(run.score)
      if (run.levelIndex === challenge.levels.length - 1) {
        setBanner('')
        setPhase('ferdig')
        return
      }
      const index = run.levelIndex
      const score = run.score
      setBanner(`Nivå ${index + 1} klart`)
      setPhase('nivåklart')
      timer = window.setTimeout(() => {
        timer = null
        if (phase === 'nivåklart') startLevel(index + 1, score)
      }, LEVEL_PAUSE_MS)
    }

    const failLevel = () => {
      rememberBest(run.score)
      view.shake = 16
      attempts += 1
      setPhase('tapt')
    }

    /** Tapp eller tast: start, prøv igjen, fortsett – eller bare skyt. */
    const wake = () => {
      if (phase === 'klar') startLevel(0, 0)
      else if (phase === 'tapt') startLevel(run.levelIndex, run.scoreAtStart)
      else if (phase === 'pause') {
        view.last = null
        setPhase('spiller')
      }
      return phase === 'spiller'
    }

    const targetX = () => {
      if (input.pointerId !== null) return input.pointerX
      if (input.left !== input.right) return input.left ? 0 : SCENE.w
      return run.ship.x
    }

    const frame = (timestamp: number) => {
      raf = window.requestAnimationFrame(frame)
      if (phase === 'spiller') {
        const dt =
          view.last === null ? 0 : Math.min(MAX_FRAME_MS, timestamp - view.last)
        view.last = timestamp
        view.carry += dt
        let status: Status = 'spiller'
        while (view.carry >= TICK_MS && status === 'spiller') {
          view.carry -= TICK_MS
          const wanted = targetX() - run.ship.x
          const dx = Math.max(-SHIP.speed, Math.min(SHIP.speed, wanted))
          const fire = input.pointerId !== null || input.fireKey
          status = stepRun(run, { dx, fire })
          harvest(run, view)
        }
        if (status === 'klart') finishLevel()
        else if (status === 'tapt') failLevel()
        else syncUi()
      } else {
        view.last = timestamp
      }
      advanceParticles(view)
      if (ctx) draw(ctx, run, view)
    }

    const startLoop = () => {
      if (raf === null) raf = window.requestAnimationFrame(frame)
    }
    const stopLoop = () => {
      if (raf !== null) window.cancelAnimationFrame(raf)
      raf = null
    }

    // Lerretet får skjermens piksler; tegningen regner i scenens enheter.
    const fit = () => {
      const ratio = Math.min(2.5, window.devicePixelRatio || 1)
      const width = wrap.clientWidth
      if (!width) return
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round((width * ratio * SCENE.h) / SCENE.w)
      view.scale = canvas.width / SCENE.w
      if (ctx) draw(ctx, run, view)
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(wrap)

    const onVisibility = () => {
      if (document.hidden) {
        releaseInput()
        if (phase === 'spiller') setPhase('pause')
        stopLoop()
      } else {
        view.last = null
        startLoop()
      }
    }
    const onBlur = () => releaseInput()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onBlur)

    /** Brettet tar tastaturet, uten fokusring når det var et trykk. */
    const focusBoard = () => {
      if (document.activeElement === wrap) return
      wrap.focus({ preventScroll: true, focusVisible: false } as FocusOptions)
    }

    const aimAt = (clientX: number) => {
      const rect = wrap.getBoundingClientRect()
      if (!rect.width) return
      input.pointerX = Math.round(((clientX - rect.left) * SCENE.w) / rect.width)
    }

    const isFireKey = (key: string) => key === ' ' || key === 'Enter'
    const isLeft = (key: string) => key === 'ArrowLeft' || key === 'a' || key === 'A'
    const isRight = (key: string) =>
      key === 'ArrowRight' || key === 'd' || key === 'D'

    controlsRef.current = {
      pointerDown: (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return
        e.preventDefault()
        focusBoard()
        if (input.pointerId !== null) return
        if (!wake()) return
        try {
          wrap.setPointerCapture(e.pointerId)
        } catch {
          // Ikke alle nettlesere tillater fangst her; spillet virker uansett.
        }
        input.pointerId = e.pointerId
        aimAt(e.clientX)
      },
      pointerMove: (e) => {
        if (e.pointerId !== input.pointerId) return
        aimAt(e.clientX)
      },
      pointerUp: (e) => {
        if (e.pointerId !== input.pointerId) return
        input.pointerId = null
      },
      keyDown: (e) => {
        if (isLeft(e.key) || isRight(e.key)) {
          e.preventDefault()
          if (isLeft(e.key)) input.left = true
          else input.right = true
          return
        }
        if (!isFireKey(e.key)) return
        e.preventDefault()
        if (e.repeat && phase !== 'spiller') return
        if (!wake()) return
        input.fireKey = true
      },
      keyUp: (e) => {
        if (isLeft(e.key)) input.left = false
        if (isRight(e.key)) input.right = false
        if (isFireKey(e.key)) input.fireKey = false
      },
      retry: () => {
        if (phase !== 'tapt') return
        releaseInput()
        startLevel(run.levelIndex, run.scoreAtStart)
        focusBoard()
      },
      playAgain: () => {
        releaseInput()
        challenge = newChallenge()
        attempts = 0
        startLevel(0, 0)
        focusBoard()
      },
    }

    syncUi()
    startLoop()

    return () => {
      stopLoop()
      clearTimer()
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onBlur)
      controlsRef.current = null
    }
  }, [])

  const { phase } = ui
  const levelName = LEVEL_NAMES[ui.levelIndex] ?? ''

  return (
    <div
      className="mx-auto flex w-full max-w-[520px] flex-col gap-2.5 rounded-2xl border p-3 text-white sm:p-4"
      style={{
        backgroundColor: CABINET,
        borderColor: rgba(ACCENT, 0.28),
        boxShadow: `0 28px 70px -40px ${rgba(ACCENT, 0.9)}`,
      }}
    >
      {/* HUD over brettet: nivå og skjold */}
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold">
          Nivå {ui.levelIndex + 1} · {levelName}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="mr-1 text-white/65">Skjold</span>
          {Array.from({ length: SHIP.shields }, (_, i) => (
            <span
              key={i}
              aria-hidden
              className="size-2.5 rounded-full border transition-colors"
              style={{
                backgroundColor: i < ui.shields ? ACCENT : 'transparent',
                borderColor: rgba(ACCENT, i < ui.shields ? 1 : 0.35),
                boxShadow: i < ui.shields ? `0 0 8px ${ACCENT}` : 'none',
              }}
            />
          ))}
          <span className="sr-only">{ui.shields} av 3</span>
        </span>
      </div>

      <div
        className="h-1 overflow-hidden rounded-sm bg-black/35"
        aria-hidden
      >
        <div
          className="h-full origin-left transition-transform duration-150"
          style={{
            backgroundColor: ACCENT,
            transform: `scaleX(${ui.progress})`,
            boxShadow: `0 0 10px ${ACCENT}`,
          }}
        />
      </div>

      <div className="relative">
        <div
          ref={wrapRef}
          role="button"
          tabIndex={0}
          aria-label="Styr Alf og skyt. Hold nede for å flytte og skyte, eller bruk piltaster og mellomrom."
          onPointerDown={(e) => controlsRef.current?.pointerDown(e)}
          onPointerMove={(e) => controlsRef.current?.pointerMove(e)}
          onPointerUp={(e) => controlsRef.current?.pointerUp(e)}
          onPointerCancel={(e) => controlsRef.current?.pointerUp(e)}
          onLostPointerCapture={(e) => controlsRef.current?.pointerUp(e)}
          onKeyDown={(e) => controlsRef.current?.keyDown(e)}
          onKeyUp={(e) => controlsRef.current?.keyUp(e)}
          onContextMenu={(e) => e.preventDefault()}
          className="relative w-full cursor-pointer touch-none overflow-hidden rounded-2xl border outline-none select-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          style={{
            aspectRatio: `${SCENE.w} / ${SCENE.h}`,
            borderColor: rgba(ACCENT, 0.25),
            backgroundColor: ROMMET[2],
            WebkitTapHighlightColor: 'transparent',
            WebkitTouchCallout: 'none',
          }}
        >
          <canvas
            ref={canvasRef}
            className="block size-full touch-none"
            style={{ touchAction: 'none' }}
          />

          {ui.boss && (
            <div
              aria-hidden
              className="pointer-events-none absolute top-2.5 left-4 flex w-[45%] flex-col gap-1"
            >
              <span className="text-xs tracking-[0.12em] text-white/80">
                Hovedkrav
              </span>
              <div className="h-1.5 overflow-hidden rounded-full bg-black/55">
                <div
                  className="h-full origin-left"
                  style={{
                    backgroundColor: KORALL,
                    transform: `scaleX(${ui.bossFrac})`,
                    boxShadow: `0 0 10px ${KORALL}`,
                  }}
                />
              </div>
            </div>
          )}

          <div
            aria-hidden
            className="pointer-events-none absolute top-2 right-4 flex flex-col items-end"
          >
            <span className="text-[11px] tracking-widest text-white/60 tabular-nums">
              Beste {padScore(Math.max(ui.best, ui.score))}
            </span>
            <span className="flex items-baseline gap-2">
              {ui.mult > 1 && (
                <span
                  className="font-mono text-lg leading-none font-black tabular-nums"
                  style={{ color: KORALL, textShadow: `0 0 12px ${rgba(KORALL, 0.55)}` }}
                >
                  ×{ui.mult}
                </span>
              )}
              <span
                className="font-mono text-2xl leading-none font-black tabular-nums"
                style={{ color: GULL, textShadow: `0 0 12px ${rgba(GULL, 0.55)}` }}
              >
                {padScore(ui.score)}
              </span>
            </span>
            <span className="sr-only">Poeng {ui.score}</span>
          </div>
        </div>

        {/* Overleggene står utenfor brettet i DOM-en, så knappene ikke også
            trigger brettets egne trykk. Resten slipper berøringen gjennom. */}
        {phase === 'klar' && (
          <Overlay>
            <Pill color={ACCENT}>Trykk for å starte</Pill>
            <p className="max-w-[80%] text-center text-xs text-white/75 [text-shadow:0_1px_4px_#000]">
              Hold fingeren eller musa nede for å styre og skyte. Tastatur:
              piltaster og mellomrom.
            </p>
          </Overlay>
        )}
        {phase === 'pause' && (
          <Overlay>
            <Pill color={ACCENT}>Pause – trykk for å fortsette</Pill>
          </Overlay>
        )}
        {phase === 'nivåklart' && banner && (
          <Overlay>
            <Pill color={ACCENT} banner>
              {banner}
            </Pill>
          </Overlay>
        )}
        {phase === 'tapt' && (
          <Overlay>
            <Pill color={KORALL}>Regningene tok Alf</Pill>
            <Button
              className="pointer-events-auto"
              onClick={() => controlsRef.current?.retry()}
            >
              Prøv igjen
            </Button>
          </Overlay>
        )}
        {phase === 'ferdig' && (
          <Overlay className="pointer-events-auto bg-black/55 backdrop-blur-[2px]">
            <div
              className="mx-4 flex max-w-[88%] flex-col items-center gap-3 rounded-2xl border bg-black/70 px-5 py-4 text-center"
              style={{
                borderColor: rgba(ACCENT, 0.85),
                boxShadow: `0 0 28px ${rgba(ACCENT, 0.4)}`,
              }}
            >
              <p className="text-base font-semibold sm:text-lg">
                Klart! Dette var bare øving – koden får du bare i det ekte
                spillet.
              </p>
              <p className="text-sm text-white/70 tabular-nums">
                Poeng: {ui.score.toLocaleString('nb-NO')}
              </p>
              <Button onClick={() => controlsRef.current?.playAgain()}>
                Spill igjen
              </Button>
            </div>
          </Overlay>
        )}
      </div>

      <p className="min-h-5 text-xs text-white/60" aria-live="polite">
        {ui.attempts > 0 && phase !== 'ferdig'
          ? `Forsøk ${ui.attempts + 1}`
          : 'Øvingsmodus – samme regler som det ekte spillet.'}
      </p>
    </div>
  )
}

function Overlay({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl',
        className,
      )}
    >
      {children}
    </div>
  )
}

function Pill({
  children,
  color,
  banner = false,
}: {
  children: ReactNode
  color: string
  banner?: boolean
}) {
  return (
    <div
      className={cn(
        'max-w-[84%] rounded-full bg-black/60 text-center font-semibold text-white backdrop-blur-sm',
        banner ? 'px-6 py-3 text-xl' : 'px-7 py-3 text-lg sm:text-xl',
      )}
      style={{
        border: `${banner ? 1 : 2}px solid ${rgba(color, 0.85)}`,
        boxShadow: `0 0 28px ${rgba(color, 0.4)}`,
      }}
    >
      {children}
    </div>
  )
}
