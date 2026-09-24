import { useState } from 'react'
import { ArrowDownUp } from 'lucide-react'

import { DiscordKreditt } from '@/components/Discord'
import { TAVLE } from '@/data/innhold'

export function TavlePanel() {
  const [nyesteForst, setNyesteForst] = useState(true)
  // TAVLE ligger i rekkefølgen svarene kom, så snu lista for nyeste først
  const liste = nyesteForst ? [...TAVLE].reverse() : TAVLE

  return (
    <div className="avis space-y-4">
      <div className="spenn">
        <h2 className="text-xl font-semibold tracking-tight">Tavla</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Alt Anja har skrevet på tavla som sier noe om stedet. Tidene er streamtid, som ligger 45 sek bak. Tavlene fra 24.09 er merket med dato, ikke klokkeslett, og står ikke i riktig rekkefølge innbyrdes.
        </p>
      </div>
      <DiscordKreditt kompakt className="spenn" />
      <div className="spenn flex items-center justify-between gap-3">
        <p className="text-[13px] text-muted-foreground">
          {TAVLE.length} svar · {nyesteForst ? 'nyeste først' : 'eldste først'}
        </p>
        <button
          type="button"
          onClick={() => setNyesteForst((n) => !n)}
          className="flex min-h-11 items-center gap-2 rounded-full border bg-white px-4 text-[14px] font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowDownUp className="size-4" />
          {nyesteForst ? 'Vis eldste først' : 'Vis nyeste først'}
        </button>
      </div>
      <ol className="spenn avis-liste grid gap-3">
        {liste.map((t) => (
          <li key={`${t.t}-${t.tekst}`} className="grid grid-cols-[5.5rem_1fr] items-start gap-3">
            <time className="pt-2 font-mono text-[12px] text-muted-foreground">{t.t}</time>
            <div>
              <p className="rounded-lg border-2 border-slate-800 bg-white px-3 py-2 font-[Chalkboard_SE,Comic_Sans_MS,Marker_Felt,cursive] text-[15px] leading-snug text-slate-800 shadow-[3px_3px_0_rgb(15_23_42/0.08)]">
                {t.tekst}
              </p>
              {t.bilder && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {t.bilder.map((b) => (
                    <a key={b.src} href={`${import.meta.env.BASE_URL}${b.src}`} target="_blank" rel="noopener" className="block overflow-hidden rounded-lg border bg-slate-100">
                      <img src={`${import.meta.env.BASE_URL}${b.src}`} alt={b.alt} loading="lazy" className="aspect-[4/3] w-full object-cover object-bottom" />
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
