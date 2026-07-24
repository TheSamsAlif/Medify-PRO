import { NextResponse } from "next/server"
import { NextRequest } from "next/server"

const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
]

const SEARCH_RADII = [2000, 5000, 10000]

function buildQuery(lat: number, lng: number, radius: number, type: string): string {
  const around = `(around:${radius},${lat},${lng})`
  let filters = ""

  if (type === "pharmacy") {
    filters = `node["amenity"="pharmacy"]${around};`
  } else if (type === "diagnostic") {
    filters = `node["amenity"="doctors"]${around};node["healthcare"="centre"]${around}`
  } else if (type === "hospital") {
    filters = `node["amenity"="hospital"]${around};node["healthcare"="hospital"]${around};node["amenity"="clinic"]${around};`
  } else {
    filters = [
      `node["amenity"="hospital"]${around}`,
      `node["amenity"="clinic"]${around}`,
      `node["amenity"="doctors"]${around}`,
      `node["amenity"="pharmacy"]${around}`,
      `node["healthcare"="hospital"]${around}`,
      `node["healthcare"="centre"]${around}`,
    ].join(";")
  }

  return `[out:json][timeout:20];(${filters};);out 50;`
}

const TYPE_LABEL: Record<string, string> = {
  hospital: "hospital",
  clinic: "hospital",
  doctors: "diagnostic",
  pharmacy: "pharmacy",
  centre: "diagnostic",
}

async function tryOverpassMirror(url: string, query: string, signal: AbortSignal): Promise<Response | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
        signal,
      })
      const text = await res.text().catch(() => "")
      if (!text) return null
      if (res.ok && text.startsWith("{")) return new Response(text, { headers: { "Content-Type": "application/json" } })
      if (text.includes("too busy") || text.includes("rate limit") || res.status === 429) {
        console.warn(`Overpass ${url} busy, retry ${attempt + 1}...`)
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)))
        continue
      }
      console.warn(`Overpass ${url} failed: ${res.status}`, text.slice(0, 200))
      return null
    } catch {
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 2000))
        continue
      }
      return null
    }
  }
  return null
}

export async function GET(req: NextRequest) {
  const start = Date.now()
  try {
    const { searchParams } = new URL(req.url)
    const lat = parseFloat(searchParams.get("lat") || "0")
    const lng = parseFloat(searchParams.get("lng") || "0")
    const type = searchParams.get("type") || "all"

    if (!lat || !lng) {
      return NextResponse.json({ error: "Location required. Allow GPS access or enter an address." }, { status: 400 })
    }

    let hospitals: Record<string, unknown>[] = []

    for (const radius of SEARCH_RADII) {
      if (hospitals.length) break
      const query = buildQuery(lat, lng, radius, type)

      for (const mirror of OVERPASS_MIRRORS) {
        if (hospitals.length) break
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 25000)

        const res = await tryOverpassMirror(mirror, query, controller.signal)
        clearTimeout(timer)

        if (!res) continue

        try {
          const data = await res.json()
          if (data.elements?.length) {
            hospitals = data.elements
              .filter((el: Record<string, unknown>) => el.tags)
              .map((el: Record<string, unknown>) => {
                const t = el.tags as Record<string, string>
                const ot = t.amenity || t.healthcare || "hospital"
                return {
                  id: `${el.type}-${el.id}`,
                  name: t.name || t["name:bn"] || unknownName(ot),
                  type: TYPE_LABEL[ot] || "hospital",
                  address: t["addr:full"] || t["addr:street"] || t["addr:city"] || t["addr:district"] || "",
                  latitude: el.lat as number,
                  longitude: el.lon as number,
                  phone: t.phone || t["contact:phone"] || null,
                  rating: null,
                  emergency: ot === "hospital" || ot === "clinic",
                  ambulance: t.ambulance === "yes",
                  bloodBank: false,
                  specialties: [ot],
                  distance: calcDist(lat, lng, el.lat as number, el.lon as number),
                }
              })
              .sort((a: { distance: number }, b: { distance: number }) => a.distance - b.distance)
              .slice(0, 50)

            console.log(`[Hospitals] Found ${hospitals.length} results at ${radius}m from ${mirror} (${Date.now() - start}ms)`)
          }
        } catch {
          console.warn(`[Hospitals] Parse error from ${mirror} (${Date.now() - start}ms)`)
        }
      }
    }

    if (hospitals.length) {
      return NextResponse.json(hospitals)
    }

    console.log(`[Hospitals] No results (${Date.now() - start}ms)`)
    return NextResponse.json([])
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    console.error(`[Hospitals] Error (${Date.now() - start}ms):`, msg)
    return NextResponse.json({ error: "Could not load nearby hospitals. Please try again." }, { status: 500 })
  }
}

function unknownName(type: string): string {
  const names: Record<string, string> = {
    hospital: "হাসপাতাল",
    clinic: "ক্লিনিক",
    doctors: "ডাক্তার",
    pharmacy: "ফার্মেসী",
    centre: "স্বাস্থ্য কেন্দ্র",
  }
  return names[type] || "স্বাস্থ্য সেবা"
}

function calcDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
