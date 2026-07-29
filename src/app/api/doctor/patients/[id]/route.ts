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
    include: {
      patient: {
        include: {
          user: {
            select: {
              id: true, name: true, email: true, phone: true, age: true, gender: true,
              bloodGroup: true, address: true, emergencyPhone: true, image: true,
            },
          },
        },
      },
    },
  })
  if (!doctorPatient) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const p = doctorPatient.patient
  const u = p.user
  return NextResponse.json({
    patientId: p.id,
    userId: p.userId,
    name: u.name, email: u.email, phone: u.phone,
    age: u.age, gender: u.gender, bloodGroup: u.bloodGroup,
    address: u.address, emergencyPhone: u.emergencyPhone, image: u.image,
    dateOfBirth: p.dateOfBirth, heightCm: p.heightCm, weightKg: p.weightKg,
    bmi: p.bmi, bloodType: p.bloodType,
    allergies: p.allergies,
    chronicConditions: p.chronicConditions,
    emergencyContact: p.emergencyContact,
    emergencyRelation: p.emergencyRelation,
    medicalHistory: p.medicalHistory,
  })
}
