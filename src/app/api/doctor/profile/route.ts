import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, phone: true, image: true,
      age: true, gender: true, address: true, degree: true, specialization: true,
      experience: true, consultationFee: true, languagesSpoken: true,
      hospitalName: true, registrationNumber: true, isAvailable: true,
      chamberLocation: true, chamberLatitude: true, chamberLongitude: true,
      language: true, theme: true,
    },
  })
  return NextResponse.json(user)
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await req.json()
  const data: any = {}
  const fields = ["name", "phone", "age", "gender", "address", "image",
    "degree", "specialization", "experience", "consultationFee",
    "hospitalName", "registrationNumber", "isAvailable",
    "chamberLocation", "chamberLatitude", "chamberLongitude", "language"]
  fields.forEach(f => {
    if (body[f] !== undefined) data[f] = body[f]
  })
  if (body.languagesSpoken !== undefined) data.languagesSpoken = body.languagesSpoken
  if (body.age !== undefined) data.age = parseInt(body.age)
  if (body.experience !== undefined) data.experience = parseInt(body.experience)
  if (body.consultationFee !== undefined) data.consultationFee = parseFloat(body.consultationFee)
  if (body.chamberLatitude !== undefined) data.chamberLatitude = parseFloat(body.chamberLatitude)
  if (body.chamberLongitude !== undefined) data.chamberLongitude = parseFloat(body.chamberLongitude)

  const user = await prisma.user.update({ where: { id: session.user.id }, data })
  return NextResponse.json({ user })
}
