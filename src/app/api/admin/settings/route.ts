import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settings = await prisma.systemSetting.findMany()
    const result: Record<string, string> = {}
    settings.forEach(s => { result[s.key] = s.value })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Admin settings get error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const entries = Array.isArray(body) ? body : [body]

    for (const { key, value } of entries) {
      if (key) {
        await prisma.systemSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      }
    }

    return NextResponse.json({ message: "সেটিংস সংরক্ষিত হয়েছে" })
  } catch (error) {
    console.error("Admin settings save error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
