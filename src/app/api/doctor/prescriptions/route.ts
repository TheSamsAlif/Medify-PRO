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
  const doctorName = session.user.name || ""

  const where: any = { doctorName }
  if (patientId) {
    const patient = await prisma.patient.findUnique({ where: { id: patientId } })
    if (patient) where.userId = patient.userId
  }

  const prescriptions = await prisma.prescription.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { medicines: true },
  })
  return NextResponse.json(prescriptions)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await req.json()
  const doctor = await prisma.user.findUnique({ where: { id: session.user.id } })

  let userId = body.userId
  if (body.patientId && !userId) {
    const patient = await prisma.patient.findUnique({ where: { id: body.patientId } })
    if (patient) userId = patient.userId
  }

  if (!userId) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 })
  }

  const prescription = await prisma.prescription.create({
    data: {
      userId,
      doctorName: doctor?.name || "Doctor",
      hospitalName: body.hospitalName || doctor?.hospitalName,
      diagnosis: body.diagnosis,
      symptoms: body.symptoms,
      notes: body.notes,
      advice: body.advice,
      bloodPressure: body.bloodPressure,
      temperature: body.temperature,
      patientWeight: body.patientWeight ? parseFloat(body.patientWeight) : null,
      followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
      signature: body.signature,
      isDraft: body.isDraft || false,
      medicines: {
        create: (body.medicines || []).map((m: any) => ({
          name: m.name, dosage: m.dosage, frequency: m.frequency,
          duration: m.duration, durationUnit: m.durationUnit || "days",
          morning: m.morning ?? false, noon: m.noon ?? false,
          evening: m.evening ?? false, night: m.night ?? false,
          notes: m.notes, intakeTime: m.intakeTime || "ANYTIME",
          startDate: new Date(), status: "ACTIVE",
        })),
      },
    },
    include: { medicines: true },
  })

  if (!body.isDraft) {
    await prisma.notification.create({
      data: {
        userId,
        type: "PRESCRIPTION",
        title: "নতুন প্রেসক্রিপশন",
        body: `ডা. ${doctor?.name || "Doctor"} আপনাকে একটি নতুন প্রেসক্রিপশন দিয়েছেন।`,
        data: { prescriptionId: prescription.id },
      },
    })
  }

  return NextResponse.json(prescription, { status: 201 })
}
