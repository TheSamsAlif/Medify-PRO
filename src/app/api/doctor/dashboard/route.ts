import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const doctorName = session.user.name || ""
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [totalPatients, todayAppts, upcomingAppts, completedAppts, pendingPrescriptions, emergencyCount] = await Promise.all([
    prisma.doctorPatient.count({ where: { doctorId: session.user.id } }),
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
  ])

  const weeklyAppointments = await prisma.appointment.groupBy({
    by: ["status"],
    where: { doctorName, date: { gte: weekAgo } },
    _count: true,
  })

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
    totalPatients,
    todayAppointments: todayAppts,
    upcomingAppointments: upcomingAppts,
    completedAppointments: completedAppts,
    pendingPrescriptions,
    emergencyCases: emergencyCount,
    satisfaction: 92,
    weeklyStats: { labels: weeklyLabels, data: weeklyData },
    statusBreakdown: weeklyAppointments.reduce((acc: any, r: any) => {
      acc[r.status] = r._count
      return acc
    }, {} as Record<string, number>),
  })
}
