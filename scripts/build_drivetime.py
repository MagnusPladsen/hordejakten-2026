"""Bygger kjøretidsrutenett fra Oslo (OSRM demo-server) maskert til Norge.

Kjør: python scripts/build_drivetime.py <fylker.geojson>
Skriver data/drivetime.json og data/norge.json
"""
import json, sys, time, pathlib
import requests
from shapely.geometry import shape, Point, mapping, MultiPolygon
from shapely.validation import make_valid
from shapely.ops import unary_union
from shapely.prepared import prep

ROOT = pathlib.Path(__file__).resolve().parent.parent
OSLO = (10.7522, 59.9139)  # lon, lat
LAT0, LAT1, DLAT = 57.9, 66.0, 0.1
LON0, LON1, DLON = 4.6, 15.2, 0.2
CHUNK = 99

fylker = json.load(open(sys.argv[1]))
norge = unary_union([make_valid(shape(f["geometry"])).buffer(0) for f in fylker["features"]])
# Kun Sør-Norge + Midt-Norge er relevant for kjøretid < ~10 t
norge_p = prep(norge)

pts = []
lat = LAT0
while lat <= LAT1 + 1e-9:
    lon = LON0
    while lon <= LON1 + 1e-9:
        if norge_p.contains(Point(lon, lat)):
            pts.append((round(lon, 2), round(lat, 2)))
        lon += DLON
    lat += DLAT
print("punkter i Norge:", len(pts), file=sys.stderr)

rows = []
for i in range(0, len(pts), CHUNK):
    chunk = pts[i:i + CHUNK]
    coords = ";".join(f"{x},{y}" for x, y in [OSLO] + chunk)
    url = f"https://router.project-osrm.org/table/v1/driving/{coords}?sources=0&annotations=duration,distance"
    for attempt in range(5):
        try:
            r = requests.get(url, timeout=60)
            d = r.json()
            if d.get("code") == "Ok":
                break
            print("feil:", d.get("message"), file=sys.stderr)
        except Exception as e:
            print("unntak:", e, file=sys.stderr)
        time.sleep(3 * (attempt + 1))
    else:
        sys.exit("ga opp")
    for j, (x, y) in enumerate(chunk):
        dur = d["durations"][0][j + 1]
        dist = d["distances"][0][j + 1]
        snap = d["destinations"][j + 1]["distance"]
        rows.append([y, x, None if dur is None else round(dur), None if dist is None else round(dist), round(snap)])
    print(f"{i + len(chunk)}/{len(pts)}", file=sys.stderr)
    time.sleep(1.2)

out = ROOT / "data"
out.mkdir(exist_ok=True)
json.dump({
    "kilde": "OSRM (router.project-osrm.org), bil, fra Oslo sentrum",
    "origo": [OSLO[1], OSLO[0]],
    "dlat": DLAT, "dlon": DLON,
    "felt": ["lat", "lon", "sek", "meter", "snap_m"],
    "punkter": rows,
}, open(out / "drivetime.json", "w"), separators=(",", ":"))

simple = norge.simplify(0.01, preserve_topology=True)
# Dropp småøyer; omrisset brukes bare til å skyggelegge utenfor Norge
simple = MultiPolygon([g for g in getattr(simple, "geoms", [simple]) if g.area > 0.002])
rund = lambda c: [rund(x) for x in c] if isinstance(c[0], (list, tuple)) else [round(c[0], 3), round(c[1], 3)]
geom = mapping(simple)
geom = {"type": geom["type"], "coordinates": rund(geom["coordinates"])}
json.dump({"type": "Feature", "properties": {}, "geometry": geom},
          open(out / "norge.json", "w"), separators=(",", ":"))
print("ferdig", file=sys.stderr)
