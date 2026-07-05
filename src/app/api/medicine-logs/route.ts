import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { medicineId, status } = body

    if (!medicineId || !status) {
      return NextResponse.json({ error: "medicineId and status required" }, { status: 400 })
    }

    const log = await prisma.medicineLog.create({
      data: {
        medicineId,
        userId: session.user.id,
        status,
        takenAt: new Date(),
      },
    })

    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error("Log create error:", error)
    return NextResponse.json({ error: "লগ করতে সমস্যা হয়েছে" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get("days") || "7")

    const since = new Date()
    since.setDate(since.getDate() - days)

    const logs = await prisma.medicineLog.findMany({
      where: {
        userId: session.user.id,
        takenAt: { gte: since },
      },
      include: { medicine: true },
      orderBy: { takenAt: "desc" },
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error("Logs fetch error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
