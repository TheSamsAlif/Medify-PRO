import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { medicines } = await req.json()
    if (!medicines || !Array.isArray(medicines) || medicines.length < 2) {
      return NextResponse.json({ error: "অনুগ্রহ করে কমপক্ষে ২টি ওষুধের নাম দিন" }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        response: "⚠️ ড্রাগ ইন্টারঅ্যাকশন চেক করতে OpenRouter API কী প্রয়োজন। .env.local ফাইলে OPENROUTER_API_KEY সেট করুন।",
        severity: "unknown",
        interactions: [],
      })
    }

    const prompt = `You are a drug interaction checker. Analyze potential interactions between these medicines: ${medicines.join(", ")}.

Provide your response in Bengali. Format as JSON:
{
  "severity": "high" | "moderate" | "low" | "none",
  "interactions": [
    {
      "drugs": ["Drug A", "Drug B"],
      "severity": "high" | "moderate" | "low",
      "description": "Description of interaction in Bengali",
      "recommendation": "Recommendation in Bengali"
    }
  ],
  "summary": "Overall summary in Bengali",
  "disclaimer": "এই তথ্য শিক্ষামূলক এবং লাইসেন্সপ্রাপ্ত ডাক্তারের পরামর্শের বিকল্প নয়।"
}

Only return valid JSON, no markdown formatting.`

    const models = [
      "deepseek/deepseek-chat-v3-0724:free",
      "qwen/qwen-vl-plus:free",
      "meta-llama/llama-3.2-3b-instruct:free",
    ]

    let response = ""
    for (const model of models) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.AUTH_URL || "http://localhost:3000",
            "X-Title": "Medify Drug Interaction Checker",
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 2048,
            temperature: 0.3,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          response = data.choices?.[0]?.message?.content || ""
          if (response) break
        }
      } catch {
        continue
      }
    }

    if (!response) {
      return NextResponse.json({
        response: "দুঃখিত, ড্রাগ ইন্টারঅ্যাকশন চেক করতে সমস্যা হয়েছে।",
        severity: "unknown",
        interactions: [],
        summary: "",
        disclaimer: "এই তথ্য শিক্ষামূলক এবং লাইসেন্সপ্রাপ্ত ডাক্তারের পরামর্শের বিকল্প নয়।",
      })
    }

    try {
      const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      const parsed = JSON.parse(cleaned)
      return NextResponse.json(parsed)
    } catch {
      return NextResponse.json({
        response,
        severity: "unknown",
        interactions: [],
        summary: response,
        disclaimer: "এই তথ্য শিক্ষামূলক এবং লাইসেন্সপ্রাপ্ত ডাক্তারের পরামর্শ의 বিকল্প নয়।",
      })
    }
  } catch (error) {
    console.error("Interaction check error:", error)
    return NextResponse.json({ error: "ড্রাগ ইন্টারঅ্যাকশন চেক করতে সমস্যা হয়েছে" }, { status: 500 })
  }
}
