import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const OLLAMA_API_KEY = "d190bb1923b7495a815748cfc92a468f.Y1kyHCAwO0ZwHM3wQxyErqx5"
const OLLAMA_MODEL = "gemma4:31b"
const OLLAMA_URL = "https://api.ollama.com/api/chat"

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

    const buffer = await image.arrayBuffer()
    const base64 = Buffer.from(buffer).toString("base64")

    try {
      const res = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OLLAMA_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: [
            {
              role: "user",
              content: "You are an advanced medical OCR system specialized in reading handwritten prescriptions. The image may contain both typed and handwritten text. Extract the following details and respond with a JSON object in the exact format:\n{\n  \"doctorName\": \"...\",\n  \"hospitalName\": \"...\",\n  \"patientName\": \"...\",\n  \"patientAge\": \"...\",\n  \"patientWeight\": \"...\",\n  \"date\": \"...\",\n  \"diagnosis\": \"...\",\n  \"medicines\": [\n    {\n      \"name\": \"...\",\n      \"strength\": \"...\",\n      \"form\": \"...\",\n      \"dose\": \"...\",\n      \"durationDays\": 0,\n      \"foodInstruction\": \"...\"\n    }\n  ],\n  \"investigations\": \"...\",\n  \"advice\": \"...\",\n  \"followUpDate\": \"...\"\n}\nIf any field cannot be read, set its value to null or an empty string. Return only the JSON.",
              images: [base64],
            },
          ],
          stream: false,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const extractedText = data.message?.content || ""

        let medicines: any[] = [];
        try {
          const parsed = JSON.parse(extractedText);
          if (parsed && Array.isArray(parsed.medicines)) {
            medicines = parsed.medicines.map((m: any) => ({
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