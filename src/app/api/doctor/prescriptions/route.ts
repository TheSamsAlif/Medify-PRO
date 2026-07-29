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
  const prescriptions = await prisma.prescription.findMany({
    where: { userId: doctorPatient.patient.userId },
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
  const { patientId, diagnosis, notes, advice, followUpDate, medicines } = await req.json()
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
  const patientUserId = doctorPatient.patient.userId
  const prescription = await prisma.prescription.create({
    data: {
      userId: patientUserId,
      doctorName: session.user.name || "Doctor",
      diagnosis,
      notes,
      advice,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      medicines: {
        create: (medicines || []).map((m: any) => ({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          morning: m.morning ?? false,
          noon: m.noon ?? false,
          evening: m.evening ?? false,
          night: m.night ?? false,
          notes: m.notes,
        })),
      },
    },
    include: { medicines: true },
  })
  await prisma.notification.create({
    data: {
      userId: patientUserId,
      type: "PRESCRIPTION",
      title: "নতুন প্রেসক্রিপশন",
      body: `ডা. ${session.user.name || "Doctor"} আপনাকে একটি নতুন প্রেসক্রিপশন দিয়েছেন।`,
      data: { actionUrl: "/prescriptions" },
    },
  })
  return NextResponse.json(prescription, { status: 201 })
}
