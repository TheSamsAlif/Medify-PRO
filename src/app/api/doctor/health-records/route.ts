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
  if (!patientId) {
    return NextResponse.json({ error: "patientId required" }, { status: 400 })
  }
  const doctorPatient = await prisma.doctorPatient.findFirst({
    where: { doctorId: session.user.id, patientId },
    include: { patient: true },
  })
  if (!doctorPatient) {
    return NextResponse.json({ error: "Patient not linked" }, { status: 403 })
  }
  const records = await prisma.healthRecord.findMany({
    where: { userId: doctorPatient.patient.userId },
    orderBy: { date: "desc" },
  })
  return NextResponse.json(records)
}
