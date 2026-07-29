import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const appointment = await prisma.appointment.findUnique({ where: { id } })
    if (!appointment || appointment.userId !== session.user.id) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    await prisma.appointment.delete({ where: { id } })

    return NextResponse.json({ message: "Deleted" })
  } catch (error) {
    console.error("Appointment delete error:", error)
    return NextResponse.json({ error: "মুছতে সমস্যা হয়েছে" }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    const appointment = await prisma.appointment.findUnique({ where: { id } })
    if (!appointment || appointment.userId !== session.user.id) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: body.status || appointment.status,
        notes: body.notes !== undefined ? body.notes : appointment.notes,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Appointment update error:", error)
    return NextResponse.json({ error: "আপডেট করতে সমস্যা হয়েছে" }, { status: 500 })
  }
}
