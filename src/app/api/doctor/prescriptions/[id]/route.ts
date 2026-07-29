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
  const prescription = await prisma.prescription.findUnique({ where: { id } })
  if (!prescription || prescription.doctorName !== session.user.name) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  const data: any = {}
  const fields = ["diagnosis", "symptoms", "notes", "advice", "bloodPressure", "temperature", "signature", "hospitalName"]
  fields.forEach(f => { if (body[f] !== undefined) data[f] = body[f] })
  if (body.patientWeight !== undefined) data.patientWeight = parseFloat(body.patientWeight)
  if (body.followUpDate !== undefined) data.followUpDate = body.followUpDate ? new Date(body.followUpDate) : null
  if (body.isDraft !== undefined) data.isDraft = body.isDraft

  const updated = await prisma.prescription.update({ where: { id }, data, include: { medicines: true } })
  return NextResponse.json(updated)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const prescription = await prisma.prescription.findUnique({ where: { id } })
  if (!prescription || prescription.doctorName !== session.user.name) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  await prisma.prescription.delete({ where: { id } })
  return NextResponse.json({ deleted: true })
}
