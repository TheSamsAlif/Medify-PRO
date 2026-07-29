import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"

const genderValues = ["MALE", "FEMALE", "OTHER"] as const

const updateSchema = z.object({
  name: z.string().min(1, "নাম দেওয়া আবশ্যক").optional(),
  phone: z.string().optional(),
  age: z.coerce.number().int().min(0, "বয়স ০-এর কম হতে পারে না").max(150, "বয়স ১৫০-এর বেশি হতে পারে না").optional(),
  gender: z.enum(genderValues).optional(),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
  image: z.string().optional(),
  registrationNumber: z.string().optional(),
  isAvailable: z.boolean().optional(),
  chamberLocation: z.string().optional(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "লগইন প্রয়োজন" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { patients: true },
    })

    if (!user) {
      return NextResponse.json({ error: "ব্যবহারকারী পাওয়া যায়নি" }, { status: 404 })
    }

    const patientId = `PAT-${user.id.slice(-6).toUpperCase()}`

    const doctorId = user.role === "DOCTOR" ? `DOC-${user.id.slice(-6).toUpperCase()}` : null

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      age: user.age,
      gender: user.gender,
      bloodGroup: user.bloodGroup,
      address: user.address,
      image: user.image,
      role: user.role,
      patientId,
      doctorId,
      registrationNumber: user.registrationNumber,
      isAvailable: user.isAvailable,
      chamberLocation: user.chamberLocation,
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json({ error: "প্রোফাইল লোড করতে সমস্যা হয়েছে" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "লগইন প্রয়োজন" }, { status: 401 })
    }

    const body = await req.json()

    const result = updateSchema.safeParse(body)
    if (!result.success) {
      const firstError = result.error.issues[0]
      const fieldName = firstError.path.join(".")
      const message = firstError.message
      return NextResponse.json(
        { error: `${fieldName}: ${message}` },
        { status: 400 }
      )
    }

    const { name, phone, age, gender, bloodGroup, address, image, registrationNumber, isAvailable, chamberLocation } = result.data

    const data: Record<string, any> = {}
    if (name !== undefined) data.name = name
    if (phone !== undefined) data.phone = phone || null
    if (age !== undefined) data.age = age
    if (gender !== undefined) data.gender = gender
    if (bloodGroup !== undefined) data.bloodGroup = bloodGroup || null
    if (address !== undefined) data.address = address || null
    if (image !== undefined) data.image = image || null
    if (registrationNumber !== undefined) data.registrationNumber = registrationNumber || null
    if (isAvailable !== undefined) data.isAvailable = isAvailable
    if (chamberLocation !== undefined) data.chamberLocation = chamberLocation || null

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data,
    })

    return NextResponse.json({
      message: "প্রোফাইল সফলভাবে আপডেট হয়েছে",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        age: updatedUser.age,
        gender: updatedUser.gender,
        bloodGroup: updatedUser.bloodGroup,
        address: updatedUser.address,
        image: updatedUser.image,
      },
    })
  } catch (error: any) {
    console.error("Profile update error:", error)
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "এই ফোন নম্বর বা ইমেইল ইতিমধ্যে ব্যবহৃত হচ্ছে" },
        { status: 409 }
      )
    }
    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "ব্যবহারকারী পাওয়া যায়নি" },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: `সার্ভার ত্রুটি: ${error?.message || "অজানা ত্রুটি"}` },
      { status: 500 }
    )
  }
}
