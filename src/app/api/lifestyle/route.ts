import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { startOfDay, endOfDay } from "date-fns"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date()
    const dayStart = startOfDay(today)
    const dayEnd = endOfDay(today)

    const [dietPlans, healthMetrics] = await Promise.all([
      prisma.dietPlan.findMany({
        where: { userId: session.user.id, date: { gte: dayStart, lte: dayEnd } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.healthMetric.findMany({
        where: { userId: session.user.id, date: { gte: dayStart, lte: dayEnd } },
        orderBy: { date: "desc" },
      }),
    ])

    const waterIntake = healthMetrics
      .filter((m) => m.type === "water")
      .reduce((sum, m) => sum + m.value, 0)

    const exerciseLogs = healthMetrics.filter((m) => m.type === "exercise")

    return NextResponse.json({ dietPlans, waterIntake, exerciseLogs })
  } catch (error) {
    console.error("Lifestyle error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { type, data } = body

    if (type === "diet") {
      const plan = await prisma.dietPlan.create({
        data: {
          userId: session.user.id,
          mealType: data.mealType,
          foods: data.foods || [],
          calories: data.calories || null,
          notes: data.notes || null,
          date: new Date(),
        },
      })
      return NextResponse.json(plan, { status: 201 })
    }

    if (type === "water") {
      const metric = await prisma.healthMetric.create({
        data: {
          userId: session.user.id,
          type: "water",
          value: data.amount || 250,
          unit: "ml",
          date: new Date(),
          source: "manual",
        },
      })
      return NextResponse.json(metric, { status: 201 })
    }

    if (type === "exercise") {
      const metric = await prisma.healthMetric.create({
        data: {
          userId: session.user.id,
          type: "exercise",
          value: data.duration || 30,
          unit: "minutes",
          date: new Date(),
          notes: data.notes || null,
          source: "manual",
        },
      })
      return NextResponse.json(metric, { status: 201 })
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    console.error("Lifestyle create error:", error)
    return NextResponse.json({ error: "সংরক্ষণ করতে সমস্যা হয়েছে" }, { status: 500 })
  }
}
