import { useCallback, useEffect, useId, useRef, useState } from "react";
import type {
  CSSProperties,
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";

import armFarSrc from "@/assets/kodejakten/alf-arm-far.webp";
import armNearSrc from "@/assets/kodejakten/alf-arm-near.webp";
import headSrc from "@/assets/kodejakten/alf-head.webp";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/*
 * Øvingsversjon av spill 3, «Flappy-Alf». Utseendet er portert fra det ekte
 * spillet (FlyAlf.tsx, AlfFlyger.tsx, Kasse.tsx, spillTema.ts, SpillRamme.tsx
 * og SpillOverlay.tsx): samme DOM-oppbygging, mål, farger og tekster.
 *
 * Spilløkken er en ny implementasjon av reglene: scenen er STAGE_W enheter
 * bred, Alf flyttes ett heltallssteg framover om gangen, og for hvert steg gjelder
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

// ── Farger og tema (Hordes COLORS og spillTema, spill 3) ────────────────────

const C = {
  WHITE_100: "#f2f2f2",
  WHITE_80: "#D9D9D9",
  TRUE_WHITE: "#FFFFFF",
  BLACK_40: "#bdbdbd",
  CORAL: "#FF5E32",
  YELLOW: "#FFD80E",
  SKY: "#C8E9EC",
  DARK_GREEN: "#014639",
  LIME: "#CAD58A",
  PEACH: "#FFD1BA",
  ACCENT: "#8EA1FF", // BRIGHT_BLUE[60]
  CABINET: "#080C1E",
  FIELD:
    "linear-gradient(180deg, #05081C 0%, #101A47 48%, #1F2158 78%, #2C2665 100%)",
} as const;

/** MUI sin alpha() for #RRGGBB. */
const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

/** Merkevarens display-snitt finnes ikke her; nærmeste er en tung sans-serif. */
const DISPLAY_FONT = "var(--font-heading, ui-sans-serif), system-ui, sans-serif";

const COPY = {
  title: "Flappy-Alf",
  instruction:
    "Tapp for å flakse Alf gjennom regningsbunkene frem til pengekassen.",
  tapToStart: "Tapp for å starte",
  tapToRetry: "Au! Tapp for å prøve igjen",
  paused: "Pause – tapp for å fortsette",
  attempt: "Forsøk",
  flap: "Flaks",
  best: "Beste",
  solvedTitle: "Alf kom seg til kassen!",
};

// ── Stjerner og skog: samme fliser som spillTema.ts ─────────────────────────

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
const SKOG_PATH = [
  ...TRAER.map(
    ({ x, w, h }) =>
      `M${x} ${SKOG_TILE_H}L${x + w / 2} ${SKOG_TILE_H - h}L${x + w} ${SKOG_TILE_H}Z`,
  ),
  `M0 ${SKOG_TILE_H - 6}h${SKOG_W}v6H0Z`,
].join("");
const SKOG_BILDE = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${SKOG_W}" height="${SKOG_TILE_H}" viewBox="0 0 ${SKOG_W} ${SKOG_TILE_H}"><path fill="${SKOG_FARGE}" d="${SKOG_PATH}"/></svg>`,
)}")`;

const STJERNE_FLIS_PX = 200;
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
const STJERNE_BILDE = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${STJERNE_FLIS_PX}" height="${STJERNE_FLIS_PX}">${STJERNER.map(
    (s) =>
      `<circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="${C.TRUE_WHITE}" opacity="${s.o}"/>`,
  ).join("")}</svg>`,
)}")`;

// ── Alf: hodet og armene som vinger (AlfFlyger.tsx + alfGeometry.ts) ────────

const FIGURE_ASPECT = 0.28764;
const SHOULDER_NEAR = { x: 0.73278, y: 0.32647 };
const SHOULDER_FAR = { x: 0.26446, y: 0.32647 };
const HEAD_BOX = { left: 0.0496, top: 0.0095, right: 0.9642, bottom: 0.317 };
const HEAD_W = HEAD_BOX.right - HEAD_BOX.left;
const HEAD_H = HEAD_BOX.bottom - HEAD_BOX.top;
const HEAD_ASPECT = (HEAD_W * FIGURE_ASPECT) / HEAD_H;
const HEAD_WIDTH = HEAD_HEIGHT * HEAD_ASPECT;
const WING_NEAR = { pivot: { x: 0.7, y: 0.25 }, rest: -75 };
const WING_FAR = { pivot: { x: 0.27, y: 0.25 }, rest: 75 };
const FLAP_MS = 280;
const FLAP_DEG = 28;
const FAR_SIDE = "brightness(0.78)";

const pct = (value: number) => `${Number((value * 100).toFixed(3))}%`;
const origin = (p: { x: number; y: number }) => `${pct(p.x)} ${pct(p.y)}`;

type WingDef = { pivot: { x: number; y: number }; rest: number };

const wingPose = (shoulder: { x: number; y: number }, wing: WingDef) => {
  const dx = (wing.pivot.x - shoulder.x) * 100;
  const dy = (wing.pivot.y - shoulder.y) * 100;
  return (degrees: number) => `translate(${dx}%, ${dy}%) rotate(${degrees}deg)`;
};

const wingKeyframes = (
  name: string,
  shoulder: { x: number; y: number },
  wing: WingDef,
) => {
  const pose = wingPose(shoulder, wing);
  const up = Math.sign(wing.rest) * FLAP_DEG;
  return `@keyframes ${name}{0%,100%{transform:${pose(wing.rest + up)}}50%{transform:${pose(wing.rest - up)}}}`;
};

const ALF_CSS = [
  wingKeyframes("ovelseAlfWingFar", SHOULDER_FAR, WING_FAR),
  wingKeyframes("ovelseAlfWingNear", SHOULDER_NEAR, WING_NEAR),
  "@media (prefers-reduced-motion: reduce){.ovelse-alf-wing{animation:none!important}}",
].join("");

function Wing({
  src,
  name,
  shoulder,
  wing,
  far,
  flapping,
}: {
  src: string;
  name: string;
  shoulder: { x: number; y: number };
  wing: WingDef;
  far?: boolean;
  flapping: boolean;
}) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      draggable={false}
      className="ovelse-alf-wing"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        maxWidth: "none",
        transformOrigin: origin(shoulder),
        transform: wingPose(shoulder, wing)(wing.rest),
        willChange: "transform",
        filter: far ? FAR_SIDE : undefined,
        animation: `${name} ${FLAP_MS}ms ease-in-out infinite`,
        animationPlayState: flapping ? "running" : "paused",
      }}
    />
  );
}

function AlfFlyger({ height, flapping }: { height: number; flapping: boolean }) {
  return (
    <div
      aria-hidden
      style={{
        position: "relative",
        height: `${height}px`,
        width: `${height * HEAD_ASPECT}px`,
      }}
    >
      {/* Lerretet ligger forskjøvet så hodets omriss fyller boksen */}
      <div
        style={{
          position: "absolute",
          left: `${(-HEAD_BOX.left / HEAD_W) * 100}%`,
          top: `${(-HEAD_BOX.top / HEAD_H) * 100}%`,
          width: `${100 / HEAD_W}%`,
          height: `${100 / HEAD_H}%`,
        }}
      >
        <Wing
          src={armFarSrc}
          name="ovelseAlfWingFar"
          shoulder={SHOULDER_FAR}
          wing={WING_FAR}
          far
          flapping={flapping}
        />
        <Wing
          src={armNearSrc}
          name="ovelseAlfWingNear"
          shoulder={SHOULDER_NEAR}
          wing={WING_NEAR}
          flapping={flapping}
        />
        <img
          src={headSrc}
          alt=""
          aria-hidden
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            maxWidth: "none",
          }}
        />
      </div>
    </div>
  );
}

// ── Regningsbunkene (Stabel/Bunke i FlyAlf.tsx) ─────────────────────────────

function Stabel({
  x,
  top,
  h,
  lip,
}: {
  x: number;
  top: number;
  h: number;
  lip: "top" | "bottom";
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: `${x}px`,
        top: `${top}px`,
        width: `${PIPE_W}px`,
        height: `${h}px`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: C.WHITE_80,
          backgroundImage: `repeating-linear-gradient(180deg, transparent 0 8px, ${C.BLACK_40} 8px 10px)`,
          boxShadow: "inset -6px 0 12px rgba(0, 0, 0, 0.35)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "-3px",
          right: "-3px",
          [lip]: 0,
          height: `${LIP_H}px`,
          backgroundColor: C.TRUE_WHITE,
          borderRadius: "2px",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "5px",
            right: "5px",
            top: "4px",
            height: "4px",
            backgroundColor: C.CORAL,
            borderRadius: "1px",
          }}
        />
      </div>
    </div>
  );
}

function Bunke({ x, pipe }: { x: number; pipe: Pipe }) {
  return (
    <>
      <Stabel x={x} top={0} h={pipe.gap} lip="bottom" />
      <Stabel
        x={x}
        top={pipe.gap + pipe.h}
        h={STAGE_H - pipe.gap - pipe.h}
        lip="top"
      />
    </>
  );
}

// ── Kassen (Kasse.tsx) ───────────────────────────────────────────────────────

const KASSE_W = 48;
const KASSE_H = 40;
const HALO = 34;

function Kasse({ x, ground }: { x: number; ground: number }) {
  const id = `kasseLys-${useId().replace(/:/g, "")}`;
  return (
    <svg
      viewBox={`${-HALO} ${-HALO} ${KASSE_W + HALO * 2} ${KASSE_H + HALO * 2}`}
      width={KASSE_W + HALO * 2}
      height={KASSE_H + HALO * 2}
      style={{
        position: "absolute",
        left: `${x - HALO}px`,
        top: `${ground - KASSE_H - HALO}px`,
        display: "block",
        pointerEvents: "none",
      }}
      aria-hidden
    >
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor={C.YELLOW} stopOpacity={0.55} />
          <stop offset="55%" stopColor={C.YELLOW} stopOpacity={0.14} />
          <stop offset="100%" stopColor={C.YELLOW} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle
        cx={KASSE_W / 2}
        cy={KASSE_H / 2}
        r={KASSE_W / 2 + HALO}
        fill={`url(#${id})`}
      />
      <rect
        x={2}
        y={10}
        width={44}
        height={30}
        rx={4}
        fill={C.DARK_GREEN}
        stroke={C.LIME}
        strokeWidth={1.5}
      />
      <rect x={0} y={6} width={48} height={10} rx={3} fill={C.YELLOW} />
      <circle cx={24} cy={27} r={4} fill={C.YELLOW} />
      <rect x={22.4} y={27} width={3.2} height={7} fill={C.YELLOW} />
    </svg>
  );
}

// ── Merkelappen midt på brettet (SpillOverlay.tsx) ──────────────────────────

function SpillOverlay({ text, color }: { text: string; color: string }) {
  if (!text) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
      aria-live="polite"
    >
      <p
        className="m-0 max-w-[84%] rounded-full px-8 py-4 text-center text-[18px] leading-[1.6] font-bold sm:text-[20px]"
        style={{
          color: C.TRUE_WHITE,
          backgroundColor: "rgba(0, 0, 0, 0.62)",
          border: `2px solid ${alpha(color, 0.85)}`,
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          boxShadow: `0 0 28px ${alpha(color, 0.4)}`,
        }}
      >
        {text}
      </p>
    </div>
  );
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

const alfTransform = (y: number, tilt: number) =>
  `translateY(${y - HEAD_HEIGHT / 2}px) rotate(${tilt}deg)`;

export function FlappyAlfOvelse() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [attempts, setAttempts] = useState(0);
  const [best, setBest] = useState(0);

  const phaseRef = useRef<Phase>("ready");
  const runRef = useRef<Run>(freshRun());
  const bestRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const alfRef = useRef<HTMLDivElement>(null);
  const stjernerRef = useRef<HTMLDivElement>(null);
  const skogRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);

  const setPhaseBoth = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  /** Samme som paint() i originalen: bare transformer, ingen React-rendering. */
  const paint = useCallback((run: Run, crashed = false) => {
    if (worldRef.current) {
      worldRef.current.style.transform = `translateX(${-run.distance}px)`;
    }
    if (alfRef.current) {
      const tilt = crashed
        ? TILT_HIT
        : Math.max(TILT_MIN, Math.min(TILT_MAX, run.v * TILT_PER_V));
      alfRef.current.style.transform = alfTransform(run.y, tilt);
    }
    if (stjernerRef.current) {
      stjernerRef.current.style.backgroundPositionX = `${-run.distance * STJERNE_PARALLAKSE}px`;
    }
    if (skogRef.current) {
      skogRef.current.style.backgroundPositionX = `${-run.distance * SKOG_PARALLAKSE}px`;
    }
    if (progressRef.current) {
      progressRef.current.style.transform = `scaleX(${Math.min(1, run.distance / GOAL)})`;
    }
    if (scoreRef.current) {
      scoreRef.current.textContent = String(run.passed);
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
    setBest(score);
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
          paint(run, true);
          rememberBest(run.passed);
          setAttempts((n) => n + 1);
          setPhaseBoth("hit");
          return;
        }
        if (run.x >= GOAL) {
          run.distance = GOAL;
          paint(run);
          rememberBest(run.passed);
          setPhaseBoth("goal");
          return;
        }
      }

      paint(run);
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
    // Starttappet er også det første flakset, så han løfter i stedet for å falle.
    run.flapAt = 1;
    runRef.current = run;
    paint(run);
    setPhaseBoth("running");
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
    // Ett flaks per steg. Det gjelder fra neste steg.
    if (run.flapAt === null) run.flapAt = run.x + 1;
  }, [setPhaseBoth, start, startLoop]);

  const playAgain = useCallback(() => {
    setAttempts(0);
    viewportRef.current?.focus({ preventScroll: true });
    start();
  }, [start]);

  useEffect(() => {
    bestRef.current = readBest();
    setBest(bestRef.current);
  }, []);

  // Scenen er STAGE_W enheter bred og skaleres til visningens bredde.
  useEffect(() => {
    const viewport = viewportRef.current;
    const stage = stageRef.current;
    if (!viewport || !stage) return undefined;
    const fit = () => {
      stage.style.transform = `scale(${viewport.clientWidth / STAGE_W})`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  // Pause når fanen er skjult; rydd opp ved avmontering.
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
    viewportRef.current?.focus({ preventScroll: true });
    tap();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === " " || event.key === "ArrowUp" || event.key === "Enter") {
      event.preventDefault();
      if (!event.repeat) tap();
    }
  };

  const overlay =
    phase === "ready"
      ? COPY.tapToStart
      : phase === "hit"
        ? COPY.tapToRetry
        : phase === "paused"
          ? COPY.paused
          : "";

  const scoreStyle: CSSProperties = {
    position: "absolute",
    top: "10px",
    left: 0,
    right: 0,
    margin: 0,
    fontFamily: DISPLAY_FONT,
    fontWeight: 900,
    fontSize: "38px",
    lineHeight: 1,
    letterSpacing: "0.04em",
    textAlign: "center",
    color: C.YELLOW,
    fontVariantNumeric: "tabular-nums",
    pointerEvents: "none",
    textShadow: `0 0 4px rgba(0, 0, 0, 0.9), 0 2px 8px rgba(0, 0, 0, 0.8), 0 0 18px ${alpha(C.YELLOW, 0.5)}`,
  };

  return (
    // Kabinettet (SpillRamme.tsx), med spillets mørke tone og blå glød
    <section
      className="relative mx-auto flex w-full max-w-[520px] flex-col gap-5 overflow-hidden rounded-[20px] p-5 sm:p-7"
      style={{
        backgroundColor: C.CABINET,
        border: `1px solid ${alpha(C.ACCENT, 0.28)}`,
        boxShadow: `0 28px 70px -40px ${alpha(C.ACCENT, 0.9)}, inset 0 1px 0 rgba(255, 255, 255, 0.07)`,
      }}
    >
      <style>{ALF_CSS}</style>
      <div
        aria-hidden
        className="absolute top-0 right-0 left-0 z-[1] h-0.5"
        style={{
          background: `linear-gradient(90deg, transparent, ${C.ACCENT}, transparent)`,
          opacity: 0.85,
        }}
      />
      <div className="flex flex-col gap-1.5">
        <h2
          className="m-0 text-2xl leading-[1.33] font-black"
          style={{ color: C.WHITE_100, fontFamily: DISPLAY_FONT }}
        >
          {COPY.title}
        </h2>
        <p
          className="m-0 text-base leading-[1.6]"
          style={{ color: alpha(C.WHITE_100, 0.7) }}
        >
          {COPY.instruction}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div
          aria-hidden
          className="h-1 overflow-hidden rounded-[2px]"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.35)" }}
        >
          <div
            ref={progressRef}
            className="h-full"
            style={{
              backgroundColor: C.ACCENT,
              transformOrigin: "0 50%",
              transform: "scaleX(0)",
              boxShadow: `0 0 10px ${C.ACCENT}`,
            }}
          />
        </div>

        <div
          ref={viewportRef}
          role="button"
          tabIndex={0}
          aria-label={COPY.flap}
          onPointerDown={onPointerDown}
          onKeyDown={onKeyDown}
          onContextMenu={(e) => e.preventDefault()}
          className={cn(
            "relative w-full cursor-pointer overflow-hidden rounded-2xl select-none",
            "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2f2f2]",
          )}
          style={{
            aspectRatio: `${STAGE_W} / ${STAGE_H}`,
            background: C.FIELD,
            border: `1px solid ${alpha(C.ACCENT, 0.25)}`,
            touchAction: "none",
            WebkitUserSelect: "none",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <div
            ref={stageRef}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: `${STAGE_W}px`,
              height: `${STAGE_H}px`,
              transformOrigin: "0 0",
            }}
          >
            {/* Stjernehimmelen, nesten i ro, og månen som står helt stille */}
            <div
              ref={stjernerRef}
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: STJERNE_BILDE,
                backgroundRepeat: "repeat",
                backgroundSize: `${STJERNE_FLIS_PX}px ${STJERNE_FLIS_PX}px`,
              }}
            />
            <div
              style={{
                position: "absolute",
                right: "58px",
                top: "26px",
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                backgroundColor: C.SKY,
                boxShadow: `0 0 44px 14px ${alpha(C.SKY, 0.3)}`,
              }}
            />
            {/* Skogen under ham */}
            <div
              ref={skogRef}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: `${STAGE_H - SKOG_H}px`,
                height: `${SKOG_H}px`,
                backgroundImage: SKOG_BILDE,
                backgroundRepeat: "repeat-x",
                backgroundSize: `${SKOG_W}px ${SKOG_H}px`,
                backgroundPosition: "0 bottom",
              }}
            />
            {/* Bakken */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: `${STAGE_H - 2}px`,
                height: "2px",
                backgroundColor: C.ACCENT,
                boxShadow: `0 0 12px ${alpha(C.ACCENT, 0.8)}`,
              }}
            />

            {/* Verden flyttes mot venstre; Alf står stille på scenen. */}
            <div
              ref={worldRef}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: "100%",
                width: 0,
                willChange: "transform",
              }}
            >
              {COURSE.pipes.map((pipe) => (
                <Bunke key={pipe.x} x={pipe.x + ALF_X} pipe={pipe} />
              ))}
              <Kasse x={GOAL + ALF_X} ground={STAGE_H - 2} />
            </div>

            <div
              ref={alfRef}
              style={{
                position: "absolute",
                left: `${ALF_X - HEAD_WIDTH / 2}px`,
                top: 0,
                transformOrigin: "50% 50%",
                transform: alfTransform(START_Y, 0),
                willChange: "transform",
              }}
            >
              <AlfFlyger height={HEAD_HEIGHT} flapping={phase === "running"} />
            </div>

            {/* Poeng midt oppe, som i originalen; beste i hjørnet */}
            <p aria-hidden style={scoreStyle}>
              <span ref={scoreRef}>0</span>
            </p>
            <p
              aria-hidden
              style={{
                position: "absolute",
                top: "12px",
                right: "16px",
                margin: 0,
                fontSize: "16px",
                lineHeight: 1.6,
                color: alpha(C.WHITE_100, 0.6),
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "0.1em",
              }}
            >
              {COPY.best} {best}
            </p>
          </div>

          <SpillOverlay
            text={overlay}
            color={phase === "hit" ? C.PEACH : C.ACCENT}
          />

          {phase === "goal" && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center p-4"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div
                className="flex max-w-[88%] flex-col items-center gap-3 rounded-3xl px-6 py-5 text-center"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.62)",
                  border: `2px solid ${alpha(C.ACCENT, 0.85)}`,
                  backdropFilter: "blur(4px)",
                  WebkitBackdropFilter: "blur(4px)",
                  boxShadow: `0 0 28px ${alpha(C.ACCENT, 0.4)}`,
                }}
              >
                <p
                  className="m-0 text-xl leading-tight font-black"
                  style={{ color: C.YELLOW, fontFamily: DISPLAY_FONT }}
                >
                  {COPY.solvedTitle}
                </p>
                <p
                  className="m-0 text-sm leading-normal"
                  style={{ color: alpha(C.WHITE_100, 0.85) }}
                >
                  Klart! Dette var bare øving – koden får du bare i det ekte
                  spillet.
                </p>
                <Button
                  onClick={playAgain}
                  className="h-9 rounded-full px-5 font-bold"
                  style={{ backgroundColor: C.ACCENT, color: "#05081C" }}
                >
                  Spill igjen
                </Button>
              </div>
            </div>
          )}
        </div>

        <p
          className="m-0 min-h-[26px] text-base leading-[1.6]"
          style={{ color: alpha(C.WHITE_100, 0.6) }}
          aria-live="polite"
        >
          {attempts > 0 ? `${COPY.attempt} ${attempts + 1}` : ""}
        </p>
      </div>
    </section>
  );
}
