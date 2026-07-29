import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const alerts = await prisma.sOSAlert.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      user: {
        select: {
          id: true, name: true, phone: true, age: true, gender: true, bloodGroup: true,
          address: true, emergencyPhone: true, image: true,
        },
      },
    },
  })

  const patients = alerts.map(a => ({
    id: a.id, userId: a.userId,
    patientName: a.user.name, patientPhone: a.user.phone,
    patientAge: a.user.age, patientGender: a.user.gender,
    bloodGroup: a.user.bloodGroup, address: a.user.address,
    emergencyPhone: a.user.emergencyPhone, image: a.user.image,
    latitude: a.latitude, longitude: a.longitude,
    message: a.message, status: a.status,
    createdAt: a.createdAt,
    priority: a.message?.toLowerCase().includes("critical") ? "CRITICAL" : "HIGH",
  }))

  return NextResponse.json(patients)
}
