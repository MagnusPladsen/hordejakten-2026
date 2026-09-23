// Sjekker om Kodejakten er skrudd på hos Horde. Horde tillater ikke kall fra andre
// nettsider, så nettleseren spør oss, og vi spør Horde. Svaret caches i 60 sek, så
// Horde får høyst ett kall i minuttet uansett hvor mange som har siden åpen.
//
// Vi bruker «status» med et ugyldig token: det starter ingen spilløkt. Når spillet
// er av, svarer Horde 503 «not_configured». Alt annet betyr at serveren er på.
export const config = { runtime: 'edge' }

export default async function handler(): Promise<Response> {
  const sjekket = new Date().toISOString()
  let status = 0
  let kode: string | null = null
  try {
    const svar = await fetch('https://horde.no/api/spill/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'statussjekk' }),
      signal: AbortSignal.timeout(8000),
    })
    status = svar.status
    kode = ((await svar.json().catch(() => null)) as { error?: string } | null)?.error ?? null
  } catch {
    return Response.json({ klar: null, status: 0, kode: 'nettverksfeil', sjekket }, { headers: { 'Cache-Control': 'public, s-maxage=20' } })
  }
  const klar = !(status === 503 && kode === 'not_configured')
  return Response.json({ klar, status, kode, sjekket }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' } })
}
