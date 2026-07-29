import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") || ""

  const links = await prisma.doctorPatient.findMany({
    where: { doctorId: session.user.id },
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

  let patients = links.map(l => ({
    patientId: l.patient.id,
    userId: l.patient.userId,
    name: l.patient.user.name,
    email: l.patient.user.email,
    phone: l.patient.user.phone,
    age: l.patient.user.age,
    gender: l.patient.user.gender,
    bloodGroup: l.patient.user.bloodGroup,
    address: l.patient.user.address,
    emergencyPhone: l.patient.user.emergencyPhone,
    image: l.patient.user.image,
    relation: l.contactApproved ? "connected" : l.contactRequested ? "requested" : "linked",
  }))

  if (q) {
    const term = q.toLowerCase()
    patients = patients.filter(p =>
      p.name?.toLowerCase().includes(term) ||
      p.phone?.includes(term) ||
      p.email?.toLowerCase().includes(term)
    )
  }

  return NextResponse.json(patients)
}
