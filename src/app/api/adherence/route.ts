import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get("days") || "30")

    const since = new Date()
    since.setDate(since.getDate() - days)

    const logs = await prisma.medicineLog.findMany({
      where: {
        userId: session.user.id,
        takenAt: { gte: since },
      },
      orderBy: { takenAt: "desc" },
    })

    const total = logs.length
    const taken = logs.filter((l) => l.status === "TAKEN").length
    const skipped = logs.filter((l) => l.status === "SKIPPED").length
    const delayed = logs.filter((l) => l.status === "DELAYED").length
    const missed = total - taken - skipped - delayed

    let streak = 0
    const today = new Date()
    const logDates = [...new Set(logs.map((l) => {
      const d = new Date(l.takenAt)
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    }))]

    for (let i = 0; i < days; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      if (logDates.includes(key)) {
        streak++
      } else {
        break
      }
    }

    return NextResponse.json({
      total,
      taken,
      skipped,
      delayed,
      missed,
      percentage: total > 0 ? Math.round((taken / total) * 100) : 0,
      streak,
      logs,
    })
  } catch (error) {
    console.error("Adherence error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
