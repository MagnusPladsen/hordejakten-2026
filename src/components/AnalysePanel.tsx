import { AudioLines, Bird, ExternalLink, Map as MapIcon, Plane, ShieldCheck } from 'lucide-react'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import analyseData from '@/data/analyse.json'

type Analyse = {
  kreditering: { defaultno: string; vercel: string }
  lyd: {
    timer: number
    filer: number
    sjekket: number
    kopier08: number
    kopier06: number
    lags: { timer: number; antall: number }[]
    oppdatert: string
    eksempler: { fra: string; lik: string; korr: number }[]
  }
  lydtyper: { tag: string; antall: number }[]
  flylyder: { tid: string; dato: string; svar: string }[]
  fugler: { norsk: string; latin: string; antall: number }[]
  kommuner: { usikkert: string[]; teller: Record<string, number> }
  vercelFakta: string[]
}

const TAGGER: Record<string, string> = {
  wind: 'Vind',
  speech: 'Tale',
  aircraft: 'Fly',
  aircraft_candidate: 'Mulig fly',
  train: 'Tog',
  dog: 'Hund',
  siren: 'Sirene',
  gunshot: 'Skudd',
  bell: 'Klokke',
  music: 'Musikk',
}

const SVAR: Record<string, { tekst: string; klasse: string }> = {
  plane: { tekst: 'Fly', klasse: 'bg-sky-50 text-sky-700 ring-sky-200' },
  not: { tekst: 'Ikke fly', klasse: 'bg-slate-100 text-slate-600 ring-slate-200' },
  unsure: { tekst: 'Usikker', klasse: 'bg-amber-50 text-amber-800 ring-amber-200' },
}

function Kilde({ tekst, url, navn }: { tekst: string; url: string; navn: string }) {
  return (
    <p className="mt-3 rounded-lg bg-slate-50 p-2.5 text-[12.5px] leading-snug text-slate-600">
      <b>Kilde og kreditt:</b> {tekst}{' '}
      <a href={url} target="_blank" rel="noopener" className="font-semibold text-primary underline underline-offset-2">
        {navn}
      </a>
    </p>
  )
}

function Tittel({ ikon: Ikon, tittel, tekst }: { ikon: typeof AudioLines; tittel: string; tekst: string }) {
  return (
    <span className="flex min-w-0 items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100">
        <Ikon className="size-4.5 text-slate-700" />
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold">{tittel}</span>
        <span className="block text-[13px] font-normal text-muted-foreground">{tekst}</span>
      </span>
    </span>
  )
}

export function AnalysePanel({ onVisKommuner }: { onVisKommuner: () => void }) {
  // Dataen er bygget inn i appen, så fanen virker selv om nettet er ustabilt
  const a = analyseData as unknown as Analyse
  const maksTag = Math.max(...a.lydtyper.map((t) => t.antall))

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Analyse</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Lyd, fugler, fly og kommunevurderinger fra andre som leter. Alt er hentet fra deres åpne sider, med kreditt under hver del.
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-4 text-[13.5px] leading-relaxed">
        <p className="font-semibold">Takk til</p>
        <ul className="mt-1 space-y-1 text-slate-600">
          <li>
            <a href="https://default.no" target="_blank" rel="noopener" className="font-semibold text-primary underline underline-offset-2">
              default.no
            </a>{' '}
            for lydanalyse, fuglegjenkjenning, lydtagger, flyklipp og mye av dataen i appen.
          </li>
          <li>
            <a href="https://hordejakten.vercel.app" target="_blank" rel="noopener" className="font-semibold text-primary underline underline-offset-2">
              hordejakten.vercel.app
            </a>{' '}
            for kommunevurderingene og bekreftet-lista.
          </li>
        </ul>
      </div>

      <Accordion type="multiple" defaultValue={['lyd']} className="rounded-2xl border bg-card px-4">
        <AccordionItem value="lyd">
          <AccordionTrigger className="py-3.5">
            <Tittel ikon={AudioLines} tittel="Lyden på streamen går i loop" tekst="Samme minutt gjentas etter ca. 24 og 48 timer" />
          </AccordionTrigger>
          <AccordionContent className="space-y-3 text-[14px] leading-relaxed text-slate-700">
            <p>
              default.no har sammenlignet {a.lyd.sjekket} minutter mot {a.lyd.timer} timer lyd ({a.lyd.filer} filer). {a.lyd.kopier08} minutter har en nesten identisk kopi
              (korrelasjon over 0,8) et annet sted i opptaket. Konklusjonen: <b>lyden er ikke direkte, den spilles av på nytt i loop.</b>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {a.lyd.lags.slice(0, 4).map((l) => (
                <div key={l.timer} className="rounded-xl bg-slate-50 p-3">
                  <p className="font-mono text-lg font-semibold text-primary">{l.timer} t</p>
                  <p className="text-[12.5px] text-muted-foreground">avstand, {l.antall} treff</p>
                </div>
              ))}
            </div>
            <p className="font-semibold">Eksempler på like minutter</p>
            <ul className="space-y-1 font-mono text-[12.5px]">
              {a.lyd.eksempler.map((e) => (
                <li key={e.fra}>
                  {e.fra.slice(5, 16)} = {e.lik.slice(5, 16)} <span className="text-muted-foreground">(korr. {e.korr})</span>
                </li>
              ))}
            </ul>
            <p className="rounded-lg bg-amber-50 p-2.5 text-[13.5px] text-amber-900">
              Betyr: lyder på streamen (fly, tog, fugler, skudd) sier ikke noe sikkert om stedet. Anja skrev også «LYDTETT» om kassen. Stol på det hun skriver, og på det som
              synes i bildet.
            </p>
            <Button asChild variant="outline" size="sm">
              <a href="https://default.no/dupedaudio.php" target="_blank" rel="noopener">
                Hør A/B-sammenligningen <ExternalLink />
              </a>
            </Button>
            <Kilde tekst={`Lydanalyse fra default.no, oppdatert ${a.lyd.oppdatert}.`} url="https://default.no/dupedaudio.php" navn="default.no/dupedaudio" />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="typer">
          <AccordionTrigger className="py-3.5">
            <Tittel ikon={AudioLines} tittel="Lydtyper som er gjenkjent" tekst={`${a.lydtyper.reduce((s, t) => s + t.antall, 0)} lydklipp, sortert automatisk`} />
          </AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-1.5">
              {a.lydtyper.map((t) => (
                <li key={t.tag} className="grid grid-cols-[6.5rem_1fr_3rem] items-center gap-2 text-[13.5px]">
                  <span>{TAGGER[t.tag] ?? t.tag}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <span className="block h-full rounded-full bg-slate-500" style={{ width: `${Math.max(2, (100 * Math.log(1 + t.antall)) / Math.log(1 + maksTag))}%` }} />
                  </span>
                  <span className="text-right font-mono text-[12.5px] text-muted-foreground">{t.antall}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[13px] text-muted-foreground">Nesten alt er vind. Tog, sirene og skudd har lav sikkerhet og kan være feilgjenkjenning. Skalaen er logaritmisk.</p>
            <Kilde tekst="Automatisk lydgjenkjenning (YAMNet) fra default.no." url="https://default.no/clips.php" navn="default.no/clips" />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="fly">
          <AccordionTrigger className="py-3.5">
            <Tittel ikon={Plane} tittel="Flylyder merket for hånd" tekst={`${a.flylyder.filter((f) => f.svar === 'plane').length} fly, ${a.flylyder.filter((f) => f.svar !== 'plane').length} ikke fly eller usikker`} />
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-[13.5px] leading-relaxed text-slate-700">
              Lydklipp fra 21.09 der folk har lyttet og merket om det er et fly. Tidene er ekte tid. Obs: lyden etter 21.09 kan være avspilt på nytt.
            </p>
            <ul className="mt-2 grid grid-cols-2 gap-1.5">
              {a.flylyder.map((f) => (
                <li key={f.dato + f.tid} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5">
                  <span className="font-mono text-[13px]">{f.tid.slice(0, 5)}</span>
                  <span className={cn('rounded px-1.5 py-0.5 text-[11px] font-semibold ring-1', SVAR[f.svar]?.klasse)}>{SVAR[f.svar]?.tekst ?? f.svar}</span>
                </li>
              ))}
            </ul>
            <Kilde tekst="Flyklipp og håndmerking fra default.no." url="https://default.no/plane.php" navn="default.no/plane" />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="fugler">
          <AccordionTrigger className="py-3.5">
            <Tittel ikon={Bird} tittel="Fugler hørt på streamen" tekst={`${a.fugler.length} norske arter gjenkjent`} />
          </AccordionTrigger>
          <AccordionContent>
            <ul className="divide-y">
              {a.fugler.map((f) => (
                <li key={f.latin} className="flex items-center justify-between py-1.5 text-[13.5px]">
                  <span>
                    {f.norsk} <span className="text-[12px] text-muted-foreground italic">{f.latin}</span>
                  </span>
                  <span className="font-mono text-[12.5px] text-muted-foreground">{f.antall}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Arter som peker på stedet: furukorsnebb og grankorsnebb (barskog), tretåspett (gammel granskog), sidensvans (mest meldt i nord i september). Gjenkjenningen gjør
              også feil: den har funnet arter som ikke finnes i Norge, så enkeltfunn er usikre. Lyden kan dessuten være avspilt på nytt.
            </p>
            <Kilde tekst="Fuglegjenkjenning (BirdNET) fra default.no." url="https://default.no" navn="default.no" />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="kommuner">
          <AccordionTrigger className="py-3.5">
            <Tittel ikon={MapIcon} tittel="Kommunevurdering" tekst={`${a.kommuner.usikkert.length} kommuner er fortsatt åpne`} />
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-3 gap-2">
              {[
                ['usikkert', 'Usikkert', 'text-emerald-700'],
                ['lite sannsynlig', 'Lite sannsynlig', 'text-slate-600'],
                ['utelukket', 'Utelukket', 'text-red-700'],
              ].map(([k, n, c]) => (
                <div key={k} className="rounded-xl bg-slate-50 p-2.5 text-center">
                  <p className={cn('font-mono text-lg font-semibold', c)}>{a.kommuner.teller[k] ?? 0}</p>
                  <p className="text-[12px] text-muted-foreground">{n}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[13.5px] font-semibold">Usikkert (ingen er satt til «sannsynlig» ennå)</p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-slate-700">{a.kommuner.usikkert.join(', ')}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={onVisKommuner}>
              <MapIcon /> Vis på kartet
            </Button>
            <Kilde tekst="Vurdert av administratoren på hordejakten.vercel.app, 23.09." url="https://hordejakten.vercel.app/#kart" navn="hordejakten.vercel.app" />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="bekreftet" className="border-none">
          <AccordionTrigger className="py-3.5">
            <Tittel ikon={ShieldCheck} tittel="Bekreftet-lista fra hordejakten.vercel.app" tekst={`${a.vercelFakta.length} punkter de regner som sikre`} />
          </AccordionTrigger>
          <AccordionContent>
            <ol className="list-decimal space-y-1.5 pl-5 text-[14px] leading-snug text-slate-700">
              {a.vercelFakta.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ol>
            <p className="mt-2 text-[13px] text-muted-foreground">
              Merk: «minst 7 timer» er ikke sikkert. Anja sa til Børsen at hun sov og ikke vet hvor lenge de kjørte.
            </p>
            <Kilde tekst="Bekreftet-lista på hordejakten.vercel.app." url="https://hordejakten.vercel.app/#bekreftet" navn="hordejakten.vercel.app" />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
