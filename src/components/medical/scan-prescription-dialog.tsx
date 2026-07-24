"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Camera, Upload, Loader2, Scan, FileText } from "lucide-react"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ScanPrescriptionDialog({ open, onOpenChange, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [form, setForm] = useState({
    doctorName: "",
    hospitalName: "",
    diagnosis: "",
    notes: "",
    advice: "",
    followUpDate: "",
  })
  const [extracted, setExtracted] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreview(event.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleAIScan = async () => {
    if (!file) {
      toast.error("অনুগ্রহ করে একটি প্রেসক্রিপশন নির্বাচন করুন")
      return
    }
    setScanning(true)
    try {
      const formData = new FormData()
      formData.append("image", file)
      const res = await fetch("/api/prescriptions/scan", { method: "POST", body: formData })
      if (res.ok) {
        const data = await res.json()
        setExtracted(data.extractedText || "")
        if (data.medicines && data.medicines.length > 0) {
          toast.success(`${data.medicines.length}টি ওষুধ সনাক্ত করা হয়েছে`)
        } else {
          toast.info("প্রেসক্রিপশন স্ক্যান করা হয়েছে")
        }
      } else {
        toast.error("স্ক্যান করতে সমস্যা হয়েছে")
      }
    } catch {
      toast.error("AI স্ক্যানিং ব্যর্থ হয়েছে")
    } finally {
      setScanning(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData()
      if (file) formData.append("image", file)
      formData.append("doctorName", form.doctorName)
      formData.append("hospitalName", form.hospitalName)
      formData.append("diagnosis", form.diagnosis)
      formData.append("notes", form.notes)
      formData.append("advice", form.advice)
      formData.append("followUpDate", form.followUpDate)
      formData.append("extractedText", extracted)
      const res = await fetch("/api/prescriptions", { method: "POST", body: formData })
      if (res.ok) {
        toast.success("প্রেসক্রিপশন সংরক্ষণ করা হয়েছে")
        onSuccess()
        setFile(null); setPreview(null); setExtracted("")
        setForm({ doctorName: "", hospitalName: "", diagnosis: "", notes: "", advice: "", followUpDate: "" })
      } else {
        toast.error("সংরক্ষণ করতে সমস্যা হয়েছে")
      }
    } catch {
      toast.error("সংরক্ষণ করতে সমস্যা হয়েছে")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0a0d16] border border-white/[.08] text-[#EFF2F2]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold gradient-text">প্রেসক্রিপশন স্ক্যান</DialogTitle>
          <DialogDescription className="text-[#A5ABB0]">
            হাতে লেখা প্রেসক্রিপশন AI দিয়ে পড়ুন এবং ওষুধের রিমাইন্ডার সেট করুন
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-8 rounded-2xl border-2 border-dashed border-white/[.08] hover:border-[#F96801]/50 hover:bg-[#F96801]/5 transition-all text-center"
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-[#A5ABB0]" />
              <p className="text-sm font-medium text-[#EFF2F2]">ফাইল আপলোড</p>
              <p className="text-xs text-[#A5ABB0]">JPG, PNG, PDF</p>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-8 rounded-2xl border-2 border-dashed border-white/[.08] hover:border-[#25C2C3]/50 hover:bg-[#25C2C3]/5 transition-all text-center"
            >
              <Camera className="w-8 h-8 mx-auto mb-2 text-[#A5ABB0]" />
              <p className="text-sm font-medium text-[#EFF2F2]">ক্যামেরা</p>
              <p className="text-xs text-[#25C2C3]">ফটো তুলুন</p>
            </button>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />

          {preview && (
            <div className="relative w-full h-48 rounded-xl overflow-hidden bg-[#040406] border border-white/[.08]">
              <img src={preview} alt="Preview" className="w-full h-full object-contain" />
            </div>
          )}

          {preview && !extracted && (
            <Button onClick={handleAIScan} disabled={scanning} className="w-full rounded-xl py-6 gradient-primary text-[#160500] btn-shine">
              {scanning ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Scan className="w-5 h-5 mr-2" />}
              AI দিয়ে স্ক্যান করুন
            </Button>
          )}

          {extracted && (
            <div className="p-4 rounded-xl bg-[#040406] border border-white/[.08]">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-[#25C2C3]" />
                <p className="text-sm font-medium text-[#25C2C3]">স্ক্যান করা টেক্সট:</p>
              </div>
              <p className="text-sm text-[#A5ABB0] whitespace-pre-wrap leading-relaxed">{extracted}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#A5ABB0]">ডাক্তারের নাম</Label>
                <Input value={form.doctorName} onChange={e => setForm({ ...form, doctorName: e.target.value })}
                  className="py-5 rounded-xl bg-white/[.04] border border-white/[.08] text-[#EFF2F2] placeholder:text-[#A5ABB0]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[#A5ABB0]">হাসপাতাল</Label>
                <Input value={form.hospitalName} onChange={e => setForm({ ...form, hospitalName: e.target.value })}
                  className="py-5 rounded-xl bg-white/[.04] border border-white/[.08] text-[#EFF2F2] placeholder:text-[#A5ABB0]" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[#A5ABB0]">রোগ নির্ণয়</Label>
              <Input value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })}
                className="py-5 rounded-xl bg-white/[.04] border border-white/[.08] text-[#EFF2F2]" />
            </div>
            <div className="space-y-2">
              <Label className="text-[#A5ABB0]">পরামর্শ</Label>
              <Textarea value={form.advice} onChange={e => setForm({ ...form, advice: e.target.value })}
                className="rounded-xl bg-white/[.04] border border-white/[.08] text-[#EFF2F2]" />
            </div>
            <div className="space-y-2">
              <Label className="text-[#A5ABB0]">ফলো-আপ তারিখ</Label>
              <Input type="date" value={form.followUpDate} onChange={e => setForm({ ...form, followUpDate: e.target.value })}
                className="py-5 rounded-xl bg-white/[.04] border border-white/[.08] text-[#EFF2F2]" />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}
                className="flex-1 rounded-xl py-5 border border-white/[.08] text-[#A5ABB0] hover:text-[#EFF2F2] hover:bg-white/[.04]">
                বাতিল
              </Button>
              <Button type="submit" disabled={loading}
                className="flex-1 rounded-xl py-5 gradient-primary text-[#160500]">
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                সংরক্ষণ করুন
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
