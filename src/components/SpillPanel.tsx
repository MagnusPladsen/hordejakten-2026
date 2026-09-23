import { useMemo, useState } from "react";
import { ExternalLink, Gamepad2, Plus, Trash2 } from "lucide-react";

import { OvelseModal, type SpillNr } from "@/components/ovelse/OvelseModal";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Op = "add" | "sub" | "mul" | "div";

const FARGER: Record<Op, { navn: string; tegn: string; klasse: string }> = {
  add: { navn: "Blå", tegn: "+", klasse: "bg-sky-500 text-white" },
  sub: { navn: "Gul", tegn: "−", klasse: "bg-yellow-400 text-slate-900" },
  mul: { navn: "Rosa", tegn: "×", klasse: "bg-pink-500 text-white" },
  div: { navn: "Lilla", tegn: "÷", klasse: "bg-purple-600 text-white" },
};

const SPILL: { nr: number; navn: string; hva: string; tips: string[] }[] = [
  {
    nr: 1,
    navn: "Kill the Bill",
    hva: "Hold fingeren på skjermen for å flytte Alf og skyte. Tre nivåer: Regningsbunken, Purringene og bossen Hovedkravet (1 116 897).",
    tips: [
      "Du har 3 skjold. Kapsler som faller gir +1 skjold eller kraftigere skudd, så ta dem.",
      "Bare kjernen av hodet er treffboksen. Håret, skroget og flammen er trygge, så du kan ligge tett inntil skudd.",
      "Bossen tåler 44 treff og svaier over hele bredden. Hold deg under den og skyt hele tiden.",
      "Skyt ned regninger raskt etter hverandre for en poengmultiplikator (opp til ×5). Poeng betyr ikke noe for koden.",
    ],
  },
  {
    nr: 2,
    navn: "Bill Runner",
    hva: "Tapp for å hoppe over regningene. Kom helt fram til kassen uten å snuble.",
    tips: [
      "Banen er lik hver gang du prøver på nytt. Lær deg rytmen.",
      "Farten øker jo lenger du kommer, så hoppene må komme litt tidligere mot slutten.",
      "Et hopp klarer en regning bare hvis hele regningen er under deg mens du er i lufta. Hopp litt før, ikke rett ved.",
    ],
  },
  {
    nr: 3,
    navn: "Flappy-Alf",
    hva: "Tapp for å flakse Alf gjennom åpningene i regningsbunkene fram til pengekassen.",
    tips: [
      "Banen er lik hver gang. Åpningene er ulike og krymper utover i banen.",
      "Farten framover er jevn. Det er bare høyden du styrer.",
      "Små, jevne tapp er bedre enn store. Taket stopper deg, så det er bunkene du må passe deg for.",
    ],
  },
  {
    nr: 4,
    navn: "Dartskiven",
    hva: "Start med tallet i midten og regn deg utover, én ring om gangen. Du må ha fire riktige skiver på rad.",
    tips: [
      "Blå = pluss, gul = minus, rosa = gange, lilla = dele (fra spillet Blue Prince, bekreftet i kildekoden).",
      "Hvert farget felt i en ring peker på et tall (1–20) langs kanten. Bruk ringens regnetegn med hvert av dem.",
      "Svaret er alltid mellom 1 og 999. Feil svar gir en ny skive og starter tellingen på null.",
      "Bruk kalkulatoren under.",
    ],
  },
];

type Ring = { op: Op; tall: string };

/** Regner ut dartskiven: start i midten, så hver ring utover med ringens regnetegn */
function regnUt(start: number, ringer: Ring[]) {
  let v = start;
  const steg: string[] = [`Start: ${start}`];
  for (const [i, r] of ringer.entries()) {
    const tall = r.tall
      .split(/[\s,;]+/)
      .map((t) => Number(t))
      .filter((t) => Number.isFinite(t) && t > 0);
    for (const t of tall) {
      if (r.op === "add") v += t;
      if (r.op === "sub") v -= t;
      if (r.op === "mul") v *= t;
      if (r.op === "div") v /= t;
    }
    if (tall.length)
      steg.push(
        `Ring ${i + 1} (${FARGER[r.op].navn} ${FARGER[r.op].tegn} ${tall.join(", ")}): ${Number.isInteger(v) ? v : v.toFixed(3)}`,
      );
  }
  return { svar: v, steg };
}

function Dartkalkulator() {
  const [start, setStart] = useState("");
  const [ringer, setRinger] = useState<Ring[]>([{ op: "add", tall: "" }]);
  const res = useMemo(
    () => (start ? regnUt(Number(start), ringer) : null),
    [start, ringer],
  );
  const oppdater = (i: number, endring: Partial<Ring>) =>
    setRinger((r) => r.map((x, j) => (j === i ? { ...x, ...endring } : x)));

  return (
    <section className="rounded-2xl border-2 border-primary/40 bg-card p-4">
      <h3 className="text-[16px] font-semibold">Dartskive-kalkulator</h3>
      <p className="mt-0.5 text-[13px] text-muted-foreground">
        Skriv inn tallet i midten, og så hver ring innenfra og ut: fargen og
        tallene feltene peker på.
      </p>

      <div className="@[46rem]:grid @[46rem]:grid-cols-2 @[46rem]:items-start @[46rem]:gap-5">
        <div>
          <label
            className="mt-3 block text-[13.5px] font-semibold"
            htmlFor="dart-start"
          >
            Tallet i midten
          </label>
          <Input
            id="dart-start"
            inputMode="numeric"
            className="mt-1 font-mono text-lg"
            placeholder="f.eks. 13"
            value={start}
            onChange={(e) => setStart(e.target.value.replace(/[^0-9]/g, ""))}
          />

          <div className="mt-3 space-y-3">
            {ringer.map((r, i) => (
              <div key={i} className="rounded-xl bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[13.5px] font-semibold">Ring {i + 1}</p>
                  {ringer.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        setRinger((x) => x.filter((_, j) => j !== i))
                      }
                      aria-label={`Fjern ring ${i + 1}`}
                    >
                      <Trash2 />
                    </Button>
                  )}
                </div>
                <div
                  className="mt-2 grid grid-cols-4 gap-1.5"
                  role="radiogroup"
                  aria-label={`Farge på ring ${i + 1}`}
                >
                  {(Object.keys(FARGER) as Op[]).map((op) => (
                    <button
                      key={op}
                      type="button"
                      role="radio"
                      aria-checked={r.op === op}
                      onClick={() => oppdater(i, { op })}
                      className={cn(
                        "min-h-11 rounded-lg text-[13.5px] font-semibold ring-offset-2 transition",
                        FARGER[op].klasse,
                        r.op === op ? "ring-2 ring-slate-900" : "opacity-45",
                      )}
                    >
                      {FARGER[op].navn} {FARGER[op].tegn}
                    </button>
                  ))}
                </div>
                <Input
                  className="mt-2 bg-white font-mono"
                  inputMode="numeric"
                  placeholder="Tallene feltene peker på, f.eks. 7 16"
                  value={r.tall}
                  onChange={(e) => oppdater(i, { tall: e.target.value })}
                  aria-label={`Tall for ring ${i + 1}`}
                />
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            className="mt-3 w-full"
            onClick={() => setRinger((r) => [...r, { op: "add", tall: "" }])}
          >
            <Plus /> Legg til ring
          </Button>
        </div>

        <div className="@[46rem]:sticky @[46rem]:top-0 @[46rem]:pt-3">
          {!res && (
            <div className="mt-4 hidden rounded-xl border border-dashed p-4 text-[13.5px] text-muted-foreground @[46rem]:mt-0 @[46rem]:block">
              Svaret og utregningen vises her når du har skrevet inn tallet i
              midten.
            </div>
          )}

          {res && (
            <div
              className="mt-4 rounded-xl bg-slate-900 p-4 text-white @[46rem]:mt-0"
              aria-live="polite"
            >
              <p className="text-[12px] font-semibold tracking-wider text-slate-300 uppercase">
                Svar
              </p>
              <p className="font-mono text-3xl font-bold">
                {Number.isInteger(res.svar) ? res.svar : res.svar.toFixed(3)}
              </p>
              {(!Number.isInteger(res.svar) ||
                res.svar < 1 ||
                res.svar > 999) && (
                <p className="mt-1 text-[13px] text-amber-300">
                  Svaret skal være et helt tall mellom 1 og 999. Sjekk fargene
                  og tallene.
                </p>
              )}
              <ul className="mt-2 space-y-0.5 font-mono text-[12.5px] text-slate-300">
                {res.steg.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          <Button
            variant="ghost"
            className="mt-2 w-full"
            onClick={() => {
              setStart("");
              setRinger([{ op: "add", tall: "" }]);
            }}
          >
            Nullstill
          </Button>
        </div>
      </div>
    </section>
  );
}

export function SpillPanel() {
  const [ovelse, setOvelse] = useState<SpillNr | null>(null);
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Kodejakten</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Fire spill gir koden til én av de to hengelåsene på pengeboksen (det
          er 3 låser: 2 på boksen, 1 på døra for Anja). Slik løser du dem,
          hentet fra spillets egen kildekode.
        </p>
      </div>

      <section className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 p-4">
        <h3 className="text-[16px] font-semibold">Når alle fire er klart</h3>
        <p className="mt-2 rounded-xl bg-white p-3 text-[15px] leading-snug text-slate-900 ring-1 ring-emerald-200">
          Siden viser{" "}
          <b className="font-bold">
            «Låsen er åpen: dette er koden til den ene hengelåsen på kassen»
          </b>
          . Koden har <b>4 siffer</b> og kommer fram automatisk, ett siffer om
          gangen.
        </p>
        <ul className="mt-3 space-y-1.5 text-[14px] leading-snug text-slate-600 @[46rem]:columns-2 @[46rem]:gap-6 @[46rem]:space-y-0 [&>li]:break-inside-avoid @[46rem]:[&>li]:mb-1.5">
          <li>
            Du må ikke åpne noen lås selv i spillet. Gradene som går rundt (5°,
            −41°, −30°, −34°) er bare animasjonen av bøylen som svinger opp.
          </li>
          <li>
            Koden ligger ikke i nettsiden. Serveren gir den først når den har
            spilt av trekkene dine og godkjent alle fire spill.
          </li>
          <li>
            Fremgangen lagres, så du kan ta pauser mellom spillene.
            Hjelpeknappen sier bare «Tips: Vær bedre».
          </li>
          <li>Figuren «Alf» er Horde-mannen fra videoene, ikke Alf Prøysen.</li>
        </ul>
      </section>

      <div className="grid gap-3 @[46rem]:grid-cols-[1fr_auto] @[46rem]:items-center">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-[14.5px] leading-relaxed text-amber-900">
          <p className="font-semibold">Ikke aktiv ennå (23.09)</p>
          <p className="mt-0.5">
            Serveren som gir koden svarer «not_configured». Spillene laster, men
            ingen kan få koden før Horde skrur den på.
          </p>
        </div>
        <Button asChild className="w-full @[46rem]:w-auto @[46rem]:px-6">
          <a
            href="https://horde.no/secret/kodejakten"
            target="_blank"
            rel="noopener"
          >
            Åpne Kodejakten <ExternalLink />
          </a>
        </Button>
      </div>

      <ol className="grid gap-2.5 @[46rem]:grid-cols-2">
        {SPILL.map((s) => (
          <li key={s.nr} className="flex flex-col rounded-2xl border bg-card p-4">
            <p className="text-[12px] font-semibold tracking-wider text-muted-foreground uppercase">
              Spill {s.nr} av 4
            </p>
            <h3 className="text-[16px] font-semibold">{s.navn}</h3>
            <p className="mt-1 text-[14.5px] leading-relaxed text-slate-700">
              {s.hva}
            </p>
            <ul className="mt-2 space-y-1.5">
              {s.tips.map((t) => (
                <li
                  key={t}
                  className="flex gap-2 text-[14px] leading-snug text-slate-600"
                >
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-3">
              <Button
                variant="outline"
                className="w-full border-primary/40 text-primary hover:bg-primary/5"
                onClick={() => setOvelse(s.nr as SpillNr)}
              >
                <Gamepad2 /> Øv på {s.navn}
              </Button>
            </div>
          </li>
        ))}
      </ol>

      <Dartkalkulator />
      <OvelseModal nr={ovelse} onLukk={() => setOvelse(null)} />
    </div>
  );
}
