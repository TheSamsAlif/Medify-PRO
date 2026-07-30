import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import bcrypt from "bcryptjs"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const search = url.searchParams.get("search") || ""
    const role = url.searchParams.get("role") || ""
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "20")
    const idSearch = url.searchParams.get("id") || ""

    const where: any = {}

    if (role && ["PATIENT", "GUARDIAN", "DOCTOR", "ADMIN"].includes(role)) {
      where.role = role
    }

    if (idSearch) {
      const cleanId = idSearch.replace(/^(PAT|DOC|GDN|ADM)-/i, "").toLowerCase()
      where.id = { endsWith: cleanId }
    } else if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, name: true, email: true, phone: true, role: true,
          bloodGroup: true, age: true, gender: true, isAvailable: true,
          createdAt: true, image: true,
        },
      }),
      prisma.user.count({ where }),
    ])

    const mapped = users.map(u => ({
      ...u,
      uid: u.role === "PATIENT" ? `PAT-${u.id.slice(-4).toUpperCase()}`
        : u.role === "DOCTOR" ? `DOC-${u.id.slice(-4).toUpperCase()}`
        : u.role === "GUARDIAN" ? `GDN-${u.id.slice(-4).toUpperCase()}`
        : `ADM-${u.id.slice(-4).toUpperCase()}`,
    }))

    return NextResponse.json({ users: mapped, total, page })
  } catch (error) {
    console.error("Admin users list error:", error)
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
    const { name, email, phone, password, role, bloodGroup, age, gender } = body

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "name, email, password & role required" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "ইমেইল ইতিমধ্যে ব্যবহার হচ্ছে" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { name, email, phone, passwordHash, role, bloodGroup, age: age ? parseInt(age) : null, gender },
    })

    if (role === "PATIENT") {
      await prisma.patient.create({ data: { userId: user.id } })
    } else if (role === "GUARDIAN") {
      await prisma.guardian.create({ data: { userId: user.id } })
    }

    await prisma.auditLog.create({
      data: {
        action: "USER_CREATE",
        entityType: "USER",
        entityId: user.id,
        details: { createdBy: session.user.id, role },
        adminId: session.user.id,
        adminName: session.user.name || null,
        adminEmail: session.user.email || null,
      },
    })

    const { passwordHash: _, ...userData } = user
    return NextResponse.json({ message: "ব্যবহারকারী তৈরি হয়েছে", user: userData })
  } catch (error) {
    console.error("Admin create user error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
