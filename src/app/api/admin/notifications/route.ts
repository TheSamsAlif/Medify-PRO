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
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "50")

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count(),
    ])

    return NextResponse.json({ notifications, total, page })
  } catch (error) {
    console.error("Admin notifications list error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId, title, body, type } = await req.json()

    if (!userId || !title || !body) {
      return NextResponse.json({ error: "userId, title & body required" }, { status: 400 })
    }

    await prisma.notification.create({
      data: { userId, title, body, type: type || "ADMIN" },
    })

    return NextResponse.json({ message: "নোটিফিকেশন পাঠানো হয়েছে" })
  } catch (error) {
    console.error("Admin send notification error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
