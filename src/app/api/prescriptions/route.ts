import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const prescriptions = await prisma.prescription.findMany({
      where: { userId: session.user.id },
      include: { medicines: true },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(prescriptions)
  } catch (error) {
    console.error("Prescriptions error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const doctorName = formData.get("doctorName") as string
    const hospitalName = formData.get("hospitalName") as string
    const diagnosis = formData.get("diagnosis") as string
    const notes = formData.get("notes") as string
    const advice = formData.get("advice") as string
    const followUpDate = formData.get("followUpDate") as string
    const extractedText = formData.get("extractedText") as string

    const prescription = await prisma.prescription.create({
      data: {
        userId: session.user.id,
        doctorName: doctorName || null,
        hospitalName: hospitalName || null,
        diagnosis: diagnosis || null,
        notes: notes || null,
        advice: advice || null,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        extractedText: extractedText || null,
      },
    })

    return NextResponse.json(prescription, { status: 201 })
  } catch (error) {
    console.error("Prescription create error:", error)
    return NextResponse.json({ error: "প্রেসক্রিপশন সংরক্ষণ করতে সমস্যা হয়েছে" }, { status: 500 })
  }
}
