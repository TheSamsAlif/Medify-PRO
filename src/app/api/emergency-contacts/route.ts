import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  try {
    const contacts = await prisma.emergencyContact.findMany({
      orderBy: { priority: "asc" },
    })

    return NextResponse.json(contacts)
  } catch (error) {
    console.error("Emergency contacts error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
