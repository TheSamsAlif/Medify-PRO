import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    const medicine = await prisma.medicine.updateMany({
      where: { id, userId: session.user.id },
      data: body,
    })

    return NextResponse.json(medicine)
  } catch (error) {
    console.error("Medicine update error:", error)
    return NextResponse.json({ error: "আপডেট করতে সমস্যা হয়েছে" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await prisma.medicine.deleteMany({
      where: { id, userId: session.user.id },
    })

    return NextResponse.json({ message: "Deleted" })
  } catch (error) {
    console.error("Medicine delete error:", error)
    return NextResponse.json({ error: "মুছতে সমস্যা হয়েছে" }, { status: 500 })
  }
}
