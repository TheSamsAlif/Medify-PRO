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
    include: { patient: { select: { allergies: true } } },
  })
  if (!doctorPatient) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ allergies: doctorPatient.patient.allergies })
}
