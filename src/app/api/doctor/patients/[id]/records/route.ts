import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const doctorPatient = await prisma.doctorPatient.findFirst({
    where: { doctorId: session.user.id, patientId: id },
    include: { patient: true },
  })
  if (!doctorPatient) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const userId = doctorPatient.patient.userId
  const [prescriptions, healthRecords, healthMetrics] = await Promise.all([
    prisma.prescription.findMany({
      where: { userId, isDraft: false },
      orderBy: { createdAt: "desc" },
      include: { medicines: true },
    }),
    prisma.healthRecord.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    }),
    prisma.healthMetric.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 50,
    }),
  ])

  return NextResponse.json({ prescriptions, healthRecords, healthMetrics })
}
