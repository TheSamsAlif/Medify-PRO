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

  return `[out:json][timeout:30];(${filters};);out 50;`
}

const TYPE_LABEL: Record<string, string> = {
  hospital: "hospital",
  clinic: "hospital",
  doctors: "diagnostic",
  pharmacy: "pharmacy",
  centre: "diagnostic",
}

async function queryMirror(url: string, query: string, signal: AbortSignal): Promise<Response | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      signal,
    })
    return res
  } catch {
    return null
  }
}

async function queryOverpass(query: string, timeoutMs = 35000): Promise<Record<string, unknown>[] | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  const results = await Promise.race(
    OVERPASS_MIRRORS.map(mirror => queryMirror(mirror, query, controller.signal))
  )
  clearTimeout(timer)

  if (!results) return null

  const text = await results.text().catch(() => "")
  if (!text || !text.startsWith("{")) {
    if (text.includes("too busy")) {
      await new Promise(r => setTimeout(r, 3000))
      return queryOverpass(query, timeoutMs - 5000)
    }
    return null
  }

  try {
    const data = JSON.parse(text)
    return data.elements || []
  } catch {
    return null
  }
}

function mapElement(el: Record<string, unknown>, lat: number, lng: number) {
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

    for (const radius of SEARCH_RADII) {
      const query = buildQuery(lat, lng, radius, type)
      console.log(`[Hospitals] Query radius ${radius}m (${Date.now() - start}ms)`)

      const elements = await queryOverpass(query)
      if (!elements || !elements.length) {
        console.log(`[Hospitals] No results at ${radius}m (${Date.now() - start}ms)`)
        continue
      }

      const filtered = elements.filter((el: Record<string, unknown>) => el.tags)
      if (!filtered.length) continue

      const hospitals = filtered
        .map((el: Record<string, unknown>) => mapElement(el, lat, lng))
        .sort((a: { distance: number }, b: { distance: number }) => a.distance - b.distance)
        .slice(0, 50)

      console.log(`[Hospitals] Found ${hospitals.length} results (${Date.now() - start}ms)`)
      return NextResponse.json(hospitals)
    }

    console.log(`[Hospitals] No results after all radii (${Date.now() - start}ms)`)
    return NextResponse.json([])
  } catch (err) {
    console.error(`[Hospitals] Error (${Date.now() - start}ms):`, err instanceof Error ? err.message : err)
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
