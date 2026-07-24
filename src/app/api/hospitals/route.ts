import { NextResponse } from "next/server"

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

const TYPES_MAP: Record<string, string[]> = {
  all: ["hospital", "doctor", "pharmacy", "health"],
  hospital: ["hospital"],
  diagnostic: ["doctor"],
  pharmacy: ["pharmacy"],
}

const TYPE_LABEL: Record<string, string> = {
  hospital: "hospital",
  doctor: "diagnostic",
  pharmacy: "pharmacy",
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

    const types = TYPES_MAP[type] || TYPES_MAP.all
    const allResults: Record<string, unknown>[] = []
    const seenIds = new Set<string>()

    for (const placeType of types) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=${placeType}&key=${GOOGLE_API_KEY}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.results) {
        for (const place of data.results) {
          if (!seenIds.has(place.place_id)) {
            seenIds.add(place.place_id)
            allResults.push(place)
          }
        }
      }
    }

    const hospitals = allResults.slice(0, 50).map((place: Record<string, unknown>) => {
      const lat2 = (place.geometry as Record<string, Record<string, number>>).location.lat
      const lng2 = (place.geometry as Record<string, Record<string, number>>).location.lng
      const distance = calcDistance(lat, lng, lat2, lng2)
      const typesArr = place.types as string[]
      return {
        id: place.place_id as string,
        name: place.name as string,
        address: place.vicinity as string,
        latitude: lat2,
        longitude: lng2,
        rating: place.rating as number || null,
        type: getTypeLabel(typesArr),
        phone: null,
        emergency: typesArr.includes("hospital"),
        ambulance: typesArr.includes("hospital"),
        bloodBank: typesArr.includes("hospital"),
        specialties: typesArr.slice(0, 3),
        distance,
        photoRef: (place.photos as Record<string, unknown>[])?.[0]?.photo_reference as string || null,
        openNow: (place.opening_hours as Record<string, unknown>)?.open_now as boolean ?? null,
        placeId: place.place_id as string,
      }
    })

    hospitals.sort((a, b) => (a.distance || 0) - (b.distance || 0))

    return NextResponse.json(hospitals)
  } catch (error) {
    console.error("Hospitals error:", error)
    return NextResponse.json({ error: "Failed to fetch hospitals" }, { status: 500 })
  }
}

function getTypeLabel(types: string[]): string {
  if (types.includes("hospital")) return "hospital"
  if (types.includes("doctor")) return "diagnostic"
  if (types.includes("pharmacy")) return "pharmacy"
  return "hospital"
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
