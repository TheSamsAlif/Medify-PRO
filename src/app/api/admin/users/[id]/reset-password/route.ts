import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { oldPassword, newPassword, notifyOldPassword } = await req.json()

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({ where: { id }, data: { passwordHash } })

    await prisma.auditLog.create({
      data: {
        action: "PASSWORD_RESET",
        entityType: "USER",
        entityId: id,
        details: { resetBy: session.user.id, resetByEmail: session.user.email },
        adminId: session.user.id,
        adminName: session.user.name || null,
        adminEmail: session.user.email || null,
      },
    })

    const passMsg = notifyOldPassword && oldPassword
      ? `আপনার পূর্ববর্তী পাসওয়ার্ড: ${oldPassword}\nআপনার নতুন পাসওয়ার্ড: ${newPassword}`
      : `আপনার নতুন পাসওয়ার্ড: ${newPassword}`

    await prisma.notification.create({
      data: {
        userId: id,
        title: "পাসওয়ার্ড রিসেট করা হয়েছে",
        body: `এডমিন ${session.user.name || session.user.email} আপনার পাসওয়ার্ড রিসেট করেছেন।\n${passMsg}\n\nঅনুগ্রহ করে লগইন করে পাসওয়ার্ড পরিবর্তন করুন।`,
        type: "PASSWORD_RESET",
        data: { oldPassword: notifyOldPassword && oldPassword ? oldPassword : null, newPassword },
      },
    })

    return NextResponse.json({ message: "পাসওয়ার্ড রিসেট সফল হয়েছে" })
  } catch (error) {
    console.error("Admin reset password error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
