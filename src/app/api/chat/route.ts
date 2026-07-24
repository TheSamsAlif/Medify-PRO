import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// Modular AI Provider - Gemini or OpenRouter
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || ""
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ""

const MODELS = [
  "google/gemini-2.0-flash-exp:free",
  "google/gemini-2.0-pro-exp-02-05:free",
  "deepseek/deepseek-chat-v3-0724:free",
  "qwen/qwen-vl-plus:free",
  "cohere/command-r-plus-08-2024:free",
]

const SYSTEM_PROMPT = `You are Medify AI, a professional healthcare assistant for the Medify health app. You MUST follow these rules strictly:

1. LANGUAGE: The user may write in Bengali (বংলা), English, or Banglish (Bangla written in English letters like "amar bhab kemon ache", "thanda lagche", "dard hocche"). ALWAYS reply in the SAME language the user used. If they write in Banglish, reply in Banglish. If they write in Bengali, reply in Bengali. If they write in English, reply in English.

2. SCOPE: You ONLY answer healthcare-related questions. These include: medicines, diseases, symptoms, dosage, side effects, food interactions, pregnancy safety, lifestyle, exercise, diet, health reports, medical tests, lab reports, blood tests, X-ray, MRI, CT Scan, Ultrasound, ECG, diabetes, blood pressure, heart disease, kidney disease, liver disease, asthma, cancer, mental health, fever, cold, flu, common illnesses, first aid, emergency care, hospital information, vaccination, health tips.

3. IF ASKED ABOUT NON-HEALTHCARE TOPICS (programming, politics, sports, movies, general knowledge, etc.), reply exactly: "I can only assist with Medify healthcare features and health-related guidance."

4. NEVER make false claims or diagnose. Always advise consulting a licensed doctor.

5. ALWAYS end with: "⚠️ এই তথ্য শিক্ষামূলক এবং লাইসেন্সপ্রাপ্ত ডাক্তারের পরামর্শের বিকল্প নয়।"

6. Be helpful, empathetic, and professional. Keep responses concise but informative.`

async function callOpenRouter(messages: Record<string, string>[]) {
  if (!OPENROUTER_API_KEY) return null

  for (const model of MODELS) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.AUTH_URL || "http://localhost:3000",
          "X-Title": "Medify AI Healthcare",
        },
        body: JSON.stringify({ model, messages, max_tokens: 1024, temperature: 0.7 }),
      })

      if (res.ok) {
        const data = await res.json()
        const content = data.choices?.[0]?.message?.content
        if (content) return content
      }
    } catch (err) {
      console.warn(`Model ${model} error:`, err)
    }
  }
  return null
}

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

    // Get conversation history
    const recentHistory = await prisma.chatMessage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    const conversationHistory = recentHistory
      .reverse()
      .map((m) => ({ role: m.role, content: m.content }))

    let response = ""

    // Try OpenRouter (has Gemini models built-in)
    if (OPENROUTER_API_KEY) {
      try {
        response = await callOpenRouter([
          { role: "system", content: SYSTEM_PROMPT },
          ...conversationHistory,
          { role: "user", content: message },
        ])
      } catch (err) {
        console.error("OpenRouter error:", err)
      }
    }

    if (!response) {
      response = "দুঃখিত, AI সার্ভিস এখন কনফিগার করা নই। অনুগ্রহ করে পরে আবার চেষ্টা করুন।"
    }

    // Save to DB
    try {
      await prisma.chatMessage.createMany({
        data: [
          { userId: session.user.id, role: "user", content: message },
          { userId: session.user.id, role: "assistant", content: response },
        ],
      })
    } catch (dbErr) {
      console.error("DB save error:", dbErr)
    }

    return NextResponse.json({ response })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json({
      response: "টেকনিক্যাল সমস্যা হযেছে। অনুরোধ করি আবার চেষ্টা করুন।\n\n⚠️ এই তথ্য শিক্ষামূলক এবং লাইসেন্সপ্রাপ্ত ডাক্তারের পরামর্শের বিকল্প নয়।",
    })
  }
}
