import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

const MODELS = [
  "deepseek/deepseek-chat-v3-0724:free",
  "qwen/qwen-vl-plus:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "google/gemma-2-9b-it:free",
]

const SYSTEM_PROMPT = `You are Medify AI, a professional healthcare assistant. You MUST follow these rules strictly:

1. Answer in Bengali (Bangla) if the user writes in Bengali, English if they write in English. Detect language automatically.
2. Always use simple, easy-to-understand language.
3. You can answer questions about: medicines, diseases, side effects, dosage, food interactions, pregnancy safety, lifestyle, exercise, diet, health reports, medical tests, lab reports, blood tests, X-ray, MRI, CT Scan, Ultrasound, ECG, diabetes, blood pressure, heart disease, kidney disease, liver disease, asthma, cancer, mental health, fever, cold, flu, common illnesses.
4. When explaining medicines, include: how it works, why prescribed, when to take, common side effects, serious side effects, drug interactions, foods to avoid, storage instructions, missed dose info, overdose info.
5. If user uploads a prescription or medical report image, explain everything line by line.
6. NEVER make false claims or diagnose.
7. ALWAYS end with: "⚠️ এই তথ্য শিক্ষামূলক এবং লাইসেন্সপ্রাপ্ত ডাক্তারের পরামর্শের বিকল্প নয়।"
8. Be helpful, empathetic, and professional.
9. Keep responses concise but informative.
10. For emergency situations, immediately advise calling 999 or going to the nearest hospital.`

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message } = await req.json()
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        response: "⚠️ স্বাগতম! আমি Medify AI সহায়ক। আমার সাথে ওষুধ, রোগ, ডায়েট, লাইফস্টাইল নিয়ে কথা বলুন। আমি বাংলা ও ইংরেজি দুটো ভাষাতেই উত্তর দিতে পারি।\n\n⚠️ এই তথ্য শিক্ষামূলক এবং লাইসেন্সপ্রাপ্ত ডাক্তারের পরামর্শের বিকল্প নয়।",
      })
    }

    const recentHistory = await prisma.chatMessage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    const conversationHistory = recentHistory
      .reverse()
      .map((m) => ({ role: m.role, content: m.content }))

    let response = ""

    for (const model of MODELS) {
      try {
        const res = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": process.env.AUTH_URL || "http://localhost:3000",
              "X-Title": "Medify AI Healthcare",
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...conversationHistory,
                { role: "user", content: message },
              ],
              max_tokens: 1024,
              temperature: 0.7,
            }),
          }
        )

        if (res.ok) {
          const data = await res.json()
          response = data.choices?.[0]?.message?.content || ""
          if (response) break
        } else {
          console.warn(`Model ${model} failed, trying next...`)
          continue
        }
      } catch (err) {
        console.warn(`Model ${model} error:`, err)
        continue
      }
    }

    if (!response) {
      response = "দুঃখিত, আমি এখন উত্তর দিতে পারছি না। অনুগ্রহ করে আবার চেষ্টা করুন।"
    }

    await prisma.chatMessage.createMany({
      data: [
        { userId: session.user.id, role: "user", content: message },
        { userId: session.user.id, role: "assistant", content: response },
      ],
    })

    return NextResponse.json({ response })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json({
      response: "⚠️ টেকনিক্যাল সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।\n\n⚠️ এই তথ্য শিক্ষামূলক এবং লাইসেন্সপ্রাপ্ত ডাক্তারের পরামর্শের বিকল্প নয়।",
    })
  }
}
