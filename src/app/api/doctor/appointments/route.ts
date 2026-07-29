import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const patientId = searchParams.get("patientId")
  const doctorName = session.user.name

  let userId: string | undefined
  if (patientId) {
    const patient = await prisma.patient.findUnique({ where: { id: patientId } })
    if (patient) userId = patient.userId
  }

  const where: any = {}
  if (doctorName) {
    where.doctorName = doctorName
  }
  if (userId) {
    where.userId = userId
  }

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { date: "desc" },
    include: { user: { select: { id: true, name: true } } },
  })
  return NextResponse.json(appointments)
}
