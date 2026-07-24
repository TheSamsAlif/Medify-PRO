import { NextResponse } from "next/server"

const QUERY_TEMPLATE = `[out:json][timeout:8];({{FILTERS}});out center 20;`

const TYPE_FILTERS: Record<string, string> = {
  all: 'node["amenity"~"hospital|clinic|pharmacy"](around:5000,{{LAT}},{{LNG}});way["amenity"~"hospital|clinic"](around:5000,{{LAT}},{{LNG}});node["healthcare"="doctor"](around:5000,{{LAT}},{{LNG}});',
  hospital: 'node["amenity"~"hospital|clinic"](around:5000,{{LAT}},{{LNG}});way["amenity"="hospital"](around:5000,{{LAT}},{{LNG}});',
  diagnostic: 'node["healthcare"="doctor"](around:5000,{{LAT}},{{LNG}});',
  pharmacy: 'node["amenity"="pharmacy"](around:5000,{{LAT}},{{LNG}});',
}

const TYPE_LABEL: Record<string, string> = {
  hospital: "hospital",
  clinic: "hospital",
  pharmacy: "pharmacy",
  doctor: "diagnostic",
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const lat = parseFloat(searchParams.get("lat") || "0")
    const lng = parseFloat(searchParams.get("lng") || "0")
    const type = searchParams.get("type") || "all"

    if (!lat || !lng) {
      return NextResponse.json({ error: "lat and lng required" }, { status: 400 })
    }

    const filter = TYPE_FILTERS[type] || TYPE_FILTERS.all
    const query = QUERY_TEMPLATE.replace("{{FILTERS}}", filter.replaceAll("{{LAT}}", lat.toString()).replaceAll("{{LNG}}", lng.toString()))

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 9000)

    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      const errText = await res.text().catch(() => "")
      console.error("Overpass error:", res.status, errText)
      return NextResponse.json({ error: `Overpass API error: ${res.status}` }, { status: 502 })
    }

    const data = await res.json()

    if (!data.elements || data.elements.length === 0) {
      return NextResponse.json([])
    }

    const hospitals = data.elements
      .filter((el: Record<string, unknown>) => el.tags)
      .map((el: Record<string, unknown>) => {
        const tags = el.tags as Record<string, string>
        const lat2 = el.type === "way" ? (el.center as Record<string, number>)?.lat || lat : (el.lat as number)
        const lng2 = el.type === "way" ? (el.center as Record<string, number>)?.lon || lng : (el.lon as number)
        const osmType = tags.amenity || tags.healthcare || "hospital"
        return {
          id: `${el.type}-${el.id}`,
          name: tags.name || tags["name:bn"] || getTypeName(osmType),
          type: TYPE_LABEL[osmType] || "hospital",
          address: tags["addr:full"] || tags["addr:street"] || `${tags["addr:city"] || ""} ${tags["addr:district"] || ""}`.trim() || "ঠিকানা দেওয়া নেই",
          latitude: lat2,
          longitude: lng2,
          phone: tags.phone || tags["contact:phone"] || null,
          rating: null,
          emergency: osmType === "hospital",
          ambulance: tags.ambulance === "yes" || osmType === "hospital",
          bloodBank: osmType === "hospital",
          specialties: [osmType],
          distance: calcDistance(lat, lng, lat2, lng2),
          openNow: null,
          placeId: `${el.type}-${el.id}`,
        }
      })
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (a.distance as number) - (b.distance as number))
      .slice(0, 50)

    return NextResponse.json(hospitals)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    console.error("Hospitals error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

function getTypeName(type: string): string {
  const names: Record<string, string> = {
    hospital: "হাসপাতাল",
    clinic: "ক্লিনিক",
    pharmacy: "ফার্মেসী",
    doctor: "ডাক্তার",
  }
  return names[type] || "স্বাস্থ্য সেবা"
}

function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}
