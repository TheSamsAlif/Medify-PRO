import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { startOfDay, endOfDay } from "date-fns"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const today = new Date()
    const dayStart = startOfDay(today)
    const dayEnd = endOfDay(today)

    const [activeMedicines, todayLogs, appointments] = await Promise.all([
      prisma.medicine.count({
        where: { userId, status: "ACTIVE" },
      }),
      prisma.medicineLog.findMany({
        where: {
          userId,
          takenAt: { gte: dayStart, lte: dayEnd },
        },
        include: { medicine: true },
        orderBy: { takenAt: "desc" },
      }),
      prisma.appointment.findMany({
        where: {
          userId,
          date: { gte: today },
          status: { in: ["SCHEDULED", "CONFIRMED"] },
        },
        orderBy: { date: "asc" },
        take: 5,
      }),
    ])

    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    const logs30d = await prisma.medicineLog.findMany({
      where: {
        userId,
        takenAt: { gte: thirtyDaysAgo },
      },
    })

    const total = logs30d.length
    const taken = logs30d.filter((l) => l.status === "TAKEN").length
    const adherence = total > 0 ? Math.round((taken / total) * 100) : 0

    return NextResponse.json({
      user: session.user,
      activeMedicines,
      todayLogs,
      adherence,
      upcomingAppointments: appointments,
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
