// Samler alt som peker på et sted (hint, det folk sier og siste nytt) til markører på kartet.
// Ting på samme sted slås sammen til én markør, så kartet ikke fylles av stablede nåler.
import { FOLK_TROR, HINT, SISTE_NYTT, STATUS, STEDER, TEORIER, type Status } from '@/data/innhold'
import type { LatLon } from '@/lib/geo'

export type MarkorPost = {
  type: 'hint' | 'folk'
  tittel: string
  tekst: string
  /** Hint-id, så popupen kan lenke til hintkortet */
  hint?: string
  status?: Status
  nytt?: boolean
}

export type KartMarkor = { pos: LatLon; poster: MarkorPost[] }

const alleSteder = [...STEDER, ...TEORIER]
const stedFor = (id?: string) => alleSteder.find((s) => s.id === id)?.pos

const nyeHint = new Set(SISTE_NYTT.map((n) => n.hint).filter(Boolean) as string[])

function lagMarkorer(): KartMarkor[] {
  const grupper = new Map<string, KartMarkor>()
  const legg = (pos: LatLon | undefined, post: MarkorPost) => {
    if (!pos) return
    // Samme sted innen ca. 1 km blir én markør
    const nokkel = `${pos[0].toFixed(2)},${pos[1].toFixed(2)}`
    const gruppe = grupper.get(nokkel) ?? { pos, poster: [] }
    if (!gruppe.poster.some((p) => p.tittel === post.tittel)) gruppe.poster.push(post)
    grupper.set(nokkel, gruppe)
  }

  for (const h of HINT) {
    legg(h.pos ?? stedFor(h.fokus), {
      type: 'hint',
      tittel: h.tittel,
      tekst: h.betydning,
      hint: h.id,
      status: h.status,
      nytt: nyeHint.has(h.id),
    })
  }
  for (const f of FOLK_TROR) {
    legg(f.pos ?? stedFor(f.fokus), { type: 'folk', tittel: f.tekst, tekst: f.hvem, hint: f.hint?.[0] })
  }

  // Hint først, nyeste først i hver markør
  for (const g of grupper.values()) {
    g.poster.sort((a, b) => Number(b.nytt ?? false) - Number(a.nytt ?? false) || (a.type === 'hint' ? -1 : 1) - (b.type === 'hint' ? -1 : 1))
  }
  return [...grupper.values()]
}

export const KART_MARKORER = lagMarkorer()

export const statusTekst = (s?: Status) => (s ? STATUS[s].tekst : 'Folk sier')
