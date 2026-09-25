// Flyspor rundt kl. 21:30 den 21.09 (ADS-B). Tider i sporet er ekte tid (CEST).
import type { LatLon } from '@/lib/geo'

export type Fly = { kallesignal: string; type: string | null; spor: [string, number, number, number][] }
export type FlyData = { kilde: string; fly: Fly[] }

const sek = (hms: string) => {
  const [t, m, s] = hms.split(':').map(Number)
  return t * 3600 + m * 60 + s
}

/** Streamen er trolig 20 sek–1 min forsinket (vi tipper). Anja pekte opp 21:29:38 og skrev «FLY» 21:30:12–21:30:30 (streamtid). */
export const PEKETID_EKTE = '21:29:15'
export const VINDU_SEK = 60

/** Posisjon til et fly på et gitt tidspunkt (lineær interpolasjon), eller null utenfor sporet */
export function posisjon(fly: Fly, hms: string): { pos: LatLon; fot: number } | null {
  const t = sek(hms)
  const s = fly.spor
  for (let i = 0; i < s.length - 1; i++) {
    const a = sek(s[i][0])
    const b = sek(s[i + 1][0])
    if (t >= a && t <= b) {
      const f = b === a ? 0 : (t - a) / (b - a)
      return {
        pos: [s[i][1] + f * (s[i + 1][1] - s[i][1]), s[i][2] + f * (s[i + 1][2] - s[i][2])],
        fot: s[i][3] + f * (s[i + 1][3] - s[i][3]),
      }
    }
  }
  return null
}

/** Alle posisjoner til fly over 3000 fot i vinduet rundt pekeøyeblikket, hvert 10. sekund */
export function posisjonerRundtPeking(data: FlyData): LatLon[] {
  const midt = sek(PEKETID_EKTE)
  const ut: LatLon[] = []
  for (const fly of data.fly) {
    for (let t = midt - VINDU_SEK; t <= midt + VINDU_SEK; t += 10) {
      const hms = [Math.floor(t / 3600), Math.floor((t % 3600) / 60), t % 60].map((x) => String(x).padStart(2, '0')).join(':')
      const p = posisjon(fly, hms)
      if (p && p.fot > 3000) ut.push(p.pos)
    }
  }
  return ut
}
