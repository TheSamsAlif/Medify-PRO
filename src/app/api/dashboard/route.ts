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
    const role = session.user.role as string

    if (role === "DOCTOR") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      const doctorName = session.user.name || ""

      const [totalPatients, todayAppts, upcomingAppts, completedAppts, pendingPrescriptions, emergencyCount, recentAppointments, recentPrescriptions, emergencyPatients] = await Promise.all([
        prisma.doctorPatient.count({ where: { doctorId: userId } }),
        prisma.appointment.count({
          where: { doctorName, date: { gte: today, lt: new Date(today.getTime() + 86400000) } },
        }),
        prisma.appointment.count({
          where: { doctorName, date: { gt: new Date(today.getTime() + 86400000) }, status: { in: ["SCHEDULED", "CONFIRMED"] } },
        }),
        prisma.appointment.count({
          where: { doctorName, status: "COMPLETED" },
        }),
        prisma.prescription.count({
          where: { doctorName, isDraft: true },
        }),
        prisma.sOSAlert.count({
          where: { status: "ACTIVE", createdAt: { gte: weekAgo } },
        }),
        prisma.appointment.findMany({
          where: { doctorName, date: { gte: today } },
          orderBy: { date: "asc" },
          take: 10,
          include: { user: { select: { name: true, phone: true } } },
        }),
        prisma.prescription.findMany({
          where: { doctorName },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { user: { select: { name: true } } },
        }),
        prisma.sOSAlert.findMany({
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { user: { select: { name: true, phone: true } } },
        }),
      ])

      const weeklyLabels: string[] = []
      const weeklyData: number[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const dayStart = new Date(d)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(dayStart.getTime() + 86400000)
        const count = await prisma.appointment.count({
          where: { doctorName, date: { gte: dayStart, lt: dayEnd } },
        })
        weeklyLabels.push(d.toLocaleDateString("en-US", { weekday: "short" }))
        weeklyData.push(count)
      }

      return NextResponse.json({
        role: "DOCTOR",
        todayAppointments: todayAppts,
        totalPatients,
        pendingPrescriptions,
        emergencyCases: emergencyCount,
        completedAppointments: completedAppts,
        upcomingAppointments: upcomingAppts,
        weeklyStats: { labels: weeklyLabels, data: weeklyData },
        recentAppointments: recentAppointments.map(a => ({
          id: a.id, patientName: a.user?.name || "Unknown", time: a.date, problem: a.notes || "General", status: a.status,
        })),
        recentPrescriptions: recentPrescriptions.map(p => ({
          id: p.id, patientName: p.user?.name || "Unknown", diagnosis: p.diagnosis, createdAt: p.createdAt, medicinesCount: (p as any).medicines?.length || 0,
        })),
        emergencyPatients: emergencyPatients.map(e => ({
          id: e.id, patientName: e.user?.name || "Unknown", phone: e.user?.phone, message: e.message, createdAt: e.createdAt,
        })),
      })
    }

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
      role: "PATIENT",
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
