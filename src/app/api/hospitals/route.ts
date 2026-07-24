import { NextResponse } from "next/server"
import { NextRequest } from "next/server"

function buildQuery(lat: number, lng: number, type: string): string {
  const around = `(around:5000,${lat},${lng})`
  let filters = ""

  if (type === "pharmacy") {
    filters = `node['amenity'='pharmacy']${around};`
  } else if (type === "diagnostic") {
    filters = `node['healthcare']='doctor'${around};`
  } else if (type === "hospital") {
    filters = `node['amenity'='hospital']${around};way['amenity'='hospital']${around};node['amenity'='clinic']${around};`
  } else {
    filters = `node['amenity'='hospital']${around};node['amenity'='clinic']${around};node['amenity'='pharmacy']${around};node['healthcare']='doctor'${around};way['amenity'='hospital']${around};`
  }

  return `[out:json][timeout:8];(${filters});out center 20;`
}

const TYPE_LABEL: Record<string, string> = {
  hospital: "hospital",
  clinic: "hospital",
  pharmacy: "pharmacy",
  doctor: "diagnostic",
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const lat = parseFloat(searchParams.get("lat") || "0")
    const lng = parseFloat(searchParams.get("lng") || "0")
    const type = searchParams.get("type") || "all"

    if (!lat || !lng) {
      return NextResponse.json({ error: "lat and lng required" }, { status: 400 })
    }

    const query = buildQuery(lat, lng, type)

    // Use POST with proper form encoding
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 9000)

    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ data: query }).toString(),
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!res.ok) {
      const err = await res.text().catch(() => "")
      console.error("Overpass error:", res.status, err)
      return NextResponse.json({ error: `Overpass error: ${res.status}` }, { status: 502 })
    }

    const data = await res.json()
    if (!data.elements?.length) return NextResponse.json([])

    const hospitals = data.elements
      .filter((el: Record<string, unknown>) => el.tags)
      .map((el: Record<string, unknown>) => {
        const t = el.tags as Record<string, string>
        const lat2 = el.type === "way" ? ((el.center as Record<string, number>)?.lat ?? lat) : (el.lat as number)
        const lng2 = el.type === "way" ? ((el.center as Record<string, number>)?.lon ?? lng) : (el.lon as number)
        const ot = t.amenity || t.healthcare || "hospital"
        return {
          id: `${el.type}-${el.id}`,
          name: t.name || t["name:bn"] || (ot === "hospital" ? "হাসপাতাল" : ot === "pharmacy" ? "ফার্মেসী" : ot === "clinic" ? "ক্লিনিক" : "ডাক্তার"),
          type: TYPE_LABEL[ot] || "hospital",
          address: t["addr:full"] || t["addr:street"] || t["addr:city"] || "",
          latitude: lat2,
          longitude: lng2,
          phone: t.phone || t["contact:phone"] || null,
          rating: null,
          emergency: ot === "hospital",
          ambulance: t.ambulance === "yes",
          bloodBank: false,
          specialties: [ot],
          distance: calcDist(lat, lng, lat2, lng2),
        }
      })
      .sort((a: { distance: number }, b: { distance: number }) => a.distance - b.distance)
      .slice(0, 50)

    return NextResponse.json(hospitals)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown"
    console.error("Hospitals error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

function calcDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
