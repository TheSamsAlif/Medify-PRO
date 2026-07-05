import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const records = await prisma.healthRecord.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error("Health records error:", error)
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

    const record = await prisma.healthRecord.create({
      data: {
        userId: session.user.id,
        type: body.type,
        title: body.title,
        description: body.description,
        value: body.value,
        unit: body.unit,
        date: new Date(body.date || Date.now()),
        doctorName: body.doctorName,
        hospital: body.hospital,
        tags: body.tags || [],
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error("Health record create error:", error)
    return NextResponse.json({ error: "রেকর্ড তৈরি করতে সমস্যা হয়েছে" }, { status: 500 })
  }
}
