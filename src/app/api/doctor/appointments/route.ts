import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const filter = searchParams.get("filter") || "today"
  const q = searchParams.get("q") || ""
  const doctorName = session.user.name || ""

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const where: any = { doctorName }

  if (filter === "today") {
    where.date = { gte: today, lt: new Date(today.getTime() + 86400000) }
  } else if (filter === "upcoming") {
    where.date = { gte: new Date() }
    where.status = { in: ["SCHEDULED", "CONFIRMED"] }
  } else if (filter === "completed") {
    where.status = "COMPLETED"
  } else if (filter === "cancelled") {
    where.status = "CANCELLED"
  }

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { date: "asc" },
    include: { user: { select: { id: true, name: true, phone: true, image: true, age: true, gender: true } } },
  })

  let result = appointments.map(a => ({
    id: a.id, patientId: a.userId, patientName: a.user.name, patientPhone: a.user.phone,
    patientImage: a.user.image, patientAge: a.user.age, patientGender: a.user.gender,
    date: a.date, duration: a.duration, status: a.status, notes: a.notes,
    location: a.location, meetingLink: a.meetingLink, specialty: a.specialty,
    hospitalName: a.hospitalName,
  }))

  if (q) {
    const term = q.toLowerCase()
    result = result.filter(a => a.patientName?.toLowerCase().includes(term) || a.patientPhone?.includes(term))
  }

  return NextResponse.json(result)
}
