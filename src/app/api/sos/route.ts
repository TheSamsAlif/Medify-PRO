import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { latitude, longitude, message } = body

    const alert = await prisma.sOSAlert.create({
      data: {
        userId: session.user.id,
        latitude: latitude || null,
        longitude: longitude || null,
        message: message || "SOS Emergency!",
        status: "ACTIVE",
      },
    })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        patients: {
          include: {
            guardians: {
              include: {
                guardian: { include: { user: true } },
              },
            },
          },
        },
      },
    })

    const emergencyContacts = await prisma.emergencyContact.findMany({
      orderBy: { priority: "asc" },
    })

    const guardianEmails = user?.patients?.[0]?.guardians?.map(g => g.guardian.user.email).filter(Boolean) || []

    return NextResponse.json({
      alert,
      notified: {
        guardians: guardianEmails,
        emergencyContacts: emergencyContacts.map(c => ({ name: c.name, phone: c.phone, type: c.type })),
      },
      message: "SOS alert sent! Help is on the way.",
    })
  } catch (error) {
    console.error("SOS error:", error)
    return NextResponse.json({ error: "SOS পাঠাতে সমস্যা হয়েছে" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const alerts = await prisma.sOSAlert.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    return NextResponse.json(alerts)
  } catch (error) {
    console.error("SOS fetch error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
