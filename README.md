# Hordejakten-kartet 2026

Mobilvennlig kart som samler alle hint i Hordejakten 2026 og viser hvor kassen kan stå. Hvert kartlag har en forklaring av hva fargene betyr, og sannsynlighetskartet lar deg vekte hintene selv.

## Kjør lokalt

```bash
bun install
bun run dev
```

## Innhold

| Fil | Hva |
|-----|-----|
| `src/data/innhold.ts` | Hint, tavle-logg, steder, teorier og soner. Oppdater her når nye hint kommer. |
| `src/data/lag.ts` | Kartlagene: navn, farger og forklaringstekst. |
| `src/lib/modell.ts` | Sannsynlighetsmodellen og ferdige teorier. |
| `public/data/drivetime.json` | Kjøretid fra Oslo til ca. 1 900 punkter i Norge (OSRM). |
| `public/data/fly_2130.json` | Flyspor 21:28–21:34 den 21.09 (ADS-B). |
| `scripts/build_drivetime.py` | Bygger kjøretidsnettet på nytt. |

## Bygg kjøretidsnettet på nytt

Trenger Python med `shapely` og `requests`, og en GeoJSON med fylkesgrenser (for eksempel `Fylker-M.geojson` fra [robhop/fylker-og-kommuner](https://github.com/robhop/fylker-og-kommuner)).

```bash
python scripts/build_drivetime.py Fylker-M.geojson
```

## Kilder

- Kjøretider: [OSRM](https://project-osrm.org/) på OpenStreetMap-data
- Bakgrunnskart og stedsnavn: [Kartverket](https://www.kartverket.no/)
- Flyspor: [adsb.lol](https://adsb.lol/), hentet via [default.no](https://default.no)
- Fakta fra tavla og kandidater: [default.no](https://default.no) og fellesskapet
- Direktesending: [YouTube](https://www.youtube.com/watch?v=EQHgfmZicc8)
