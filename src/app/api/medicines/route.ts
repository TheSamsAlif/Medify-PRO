import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const medicines = await prisma.medicine.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(medicines)
  } catch (error) {
    console.error("Medicines fetch error:", error)
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

    const medicine = await prisma.medicine.create({
      data: {
        userId: session.user.id,
        name: body.name,
        dosage: body.dosage,
        frequency: body.frequency || "1",
        intakeTime: body.intakeTime || "ANYTIME",
        morning: body.morning || false,
        noon: body.noon || false,
        evening: body.evening || false,
        night: body.night || false,
        notes: body.notes,
        reminderEnabled: body.reminderEnabled !== false,
        startDate: new Date(),
      },
    })

    return NextResponse.json(medicine, { status: 201 })
  } catch (error) {
    console.error("Medicine create error:", error)
    return NextResponse.json({ error: "ওষুধ যোগ করতে সমস্যা হয়েছে" }, { status: 500 })
  }
}
