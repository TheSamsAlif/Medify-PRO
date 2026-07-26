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
                    text: "You are an advanced medical OCR system specialized in reading handwritten prescriptions. The image may contain both typed and handwritten text. Extract the following details and respond with a JSON object in the exact format:\n{\n  \"doctorName\": \"...\",\n  \"hospitalName\": \"...\",\n  \"patientName\": \"...\",\n  \"patientAge\": \"...\",\n  \"patientWeight\": \"...\",\n  \"date\": \"...\",\n  \"diagnosis\": \"...\",\n  \"medicines\": [\n    {\n      \"name\": \"...\",\n      \"strength\": \"...\",\n      \"form\": \"...\",\n      \"dose\": \"...\",\n      \"durationDays\": 0,\n      \"foodInstruction\": \"...\"\n    }\n  ],\n  \"investigations\": \"...\",\n  \"advice\": \"...\",\n  \"followUpDate\": \"...\"\n}\nIf any field cannot be read, set its value to null or an empty string. Return only the JSON.",
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

        let medicines: any[] = [];
        try {
          const parsed = JSON.parse(extractedText);
          if (parsed && Array.isArray(parsed.medicines)) {
            medicines = parsed.medicines.map((m:any) => ({
              name: m.name ?? "",
              strength: m.strength ?? "",
              form: m.form ?? "",
              dose: m.dose ?? "",
              durationDays: m.durationDays ?? null,
              foodInstruction: m.foodInstruction ?? ""
            }));
          }
        } catch {
          // fallback: no medicines parsed
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
