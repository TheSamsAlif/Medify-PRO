"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Loader2, Activity, Heart, Droplets, Thermometer, Weight, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import Link from "next/link"

export default function AddRecordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    type: "",
    title: "",
    value: "",
    unit: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    doctorName: "",
    hospital: "",
  })

  const recordTypes = [
    { value: "blood_pressure", label: "ব্লাড প্রেসার", icon: Heart },
    { value: "blood_sugar", label: "ব্লাড সুগার", icon: Droplets },
    { value: "weight", label: "ওজন", icon: Weight },
    { value: "temperature", label: "তাপমাত্রা", icon: Thermometer },
    { value: "heart_rate", label: "হার্ট রেট", icon: Heart },
    { value: "lab_report", label: "ল্যাব রিপোর্ট", icon: FileText },
    { value: "other", label: "অন্যান্য", icon: Activity },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.type || !form.title) {
      toast.error("ধরন ও শিরোনাম আবশ্যক")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/health-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success("রেকর্ড যোগ করা হয়েছে")
        router.push("/records")
      } else {
        toast.error("সমস্যা হয়েছে")
      }
    } catch {
      toast.error("রেকর্ড যোগ করতে সমস্যা")
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Link href="/records" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-6">
        <ArrowLeft className="w-4 h-4" />
        রেকর্ডে ফিরুন
      </Link>

      <Card className="border-0 shadow-lg shadow-black/5 max-w-lg mx-auto">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-6">নতুন স্বাস্থ্য রেকর্ড</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>রেকর্ডের ধরন</Label>
              <Select value={form.type} onValueChange={(v) => {
                if (!v) return
                const selected = recordTypes.find(r => r.value === v)
                setForm({ ...form, type: v, title: selected?.label ?? v })
              }}>
                <SelectTrigger className="py-5 text-base rounded-xl">
                  <SelectValue placeholder="ধরন নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  {recordTypes.map((rt) => (
                    <SelectItem key={rt.value} value={rt.value}>
                      <span className="flex items-center gap-2">
                        <rt.icon className="w-4 h-4" />
                        {rt.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>শিরোনাম</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="py-5 text-base rounded-xl" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>মান</Label>
                <Input value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} className="py-5 text-base rounded-xl" placeholder="যেমন: 120" />
              </div>
              <div className="space-y-2">
                <Label>ইউনিট</Label>
                <Input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="py-5 text-base rounded-xl" placeholder="যেমন: mmHg" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>তারিখ</Label>
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="py-5 text-base rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label>বিবরণ (ঐচ্ছিক)</Label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full min-h-[80px] px-4 py-3 rounded-xl border border-input bg-transparent text-base"
                placeholder="বাড়তি তথ্য"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ডাক্তারের নাম</Label>
                <Input value={form.doctorName} onChange={e => setForm({ ...form, doctorName: e.target.value })} className="py-5 text-base rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>হাসপাতাল</Label>
                <Input value={form.hospital} onChange={e => setForm({ ...form, hospital: e.target.value })} className="py-5 text-base rounded-xl" />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.push("/records")} className="flex-1 rounded-xl py-5">
                বাতিল
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 rounded-xl py-5 gradient-primary text-white">
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                সংরক্ষণ
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
