// Nærmeste stedsnavn fra Kartverkets åpne stedsnavn-API
const cache = new Map<string, Promise<string | null>>()

const FORETRUKNE = ['By', 'Tettsted', 'Bygd', 'Grend', 'Tettbebyggelse', 'Bydel', 'Kommune']

type Svar = {
  navn?: { meterFraPunkt: number; navneobjekttype: string; stedsnavn: { skrivemåte: string }[] }[]
}

export function stedsnavn(lat: number, lon: number): Promise<string | null> {
  const nokkel = `${lat.toFixed(2)},${lon.toFixed(2)}`
  const lagret = cache.get(nokkel)
  if (lagret) return lagret

  const url = `https://ws.geonorge.no/stedsnavn/v1/punkt?nord=${lat}&ost=${lon}&koordsys=4258&radius=5000&treffPerSide=100&utkoordsys=4258`
  const svar = fetch(url)
    .then((r) => (r.ok ? (r.json() as Promise<Svar>) : null))
    .then((d) => {
      const navn = d?.navn ?? []
      if (!navn.length) return null
      const rangert = [...navn].sort((a, b) => {
        const pa = FORETRUKNE.indexOf(a.navneobjekttype)
        const pb = FORETRUKNE.indexOf(b.navneobjekttype)
        return (pa < 0 ? 99 : pa) - (pb < 0 ? 99 : pb) || a.meterFraPunkt - b.meterFraPunkt
      })
      return rangert[0].stedsnavn[0]?.skrivemåte ?? null
    })
    .catch(() => {
      // Ikke hold på feil, så neste klikk prøver igjen
      cache.delete(nokkel)
      return null
    })
  cache.set(nokkel, svar)
  return svar
}
