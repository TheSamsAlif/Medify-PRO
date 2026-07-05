import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const image = formData.get("image") as File

    if (!image) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        extractedText: "প্রেসক্রিপশন স্ক্যান করতে OpenRouter API কী প্রয়োজন।",
        medicines: [],
      })
    }

    const buffer = await image.arrayBuffer()
    const base64 = Buffer.from(buffer).toString("base64")
    const dataUri = `data:${image.type};base64,${base64}`

    try {
      const res = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.AUTH_URL || "http://localhost:3000",
            "X-Title": "Medify Prescription Scanner",
          },
          body: JSON.stringify({
            model: process.env.OPENROUTER_MODEL_VISION || "qwen/qwen-vl-plus:free",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "You are a medical prescription OCR system. Extract all text from this prescription image. Identify: doctor name, hospital, medicines (name, dosage, timing), diagnosis, tests, advice, follow-up date. Format the response in Bengali. List each medicine with its dosage and timing clearly.",
                  },
                  {
                    type: "image_url",
                    image_url: { url: dataUri },
                  },
                ],
              },
            ],
            max_tokens: 2048,
          }),
        }
      )

      if (res.ok) {
        const data = await res.json()
        const extractedText = data.choices?.[0]?.message?.content || ""

        const medicineRegex = /([\u0980-\u09FF\w\s\-]+?)\s*[\(\[]?(\d+mg|\d+\s*ml|\d+\s*ট্যাবলেট|\d+\s*ক্যাপসুল)[\)\]]?/gi
        const medicines: { name: string; dosage: string }[] = []
        let match
        while ((match = medicineRegex.exec(extractedText)) !== null) {
          medicines.push({ name: match[1].trim(), dosage: match[2] })
        }

        return NextResponse.json({
          extractedText,
          medicines: medicines.slice(0, 10),
        })
      } else {
        return NextResponse.json({
          extractedText: "AI স্ক্যানিং ব্যর্থ হয়েছে। অনুগ্রহ করে ম্যানুয়ালি তথ্য দিন।",
          medicines: [],
        })
      }
    } catch {
      return NextResponse.json({
        extractedText: "AI স্ক্যানিং ব্যর্থ হয়েছে।",
        medicines: [],
      })
    }
  } catch (error) {
    console.error("Scan error:", error)
    return NextResponse.json({ error: "স্ক্যান করতে সমস্যা হয়েছে" }, { status: 500 })
  }
}
