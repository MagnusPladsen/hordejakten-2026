import { useState } from 'react'
import { ExternalLink, MessageSquare, Play } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { FAKTA, STREAM } from '@/data/innhold'

export function StreamPanel() {
  const [spiller, setSpiller] = useState(false)
  return (
    <div className="avis space-y-4">
      <div className="spenn">
        <h2 className="text-xl font-semibold tracking-tight">Direktesendingen</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Anja sitter i kassen døgnet rundt. Streamen er bekreftet {STREAM.forsinkelseSek} sek forsinket, så trekk fra det når du sammenligner med fly og vær.
        </p>
      </div>
      <div className="relative aspect-video overflow-hidden rounded-2xl border bg-slate-900">
        {spiller ? (
          <iframe
            className="absolute inset-0 size-full"
            src={`https://www.youtube-nocookie.com/embed/${STREAM.videoId}?autoplay=1&playsinline=1`}
            title="Hordejakten 2026 direkte"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setSpiller(true)}
            className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_40%,#831843,#0f172a)]"
          >
            <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-lg">
              <Play className="size-4 fill-current" /> Se direkte her
            </span>
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button asChild>
          <a href={STREAM.url} target="_blank" rel="noopener">
            YouTube <ExternalLink />
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={STREAM.chat} target="_blank" rel="noopener">
            <MessageSquare /> Chatten
          </a>
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {FAKTA.map((f) => (
          <div key={f.tekst} className="rounded-2xl border bg-card p-3">
            <p className="font-mono text-base font-semibold text-primary">{f.verdi}</p>
            <p className="text-[13px] text-muted-foreground">{f.tekst}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border bg-amber-50/70 p-4 text-[14.5px] leading-relaxed text-amber-900">
        <p className="font-semibold">Jaktvett</p>
        <p className="mt-1">Kassen står ikke i farlig terreng. Ta trygge veivalg, respekter privat eiendom og vær grei mot Anja og andre som leter.</p>
      </div>
      <p className="text-[13px] text-muted-foreground">
        Mer data: <a className="font-semibold text-primary" href="https://default.no" target="_blank" rel="noopener">default.no</a> ·{' '}
        <a className="font-semibold text-primary" href="https://horde.no/gjeldfri/hordejakten" target="_blank" rel="noopener">horde.no</a>
      </p>
    </div>
  )
}
