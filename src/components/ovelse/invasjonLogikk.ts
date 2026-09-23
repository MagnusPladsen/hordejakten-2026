// Øvingsversjon av reglene til Regningsinvasjonen (spill 1, «Kill the Bill»).
//
// Portert regel for regel fra det ekte spillet: samme scene, samme tikk,
// samme konstanter og formler, og den samme deterministiske heltallsmatematikken
// med fast sinustabell. Eneste forskjell er tilfeldighetskilden som trekker
// nivåene: det ekte spillet får den fra serveren, her er det en lokal seed.
//
// Ingen DOM her, så fila kan kjøres og testes rett i bun/node.

/** Sinus med amplitude 1024, 64 steg per periode. */
const SIN = [
  0, 100, 200, 297, 392, 483, 569, 650, 724, 792, 851, 903, 946, 980, 1004,
  1019, 1024, 1019, 1004, 980, 946, 903, 851, 792, 724, 650, 569, 483, 392, 297,
  200, 100, 0, -100, -200, -297, -392, -483, -569, -650, -724, -792, -851, -903,
  -946, -980, -1004, -1019, -1024, -1019, -1004, -980, -946, -903, -851, -792,
  -724, -650, -569, -483, -392, -297, -200, -100,
]

/** sin(fase) skalert til `amp`, der fasen går rundt for hver 64. */
export const wave = (phase: number, amp: number) =>
  Math.floor((SIN[phase & 63] * amp) / 1024)

// ── Konstanter ───────────────────────────────────────────────────────────────

export const SCENE = { w: 400, h: 300 } as const
export const TICK_MS = 16

export const SHIP = {
  w: 30,
  h: 26,
  /** Overkanten av treffboksen, der kulene forlater skipet. */
  y: 248,
  speed: 6,
  cooldown: 17,
  mercy: 90,
  shields: 3,
} as const

export const BULLET = { w: 4, h: 13, speed: 9 } as const
export const BOMB = { w: 6, h: 13 } as const
export const PICKUP = { w: 18, h: 18, speed: 2 } as const

export const KINDS = [
  { w: 30, h: 20, hp: 1, points: 100 },
  { w: 28, h: 22, hp: 1, points: 150 },
  { w: 34, h: 24, hp: 2, points: 250 },
  { w: 96, h: 62, hp: 44, points: 4000 },
] as const
export const BOSS_KIND = 3
const BOSS_SWAY = 120
const BOSS_SWAY_SHIFT = 3

const LEVEL_BONUS = 1000
const SHIELD_BONUS = 500
const COMBO_TIMEOUT = 110
export const COMBO_STEP = 3
export const COMBO_MAX = 5
const MAX_TICKS = 7000

export const LEVEL_NAMES = ['Regningsbunken', 'Purringene', 'Hovedkravet']

// ── Typer ────────────────────────────────────────────────────────────────────

export type Rng = { nextInt: (max: number) => number }

export type EnemySpec = {
  kind: number
  slotX: number
  slotY: number
  from: number
  enterAt: number
}

export type Level = {
  boss: boolean
  enemies: EnemySpec[]
  ampX: number
  swayShift: number
  drop: number
  fireEvery: number
  fireFloor: number
  diveEvery: number
  diveFloor: number
  pickups: number
  startWeapon?: number
  maxTicks: number
}

export type Challenge = { scene: typeof SCENE; levels: Level[] }

export type EnemyState = 'venter' | 'flyr inn' | 'formasjon' | 'stuper'

export type Box = { x: number; y: number; w: number; h: number }

export type Enemy = {
  index: number
  kind: number
  w: number
  h: number
  hp: number
  slotX: number
  slotY: number
  enterAt: number
  x: number
  y: number
  state: EnemyState
  since: number
  fromX: number
  fromY: number
  vx: number
  vy: number
  hitAt: number
  alive: boolean
}

export type Bullet = Box & { vx: number }
export type Bomb = Box & { vx: number; vy: number }
export type Pickup = Box & { kind: number }

export type GameEvent = {
  type:
    | 'skudd'
    | 'bossSkyter'
    | 'stup'
    | 'truffet'
    | 'nedskutt'
    | 'treff'
    | 'kapsel'
  x: number
  y: number
  kind?: number
}

export type Run = {
  level: Level
  levelIndex: number
  tick: number
  ship: { x: number; weapon: number; readyAt: number; mercyUntil: number }
  shields: number
  enemies: Enemy[]
  bullets: Bullet[]
  bombs: Bomb[]
  pickups: Pickup[]
  events: GameEvent[]
  score: number
  scoreAtStart: number
  kills: number
  combo: number
  comboUntil: number
  nextFire: number
  nextDive: number
  cursor: number
  bossHp: number
  bossMaxHp: number
}

export type Status = 'spiller' | 'klart' | 'tapt'
export type Input = { dx: number; fire: boolean }

// ── Tilfeldighet (bare til å trekke nivåene) ─────────────────────────────────

/** Liten seedet generator (mulberry32). */
export const lagRng = (seed: number): Rng => {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return { nextInt: (max: number) => Math.floor(next() * max) }
}

// ── Nivåene ──────────────────────────────────────────────────────────────────

const seconds = (value: number) => Math.round((value * 1000) / TICK_MS)

type FormationOptions = {
  rows: number
  cols: number
  rowKinds: number[]
  ampX: number
  swayShift: number
  drop: number
  fire: { every: number; spread: number; floor: number }
  dive: { every: number; spread: number; floor: number }
  pickups: number
}

const formationLevel = (rng: Rng, options: FormationOptions): Level => {
  const { rows, cols, rowKinds, ampX, swayShift, drop, fire, dive, pickups } =
    options
  const enemies: EnemySpec[] = []
  const kindOf = (row: number) => rowKinds[row % rowKinds.length]
  const widest = Math.max(...rowKinds.map((kind) => KINDS[kind].w))
  const gapX = widest + 14
  const span = (cols - 1) * gapX
  const left = Math.round((SCENE.w - span) / 2)
  const room = left - Math.round(widest / 2) - 12
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      enemies.push({
        kind: kindOf(row),
        slotX: left + col * gapX,
        slotY: 46 + row * 34,
        from: row % 2 === 0 ? -1 : 1,
        enterAt: row * 26 + col * 7,
      })
    }
  }
  return {
    boss: false,
    enemies,
    ampX: Math.min(ampX, room),
    swayShift,
    drop,
    fireEvery: fire.every + rng.nextInt(fire.spread),
    fireFloor: fire.floor,
    diveEvery: dive.every + rng.nextInt(dive.spread),
    diveFloor: dive.floor,
    pickups,
    maxTicks: MAX_TICKS,
  }
}

const bossLevel = (rng: Rng): Level => {
  const escorts: EnemySpec[] = []
  for (let i = 0; i < 4; i++) {
    escorts.push({
      kind: 2,
      slotX: 110 + i * 60,
      slotY: 150 + wave(i * 12 + 16, 20),
      from: i % 2 === 0 ? -1 : 1,
      enterAt: 90 + i * 16,
    })
  }
  return {
    boss: true,
    enemies: [
      {
        kind: BOSS_KIND,
        slotX: Math.round(SCENE.w / 2),
        slotY: 62,
        from: 0,
        enterAt: 0,
      },
      ...escorts,
    ],
    ampX: 40,
    swayShift: 4,
    drop: 0,
    fireEvery: seconds(1.8) + rng.nextInt(12),
    fireFloor: seconds(1),
    diveEvery: seconds(3.4) + rng.nextInt(20),
    diveFloor: seconds(1.6),
    pickups: 3,
    startWeapon: 2,
    maxTicks: MAX_TICKS,
  }
}

/** De tre nivåene, trukket med `rng` på samme måte som i det ekte spillet. */
export const lagUtfordring = (rng: Rng): Challenge => ({
  scene: SCENE,
  levels: [
    formationLevel(rng, {
      rows: 4,
      cols: 6,
      rowKinds: [1, 0, 0, 0],
      ampX: 30 + rng.nextInt(12),
      swayShift: 3,
      drop: 2,
      fire: { every: seconds(1.15), spread: 14, floor: seconds(0.5) },
      dive: { every: seconds(2.8), spread: 22, floor: seconds(1.2) },
      pickups: 7,
    }),
    formationLevel(rng, {
      rows: 4,
      cols: 7,
      rowKinds: [2, 1, 1, 0],
      ampX: 34 + rng.nextInt(14),
      swayShift: 2,
      drop: 3,
      fire: { every: seconds(0.85), spread: 12, floor: seconds(0.3) },
      dive: { every: seconds(1.8), spread: 16, floor: seconds(0.8) },
      pickups: 8,
    }),
    bossLevel(rng),
  ],
})

// ── Selve spillet ────────────────────────────────────────────────────────────

const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

/** `x`/`y` på en fiende er midten på toppen. */
export const boxOf = (enemy: Enemy): Box => ({
  x: enemy.x - enemy.w / 2,
  y: enemy.y,
  w: enemy.w,
  h: enemy.h,
})

export const shipBox = (run: Run): Box => ({
  x: run.ship.x - SHIP.w / 2,
  y: SHIP.y,
  w: SHIP.w,
  h: SHIP.h,
})

export const createRun = (
  challenge: Challenge,
  levelIndex: number,
  score = 0,
): Run => {
  const level = challenge.levels[levelIndex]
  return {
    level,
    levelIndex,
    tick: 0,
    ship: {
      x: Math.round(SCENE.w / 2),
      weapon: level.startWeapon || 1,
      readyAt: 0,
      mercyUntil: 0,
    },
    shields: SHIP.shields,
    enemies: level.enemies.map((enemy, index) => ({
      index,
      kind: enemy.kind,
      w: KINDS[enemy.kind].w,
      h: KINDS[enemy.kind].h,
      hp: KINDS[enemy.kind].hp,
      slotX: enemy.slotX,
      slotY: enemy.slotY,
      enterAt: enemy.enterAt,
      x: enemy.from === 0 ? enemy.slotX : enemy.from < 0 ? -60 : SCENE.w + 60,
      y: enemy.from === 0 ? -80 : enemy.slotY,
      state: 'venter' as EnemyState,
      since: 0,
      fromX: 0,
      fromY: 0,
      vx: 0,
      vy: 0,
      hitAt: -999,
      alive: true,
    })),
    bullets: [],
    bombs: [],
    pickups: [],
    events: [],
    score,
    scoreAtStart: score,
    kills: 0,
    combo: 0,
    comboUntil: 0,
    nextFire: 0,
    nextDive: 0,
    cursor: 7,
    bossHp: level.boss ? KINDS[BOSS_KIND].hp : 0,
    bossMaxHp: level.boss ? KINDS[BOSS_KIND].hp : 0,
  }
}

const inFormation = (enemy: Enemy) => enemy.state === 'formasjon'

export const liveEnemies = (run: Run) => run.enemies.filter((e) => e.alive)

const swayOf = (run: Run) => ({
  x: wave(run.tick >> run.level.swayShift, run.level.ampX),
  y: Math.floor((run.tick * run.level.drop) / 256),
})

export const multiplierOf = (run: Run) =>
  Math.min(COMBO_MAX, 1 + Math.floor(run.combo / COMBO_STEP))

const spawnBullets = (run: Run) => {
  const { x } = run.ship
  const shots =
    run.ship.weapon === 1
      ? [{ dx: 0, vx: 0 }]
      : run.ship.weapon === 2
        ? [
            { dx: -8, vx: 0 },
            { dx: 8, vx: 0 },
          ]
        : [
            { dx: -12, vx: -2 },
            { dx: 0, vx: 0 },
            { dx: 12, vx: 2 },
          ]
  shots.forEach((shot) => {
    run.bullets.push({
      x: x + shot.dx - BULLET.w / 2,
      y: SHIP.y - BULLET.h,
      w: BULLET.w,
      h: BULLET.h,
      vx: shot.vx,
    })
  })
  run.events.push({ type: 'skudd', x, y: SHIP.y })
}

const dropBomb = (run: Run, enemy: Enemy, vx = 0) => {
  run.bombs.push({
    x: enemy.x - BOMB.w / 2,
    y: enemy.y + enemy.h,
    w: BOMB.w,
    h: BOMB.h,
    vx,
    vy: run.level.boss ? 3 : 4 + run.levelIndex,
  })
}

const bossVolley = (run: Run, boss: Enemy) => {
  const wide = run.bossHp * 2 <= run.bossMaxHp
  const spread = wide ? [-4, -2, 0, 2, 4] : [-2, 0, 2]
  spread.forEach((vx) => dropBomb(run, boss, vx))
  run.events.push({ type: 'bossSkyter', x: boss.x, y: boss.y + boss.h })
}

const startDive = (run: Run, enemy: Enemy) => {
  enemy.state = 'stuper'
  enemy.since = run.tick
  enemy.fromX = enemy.x
  enemy.fromY = enemy.y
  const toward = run.ship.x - enemy.x
  enemy.vx = Math.max(-3, Math.min(3, Math.floor(toward / 40)))
  enemy.vy = 3
  run.events.push({ type: 'stup', x: enemy.x, y: enemy.y })
}

const hitShip = (run: Run) => {
  if (run.tick < run.ship.mercyUntil) return
  run.shields -= 1
  run.ship.weapon = Math.max(1, run.ship.weapon - 1)
  run.ship.mercyUntil = run.tick + SHIP.mercy
  run.combo = 0
  run.events.push({ type: 'truffet', x: run.ship.x, y: SHIP.y })
}

const killEnemy = (run: Run, enemy: Enemy) => {
  enemy.alive = false
  run.kills += 1
  run.combo = run.tick < run.comboUntil ? run.combo + 1 : 1
  run.comboUntil = run.tick + COMBO_TIMEOUT
  run.score += KINDS[enemy.kind].points * multiplierOf(run)
  run.events.push({
    type: 'nedskutt',
    x: enemy.x,
    y: enemy.y + enemy.h / 2,
    kind: enemy.kind,
  })
  if (run.kills % run.level.pickups === 0) {
    run.pickups.push({
      x: enemy.x - PICKUP.w / 2,
      y: enemy.y,
      w: PICKUP.w,
      h: PICKUP.h,
      kind: run.shields < SHIP.shields && run.kills % 2 === 0 ? 1 : 0,
    })
  }
}

const moveEnemies = (run: Run) => {
  const sway = swayOf(run)
  run.enemies.forEach((enemy) => {
    if (!enemy.alive) return
    const homeX =
      enemy.kind === BOSS_KIND
        ? enemy.slotX + wave(run.tick >> BOSS_SWAY_SHIFT, BOSS_SWAY)
        : enemy.slotX + sway.x
    const homeY =
      enemy.slotY + sway.y + wave((run.tick >> 3) + enemy.index * 4, 4)

    if (enemy.state === 'venter') {
      if (run.tick >= enemy.enterAt) {
        enemy.state = 'flyr inn'
        enemy.since = run.tick
        enemy.fromX = enemy.x
        enemy.fromY = enemy.y
      }
      return
    }

    if (enemy.state === 'flyr inn') {
      const span = 64
      const step = Math.min(span, run.tick - enemy.since)
      enemy.x = enemy.fromX + Math.floor(((homeX - enemy.fromX) * step) / span)
      enemy.y =
        enemy.fromY +
        Math.floor(((homeY - enemy.fromY) * step) / span) -
        wave(Math.floor((step * 32) / span), 26)
      if (step >= span) {
        enemy.state = 'formasjon'
        enemy.x = homeX
        enemy.y = homeY
      }
      return
    }

    if (enemy.state === 'formasjon') {
      enemy.x = homeX
      enemy.y = homeY
      return
    }

    // Stup
    enemy.vy = Math.min(9, enemy.vy + 1)
    enemy.x += enemy.vx + wave(run.tick >> 2, 3)
    enemy.y += enemy.vy
    if (enemy.y > SCENE.h + enemy.h) {
      enemy.state = 'flyr inn'
      enemy.since = run.tick
      enemy.x = Math.max(30, Math.min(SCENE.w - 30, enemy.x))
      enemy.y = -enemy.h - 20
      enemy.fromX = enemy.x
      enemy.fromY = enemy.y
    }
  })
}

const paceOf = (run: Run) => {
  const ramp = run.tick >> 6
  return {
    fire: Math.max(run.level.fireFloor, run.level.fireEvery - ramp),
    dive: Math.max(run.level.diveFloor, run.level.diveEvery - ramp * 2),
  }
}

const pickShooter = (run: Run) => {
  const ready = run.enemies.filter((e) => e.alive && inFormation(e))
  if (!ready.length) return null
  run.cursor = (run.cursor * 31 + 17) % 1013
  return ready[run.cursor % ready.length]
}

const enemyActions = (run: Run) => {
  const pace = paceOf(run)
  if (run.tick >= run.nextFire) {
    run.nextFire = run.tick + pace.fire
    const boss = run.level.boss
      ? run.enemies.find(
          (e) => e.alive && e.kind === BOSS_KIND && inFormation(e),
        )
      : undefined
    if (boss) {
      bossVolley(run, boss)
    } else {
      const shooter = pickShooter(run)
      if (shooter) dropBomb(run, shooter)
    }
  }
  if (run.tick >= run.nextDive) {
    run.nextDive = run.tick + pace.dive
    const diver = pickShooter(run)
    if (diver && diver.kind !== BOSS_KIND) startDive(run, diver)
  }
}

const moveShots = (run: Run) => {
  run.bullets.forEach((b) => {
    b.y -= BULLET.speed
    b.x += b.vx
  })
  run.bullets = run.bullets.filter(
    (b) => b.y + b.h > 0 && b.x > -10 && b.x < SCENE.w + 10,
  )
  run.bombs.forEach((b) => {
    b.y += b.vy
    b.x += b.vx
  })
  run.bombs = run.bombs.filter(
    (b) => b.y < SCENE.h && b.x > -20 && b.x < SCENE.w + 20,
  )
  run.pickups.forEach((p) => {
    p.y += PICKUP.speed
  })
  run.pickups = run.pickups.filter((p) => p.y < SCENE.h)
}

const collisions = (run: Run) => {
  run.bullets = run.bullets.filter((bullet) => {
    const hit = run.enemies.find(
      (e) => e.alive && e.state !== 'venter' && overlaps(bullet, boxOf(e)),
    )
    if (!hit) return true
    hit.hp -= 1
    hit.hitAt = run.tick
    if (hit.kind === BOSS_KIND) run.bossHp = Math.max(0, hit.hp)
    if (hit.hp <= 0) {
      killEnemy(run, hit)
    } else {
      run.events.push({ type: 'treff', x: bullet.x, y: bullet.y })
    }
    return false
  })

  const ship = shipBox(run)
  const shielded = run.tick < run.ship.mercyUntil

  run.bombs = run.bombs.filter((bomb) => {
    if (!overlaps(bomb, ship)) return true
    if (!shielded) hitShip(run)
    return false
  })

  run.enemies.forEach((enemy) => {
    if (shielded || !enemy.alive || enemy.state === 'venter') return
    if (!overlaps(shipBox(run), boxOf(enemy))) return
    if (enemy.kind === BOSS_KIND) {
      hitShip(run)
      return
    }
    hitShip(run)
    enemy.hp = 0
    killEnemy(run, enemy)
  })

  run.pickups = run.pickups.filter((pickup) => {
    if (!overlaps(pickup, shipBox(run))) return true
    if (pickup.kind === 1) {
      run.shields = Math.min(SHIP.shields, run.shields + 1)
    } else {
      run.ship.weapon = Math.min(3, run.ship.weapon + 1)
    }
    run.score += 250
    run.events.push({
      type: 'kapsel',
      x: pickup.x,
      y: pickup.y,
      kind: pickup.kind,
    })
    return false
  })
}

/** Ett tikk (16 ms). Svarer «spiller», «klart» eller «tapt». */
export const stepRun = (run: Run, input: Input): Status => {
  run.events = []
  run.tick += 1
  if (run.tick > run.level.maxTicks) return 'tapt'

  const dx = Math.max(-SHIP.speed, Math.min(SHIP.speed, input.dx | 0))
  const half = Math.round(SHIP.w / 2)
  run.ship.x = Math.max(half, Math.min(SCENE.w - half, run.ship.x + dx))
  if (input.fire && run.tick >= run.ship.readyAt) {
    run.ship.readyAt = run.tick + SHIP.cooldown
    spawnBullets(run)
  }

  moveShots(run)
  moveEnemies(run)
  enemyActions(run)
  collisions(run)

  if (run.combo && run.tick >= run.comboUntil) run.combo = 0

  if (run.shields <= 0) return 'tapt'
  if (!liveEnemies(run).length) {
    run.score += LEVEL_BONUS + run.shields * SHIELD_BONUS
    return 'klart'
  }
  return 'spiller'
}
