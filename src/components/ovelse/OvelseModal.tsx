import { lazy, Suspense } from 'react'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// Spillene lastes først når noen åpner dem, så appen ikke blir tyngre
const SPILL = {
  1: { navn: 'Kill the Bill', noyaktig: true, komponent: lazy(() => import('./Regningsinvasjonen').then((m) => ({ default: m.RegningsinvasjonenOvelse }))) },
  2: { navn: 'Bill Runner', noyaktig: false, komponent: lazy(() => import('./BillRunner').then((m) => ({ default: m.BillRunnerOvelse }))) },
  3: { navn: 'Flappy-Alf', noyaktig: false, komponent: lazy(() => import('./FlappyAlf').then((m) => ({ default: m.FlappyAlfOvelse }))) },
  4: { navn: 'Dartskiven', noyaktig: true, komponent: lazy(() => import('./Dartskiven').then((m) => ({ default: m.DartskivenOvelse }))) },
} as const

export type SpillNr = keyof typeof SPILL

export function OvelseModal({ nr, onLukk }: { nr: SpillNr | null; onLukk: () => void }) {
  const spill = nr ? SPILL[nr] : null
  const Komponent = spill?.komponent
  return (
    <Dialog open={nr != null} onOpenChange={(apen) => !apen && onLukk()}>
      <DialogContent className="z-[2000] max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-xl overflow-y-auto sm:max-w-xl rounded-3xl p-4 sm:p-5">
        <DialogHeader>
          <DialogTitle>Øv: {spill?.navn}</DialogTitle>
          <DialogDescription>
            {spill?.noyaktig
              ? 'Samme regler som det ekte spillet, laget etter spillets kildekode.'
              : 'Laget etter spillets kildekode. Banen og hoppet/fallet sendes fra Hordes server og er anslått her, så timingen kan kjennes litt annerledes.'}{' '}
            Her får du ingen kode, det er bare øving.
          </DialogDescription>
        </DialogHeader>
        <Suspense fallback={<p className="py-10 text-center text-sm text-muted-foreground">Laster spillet …</p>}>{Komponent && <Komponent key={nr} />}</Suspense>
      </DialogContent>
    </Dialog>
  )
}
