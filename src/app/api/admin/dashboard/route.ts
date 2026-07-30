import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(startOfDay.getTime() + 86400000)

    const [
      totalPatients, totalGuardians, totalDoctors, totalAdmins,
      todayAppointments, prescriptions, aiUsage,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "PATIENT" } }),
      prisma.user.count({ where: { role: "GUARDIAN" } }),
      prisma.user.count({ where: { role: "DOCTOR" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.appointment.count({ where: { date: { gte: startOfDay, lt: endOfDay } } }),
      prisma.prescription.count(),
      prisma.chatMessage.count({ where: { createdAt: { gte: startOfDay } } }),
    ])

    return NextResponse.json({
      totalPatients,
      totalGuardians,
      totalDoctors,
      totalAdmins,
      activeUsers: totalPatients + totalGuardians + totalDoctors + totalAdmins,
      todayAppointments,
      prescriptions,
      aiUsage,
      systemStatus: "All Good",
    })
  } catch (error) {
    console.error("Admin dashboard error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
