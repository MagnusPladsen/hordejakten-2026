import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/*
 * Øvingsversjon av spill 3, «Flappy-Alf». Spilløkken er en ny implementasjon
 * av reglene i det ekte spillet (FlyAlf.tsx): scenen er STAGE_W enheter bred,
 * Alf flyttes ett heltallssteg framover om gangen, og for hvert steg gjelder
 *   flaks (hvis tappet) → v = FLAP, så v = min(MAX_FALL, v + GRAVITY), y += v,
 *   taket stopper ham (y = RADIUS, v = 0), bakken og bunkene er dødelige.
 * Tiden styrer bare hvor mange steg som tas (SPEED enheter/s, maks 50 ms per bilde).
 *
 * Det ekte spillet får fysikken og banen fra serveren. De tallene finnes ikke i
 * klientkoden, så GRAVITY, FLAP, MAX_FALL, RADIUS, STAGE_H, PIPE_W, START_Y og
 * banen under er valgt her slik at de passer med klientens egne konstanter.
 * Banen lages med samme regler som den evige delen av det ekte spillet, men
 * med fast frø, så den er lik for hvert forsøk.
 */

// ── Fra klienten til det ekte spillet (samme tall) ──────────────────────────
const STAGE_W = 400;
const HEAD_HEIGHT = 40;
const HEAD_ASPECT = ((0.9642 - 0.0496) * 0.28764) / (0.317 - 0.0095);
const HEAD_WIDTH = HEAD_HEIGHT * HEAD_ASPECT;
const ALF_X = 120;
const SPEED = 200;
const MAX_FRAME_MS = 50;
const GAP_MIN = 72; // ENDLESS_GAP_MIN
const EDGE = 24; // ENDLESS_EDGE
const MAX_SHIFT = 90; // ENDLESS_MAX_SHIFT
const TILT_PER_V = 30;
const TILT_MIN = -25;
const TILT_MAX = 70;
const TILT_HIT = 84;
const LIP_H = 12;
const STJERNE_PARALLAKSE = 0.08;
const SKOG_PARALLAKSE = 0.35;
const SKOG_H = 30;
const SKOG_FARGE = "#080B22";
const KASSE_W = 48;
const KASSE_H = 40;
const KASSE_HALO = 34;
const FLAP_MS = 280;
const FLAP_DEG = 28;

// ── Fra serveren i det ekte spillet: anslått her ────────────────────────────
const STAGE_H = 400;
const RADIUS = 16;
const PIPE_W = 52;
const START_Y = 160;
const GRAVITY = 0.025;
const FLAP = -1.5;
const MAX_FALL = 2.5;

// ── Banen ────────────────────────────────────────────────────────────────────
const PIPE_COUNT = 12;
const FIRST_PIPE_X = 360;
const GAP_START = 150;
const GAP_END = 100;
const GOAL_AFTER_LAST = 260;
const SEED = 0x4a1f;

// ── Farger (nattehimmelen i spill 3) ─────────────────────────────────────────
const ACCENT = "#8AB4FF";
const YELLOW = "#FFD84D";
const CORAL = "#FF6B5B";
const SKY = "#CFE8FF";
const FIELD = [
  [0, "#05081C"],
  [0.48, "#101A47"],
  [0.78, "#1F2158"],
  [1, "#2C2665"],
] as const;

type Pipe = { x: number; gap: number; h: number };
type Phase = "ready" | "running" | "paused" | "hit" | "goal";

type Run = {
  distance: number;
  x: number;
  y: number;
  v: number;
  flapAt: number | null;
  nextPipe: number;
  passed: number;
  lastTimestamp: number | null;
};

/** Liten, deterministisk PRNG, så banen blir lik hver gang. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Samme regler som den evige delen: forskyvning maks MAX_SHIFT, EDGE fra kantene, 200–250 mellom bunkene. */
function buildCourse(): { pipes: Pipe[]; goal: number } {
  const rnd = mulberry32(SEED);
  const pipes: Pipe[] = [];
  let x = FIRST_PIPE_X;
  let lastGap = Math.round((STAGE_H - GAP_START) / 2);
  for (let i = 0; i < PIPE_COUNT; i += 1) {
    const h = Math.max(
      GAP_MIN,
      Math.round(GAP_START - ((GAP_START - GAP_END) * i) / (PIPE_COUNT - 1)),
    );
    const low = Math.max(EDGE, lastGap - MAX_SHIFT);
    const high = Math.min(STAGE_H - h - EDGE, lastGap + MAX_SHIFT);
    const gap = Math.round(low + rnd() * (high - low));
    pipes.push({ x, gap, h });
    lastGap = gap;
    x = Math.round(x + 200 + rnd() * 50);
  }
  const goal = pipes[pipes.length - 1].x + GOAL_AFTER_LAST;
  return { pipes, goal };
}

const COURSE = buildCourse();
const GOAL = COURSE.goal;

const freshRun = (): Run => ({
  distance: 0,
  x: 0,
  y: START_Y,
  v: 0,
  flapAt: null,
  nextPipe: 0,
  passed: 0,
  lastTimestamp: null,
});

/** Ett steg framover, i samme rekkefølge som det ekte spillet. Gir false ved treff. */
function step(run: Run): boolean {
  run.x += 1;
  if (run.flapAt === run.x) {
    run.v = FLAP;
    run.flapAt = null;
  }
  run.v = Math.min(MAX_FALL, run.v + GRAVITY);
  run.y += run.v;
  if (run.y < RADIUS) {
    run.y = RADIUS;
    run.v = 0;
  }
  if (run.y + RADIUS > STAGE_H) return false;
  const pipes = COURSE.pipes;
  while (
    run.nextPipe < pipes.length &&
    run.x > pipes[run.nextPipe].x + PIPE_W + RADIUS
  ) {
    run.nextPipe += 1;
    run.passed += 1;
  }
  const pipe = pipes[run.nextPipe];
  return !(
    pipe &&
    run.x >= pipe.x - RADIUS &&
    (run.y - RADIUS < pipe.gap || run.y + RADIUS > pipe.gap + pipe.h)
  );
}

// ── Tegning ──────────────────────────────────────────────────────────────────

const STJERNE_FLIS = 200;
const STJERNER = [
  { x: 12, y: 22, r: 1.2, o: 0.9 },
  { x: 48, y: 64, r: 0.8, o: 0.5 },
  { x: 80, y: 18, r: 1, o: 0.7 },
  { x: 118, y: 52, r: 1.4, o: 1 },
  { x: 152, y: 28, r: 0.9, o: 0.6 },
  { x: 184, y: 74, r: 1.1, o: 0.8 },
  { x: 30, y: 108, r: 1, o: 0.7 },
  { x: 68, y: 142, r: 1.3, o: 0.9 },
  { x: 104, y: 112, r: 0.8, o: 0.45 },
  { x: 140, y: 160, r: 1.1, o: 0.75 },
  { x: 172, y: 126, r: 0.9, o: 0.55 },
  { x: 8, y: 176, r: 1.2, o: 0.8 },
  { x: 92, y: 186, r: 0.8, o: 0.5 },
  { x: 128, y: 86, r: 0.7, o: 0.4 },
];

const SKOG_W = 180;
const SKOG_TILE_H = 52;
const TRAER = [
  { x: 2, w: 28, h: 36 },
  { x: 26, w: 22, h: 24 },
  { x: 44, w: 36, h: 47 },
  { x: 76, w: 24, h: 29 },
  { x: 96, w: 30, h: 39 },
  { x: 120, w: 20, h: 22 },
  { x: 136, w: 34, h: 45 },
  { x: 152, w: 26, h: 31 },
];

const wrap = (value: number, size: number) => ((value % size) + size) % size;

function drawSky(ctx: CanvasRenderingContext2D, distance: number) {
  const g = ctx.createLinearGradient(0, 0, 0, STAGE_H);
  for (const [stop, color] of FIELD) g.addColorStop(stop, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);

  // Stjerner, nesten i ro
  ctx.fillStyle = "#FFFFFF";
  const sx = -wrap(distance * STJERNE_PARALLAKSE, STJERNE_FLIS);
  for (let tx = sx; tx < STAGE_W; tx += STJERNE_FLIS) {
    for (let ty = 0; ty < STAGE_H; ty += STJERNE_FLIS) {
      for (const s of STJERNER) {
        ctx.globalAlpha = s.o;
        ctx.beginPath();
        ctx.arc(tx + s.x, ty + s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.globalAlpha = 1;

  // Månen står stille
  ctx.save();
  ctx.shadowColor = "rgba(207, 232, 255, 0.45)";
  ctx.shadowBlur = 40;
  ctx.fillStyle = SKY;
  ctx.beginPath();
  ctx.arc(STAGE_W - 58 - 22, 26 + 22, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Skogen
  ctx.fillStyle = SKOG_FARGE;
  const k = SKOG_H / SKOG_TILE_H;
  const top = STAGE_H - SKOG_H;
  const fx = -wrap(distance * SKOG_PARALLAKSE, SKOG_W);
  for (let tx = fx; tx < STAGE_W; tx += SKOG_W) {
    ctx.beginPath();
    for (const t of TRAER) {
      ctx.moveTo(tx + t.x, top + SKOG_TILE_H * k);
      ctx.lineTo(tx + t.x + t.w / 2, top + (SKOG_TILE_H - t.h) * k);
      ctx.lineTo(tx + t.x + t.w, top + SKOG_TILE_H * k);
      ctx.closePath();
    }
    ctx.rect(tx, top + (SKOG_TILE_H - 6) * k, SKOG_W + 0.5, 6 * k);
    ctx.fill();
  }

  // Bakken
  ctx.save();
  ctx.shadowColor = "rgba(138, 180, 255, 0.8)";
  ctx.shadowBlur = 12;
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, STAGE_H - 2, STAGE_W, 2);
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

/** En stabel regninger, med den øverste (med frist-stripen) mot åpningen. */
function drawStack(
  ctx: CanvasRenderingContext2D,
  x: number,
  top: number,
  h: number,
  lip: "top" | "bottom",
) {
  if (h <= 0) return;
  ctx.fillStyle = "#E4E2EC";
  ctx.fillRect(x, top, PIPE_W, h);
  ctx.fillStyle = "rgba(20, 22, 40, 0.28)";
  for (let y = 8; y < h; y += 10) {
    ctx.fillRect(x, top + y, PIPE_W, Math.min(2, h - y));
  }
  const shade = ctx.createLinearGradient(x + PIPE_W - 14, 0, x + PIPE_W, 0);
  shade.addColorStop(0, "rgba(0,0,0,0)");
  shade.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = shade;
  ctx.fillRect(x + PIPE_W - 14, top, 14, h);

  const lipY = lip === "top" ? top : top + h - LIP_H;
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, x - 3, lipY, PIPE_W + 6, LIP_H, 2);
  ctx.fillStyle = CORAL;
  roundRect(ctx, x - 3 + 5, lipY + 4, PIPE_W + 6 - 10, 4, 1);
}

function drawKasse(ctx: CanvasRenderingContext2D, x: number) {
  const top = STAGE_H - 2 - KASSE_H;
  const cx = x + KASSE_W / 2;
  const cy = top + KASSE_H / 2;
  const r = KASSE_W / 2 + KASSE_HALO;
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  halo.addColorStop(0, "rgba(255, 216, 77, 0.55)");
  halo.addColorStop(0.55, "rgba(255, 216, 77, 0.14)");
  halo.addColorStop(1, "rgba(255, 216, 77, 0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#0B3B2E";
  ctx.strokeStyle = "#C6F432";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x + 2, top + 10, 44, 30, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = YELLOW;
  roundRect(ctx, x, top + 6, 48, 10, 3);
  ctx.beginPath();
  ctx.arc(x + 24, top + 27, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x + 22.4, top + 27, 3.2, 7);
}

/** Alf: et rundt hode med to små vinger, rotert om midten av hodet. */
function drawAlf(
  ctx: CanvasRenderingContext2D,
  y: number,
  tilt: number,
  wingPhase: number,
) {
  const w = HEAD_WIDTH;
  const h = HEAD_HEIGHT;
  ctx.save();
  ctx.translate(ALF_X, y);
  ctx.rotate((tilt * Math.PI) / 180);

  const flap = Math.sin(wingPhase * Math.PI * 2) * FLAP_DEG;
  const wing = (side: 1 | -1, color: string) => {
    ctx.save();
    ctx.translate(side * w * 0.3, h * 0.08);
    ctx.rotate(((side * (-55 + flap)) * Math.PI) / 180);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(side * 12, 0, 13, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  wing(-1, "#C9D6F5");
  wing(1, "#F2F5FF");

  // Hodet
  ctx.fillStyle = "#F1C6A0";
  ctx.beginPath();
  ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Håret
  ctx.fillStyle = "#6B4A2E";
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.2, w / 2, h * 0.32, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  // Øret
  ctx.fillStyle = "#E3AF86";
  ctx.beginPath();
  ctx.ellipse(-w * 0.44, h * 0.02, 3, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Øyne mot høyre
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.ellipse(w * 0.22, -h * 0.04, 4.2, 4.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1B1B2A";
  ctx.beginPath();
  ctx.arc(w * 0.26, -h * 0.03, 2.1, 0, Math.PI * 2);
  ctx.fill();
  // Smil
  ctx.strokeStyle = "#8A3B2E";
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(w * 0.14, h * 0.14, 6, 0.15 * Math.PI, 0.7 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

function drawHud(ctx: CanvasRenderingContext2D, score: number, best: number) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = "900 38px ui-sans-serif, system-ui, sans-serif";
  ctx.lineJoin = "round";
  ctx.lineWidth = 5;
  ctx.strokeStyle = "rgba(0,0,0,0.75)";
  ctx.strokeText(String(score), STAGE_W / 2, 10);
  ctx.shadowColor = "rgba(255, 216, 77, 0.5)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = YELLOW;
  ctx.fillText(String(score), STAGE_W / 2, 10);
  ctx.restore();

  ctx.save();
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.font = "500 12px ui-sans-serif, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText(`Beste ${best}`, STAGE_W - 16, 14);
  ctx.restore();
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  run: Run,
  crashed: boolean,
  wingPhase: number,
  best: number,
) {
  drawSky(ctx, run.distance);

  const offset = ALF_X - run.distance;
  for (const pipe of COURSE.pipes) {
    const x = pipe.x + offset;
    if (x > STAGE_W + 10 || x + PIPE_W < -10) continue;
    drawStack(ctx, x, 0, pipe.gap, "bottom");
    drawStack(ctx, x, pipe.gap + pipe.h, STAGE_H - pipe.gap - pipe.h, "top");
  }
  const kx = GOAL + offset;
  if (kx < STAGE_W + KASSE_HALO && kx + KASSE_W > -KASSE_HALO) drawKasse(ctx, kx);

  const tilt = crashed
    ? TILT_HIT
    : Math.max(TILT_MIN, Math.min(TILT_MAX, run.v * TILT_PER_V));
  drawAlf(ctx, run.y, tilt, wingPhase);
  drawHud(ctx, run.passed, best);
}

// ── Komponenten ──────────────────────────────────────────────────────────────

const BEST_KEY = "ovelse_flappy_alf_beste";

const readBest = () => {
  try {
    return Number(window.localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
};

const writeBest = (value: number) => {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Sperret lager: beste gjelder bare denne økten.
  }
};

export function FlappyAlfOvelse() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [attempts, setAttempts] = useState(0);
  const [lastScore, setLastScore] = useState(0);

  const phaseRef = useRef<Phase>("ready");
  const runRef = useRef<Run>(freshRun());
  const crashedRef = useRef(false);
  const bestRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(1);

  const setPhaseBoth = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const run = runRef.current;
    ctx.setTransform(scaleRef.current, 0, 0, scaleRef.current, 0, 0);
    const wingPhase =
      phaseRef.current === "running"
        ? (performance.now() % FLAP_MS) / FLAP_MS
        : 0;
    drawScene(ctx, run, crashedRef.current, wingPhase, bestRef.current);
    if (progressRef.current) {
      progressRef.current.style.transform = `scaleX(${Math.min(1, run.distance / GOAL)})`;
    }
  }, []);

  const stopLoop = useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const rememberBest = useCallback((score: number) => {
    if (score <= bestRef.current) return;
    bestRef.current = score;
    writeBest(score);
  }, []);

  const frame = useCallback(
    (timestamp: number) => {
      frameRef.current = null;
      if (phaseRef.current !== "running") return;
      const run = runRef.current;
      const dt =
        run.lastTimestamp === null
          ? 0
          : Math.min(MAX_FRAME_MS, timestamp - run.lastTimestamp);
      run.lastTimestamp = timestamp;
      run.distance += (SPEED * dt) / 1000;

      while (run.x < Math.floor(run.distance)) {
        if (!step(run)) {
          run.distance = run.x;
          crashedRef.current = true;
          rememberBest(run.passed);
          setLastScore(run.passed);
          setAttempts((n) => n + 1);
          setPhaseBoth("hit");
          paint();
          return;
        }
        if (run.x >= GOAL) {
          run.distance = GOAL;
          rememberBest(run.passed);
          setLastScore(run.passed);
          setPhaseBoth("goal");
          paint();
          return;
        }
      }

      paint();
      frameRef.current = window.requestAnimationFrame(frame);
    },
    [paint, rememberBest, setPhaseBoth],
  );

  const startLoop = useCallback(() => {
    stopLoop();
    frameRef.current = window.requestAnimationFrame(frame);
  }, [frame, stopLoop]);

  const start = useCallback(() => {
    const run = freshRun();
    // Starttappet er også det første flakset.
    run.flapAt = 1;
    runRef.current = run;
    crashedRef.current = false;
    setPhaseBoth("running");
    paint();
    startLoop();
  }, [paint, setPhaseBoth, startLoop]);

  const tap = useCallback(() => {
    const current = phaseRef.current;
    if (current === "ready" || current === "hit") {
      start();
      return;
    }
    if (current === "paused") {
      runRef.current.lastTimestamp = null;
      setPhaseBoth("running");
      startLoop();
      return;
    }
    if (current !== "running") return;
    const run = runRef.current;
    // Ett flaks per steg, gjelder fra neste steg.
    if (run.flapAt === null) run.flapAt = run.x + 1;
  }, [setPhaseBoth, start, startLoop]);

  const restart = useCallback(() => {
    if (phaseRef.current === "goal") setAttempts(0);
    boxRef.current?.focus({ preventScroll: true });
    start();
  }, [start]);

  // Skarp på høy DPI: lerretet følger bredden, scenen skaleres inn.
  useEffect(() => {
    bestRef.current = readBest();
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (!box || !canvas) return undefined;
    const fit = () => {
      const cssW = box.clientWidth;
      if (cssW <= 0) return;
      const cssH = (cssW * STAGE_H) / STAGE_W;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      scaleRef.current = (cssW * dpr) / STAGE_W;
      paint();
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, [paint]);

  // Pause når fanen er skjult.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && phaseRef.current === "running") {
        stopLoop();
        setPhaseBoth("paused");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stopLoop();
    };
  }, [setPhaseBoth, stopLoop]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    boxRef.current?.focus({ preventScroll: true });
    tap();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === " " || event.key === "ArrowUp" || event.key === "Enter") {
      event.preventDefault();
      if (!event.repeat) tap();
    }
  };

  const stopBubble = (event: ReactPointerEvent) => event.stopPropagation();

  return (
    <div className="mx-auto flex w-full max-w-[520px] flex-col gap-3">
      <div
        className="h-1 overflow-hidden rounded-full bg-black/35"
        aria-hidden
      >
        <div
          ref={progressRef}
          className="h-full origin-left"
          style={{
            transform: "scaleX(0)",
            background: ACCENT,
            boxShadow: `0 0 10px ${ACCENT}`,
          }}
        />
      </div>

      <div
        ref={boxRef}
        role="button"
        tabIndex={0}
        aria-label="Flaks"
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
        onContextMenu={(e) => e.preventDefault()}
        className={cn(
          "relative w-full cursor-pointer overflow-hidden rounded-2xl border select-none",
          "outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2",
        )}
        style={{
          aspectRatio: `${STAGE_W} / ${STAGE_H}`,
          touchAction: "none",
          WebkitTapHighlightColor: "transparent",
          WebkitUserSelect: "none",
          borderColor: "rgba(138, 180, 255, 0.25)",
          background: "#05081C",
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 block h-full w-full"
          aria-hidden
        />

        {(phase === "ready" || phase === "paused") && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
            <p
              className="rounded-full bg-black/55 px-4 py-2 text-base font-semibold tracking-wide"
              style={{ color: ACCENT }}
            >
              {phase === "ready"
                ? "Trykk for å starte"
                : "Pause – trykk for å fortsette"}
            </p>
          </div>
        )}

        {phase === "hit" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 px-4 text-center">
            <p className="text-lg font-bold text-[#FFB38A]">
              Au! Alf traff en regningsbunke
            </p>
            <p className="text-sm text-white/75">
              {lastScore} {lastScore === 1 ? "bunke" : "bunker"} passert av{" "}
              {COURSE.pipes.length}
            </p>
            <Button
              onPointerDown={stopBubble}
              onClick={restart}
              className="h-9 px-4"
            >
              Prøv igjen
            </Button>
          </div>
        )}

        {phase === "goal" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 px-6 text-center">
            <p className="text-lg font-bold" style={{ color: YELLOW }}>
              Alf kom seg til kassen!
            </p>
            <p className="max-w-[34ch] text-sm text-white/85">
              Klart! Dette var bare øving – koden får du bare i det ekte
              spillet.
            </p>
            <Button
              onPointerDown={stopBubble}
              onClick={restart}
              className="h-9 px-4"
            >
              Spill igjen
            </Button>
          </div>
        )}
      </div>

      <p
        className="min-h-[1.25rem] text-sm text-muted-foreground"
        aria-live="polite"
      >
        {phase === "goal"
          ? `Klart på forsøk ${attempts + 1}`
          : attempts > 0
            ? `Forsøk ${attempts + 1}`
            : "Trykk, klikk eller mellomrom for å flakse."}
      </p>
    </div>
  );
}
