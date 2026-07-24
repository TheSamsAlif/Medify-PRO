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
                    text: "You are an advanced medical OCR system specialized in reading handwritten prescriptions. This image may contain BOTH typed and HANDWRITTEN text. Carefully read every character, including doctor's handwriting which may be cursive or rushed.\n\nExtract ALL of the following details:\n1. Doctor's name and chamber/hospital\n2. Patient name & age/weight (if visible)\n3. Date of prescription\n4. MEDICINES: For each medicine, extract: name, strength (e.g., 500mg, 250mg/5ml), dosage form (tablet/capsule/syrup/injection), dose (e.g., 1+0+1, 1+1+1, before/after meal), duration (e.g., 7 days, 14 days)\n5. Diagnosis / presenting complaints\n6. Investigations / tests advised\n7. Advice / instructions\n8. Follow-up date\n\nFormat output in Bengali. Use a clear structured format with medicine names in BOLD. For each medicine, list: name, strength, dose timing, and duration separated by clear lines.\n\nIMPORTANT: This is a HANDWRITTEN prescription OCR task. Do your best to read even unclear handwriting. If you cannot read something, mark it as [অপাঠ্য].",
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

        const medicineRegex = /(?:ঔষধ|ওষুধ|Medicine|মেডিসিন|ট্যাব|Tab|ক্যাপ|Cap|সিরাপ|Syrup|ইনজেকশন|Inj)[:\s]*([\u0980-\u09FF\w\s\-\.\,\/]+?)\s*[\(\[]?(\d+\s*(?:mg|ml|mcg|গ্রাম|ইউনিট|ট্যাবলেট|ক্যাপসুল|সিরাপ|এমএল|এমজি)?)[\)\]]?/gi
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
