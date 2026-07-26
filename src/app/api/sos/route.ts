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
            doctorLinks: {
              include: {
                doctor: true,
              },
            },
          },
        },
      },
    })

    const mapsLink = latitude && longitude
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : null

    const patientName = user?.name || "Unknown"
    const notifyUserIds: string[] = []

    // Notify guardians
    const guardianEmails: string[] = []
    for (const g of user?.patients?.[0]?.guardians || []) {
      const gEmail = g.guardian.user.email
      if (gEmail) guardianEmails.push(gEmail)
      if (g.guardian.userId) {
        notifyUserIds.push(g.guardian.userId)
        await prisma.notification.create({
          data: {
            userId: g.guardian.userId,
            title: "🚨 SOS অ্যালার্ট!",
            body: `${patientName} একটি জরুরি SOS পাঠিয়েছেন।${mapsLink ? ` অবস্থান: ${mapsLink}` : ""}`,
            type: "SOS",
            data: { alertId: alert.id, latitude, longitude, mapsLink },
          },
        })
      }
    }

    // Notify doctors
    const doctorEmails: string[] = []
    for (const d of user?.patients?.[0]?.doctorLinks || []) {
      if (d.doctor.email) doctorEmails.push(d.doctor.email)
      if (d.doctorId) {
        notifyUserIds.push(d.doctorId)
        await prisma.notification.create({
          data: {
            userId: d.doctorId,
            title: "🚨 SOS অ্যালার্ট!",
            body: `আপনার রোগী ${patientName} একটি জরুরি SOS পাঠিয়েছেন।${mapsLink ? ` অবস্থান: ${mapsLink}` : ""}`,
            type: "SOS",
            data: { alertId: alert.id, latitude, longitude, mapsLink },
          },
        })
      }
    }

    const emergencyContacts = await prisma.emergencyContact.findMany({
      orderBy: { priority: "asc" },
    })

    return NextResponse.json({
      alert,
      notified: {
        guardians: guardianEmails,
        doctors: doctorEmails,
        emergencyContacts: emergencyContacts.map(c => ({ name: c.name, phone: c.phone, type: c.type })),
        inAppNotifications: notifyUserIds.length,
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
