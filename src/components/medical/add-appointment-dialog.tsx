"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddAppointmentDialog({ open, onOpenChange, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    doctorName: "",
    specialty: "",
    hospitalName: "",
    date: "",
    time: "",
    notes: "",
    location: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.doctorName || !form.date || !form.time) {
      toast.error("ডাক্তারের নাম, তারিখ ও সময় আবশ্যক")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          date: new Date(`${form.date}T${form.time}`).toISOString(),
        }),
      })

      if (res.ok) {
        toast.success("অ্যাপয়েন্টমেন্ট যোগ করা হয়েছে")
        onSuccess()
        setForm({ doctorName: "", specialty: "", hospitalName: "", date: "", time: "", notes: "", location: "" })
      } else {
        toast.error("সমস্যা হয়েছে")
      }
    } catch {
      toast.error("অ্যাপয়েন্টমেন্ট যোগ করতে সমস্যা হয়েছে")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">নতুন অ্যাপয়েন্টমেন্ট</DialogTitle>
          <DialogDescription>ডাক্তারের অ্যাপয়েন্টমেন্টের বিবরণ দিন</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doctorName">ডাক্তারের নাম</Label>
            <Input id="doctorName" value={form.doctorName} onChange={e => setForm({ ...form, doctorName: e.target.value })} className="py-5 text-base rounded-xl" required placeholder="ডাক্তারের নাম" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="specialty">বিশেষত্ব</Label>
              <Input id="specialty" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} className="py-5 text-base rounded-xl" placeholder="যেমন: কার্ডিওলজিস্ট" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hospital">হাসপাতাল</Label>
              <Input id="hospital" value={form.hospitalName} onChange={e => setForm({ ...form, hospitalName: e.target.value })} className="py-5 text-base rounded-xl" placeholder="হাসপাতালের নাম" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date">তারিখ</Label>
              <Input id="date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="py-5 text-base rounded-xl" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">সময়</Label>
              <Input id="time" type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="py-5 text-base rounded-xl" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">ঠিকানা (ঐচ্ছিক)</Label>
            <Input id="location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="py-5 text-base rounded-xl" placeholder="হাসপাতালের ঠিকানা" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">নোট (ঐচ্ছিক)</Label>
            <textarea id="notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full min-h-[60px] px-4 py-3 rounded-xl border border-input bg-transparent text-base" placeholder="কোনো বিশেষ নোট" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl py-5">বাতিল</Button>
            <Button type="submit" disabled={loading} className="rounded-xl py-5 gradient-primary text-white">
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              যোগ করুন
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
