import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let guardian = await prisma.guardian.findUnique({
      where: { userId: session.user.id },
    })

    if (!guardian) {
      guardian = await prisma.guardian.create({
        data: { userId: session.user.id },
      })
    }

    const links = await prisma.guardianPatient.findMany({
      where: { guardianId: guardian.id },
      include: {
        patient: {
          include: {
            user: {
              include: {
                medicines: true,
                medicineLogs: { take: 10, orderBy: { takenAt: "desc" } },
                healthMetrics: { take: 5, orderBy: { date: "desc" } },
              },
            },
          },
        },
      },
    })

    const patients = links.map(l => ({
      id: l.patient.id,
      patientId: `PAT-${l.patient.userId.slice(-6).toUpperCase()}`,
      relation: l.relation,
      name: l.patient.user.name,
      email: l.patient.user.email,
      phone: l.patient.user.phone,
      age: l.patient.user.age,
      gender: l.patient.user.gender,
      bloodGroup: l.patient.user.bloodGroup,
      medicines: l.patient.user.medicines,
      logs: l.patient.user.medicineLogs,
      metrics: l.patient.user.healthMetrics,
    }))

    return NextResponse.json(patients)
  } catch (error) {
    console.error("Guardian patients fetch error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { patientId, relation } = await req.json()
    if (!patientId) {
      return NextResponse.json({ error: "Patient ID required" }, { status: 400 })
    }

    let guardian = await prisma.guardian.findUnique({
      where: { userId: session.user.id },
    })

    if (!guardian) {
      guardian = await prisma.guardian.create({
        data: { userId: session.user.id },
      })
    }

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

    await prisma.guardianPatient.upsert({
      where: {
        guardianId_patientId: {
          guardianId: guardian.id,
          patientId: patientRecord.id,
        },
      },
      create: {
        guardianId: guardian.id,
        patientId: patientRecord.id,
        relation: relation || "family",
      },
      update: {
        relation: relation || "family",
      },
    })

    return NextResponse.json({
      message: "রোগী সফলভাবে যুক্ত হয়েছে",
      patient: {
        patientId,
        name: matchedUser.name,
      },
    })
  } catch (error) {
    console.error("Guardian link patient error:", error)
    return NextResponse.json({ error: "রোগী যুক্ত করতে সমস্যা হয়েছে" }, { status: 500 })
  }
}
