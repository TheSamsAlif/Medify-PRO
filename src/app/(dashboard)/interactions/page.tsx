"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Pill,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Info,
  Plus,
  X,
  Loader2,
  Shield,
  Search,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"

interface Interaction {
  drugs: string[]
  severity: string
  description: string
  recommendation: string
}

interface InteractionResult {
  severity: string
  interactions: Interaction[]
  summary: string
  disclaimer: string
}

export default function InteractionsPage() {
  const [medicines, setMedicines] = useState<string[]>([""])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<InteractionResult | null>(null)

  const addMedicine = () => setMedicines([...medicines, ""])
  const removeMedicine = (i: number) => {
    if (medicines.length > 1) setMedicines(medicines.filter((_, idx) => idx !== i))
  }
  const updateMedicine = (i: number, v: string) => {
    const updated = [...medicines]
    updated[i] = v
    setMedicines(updated)
  }

  const handleCheck = async () => {
    const validMeds = medicines.filter((m) => m.trim())
    if (validMeds.length < 2) {
      toast.error("কমপক্ষে ২টি ওষুধের নাম দিন")
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicines: validMeds }),
      })
      if (res.ok) {
        const data = await res.json()
        setResult(data)
      } else {
        toast.error("চেক করতে সমস্যা হয়েছে")
      }
    } catch {
      toast.error("ড্রাগ ইন্টারঅ্যাকশন চেক ব্যর্থ হয়েছে")
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900"
      case "moderate": return "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900"
      case "low": return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900"
      default: return "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high": return AlertTriangle
      case "moderate": return AlertCircle
      case "low": return Info
      default: return CheckCircle2
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high": return "danger"
      case "moderate": return "warning"
      case "low": return "secondary"
      default: return "default"
    }
  }

  const overallColor = result?.severity === "high"
    ? "from-red-500 to-rose-600"
    : result?.severity === "moderate"
    ? "from-amber-500 to-orange-600"
    : result?.severity === "low"
    ? "from-yellow-500 to-amber-600"
    : "from-emerald-500 to-teal-600"

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold">ড্রাগ ইন্টারঅ্যাকশন চেকার</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          দুই বা ততোধিক ওষুধের মধ্যে সম্ভাব্য প্রতিক্রিয়া পরীক্ষা করুন
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-0 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" />
                ওষুধের নাম দিন
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {medicines.map((med, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Pill className="w-4 h-4 text-primary" />
                  </div>
                  <Input
                    value={med}
                    onChange={(e) => updateMedicine(i, e.target.value)}
                    placeholder={`ওষুধ ${i + 1}${i === 0 ? " (যেমন: Napa Extra)" : i === 1 ? " (যেমন: Metformin)" : ""}`}
                    className="py-5 text-base rounded-xl flex-1"
                    onKeyDown={(e) => e.key === "Enter" && i === medicines.length - 1 && addMedicine()}
                  />
                  {medicines.length > 1 && (
                    <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-gray-400" onClick={() => removeMedicine(i)}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}

              <Button variant="outline" onClick={addMedicine} className="w-full rounded-xl py-5 text-sm">
                <Plus className="w-4 h-4 mr-2" />
                আরেকটি ওষুধ যোগ করুন
              </Button>

              <Button
                onClick={handleCheck}
                disabled={loading || medicines.filter(m => m.trim()).length < 2}
                className="w-full rounded-xl py-6 text-base gradient-primary text-white shadow-lg shadow-primary/20"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Shield className="w-5 h-5 mr-2" />
                )}
                ইন্টারঅ্যাকশন চেক করুন
              </Button>

              <p className="text-xs text-gray-400 text-center">
                * ওষুধের সঠিক জেনেরিক বা ব্র্যান্ড নাম ব্যবহার করুন
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-64"
              >
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-gray-500">ড্রাগ ইন্টারঅ্যাকশন চেক করা হচ্ছে...</p>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <Card className={`border-0 shadow-lg bg-gradient-to-br ${overallColor} text-white`}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      {result.severity === "high" || result.severity === "moderate" ? (
                        <AlertTriangle className="w-10 h-10 text-white/80" />
                      ) : (
                        <CheckCircle2 className="w-10 h-10 text-white/80" />
                      )}
                      <div>
                        <h3 className="text-xl font-bold">
                          {result.severity === "high" ? "গুরুতর ইন্টারঅ্যাকশন পাওয়া গেছে" :
                           result.severity === "moderate" ? "মাঝারি ইন্টারঅ্যাকশন পাওয়া গেছে" :
                           result.severity === "low" ? "নিম্ন স্তরের ইন্টারঅ্যাকশন" :
                           "কোনো ইন্টারঅ্যাকশন পাওয়া যায়নি"}
                        </h3>
                        <p className="text-white/80 text-sm mt-1">
                          {result.severity === "high" ? "অবিলম্বে ডাক্তারের পরামর্শ নিন" :
                           result.severity === "moderate" ? "সতর্কতার সাথে ব্যবহার করুন" :
                           "সাধারণত নিরাপদ"}
                        </p>
                      </div>
                      <Badge className="ml-auto bg-white/20 text-white text-sm border-0">
                        {result.interactions?.length || 0}টি ইন্টারঅ্যাকশন
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {result.interactions?.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">পাওয়া ইন্টারঅ্যাকশনসমূহ</h3>
                    {result.interactions.map((interaction, i) => {
                      const Icon = getSeverityIcon(interaction.severity)
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <Card className={`border-0 shadow-lg shadow-black/5 ${getSeverityColor(interaction.severity)} border`}>
                            <CardContent className="p-5">
                              <div className="flex items-start gap-3">
                                <Icon className="w-6 h-6 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold">{interaction.drugs.join(" + ")}</h4>
                                    <Badge variant="outline" className={`text-xs ${interaction.severity === "high" ? "border-red-300 text-red-600" : ""}`}>
                                      {interaction.severity === "high" ? "গুরুতর" : interaction.severity === "moderate" ? "মাঝারি" : "নিম্ন"}
                                    </Badge>
                                  </div>
                                  <p className="text-sm mb-2">{interaction.description}</p>
                                  <div className="p-3 rounded-lg bg-white/50 dark:bg-black/20">
                                    <p className="text-xs font-medium">পরামর্শ:</p>
                                    <p className="text-sm">{interaction.recommendation}</p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </div>
                )}

                {result.summary && (
                  <Card className="border-0 shadow-lg shadow-black/5">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-primary mt-0.5" />
                        <p className="text-sm text-gray-700 dark:text-gray-300">{result.summary}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-0 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        {result.disclaimer || "⚠️ এই তথ্য শিক্ষামূলক এবং লাইসেন্সপ্রাপ্ত ডাক্তারের পরামর্শের বিকল্প নয়। ওষুধ পরিবর্তনের আগে সর্বদা আপনার ডাক্তারের সাথে পরামর্শ করুন।"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-64 text-center"
              >
                <div className="w-20 h-20 rounded-3xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4">
                  <Shield className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">ড্রাগ ইন্টারঅ্যাকশন চেকার</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                  বাম পাশে ওষুধের নাম লিখুন এবং চেক বাটনে ক্লিক করুন। AI স্বয়ংক্রিয়ভাবে সম্ভাব্য ইন্টারঅ্যাকশন বিশ্লেষণ করবে।
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
