import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const status = url.searchParams.get("status") || ""
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "50")

    const where: any = {}
    if (status && ["PENDING", "REVIEWED", "RESOLVED"].includes(status)) {
      where.status = status
    }

    const [feedback, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.feedback.count({ where }),
    ])

    return NextResponse.json({ feedback, total, page })
  } catch (error) {
    console.error("Admin feedback list error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, adminReply, status } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 })
    }

    const updateData: any = {}
    if (adminReply !== undefined) updateData.adminReply = adminReply
    if (status !== undefined) updateData.status = status

    await prisma.feedback.update({ where: { id }, data: updateData })

    return NextResponse.json({ message: "ফিডব্যাক আপডেট হয়েছে" })
  } catch (error) {
    console.error("Admin feedback update error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
