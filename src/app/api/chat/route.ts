import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

const MODELS = [
  "google/gemini-2.0-flash-001",
  "google/gemini-2.0-flash-exp:free",
  "google/gemini-2.0-flash-lite-preview-02-05:free",
  "google/gemma-2-9b-it:free",
  "deepseek/deepseek-chat-v3-0724:free",
  "qwen/qwen-vl-plus:free",
]

const SYSTEM_PROMPT = `You are Medify AI, a professional healthcare assistant for the Medify health app. You MUST follow these rules strictly:

1. LANGUAGE: The user may write in Bengali (বাংলা), English, or Banglish (Bangla written in English letters like "amar bhab kemon ache"). ALWAYS reply in the SAME language the user used.

2. SCOPE: You ONLY answer healthcare-related questions: medicines, diseases, symptoms, dosage, side effects, food interactions, lifestyle, diet, health reports, medical tests, common illnesses, first aid, emergency care.

3. OFF-TOPIC: If asked about non-healthcare topics (programming, politics, sports, movies, etc.), reply exactly: "I can only assist with Medify healthcare features and health-related guidance."

4. NEVER make false claims or diagnose. Always advise consulting a licensed doctor.

5. ALWAYS end with: "⚠️ এই তথ্য শিক্ষামূলক এবং লাইসেন্সপ্রাপ্ত ডাক্তারের পরামর্শের বিকল্প নয়।"

6. Be concise and empathetic. Use bullet points for lists.`

export async function POST(req: Request) {
  const start = Date.now()
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please login first" }, { status: 401 })
    }

    const { message } = await req.json()
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      console.warn("[Chat] Missing OPENROUTER_API_KEY")
      return NextResponse.json({
        response: "⚠️ Gemini API key is not configured. Please contact the developer.\n\nMedify AI স্বাস্থ্য সহায়ক ব্যবহার করতে API কী সেটআপ প্রয়োজন।",
      })
    }

    // Get conversation history
    let conversationHistory: { role: string; content: string }[] = []
    try {
      const history = await prisma.chatMessage.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
      conversationHistory = history.reverse().map((m) => ({ role: m.role, content: m.content }))
    } catch {
      // DB unavailable - continue without history
      console.warn("[Chat] DB unavailable, proceeding without history")
    }

    let response = ""
    let usedModel = ""

    for (const model of MODELS) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.AUTH_URL || "https://medify-pro-zeta.vercel.app",
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
        })

        if (res.ok) {
          const data = await res.json()
          response = data.choices?.[0]?.message?.content || ""
          if (response) {
            usedModel = model
            break
          }
        } else {
          const err = await res.json().catch(() => ({}))
          console.warn(`[Chat] Model ${model} failed:`, err.error?.message || res.status)
        }
      } catch (err) {
        console.warn(`[Chat] Model ${model} network error:`, err instanceof Error ? err.message : err)
      }
    }

    if (!response) {
      response = "দুঃখিত, AI সার্ভার এখন উপলব্ধ নেই। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।"
    }

    // Save to DB (best-effort)
    try {
      await prisma.chatMessage.createMany({
        data: [
          { userId: session.user.id, role: "user", content: message },
          { userId: session.user.id, role: "assistant", content: response },
        ],
      })
    } catch {
      console.warn("[Chat] Failed to save messages to DB")
    }

    console.log(`[Chat] ${usedModel || "none"} responded in ${Date.now() - start}ms`)
    return NextResponse.json({ response })
  } catch (error) {
    console.error(`[Chat] Error (${Date.now() - start}ms):`, error)
    return NextResponse.json({
      response: "টেকনিক্যাল সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।\n\n⚠️ এই তথ্য শিক্ষামূলক এবং লাইসেন্সপ্রাপ্ত ডাক্তারের পরামর্শের বিকল্প নয়।",
    })
  }
}
