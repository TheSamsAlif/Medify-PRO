import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { patientId, approve } = await req.json()
    if (!patientId) {
      return NextResponse.json({ error: "patientId required" }, { status: 400 })
    }

    const link = await prisma.doctorPatient.findFirst({
      where: { doctorId: session.user.id, patientId },
      include: { patient: true },
    })
    if (!link) {
      return NextResponse.json({ error: "Patient not linked" }, { status: 404 })
    }

    await prisma.doctorPatient.update({
      where: { id: link.id },
      data: {
        contactApproved: approve === true,
        contactRequested: false,
      },
    })

    if (approve) {
      const doctor = await prisma.user.findUnique({ where: { id: session.user.id } })
      await prisma.notification.create({
        data: {
          userId: link.patient.userId,
          title: "✅ Contact Approved",
          body: `Dr. ${doctor?.name || "Doctor"} has shared their contact number: ${doctor?.phone || "N/A"}`,
          type: "CONTACT_APPROVED",
          data: { phone: doctor?.phone },
        },
      })
    }

    return NextResponse.json({ message: approve ? "Contact shared" : "Request declined" })
  } catch (error) {
    console.error("Approve contact error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
