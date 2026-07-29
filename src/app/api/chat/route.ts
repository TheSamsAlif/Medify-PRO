import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

const SYSTEM_PROMPT = `You are Medify AI, a professional healthcare assistant for the Medify health app. You MUST follow these rules strictly:

1. LANGUAGE: The user may write in Bengali (বাংলা), English, or Banglish (Bangla written in English letters like "amar bhab kemon ache"). ALWAYS reply in the SAME language the user used.

2. SCOPE: You ONLY answer healthcare-related questions: medicines, diseases, symptoms, dosage, side effects, food interactions, lifestyle, diet, health reports, medical tests, common illnesses, first aid, emergency care.

3. OFF-TOPIC: If asked about non-healthcare topics (programming, politics, sports, movies, etc.), reply exactly: "I can only assist with Medify healthcare features and health-related guidance."

4. NEVER make false claims or diagnose. Always advise consulting a licensed doctor.

5. ALWAYS end with: "⚠️ এই তথ্য শিক্ষামূলক এবং লাইসেন্সপ্রাপ্ত ডাক্তারের পরামর্শের বিকল্প নয়।"

6. Be concise and empathetic. Use bullet points for lists.`

const OLLAMA_API_KEY = "d190bb1923b7495a815748cfc92a468f.Y1kyHCAwO0ZwHM3wQxyErqx5"
const OLLAMA_MODEL = "gemma4:31b"
const OLLAMA_URL = "https://api.ollama.com/api/chat"

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

    let conversationHistory: { role: string; content: string }[] = []
    try {
      const history = await prisma.chatMessage.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
      conversationHistory = history.reverse().map((m) => ({ role: m.role, content: m.content }))
    } catch {
      console.warn("[Chat] DB unavailable, proceeding without history")
    }

    const res = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OLLAMA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...conversationHistory,
          { role: "user", content: message },
        ],
        stream: false,
      }),
    })

    let response = ""
    if (res.ok) {
      const data = await res.json()
      response = data.message?.content || ""
    } else {
      const err = await res.json().catch(() => ({}))
      console.error("[Chat] Ollama API error:", err)
      response = "দুঃখিত, AI সার্ভার এখন উপলব্ধ নেই। কিছুক্ষণ পর আবার চেষ্টা করুন।"
    }

    if (!response) {
      response = "দুঃখিত, AI সার্ভার এখন উপলব্ধ নেই। কিছুক্ষণ পর আবার চেষ্টা করুন।"
    }

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

    console.log(`[Chat] ${OLLAMA_MODEL} responded in ${Date.now() - start}ms`)
    return NextResponse.json({ response })
  } catch (error) {
    console.error(`[Chat] Error (${Date.now() - start}ms):`, error)
    return NextResponse.json({
      response: "টেকনিক্যাল সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।\n\n⚠️ এই তথ্য শিক্ষামূলক এবং লাইসেন্সপ্রাপ্ত ডাক্তারের পরামর্শের বিকল্প নয়।",
    })
  }
}