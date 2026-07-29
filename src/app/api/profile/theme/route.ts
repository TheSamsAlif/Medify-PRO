import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { theme: true },
    })

    return NextResponse.json({ theme: user?.theme || "dark" })
  } catch (error) {
    console.error("Theme fetch error:", error)
    return NextResponse.json({ theme: "dark" })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { theme } = await req.json()
    if (!["dark", "light", "system"].includes(theme)) {
      return NextResponse.json({ error: "Invalid theme" }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { theme },
    })

    return NextResponse.json({ message: "Theme updated", theme })
  } catch (error) {
    console.error("Theme update error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
