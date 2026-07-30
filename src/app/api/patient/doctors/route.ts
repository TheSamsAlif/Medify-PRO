import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      include: {
        doctorLinks: {
          include: {
            doctor: true,
          },
        },
      },
    })

    if (!patient) {
      return NextResponse.json([])
    }

    const doctors = patient.doctorLinks.map(link => ({
      id: link.doctor.id,
      doctorId: `DOC-${link.doctor.id.slice(-6).toUpperCase()}`,
      name: link.doctor.name,
      email: link.doctor.email,
      phone: link.contactApproved ? link.doctor.phone : null,
      registrationNumber: link.doctor.registrationNumber,
      isAvailable: link.doctor.isAvailable,
      chamberLocation: link.doctor.chamberLocation,
      contactRequested: link.contactRequested,
      contactApproved: link.contactApproved,
    }))

    return NextResponse.json(doctors)
  } catch (error) {
    console.error("Patient doctors fetch error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { doctorId, action } = await req.json()
    if (!doctorId) {
      return NextResponse.json({ error: "doctorId required" }, { status: 400 })
    }

    const patient = await prisma.patient.findUnique({ where: { userId: session.user.id } })
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    if (action === "add_doctor") {
      const cleanId = doctorId.replace("DOC-", "").toLowerCase()
      const allDoctors = await prisma.user.findMany({
        where: { role: "DOCTOR" },
      })

      const matchedDoctor = allDoctors.find(u => u.id.toLowerCase().endsWith(cleanId))
      if (!matchedDoctor) {
        return NextResponse.json({ error: "ডাক্তার পাওয়া যায়নি" }, { status: 404 })
      }

      await prisma.doctorPatient.upsert({
        where: {
          doctorId_patientId: {
            doctorId: matchedDoctor.id,
            patientId: patient.id,
          },
        },
        create: {
          doctorId: matchedDoctor.id,
          patientId: patient.id,
        },
        update: {},
      })

      await prisma.notification.create({
        data: {
          userId: matchedDoctor.id,
          title: "👤 New Patient Connected",
          body: `${session.user.name || "A patient"} has connected with you via your Doctor ID.`,
          type: "PATIENT_CONNECTED",
          data: { patientId: session.user.id },
        },
      })

      return NextResponse.json({
        message: "ডাক্তার সফলভাবে যুক্ত হয়েছে",
        doctor: { name: matchedDoctor.name, doctorId: `DOC-${matchedDoctor.id.slice(-6).toUpperCase()}` },
      })
    }

    if (action === "request_contact") {
      const link = await prisma.doctorPatient.findFirst({
        where: { doctorId, patientId: patient.id },
      })
      if (!link) {
        return NextResponse.json({ error: "Doctor not linked" }, { status: 404 })
      }

      await prisma.doctorPatient.update({
        where: { id: link.id },
        data: { contactRequested: true },
      })

      await prisma.notification.create({
        data: {
          userId: doctorId,
          title: "📞 Contact Request",
          body: `${session.user.name || "A patient"} has requested to see your contact number.`,
          type: "CONTACT_REQUEST",
          data: { patientId: session.user.id },
        },
      })

      return NextResponse.json({ message: "Request sent" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Patient doctors action error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { doctorId } = await req.json()
    if (!doctorId) {
      return NextResponse.json({ error: "doctorId required" }, { status: 400 })
    }

    const patient = await prisma.patient.findUnique({ where: { userId: session.user.id } })
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    const link = await prisma.doctorPatient.findFirst({
      where: { doctorId, patientId: patient.id },
    })
    if (!link) {
      return NextResponse.json({ error: "ডাক্তার পাওয়া যায়নি" }, { status: 404 })
    }

    await prisma.doctorPatient.delete({ where: { id: link.id } })

    return NextResponse.json({ message: "ডাক্তার সরানো হয়েছে" })
  } catch (error) {
    console.error("Patient doctors delete error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
