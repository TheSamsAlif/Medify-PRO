import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        bloodGroup: true, age: true, gender: true, isAvailable: true,
        createdAt: true, updatedAt: true, image: true, address: true,
        registrationNumber: true, chamberLocation: true, degree: true,
        specialization: true, experience: true, consultationFee: true,
        hospitalName: true, language: true, theme: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Admin get user error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, email, phone, bloodGroup, age, gender, isAvailable, role } = body

    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup
    if (age !== undefined) updateData.age = parseInt(age)
    if (gender !== undefined) updateData.gender = gender
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable
    if (role !== undefined) updateData.role = role

    const user = await prisma.user.update({ where: { id }, data: updateData })

    if (role && role !== existing.role) {
      await prisma.auditLog.create({
        data: {
          action: "ROLE_CHANGE",
          entityType: "USER",
          entityId: id,
          details: { from: existing.role, to: role, changedBy: session.user.id },
          adminId: session.user.id,
          adminName: session.user.name || null,
          adminEmail: session.user.email || null,
        },
      })
    }

    const { passwordHash: _, ...userData } = user
    return NextResponse.json({ message: "ব্যবহারকারী আপডেট হয়েছে", user: userData })
  } catch (error) {
    console.error("Admin update user error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await prisma.user.update({
      where: { id },
      data: {
        name: "[Deleted User]",
        email: `deleted-${id.slice(-8)}@medify.com`,
        phone: null,
        isAvailable: false,
      },
    })

    await prisma.auditLog.create({
      data: {
        action: "USER_DELETE",
        entityType: "USER",
        entityId: id,
        details: { deletedBy: session.user.id },
        adminId: session.user.id,
        adminName: session.user.name || null,
        adminEmail: session.user.email || null,
      },
    })

    return NextResponse.json({ message: "ব্যবহারকারী মুছে ফেলা হয়েছে" })
  } catch (error) {
    console.error("Admin delete user error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
