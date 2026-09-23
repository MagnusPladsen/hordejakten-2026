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
            <div>
              <p className="rounded-lg border-2 border-slate-800 bg-white px-3 py-2 font-[Chalkboard_SE,Comic_Sans_MS,Marker_Felt,cursive] text-[15px] leading-snug text-slate-800 shadow-[3px_3px_0_rgb(15_23_42/0.08)]">
                {t.tekst}
              </p>
              {t.bilder && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {t.bilder.map((b) => (
                    <a key={b.src} href={`${import.meta.env.BASE_URL}${b.src}`} target="_blank" rel="noopener" className="block overflow-hidden rounded-lg border bg-slate-100">
                      <img src={`${import.meta.env.BASE_URL}${b.src}`} alt={b.alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                      <span className="block px-2 py-1 text-[12px] text-slate-600">{b.alt}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
