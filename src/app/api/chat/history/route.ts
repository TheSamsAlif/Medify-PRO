import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const messages = await prisma.chatMessage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
      take: 50,
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Chat history error:", error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.chatMessage.deleteMany({
      where: { userId: session.user.id },
    })

    return NextResponse.json({ message: "Chat cleared" })
  } catch (error) {
    console.error("Chat clear error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
