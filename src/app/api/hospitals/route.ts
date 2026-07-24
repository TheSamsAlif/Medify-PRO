import { NextResponse } from "next/server"

const TYPES: Record<string, string[]> = {
  all: ['"amenity"="hospital"', '"amenity"="clinic"', '"amenity"="pharmacy"', '"healthcare"="doctor"'],
  hospital: ['"amenity"="hospital"', '"amenity"="clinic"'],
  diagnostic: ['"healthcare"="doctor"'],
  pharmacy: ['"amenity"="pharmacy"'],
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

    const filters = TYPES[type] || TYPES.all
    const query = `
      [out:json][timeout:10];
      (
        ${filters.map(f => `node${f}(around:5000,${lat},${lng});`).join("\n")}
        ${filters.map(f => `way${f}(around:5000,${lat},${lng});`).join("\n")}
      );
      out center 20;
    `

    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })

    if (!res.ok) {
      return NextResponse.json({ error: "Overpass API error" }, { status: 502 })
    }

    const data = await res.json()

    const hospitals = (data.elements || [])
      .filter((el: Record<string, unknown>) => el.tags)
      .map((el: Record<string, unknown>) => {
        const tags = el.tags as Record<string, string>
        const lat2 = el.type === "way" ? (el.center as Record<string, number>)?.lat || lat : el.lat as number
        const lng2 = el.type === "way" ? (el.center as Record<string, number>)?.lon || lng : el.lon as number
        const osmType = tags.amenity || tags.healthcare || "hospital"
        return {
          id: `${el.type}-${el.id}`,
          name: tags.name || `${tags["name:bn"] || ""}` || getTypeName(osmType),
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
  } catch (error) {
    console.error("Hospitals error:", error)
    return NextResponse.json({ error: "Failed to fetch hospitals" }, { status: 500 })
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
