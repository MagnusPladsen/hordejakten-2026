// Sjekker om Horde (@horde.app) er live på TikTok. Nettleseren spør oss, og vi spør
// TikTok. Svaret caches i 60 sek, så TikTok får høyst ett kall i minuttet uansett
// hvor mange som har siden åpen.
//
// TikTok sin status for et live-rom: 2 = live nå, 4 = avsluttet.
export const config = { runtime: 'edge' }

const BRUKER = 'horde.app'

export default async function handler(): Promise<Response> {
  const sjekket = new Date().toISOString()
  try {
    const svar = await fetch(`https://www.tiktok.com/api-live/user/room/?aid=1988&sourceType=54&uniqueId=${BRUKER}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    })
    const d = (await svar.json().catch(() => null)) as {
      data?: { liveRoom?: { status?: number; title?: string; startTime?: number; liveRoomStats?: { userCount?: number } } }
    } | null
    const rom = d?.data?.liveRoom
    const live = rom?.status === 2
    return Response.json(
      {
        live,
        tittel: live ? (rom?.title ?? null) : null,
        startet: live && rom?.startTime ? new Date(rom.startTime * 1000).toISOString() : null,
        seere: live ? (rom?.liveRoomStats?.userCount ?? null) : null,
        url: `https://www.tiktok.com/@${BRUKER}/live`,
        sjekket,
      },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' } },
    )
  } catch {
    return Response.json({ live: false, feil: true, url: `https://www.tiktok.com/@${BRUKER}/live`, sjekket }, { headers: { 'Cache-Control': 'public, s-maxage=20' } })
  }
}
