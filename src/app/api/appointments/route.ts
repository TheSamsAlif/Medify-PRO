import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const appointments = await prisma.appointment.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error("Appointments error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    const appointment = await prisma.appointment.create({
      data: {
        userId: session.user.id,
        doctorName: body.doctorName,
        hospitalName: body.hospitalName,
        specialty: body.specialty,
        date: new Date(body.date),
        duration: body.duration || 30,
        notes: body.notes,
        location: body.location,
        status: "SCHEDULED",
      },
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error("Appointment create error:", error)
    return NextResponse.json({ error: "অ্যাপয়েন্টমেন্ট তৈরি করতে সমস্যা হয়েছে" }, { status: 500 })
  }
}
