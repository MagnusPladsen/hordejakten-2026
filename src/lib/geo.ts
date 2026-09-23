// Enkle sfæriske beregninger. Vinkler i grader, avstander i km.
export type LatLon = [number, number]

const R = 6371
const rad = (d: number) => (d * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI

export function avstand([la1, lo1]: LatLon, [la2, lo2]: LatLon): number {
  const dphi = rad(la2 - la1)
  const dl = rad(lo2 - lo1)
  const a = Math.sin(dphi / 2) ** 2 + Math.cos(rad(la1)) * Math.cos(rad(la2)) * Math.sin(dl / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)))
}

export function peiling([la1, lo1]: LatLon, [la2, lo2]: LatLon): number {
  const p1 = rad(la1)
  const p2 = rad(la2)
  const dl = rad(lo2 - lo1)
  const y = Math.sin(dl) * Math.cos(p2)
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl)
  return (deg(Math.atan2(y, x)) + 360) % 360
}

export function destinasjon([la, lo]: LatLon, kurs: number, km: number): LatLon {
  const d = km / R
  const t = rad(kurs)
  const p1 = rad(la)
  const l1 = rad(lo)
  const p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(t))
  const l2 = l1 + Math.atan2(Math.sin(t) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2))
  return [deg(p2), deg(l2)]
}

/** Avstand fra punkt til storsirkellinja fra `fra` med gitt kurs. `langs` < 0 betyr bak startpunktet. */
export function tversAvstand(fra: LatLon, kurs: number, punkt: LatLon) {
  const d13 = avstand(fra, punkt) / R
  const t13 = rad(peiling(fra, punkt))
  const t12 = rad(kurs)
  const xt = Math.asin(Math.sin(d13) * Math.sin(t13 - t12))
  const at = Math.acos(Math.max(-1, Math.min(1, Math.cos(d13) / Math.cos(xt))))
  return { tvers: Math.abs(xt) * R, langs: (Math.cos(t13 - t12) >= 0 ? 1 : -1) * at * R }
}

export function iPolygon([la, lo]: LatLon, ring: LatLon[]): boolean {
  let inne = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i]
    const [yj, xj] = ring[j]
    if (yi > la !== yj > la && lo < ((xj - xi) * (la - yi)) / (yj - yi) + xi) inne = !inne
  }
  return inne
}

/** Punkter langs en storsirkel, slik at lange linjer tegnes riktig */
export function storsirkel(fra: LatLon, til: LatLon, n = 64): LatLon[] {
  const km = avstand(fra, til)
  const kurs = peiling(fra, til)
  return Array.from({ length: n + 1 }, (_, i) => destinasjon(fra, kurs, (km * i) / n))
}

export function sektor(senter: LatLon, kurs: number, halvBredde: number, indreKm: number, ytreKm: number, steg = 24): LatLon[] {
  const ut: LatLon[] = []
  for (let i = 0; i <= steg; i++) ut.push(destinasjon(senter, kurs - halvBredde + (2 * halvBredde * i) / steg, ytreKm))
  for (let i = steg; i >= 0; i--) ut.push(destinasjon(senter, kurs - halvBredde + (2 * halvBredde * i) / steg, indreKm))
  return ut
}

export function formaterTid(sek: number): string {
  const t = Math.floor(sek / 3600)
  const m = Math.round((sek % 3600) / 60)
  return m === 60 ? `${t + 1} t` : `${t} t ${m.toString().padStart(2, '0')} min`
}
