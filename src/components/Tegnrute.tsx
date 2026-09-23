import type { Tegn } from '@/data/lag'
import { cn } from '@/lib/utils'

/** Liten fargeprøve som viser hvordan et tegn ser ut på kartet */
export function Tegnrute({ tegn, className }: { tegn: Pick<Tegn, 'stil' | 'farge'>; className?: string }) {
  const { stil, farge } = tegn
  const felles = 'inline-block shrink-0'
  switch (stil) {
    case 'fyll':
      return <span className={cn(felles, 'size-3.5 rounded-[4px] ring-1 ring-black/10', className)} style={{ background: farge }} />
    case 'rute':
      return (
        <span
          className={cn(felles, 'size-3.5 rounded-[4px] border-[1.5px] border-dashed', className)}
          style={{ borderColor: farge, background: `${farge}40` }}
        />
      )
    case 'linje':
      return <span className={cn(felles, 'h-[3px] w-5 rounded-full', className)} style={{ background: farge }} />
    case 'stiplet':
      return <span className={cn(felles, 'w-5 border-t-[3px] border-dotted', className)} style={{ borderColor: farge }} />
    case 'ring':
      return <span className={cn(felles, 'size-3.5 rounded-full border-[2.5px]', className)} style={{ borderColor: farge }} />
    case 'prikk':
      return (
        <span
          className={cn(felles, 'size-3.5 rounded-full ring-2 ring-white shadow-[0_0_0_1px_rgb(0_0_0/0.15)]', className)}
          style={{ background: farge }}
        />
      )
  }
}
