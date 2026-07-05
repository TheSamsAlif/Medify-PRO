import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const lat = parseFloat(searchParams.get("lat") || "0")
    const lng = parseFloat(searchParams.get("lng") || "0")
    const type = searchParams.get("type") || ""
    const limit = parseInt(searchParams.get("limit") || "20")

    const where: Record<string, unknown> = {}
    if (type) {
      where.type = type
    }

    let hospitals = await prisma.hospital.findMany({
      where,
      take: limit,
    })

    if (lat && lng) {
      hospitals = hospitals
        .map((h) => ({
          ...h,
          distance: calculateDistance(lat, lng, h.latitude, h.longitude),
        }))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
    }

    return NextResponse.json(hospitals)
  } catch (error) {
    console.error("Hospitals error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
