import { NextResponse } from "next/server"
import { NextRequest } from "next/server"

const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
]

const SEARCH_RADII = [2000, 5000, 10000]

const FALLBACK_HOSPITALS = [
  { name: "Square Hospital", nameBn: "স্কয়ার হাসপাতাল", lat: 23.7503, lng: 90.3926, phone: "+880-2-8142440", type: "hospital" },
  { name: "Apollo Hospitals Dhaka", nameBn: "অ্যাপোলো হাসপাতাল ঢাকা", lat: 23.7512, lng: 90.3895, phone: "+880-2-8431661", type: "hospital" },
  { name: "United Hospital", nameBn: "ইউনাইটেড হাসপাতাল", lat: 23.7957, lng: 90.4162, phone: "+880-2-8836000", type: "hospital" },
  { name: "Labaid Specialized Hospital", nameBn: "ল্যাবএইড স্পেশালাইজড হাসপাতাল", lat: 23.7572, lng: 90.3882, phone: "+880-9613-333333", type: "hospital" },
  { name: "Ibn Sina Hospital", nameBn: "ইবনে সিনা হাসপাতাল", lat: 23.7290, lng: 90.4075, phone: "+880-2-9669230", type: "hospital" },
  { name: "Bangladesh Medical College", nameBn: "বাংলাদেশ মেডিকেল কলেজ", lat: 23.8147, lng: 90.4089, phone: "+880-2-9005588", type: "hospital" },
  { name: "Popular Diagnostic Center", nameBn: "পপুলার ডায়াগনস্টিক সেন্টার", lat: 23.7372, lng: 90.3946, phone: "+880-2-8311741", type: "diagnostic" },
  { name: "Medinova Medical Services", nameBn: "মেডিনোভা মেডিকেল সার্ভিসেস", lat: 23.7285, lng: 90.4100, phone: "+880-2-9564781", type: "diagnostic" },
  { name: "Shahid Suhrawardy Hospital", nameBn: "শহীদ সোহরাওয়ার্দী হাসপাতাল", lat: 23.7712, lng: 90.3737, phone: "+880-2-9111763", type: "hospital" },
  { name: "Dhaka Medical College Hospital", nameBn: "ঢাকা মেডিকেল কলেজ হাসপাতাল", lat: 23.7250, lng: 90.3972, phone: "+880-2-55165011", type: "hospital" },
]

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
  return `[out:json][timeout:15];(${filters};);out 50;`
}

const TYPE_LABEL: Record<string, string> = {
  hospital: "hospital", clinic: "hospital", doctors: "diagnostic", pharmacy: "pharmacy", centre: "diagnostic",
}

async function tryOverpass(query: string): Promise<Record<string, unknown>[] | null> {
  for (const url of OVERPASS_MIRRORS) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 12000)
      const res = await fetch(`${url}?data=${encodeURIComponent(query)}`, { method: "GET", signal: controller.signal })
      clearTimeout(timer)
      if (!res.ok) continue
      const text = await res.text()
      if (!text || !text.startsWith("{")) continue
      const data = JSON.parse(text)
      if (data?.elements?.length) return data.elements
    } catch {
      continue
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
      return NextResponse.json({ error: "Location required" }, { status: 400 })
    }

    let hospitals: Record<string, unknown>[] = []

    for (const radius of SEARCH_RADII) {
      const query = buildQuery(lat, lng, radius, type)
      const elements = await tryOverpass(query)
      if (elements) {
        hospitals = elements
          .filter((el: Record<string, unknown>) => el.tags)
          .map((el: Record<string, unknown>) => {
            const t = el.tags as Record<string, string>
            const ot = t.amenity || t.healthcare || "hospital"
            return {
              id: `${el.type}-${el.id}`,
              name: t.name || t["name:bn"] || unknownName(ot),
              type: TYPE_LABEL[ot] || "hospital",
              address: t["addr:full"] || t["addr:street"] || t["addr:city"] || t["addr:district"] || "",
              city: t["addr:city"] || t["addr:district"] || "",
              state: t["addr:state"] || "",
              latitude: el.lat as number,
              longitude: el.lon as number,
              phone: t.phone || t["contact:phone"] || null,
              email: t.email || t["contact:email"] || null,
              website: t.website || t["contact:website"] || null,
              rating: null,
              emergency: ot === "hospital" || ot === "clinic",
              ambulance: t.ambulance === "yes",
              bloodBank: false,
              diagnostic: ot === "doctors" || ot === "centre",
              specialties: [ot],
              openingHours: t["opening_hours"] || null,
              imageUrl: null,
              distance: calcDist(lat, lng, el.lat as number, el.lon as number),
            }
          })
          .sort((a: { distance: number }, b: { distance: number }) => a.distance - b.distance)
          .slice(0, 50)
        if (hospitals.length > 0) break
      }
    }

    if (!hospitals.length) {
      const close = FALLBACK_HOSPITALS.map((h, i) => ({
        id: `fallback-${i}`,
        name: h.name,
        type: h.type,
        address: "",
        city: "Dhaka",
        state: "Dhaka",
        phone: h.phone,
        email: null,
        website: null,
        latitude: h.lat,
        longitude: h.lng,
        rating: null,
        emergency: h.type === "hospital",
        ambulance: false,
        bloodBank: false,
        diagnostic: h.type === "diagnostic",
        specialties: [h.type],
        openingHours: null,
        imageUrl: null,
        distance: calcDist(lat, lng, h.lat, h.lng),
      })).sort((a, b) => a.distance - b.distance).slice(0, 10)
      hospitals = close as unknown as Record<string, unknown>[]
    }

    console.log(`[Hospitals] Returning ${hospitals.length} results (${Date.now() - start}ms)`)
    return NextResponse.json(hospitals)
  } catch (err) {
    console.error(`[Hospitals] Error (${Date.now() - start}ms):`, err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "Could not load nearby hospitals" }, { status: 500 })
  }
}

function unknownName(type: string): string {
  const names: Record<string, string> = {
    hospital: "হাসপাতাল", clinic: "ক্লিনিক", doctors: "ডাক্তার", pharmacy: "ফার্মেসী", centre: "স্বাস্থ্য কেন্দ্র",
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
