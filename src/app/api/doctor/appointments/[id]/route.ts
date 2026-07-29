import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const body = await req.json()
  const doctorName = session.user.name || ""

  const appt = await prisma.appointment.findFirst({
    where: { id, doctorName },
  })
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const data: any = {}
  if (body.status) data.status = body.status
  if (body.date) data.date = new Date(body.date)
  if (body.duration) data.duration = body.duration
  if (body.notes !== undefined) data.notes = body.notes
  if (body.meetingLink !== undefined) data.meetingLink = body.meetingLink

  const updated = await prisma.appointment.update({ where: { id }, data })

  if (body.status === "CONFIRMED" || body.status === "CANCELLED") {
    await prisma.notification.create({
      data: {
        userId: appt.userId,
        type: "APPOINTMENT",
        title: body.status === "CONFIRMED" ? "অ্যাপয়েন্টমেন্ট নিশ্চিত" : "অ্যাপয়েন্টমেন্ট বাতিল",
        body: body.status === "CONFIRMED"
          ? `ডা. ${doctorName} আপনার অ্যাপয়েন্টমেন্ট নিশ্চিত করেছেন।`
          : `ডা. ${doctorName} আপনার অ্যাপয়েন্টমেন্ট বাতিল করেছেন।`,
        data: { appointmentId: id },
      },
    })
  }

  return NextResponse.json(updated)
}
