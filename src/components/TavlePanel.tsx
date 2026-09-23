import { TAVLE } from '@/data/innhold'

export function TavlePanel() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Tavla</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Alt Anja har skrevet på tavla som sier noe om stedet. Tidene er streamtid, som ligger 45 sek bak.
        </p>
      </div>
      <ol className="space-y-3">
        {TAVLE.map((t, i) => (
          <li key={i} className="grid grid-cols-[5.5rem_1fr] items-start gap-3">
            <time className="pt-2 font-mono text-[12px] text-muted-foreground">{t.t}</time>
            <p className="rounded-lg border-2 border-slate-800 bg-white px-3 py-2 font-[Chalkboard_SE,Comic_Sans_MS,Marker_Felt,cursive] text-[15px] leading-snug text-slate-800 shadow-[3px_3px_0_rgb(15_23_42/0.08)]">
              {t.tekst}
            </p>
          </li>
        ))}
      </ol>
    </div>
  )
}
