import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const drafts = await prisma.prescriptionDraft.findMany({
    where: { doctorId: session.user.id },
    orderBy: { updatedAt: "desc" },
  })
  return NextResponse.json(drafts)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await req.json()
  const draft = await prisma.prescriptionDraft.create({
    data: {
      doctorId: session.user.id,
      userId: body.userId || null,
      diagnosis: body.diagnosis,
      symptoms: body.symptoms,
      notes: body.notes,
      advice: body.advice,
      bloodPressure: body.bloodPressure,
      temperature: body.temperature,
      patientWeight: body.patientWeight ? parseFloat(body.patientWeight) : null,
      followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
      hospitalName: body.hospitalName,
      medicines: body.medicines || "[]",
    },
  })
  return NextResponse.json(draft, { status: 201 })
}
