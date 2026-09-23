import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Gamepad2, RefreshCw } from "lucide-react";

import { OvelseModal, type SpillNr } from "@/components/ovelse/OvelseModal";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      "Øv med knappen under. «Vis fasit» viser utregningen steg for steg.",
    ],
  },
];

type Status = {
  klar: boolean | null;
  status: number;
  kode: string | null;
  sjekket: string;
};

const klokke = (iso: string) =>
  new Date(iso).toLocaleTimeString("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

/** Spør vår egen funksjon (api/kodejakten.ts) om Horde har skrudd på spillet. Sjekker hvert minutt. */
function KodejaktenStatus() {
  const [status, setStatus] = useState<Status | null>(null);
  const [sjekker, setSjekker] = useState(false);
  const [feil, setFeil] = useState(false);
  const forrige = useRef<boolean | null>(null);

  const sjekk = useCallback(async () => {
    setSjekker(true);
    try {
      const r = await fetch(
        `/api/kodejakten?t=${Math.floor(Date.now() / 60000)}`,
        { signal: AbortSignal.timeout(12000) },
      );
      if (!r.ok) throw new Error(String(r.status));
      const s = (await r.json()) as Status;
      if (s.klar && forrige.current === false)
        toast.success("Kodejakten er oppe nå!", {
          description: "Serveren svarer. Åpne spillet og prøv.",
          duration: 20000,
        });
      forrige.current = s.klar;
      setStatus(s);
      setFeil(false);
    } catch {
      setFeil(true);
    } finally {
      setSjekker(false);
    }
  }, []);

  useEffect(() => {
    void sjekk();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void sjekk();
    }, 60000);
    return () => window.clearInterval(id);
  }, [sjekk]);

  const klar = status?.klar === true;
  const stil = klar
    ? "border-emerald-300 bg-emerald-50 text-emerald-900"
    : feil || status?.klar === null
      ? "border-slate-200 bg-slate-50 text-slate-700"
      : "border-amber-200 bg-amber-50 text-amber-900";

  return (
    <div
      className={cn(
        "rounded-2xl border p-3.5 text-[14.5px] leading-relaxed",
        stil,
      )}
      aria-live="polite"
    >
      <p className="flex items-center gap-2 font-semibold">
        <span
          className={cn(
            "size-2.5 shrink-0 rounded-full",
            klar
              ? "live-puls bg-emerald-500"
              : feil
                ? "bg-slate-400"
                : "bg-amber-500",
          )}
        />
        {!status && !feil
          ? "Sjekker om spillet er oppe …"
          : klar
            ? "Kodejakten er oppe!"
            : feil || status?.klar === null
              ? "Fikk ikke sjekket akkurat nå"
              : "Ikke aktiv ennå"}
      </p>
      <p className="mt-0.5">
        {klar
          ? "Serveren som gir koden svarer. Åpne spillet og spill alle fire."
          : feil || status?.klar === null
            ? "Prøver igjen om et minutt."
            : "Serveren som gir koden svarer «not_configured». Ingen kan få koden før Horde skrur den på."}
      </p>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <p className="text-[12.5px] opacity-80">
          {status ? `Sjekket kl. ${klokke(status.sjekket)}` : ""} · sjekker
          hvert minutt
        </p>
        <Button
          variant="outline"
          size="sm"
          className="bg-white"
          onClick={() => void sjekk()}
          disabled={sjekker}
        >
          <RefreshCw className={cn(sjekker && "animate-spin")} /> Sjekk nå
        </Button>
      </div>
    </div>
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

      <div className="flex flex-col gap-3 @[46rem]:flex-row @[46rem]:items-start">
        <section className="min-w-0 flex-1 rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 p-4">
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
              Du må ikke åpne noen lås selv i spillet. Gradene som går rundt
              (5°, −41°, −30°, −34°) er bare animasjonen av bøylen som svinger
              opp.
            </li>
            <li>
              Koden ligger ikke i nettsiden. Serveren gir den først når den har
              spilt av trekkene dine og godkjent alle fire spill.
            </li>
            <li>
              Fremgangen lagres, så du kan ta pauser mellom spillene.
              Hjelpeknappen sier bare «Tips: Vær bedre».
            </li>
            <li>
              Figuren «Alf» er Horde-mannen fra videoene, ikke Alf Prøysen.
            </li>
          </ul>
        </section>
        <div className="flex flex-col gap-3 @[46rem]:w-[20rem] @[46rem]:shrink-0">
          <KodejaktenStatus />
          <Button asChild className="w-full">
            <a
              href="https://horde.no/secret/kodejakten"
              target="_blank"
              rel="noopener"
            >
              Åpne Kodejakten <ExternalLink />
            </a>
          </Button>
        </div>
      </div>

      <ol className="grid gap-2.5 @[46rem]:grid-cols-2">
        {SPILL.map((s) => (
          <li
            key={s.nr}
            className="flex flex-col rounded-2xl border bg-card p-4"
          >
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

      <OvelseModal nr={ovelse} onLukk={() => setOvelse(null)} />
    </div>
  );
}
