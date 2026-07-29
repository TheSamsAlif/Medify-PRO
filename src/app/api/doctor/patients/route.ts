import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const links = await prisma.doctorPatient.findMany({
      where: { doctorId: session.user.id },
      include: {
        patient: {
          include: {
            user: {
              include: {
                medicines: true,
                medicineLogs: { take: 20, orderBy: { takenAt: "desc" } },
              },
            },
          },
        },
      },
    })

    const patients = links.map(l => ({
      id: l.patient.id,
      patientId: `PAT-${l.patient.userId.slice(-6).toUpperCase()}`,
      name: l.patient.user.name,
      email: l.patient.user.email,
      phone: l.patient.user.phone,
      age: l.patient.user.age,
      gender: l.patient.user.gender,
      bloodGroup: l.patient.user.bloodGroup,
      address: l.patient.user.address,
      medicalHistory: l.patient.medicalHistory,
      medicines: l.patient.user.medicines,
      logs: l.patient.user.medicineLogs,
      contactRequested: l.contactRequested,
      contactApproved: l.contactApproved,
      createdAt: l.createdAt,
    }))

    return NextResponse.json(patients)
  } catch (error) {
    console.error("Doctor patients fetch error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { patientId } = await req.json()
    if (!patientId) {
      return NextResponse.json({ error: "Patient ID required" }, { status: 400 })
    }

    // Find user whose id ends with patientId suffix
    const cleanId = patientId.replace("PAT-", "").toLowerCase()
    const allUsers = await prisma.user.findMany({
      where: { role: "PATIENT" },
      include: { patients: true },
    })

    const matchedUser = allUsers.find(u => u.id.toLowerCase().endsWith(cleanId))
    if (!matchedUser || !matchedUser.patients[0]) {
      return NextResponse.json({ error: "রোগী পাওয়া যায়নি" }, { status: 404 })
    }

    const patientRecord = matchedUser.patients[0]

    // Link doctor to patient
    await prisma.doctorPatient.upsert({
      where: {
        doctorId_patientId: {
          doctorId: session.user.id,
          patientId: patientRecord.id,
        },
      },
      create: {
        doctorId: session.user.id,
        patientId: patientRecord.id,
      },
      update: {},
    })

    return NextResponse.json({
      message: "রোগী সফলভাবে যুক্ত হয়েছে",
      patient: {
        patientId,
        name: matchedUser.name,
        email: matchedUser.email,
        phone: matchedUser.phone,
      },
    })
  } catch (error) {
    console.error("Doctor link patient error:", error)
    return NextResponse.json({ error: "রোগী যুক্ত করতে সমস্যা হয়েছে" }, { status: 500 })
  }
}
