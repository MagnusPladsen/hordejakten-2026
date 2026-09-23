import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Check, Delete } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Øvingsversjon av spill 4 i Kodejakten, «Dartskiven». Skiven, tastaturet og
 * tilbakemeldingene er tegnet etter samme mål som det ekte spillet, men skivene
 * lages her i nettleseren, og ingenting sendes noe sted. Fire riktige på rad
 * gir ingen kode, bare beskjed om at øvingen er klar.
 */

// #region generator
type Op = 'add' | 'sub' | 'mul' | 'div'

/** Samme form som skiven serveren sender: starttall i midten, ringer innenfra og ut. */
type Skive = {
  bullseye: number
  rings: { op: Op; segments: number[] }[]
}

type Steg = { fra: number; tall: number; til: number }
type Utregning = {
  svar: number
  ringer: { op: Op; steg: Steg[] }[]
}

const MIN_SVAR = 1
const MAX_SVAR = 999

type Rand = () => number

const heltall = (rand: Rand, fra: number, til: number) => fra + Math.floor(rand() * (til - fra + 1))

const vektet = <T,>(rand: Rand, valg: [T, number][]): T => {
  const sum = valg.reduce((s, [, v]) => s + v, 0)
  let r = rand() * sum
  for (const [verdi, vekt] of valg) {
    r -= vekt
    if (r < 0) return verdi
  }
  return valg[valg.length - 1][0]
}

const stokk = <T,>(rand: Rand, liste: T[]): T[] => {
  const ut = [...liste]
  for (let i = ut.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[ut[i], ut[j]] = [ut[j], ut[i]]
  }
  return ut
}

const regn = (op: Op, a: number, b: number) => {
  if (op === 'add') return a + b
  if (op === 'sub') return a - b
  if (op === 'mul') return a * b
  return a / b
}

/** Én ring med ett regnetegn og 1–3 ulike tall fra kanten, eller null hvis det ikke går. */
function lagRing(rand: Rand, op: Op, verdi: number): number[] | null {
  for (let forsok = 0; forsok < 30; forsok++) {
    if (op === 'add' || op === 'sub') {
      const antall = vektet(rand, [
        [1, 3],
        [2, 4.5],
        [3, 2.5],
      ])
      const tall = stokk(
        rand,
        Array.from({ length: 20 }, (_, i) => i + 1),
      ).slice(0, antall)
      const sum = tall.reduce((s, t) => s + t, 0)
      const ny = op === 'add' ? verdi + sum : verdi - sum
      if (ny >= MIN_SVAR && ny <= MAX_SVAR) return tall
      continue
    }
    if (op === 'mul') {
      const antall = vektet(rand, [
        [1, 7],
        [2, 3],
      ])
      const tall = stokk(
        rand,
        Array.from({ length: 19 }, (_, i) => i + 2),
      ).slice(0, antall)
      const produkt = tall.reduce((p, t) => p * t, 1)
      if (verdi * produkt <= MAX_SVAR) return tall
      continue
    }
    // Deling: hvert steg skal gå opp, så vi velger bare blant faktorene som er igjen.
    const antall = vektet(rand, [
      [1, 7],
      [2, 3],
    ])
    const tall: number[] = []
    let rest = verdi
    for (let i = 0; i < antall; i++) {
      const faktorer = Array.from({ length: 19 }, (_, k) => k + 2).filter((d) => rest % d === 0 && !tall.includes(d))
      if (!faktorer.length) break
      const d = faktorer[heltall(rand, 0, faktorer.length - 1)]
      tall.push(d)
      rest /= d
    }
    if (tall.length) return tall
    return null
  }
  return null
}

function forsokSkive(rand: Rand): Skive | null {
  const ringAntall = vektet(rand, [
    [2, 2],
    [3, 5],
    [4, 3],
  ])
  const bullseye = heltall(rand, 1, 20)
  let verdi = bullseye
  let forrige: Op | null = null
  const rings: Skive['rings'] = []
  for (let r = 0; r < ringAntall; r++) {
    let valgt: { op: Op; segments: number[] } | null = null
    // To ringer etter hverandre har aldri samme farge, ellers ser de ut som én.
    for (const op of stokk<Op>(rand, ['add', 'sub', 'mul', 'div']).filter((o) => o !== forrige)) {
      const segments = lagRing(rand, op, verdi)
      if (segments) {
        valgt = { op, segments: [...segments].sort((a, b) => a - b) }
        break
      }
    }
    if (!valgt) return null
    for (const t of valgt.segments) verdi = regn(valgt.op, verdi, t)
    rings.push(valgt)
    forrige = valgt.op
  }
  if (!Number.isInteger(verdi) || verdi < MIN_SVAR || verdi > MAX_SVAR) return null
  return { bullseye, rings }
}

/** En ny skive. Svaret er alltid et heltall fra 1 til 999, og hvert mellomsteg også. */
function lagSkive(rand: Rand = Math.random): Skive {
  for (;;) {
    const skive = forsokSkive(rand)
    if (skive) return skive
  }
}

/** Fasiten: start i midten, og bruk hver rings regnetegn med tallene ett om gangen. */
function regnUt(skive: Skive): Utregning {
  let verdi = skive.bullseye
  const ringer = skive.rings.map((ring) => ({
    op: ring.op,
    steg: ring.segments.map((tall) => {
      const fra = verdi
      verdi = regn(ring.op, verdi, tall)
      return { fra, tall, til: verdi }
    }),
  }))
  return { svar: verdi, ringer }
}
// #endregion generator

/** Tallene rundt en ekte dartskive, med klokka fra toppen. */
const NUMBERS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]
const WEDGE_DEG = 360 / NUMBERS.length

const SIZE = 200
const CENTER = SIZE / 2
const BULLSEYE_R = 15
const RINGS_FROM_R = 19.5
const RINGS_TO_R = 82
const RING_GAP = 3
const RING_SHADES = [0.05, 0.11]
const BOARD_SEAM = '#0C0805'
const NUMBERS_R = 91
const MAX_DIGITS = 3
const SHAKE_MS = 360
const TARGET = 4

const ACCENT = '#ff9900'
const CABINET = '#150E08'
const FIELD = 'radial-gradient(74% 74% at 50% 40%, #3A2818 0%, #1D1309 54%, #0C0805 100%)'
const WHITE = '#f2f2f2'
const CREAM = '#FBF2DD'

const COLOR_OF: Record<Op, string> = {
  add: '#8EA1FF',
  sub: '#FFD80E',
  mul: '#F7A1C6',
  div: '#B79CFF',
}
const FARGENAVN: Record<Op, string> = { add: 'blå', sub: 'gul', mul: 'rosa', div: 'lilla' }
const REGNENAVN: Record<Op, string> = { add: 'pluss', sub: 'minus', mul: 'gange', div: 'dele' }
const TEGN: Record<Op, string> = { add: '+', sub: '−', mul: '×', div: '÷' }

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'erase', '0', 'check'] as const

/** #rrggbb med gjennomsiktighet, som rgba(). */
const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1, 7), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}
const glow = (color: string, radius = 6, strength = 0.75) => `drop-shadow(0 0 ${radius}px ${alpha(color, strength)})`

const point = (r: number, angle: number) => {
  const rad = (angle * Math.PI) / 180
  return { x: CENTER + r * Math.sin(rad), y: CENTER - r * Math.cos(rad) }
}
const px = (n: number) => n.toFixed(2)

const segmentPath = (rIn: number, rOut: number, from: number, to: number) => {
  const a = point(rOut, from)
  const b = point(rOut, to)
  const c = point(rIn, to)
  const d = point(rIn, from)
  return [
    `M${px(a.x)} ${px(a.y)}`,
    `A${rOut} ${rOut} 0 0 1 ${px(b.x)} ${px(b.y)}`,
    `L${px(c.x)} ${px(c.y)}`,
    `A${rIn} ${rIn} 0 0 0 ${px(d.x)} ${px(d.y)}Z`,
  ].join('')
}

const listNumbers = (numbers: number[]) =>
  numbers.length > 1 ? `${numbers.slice(0, -1).join(', ')} og ${numbers[numbers.length - 1]}` : `${numbers[0]}`

type Feedback = { kind: 'next' } | { kind: 'all' } | { kind: 'wrong'; svar: number }

const KEY_CLASS =
  'flex h-[54px] cursor-pointer items-center justify-center rounded-[14px] border border-[#ff990038] bg-[#ffffff0d] p-0 text-[22px] leading-none font-semibold text-[#f2f2f2] tabular-nums transition-[transform,background-color] duration-100 ease-out select-none [-webkit-tap-highlight-color:transparent] hover:enabled:bg-[#ff990024] active:enabled:scale-[0.94] disabled:cursor-default disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2f2f2]'

const CHECK_CLASS =
  'border-0 bg-[#ff9900] text-black shadow-[0_0_20px_rgba(255,153,0,0.45)] hover:enabled:bg-[#ff9900]'

const SHAKE_CSS = `@keyframes ovelseDartRist{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}`

export function DartskivenOvelse() {
  const [board, setBoard] = useState<Skive>(() => lagSkive())
  const [streak, setStreak] = useState(0)
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [shaking, setShaking] = useState(false)
  const [visFasit, setVisFasit] = useState(false)
  const [lesMer, setLesMer] = useState(false)
  const shakeTimer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (shakeTimer.current) window.clearTimeout(shakeTimer.current)
    },
    [],
  )

  const solved = feedback?.kind === 'all'
  const locked = solved

  const nyttBrett = () => {
    setBoard(lagSkive())
    setInput('')
    setVisFasit(false)
  }

  const press = (digit: string) => {
    if (locked || input.length >= MAX_DIGITS) return
    // Ingen ledende null: svaret er alltid minst 1.
    if (digit === '0' && !input) return
    setInput(input + digit)
  }

  const erase = () => {
    if (!locked) setInput((current) => current.slice(0, -1))
  }

  const check = () => {
    if (locked || !input) return
    const { svar } = regnUt(board)
    if (Number(input) === svar) {
      const neste = streak + 1
      setStreak(neste)
      if (neste >= TARGET) {
        setFeedback({ kind: 'all' })
        setVisFasit(false)
      } else {
        setFeedback({ kind: 'next' })
        nyttBrett()
      }
      return
    }
    setStreak(0)
    setFeedback({ kind: 'wrong', svar })
    nyttBrett()
    setShaking(true)
    if (shakeTimer.current) window.clearTimeout(shakeTimer.current)
    shakeTimer.current = window.setTimeout(() => setShaking(false), SHAKE_MS)
  }

  const spillIgjen = () => {
    setStreak(0)
    setFeedback(null)
    nyttBrett()
  }

  const message = (() => {
    if (!feedback) return ''
    if (feedback.kind === 'next') return 'Riktig! Her er neste skive.'
    if (feedback.kind === 'all') return 'Riktig! Det var den siste.'
    return `Det stemte ikke – svaret var ${feedback.svar}. Du starter på null igjen, med en ny skive.`
  })()

  const ringCount = board.rings.length
  const thickness = (RINGS_TO_R - RINGS_FROM_R - RING_GAP * (ringCount - 1)) / ringCount
  const radiiOf = (ring: number) => {
    const rIn = RINGS_FROM_R + ring * (thickness + RING_GAP)
    return { rIn, rOut: rIn + thickness }
  }
  const used = new Set(board.rings.flatMap((ring) => ring.segments))

  const description = [
    `Dartskive. Start med ${board.bullseye}.`,
    ...board.rings.map((ring, index) => `Ring ${index + 1}: ${FARGENAVN[ring.op]} på ${listNumbers(ring.segments)}.`),
  ].join(' ')

  const rimColor = solved ? ACCENT : alpha(ACCENT, 0.4)
  const fasit = regnUt(board)

  const answerBoxStyle: CSSProperties = {
    background: alpha('#000000', 0.35),
    border: `1px solid ${solved ? ACCENT : alpha(ACCENT, 0.3)}`,
    boxShadow: solved ? `0 0 26px ${alpha(ACCENT, 0.5)}` : 'none',
    transition: 'border-color 300ms, box-shadow 300ms',
  }

  return (
    <section
      className="relative mx-auto flex w-full max-w-[480px] flex-col gap-5 overflow-hidden rounded-[20px] p-5 sm:p-7"
      style={{
        background: CABINET,
        border: `1px solid ${alpha(ACCENT, 0.28)}`,
        boxShadow: `0 28px 70px -40px ${alpha(ACCENT, 0.9)}, inset 0 1px 0 ${alpha('#ffffff', 0.07)}`,
        color: WHITE,
      }}
    >
      <style>{SHAKE_CSS}</style>
      {/* Lysstripen langs toppkanten av kabinettet. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`, opacity: 0.85 }}
      />

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <h2 className="text-[22px] leading-tight font-extrabold tracking-tight" style={{ color: WHITE }}>
            Dartskiven
          </h2>
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase"
            style={{ color: ACCENT, border: `1px solid ${alpha(ACCENT, 0.35)}` }}
          >
            Øving
          </span>
        </div>
        <p className="m-0 text-[14px] leading-relaxed" style={{ color: alpha(WHITE, 0.7) }}>
          Start med tallet i midten og regn deg utover, én ring om gangen.
          {lesMer
            ? ' Hvert farget felt peker på et tall langs kanten, og fargen bestemmer hva du gjør med det. Du må klare fire skiver på rad. Svarer du feil, får du en ny skive og starter på null. '
            : ' '}
          <button
            type="button"
            onClick={() => setLesMer((on) => !on)}
            aria-expanded={lesMer}
            className="inline cursor-pointer border-0 bg-transparent px-0.5 py-3 underline underline-offset-[3px] [-webkit-tap-highlight-color:transparent] focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2f2f2]"
            style={{ color: ACCENT, font: 'inherit' }}
          >
            {lesMer ? 'Vis mindre' : 'Les mer'}
          </button>
        </p>
      </div>

      <div className="flex flex-col items-center gap-5">
        <div
          className="w-full max-w-[340px] rounded-[20px] p-3"
          style={{ background: FIELD, border: `1px solid ${alpha(ACCENT, 0.18)}` }}
        >
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" className="block" role="img" aria-label={description}>
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RINGS_TO_R + 1}
              fill="none"
              stroke={rimColor}
              strokeWidth={1.5}
              style={{ transition: 'stroke 300ms', filter: solved ? glow(ACCENT, 5) : 'none' }}
            />
            {board.rings.map((ring, ringIndex) => {
              const { rIn, rOut } = radiiOf(ringIndex)
              const color = COLOR_OF[ring.op]
              const shade = alpha(WHITE, RING_SHADES[ringIndex % RING_SHADES.length])
              return (
                <g key={ringIndex}>
                  {NUMBERS.map((number, wedge) => {
                    const from = wedge * WEDGE_DEG - WEDGE_DEG / 2
                    const marked = ring.segments.includes(number)
                    return (
                      <path
                        key={number}
                        d={segmentPath(rIn, rOut, from, from + WEDGE_DEG)}
                        fill={marked ? color : shade}
                        stroke={BOARD_SEAM}
                        strokeWidth={0.7}
                        style={{ filter: marked ? glow(color, 3, 0.5) : 'none' }}
                      />
                    )
                  })}
                </g>
              )
            })}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={BULLSEYE_R}
              fill={alpha(CREAM, 0.14)}
              stroke={CREAM}
              strokeWidth={1.5}
              style={{ filter: glow(CREAM, 4, 0.45) }}
            />
            <text
              x={CENTER}
              y={CENTER}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={14}
              fontWeight={700}
              fill={CREAM}
            >
              {board.bullseye}
            </text>
            {NUMBERS.map((number, wedge) => {
              const at = point(NUMBERS_R, wedge * WEDGE_DEG)
              const marked = used.has(number)
              return (
                <text
                  key={number}
                  x={px(at.x)}
                  y={px(at.y)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={7.5}
                  fontWeight={marked ? 700 : 500}
                  fill={marked ? WHITE : alpha(WHITE, 0.45)}
                >
                  {number}
                </text>
              )
            })}
          </svg>
        </div>

        <div className="flex items-center gap-2.5" role="img" aria-label={`${streak} av ${TARGET} riktige på rad`}>
          <div className="flex gap-1.5" aria-hidden>
            {Array.from({ length: TARGET }, (_, dot) => {
              const on = dot < streak
              return (
                <span
                  key={dot}
                  className="size-3 rounded-full transition-[background-color,box-shadow] duration-200"
                  style={{
                    background: on ? ACCENT : 'transparent',
                    border: `2px solid ${on ? ACCENT : alpha(ACCENT, 0.3)}`,
                    boxShadow: on ? `0 0 10px ${alpha(ACCENT, 0.8)}` : 'none',
                  }}
                />
              )
            })}
          </div>
          <span className="text-[14px]" style={{ color: alpha(WHITE, 0.7) }} aria-hidden>
            {streak} av {TARGET} riktige på rad
          </span>
        </div>

        <div className="flex w-full flex-col items-center gap-1.5">
          <span id="ovelse-dart-svar" className="text-[14px]" style={{ color: alpha(WHITE, 0.6) }}>
            Svaret ditt
          </span>
          <div
            role="status"
            aria-labelledby="ovelse-dart-svar"
            className={cn(
              'flex h-[60px] min-w-[150px] items-center justify-center rounded-[14px] px-5',
              shaking && 'animate-[ovelseDartRist_360ms_ease-in-out] motion-reduce:animate-none',
            )}
            style={answerBoxStyle}
          >
            <span
              className="font-mono text-[32px] leading-none font-black tracking-[0.12em] tabular-nums"
              style={{
                color: solved ? ACCENT : WHITE,
                textShadow: `0 0 12px ${alpha(solved ? ACCENT : WHITE, 0.55)}`,
              }}
            >
              {input || '–'}
            </span>
          </div>
          <p
            role="status"
            className="m-0 min-h-[22px] text-center text-[14px]"
            style={{ color: feedback && feedback.kind !== 'wrong' ? ACCENT : alpha(WHITE, 0.7) }}
          >
            {message}
          </p>
        </div>

        {solved ? (
          <div
            className="flex w-full flex-col items-center gap-4 rounded-[14px] px-4 py-5 text-center"
            style={{ background: alpha(ACCENT, 0.12), border: `1px solid ${alpha(ACCENT, 0.3)}` }}
          >
            <p className="m-0 text-[15px] leading-relaxed font-semibold" style={{ color: WHITE }}>
              Klart! Dette var bare øving – koden får du bare i det ekte spillet.
            </p>
            <Button
              type="button"
              onClick={spillIgjen}
              className="h-11 min-w-[160px] rounded-[14px] border-0 px-5 text-[15px] font-semibold text-black hover:opacity-90"
              style={{ background: ACCENT, boxShadow: `0 0 20px ${alpha(ACCENT, 0.45)}` }}
            >
              Spill igjen
            </Button>
          </div>
        ) : (
          <div className="grid w-full max-w-[280px] grid-cols-3 gap-2">
            {KEYS.map((key) => {
              if (key === 'erase') {
                return (
                  <button
                    key={key}
                    type="button"
                    aria-label="Slett siste siffer"
                    onClick={erase}
                    disabled={locked || !input}
                    className={KEY_CLASS}
                  >
                    <Delete className="size-6" />
                  </button>
                )
              }
              if (key === 'check') {
                return (
                  <button
                    key={key}
                    type="button"
                    aria-label="Sjekk svaret"
                    onClick={check}
                    disabled={locked || !input}
                    className={cn(KEY_CLASS, CHECK_CLASS)}
                  >
                    <Check className="size-7" strokeWidth={2.5} />
                  </button>
                )
              }
              return (
                <button key={key} type="button" onClick={() => press(key)} disabled={locked} className={KEY_CLASS}>
                  {key}
                </button>
              )
            })}
          </div>
        )}

        {!solved && (
          <div className="flex w-full flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setVisFasit((on) => !on)}
              aria-expanded={visFasit}
              aria-controls="ovelse-dart-fasit"
              className="min-h-11 cursor-pointer rounded-[12px] border-0 bg-transparent px-4 text-[14px] font-semibold underline underline-offset-[3px] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2f2f2]"
              style={{ color: ACCENT }}
            >
              {visFasit ? 'Skjul fasit' : 'Vis fasit'}
            </button>
            {visFasit && (
              <div
                id="ovelse-dart-fasit"
                className="w-full rounded-[14px] p-4 text-[14px]"
                style={{ background: alpha('#ffffff', 0.04), border: `1px solid ${alpha(ACCENT, 0.2)}` }}
              >
                <p className="m-0" style={{ color: alpha(WHITE, 0.7) }}>
                  Start med tallet i midten:{' '}
                  <span className="font-mono font-bold tabular-nums" style={{ color: CREAM }}>
                    {board.bullseye}
                  </span>
                </p>
                <ol className="m-0 mt-3 flex list-none flex-col gap-3 p-0">
                  {fasit.ringer.map((ring, i) => (
                    <li key={i} className="flex flex-col gap-1">
                      <span className="flex items-center gap-2 font-semibold" style={{ color: WHITE }}>
                        <span
                          aria-hidden
                          className="size-3 shrink-0 rounded-sm"
                          style={{ background: COLOR_OF[ring.op], boxShadow: `0 0 6px ${alpha(COLOR_OF[ring.op], 0.5)}` }}
                        />
                        Ring {i + 1}: {FARGENAVN[ring.op]} = {REGNENAVN[ring.op]} ({TEGN[ring.op]})
                      </span>
                      <span className="flex flex-wrap gap-x-3 gap-y-0.5 font-mono tabular-nums" style={{ color: alpha(WHITE, 0.85) }}>
                        {ring.steg.map((s, j) => (
                          <span key={j} className="whitespace-nowrap">
                            {s.fra} {TEGN[ring.op]} {s.tall} = {s.til}
                          </span>
                        ))}
                      </span>
                    </li>
                  ))}
                </ol>
                <p className="m-0 mt-3 font-semibold" style={{ color: WHITE }}>
                  Svar:{' '}
                  <span className="font-mono tabular-nums" style={{ color: ACCENT }}>
                    {fasit.svar}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
