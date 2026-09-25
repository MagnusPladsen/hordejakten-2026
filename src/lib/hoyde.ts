// Høyde over havet fra Kartverkets terrengmodell (DTM 1 m). Svarene caches, så samme punkt hentes én gang.
const cache = new Map<string, Promise<{ moh: number; terreng: string | null } | null>>()

const TERRENG: Record<string, string> = {
  Skog: 'skog',
  Myr: 'myr',
  AapentOmraade: 'åpent område',
  ÅpentOmråde: 'åpent område',
  DyrketMark: 'dyrket mark',
  Innsjø: 'vann',
  Elv: 'elv',
  Hav: 'hav',
  BebyggelseTettsted: 'bebyggelse',
  Tettbebyggelse: 'bebyggelse',
  SnøIsbre: 'snø og is',
  BymessigBebyggelse: 'bebyggelse',
  Industriområde: 'industriområde',
  Alpinbakke: 'alpinbakke',
  Golfbane: 'golfbane',
  Park: 'park',
  Sportsidrettplass: 'idrettsplass',
  Steinbrudd: 'steinbrudd',
  Gravplass: 'gravplass',
  Lufthavn: 'flyplass',
}

export function hentHoyde(lat: number, lon: number) {
  const nokkel = `${lat.toFixed(4)},${lon.toFixed(4)}`
  let p = cache.get(nokkel)
  if (!p) {
    p = fetch(`https://ws.geonorge.no/hoydedata/v1/punkt?koordsys=4258&nord=${lat}&ost=${lon}&geojson=false`, { signal: AbortSignal.timeout(8000) })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { punkter?: { z?: number | null; terreng?: string | null }[] } | null) => {
        const pkt = d?.punkter?.[0]
        if (pkt?.z == null) return null
        return { moh: Math.round(pkt.z), terreng: pkt.terreng ? (TERRENG[pkt.terreng] ?? pkt.terreng) : null }
      })
      .catch(() => null)
    cache.set(nokkel, p)
  }
  return p
}

/** «ca. 612 moh (skog)». Merker høyden hvis den er nær 2,7 eiffeltårn (810–891 m). */
export function hoydeTekst(h: { moh: number; terreng: string | null }) {
  const eiffel = h.moh >= 790 && h.moh <= 911 ? ' · passer med 2,7 eiffeltårn' : ''
  return `${h.moh.toLocaleString('nb-NO')} moh${h.terreng ? ` (${h.terreng})` : ''}${eiffel}`
}
