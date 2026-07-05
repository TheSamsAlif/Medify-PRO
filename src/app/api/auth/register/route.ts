import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db/prisma"

export async function POST(req: Request) {
  try {
    const { name, email, phone, password } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "নাম, ইমেইল ও পাসওয়ার্ড আবশ্যক" },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: "এই ইমেইলে ইতিমধ্যে একটি অ্যাকাউন্ট আছে" },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        role: "PATIENT",
        language: "bn",
        patients: {
          create: {},
        },
      },
    })

    return NextResponse.json(
      {
        message: "অ্যাকাউন্ট তৈরি হয়েছে",
        user: { id: user.id, name: user.name, email: user.email },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "রেজিস্টার করতে সমস্যা হয়েছে" },
      { status: 500 }
    )
  }
}
