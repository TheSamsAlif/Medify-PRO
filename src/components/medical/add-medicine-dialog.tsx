"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Loader2, Sun, Clock, Sunset, MoonStar } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AddMedicineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddMedicineDialog({ open, onOpenChange, onSuccess }: AddMedicineDialogProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    dosage: "",
    frequency: "1",
    intakeTime: "ANYTIME",
    morning: false,
    noon: false,
    evening: false,
    night: false,
    notes: "",
    reminderEnabled: true,
  })

  const timeSlots = [
    { key: "morning", label: "সকাল", icon: Sun, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    { key: "noon", label: "দুপুর", icon: Clock, color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    { key: "evening", label: "বিকাল", icon: Sunset, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
    { key: "night", label: "রাত", icon: MoonStar, color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name || !form.dosage) {
      toast.error("নাম ও ডোজ আবশ্যক")
      return
    }

    if (!form.morning && !form.noon && !form.evening && !form.night) {
      toast.error("অনুগ্রহ করে অন্তত একটি সময় নির্বাচন করুন")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        toast.success("ওষুধ যোগ করা হয়েছে")
        onSuccess()
        setForm({
          name: "", dosage: "", frequency: "1", intakeTime: "ANYTIME",
          morning: false, noon: false, evening: false, night: false,
          notes: "", reminderEnabled: true,
        })
      } else {
        const data = await res.json()
        toast.error(data.error || "সমস্যা হয়েছে")
      }
    } catch {
      toast.error("ওষুধ যোগ করতে সমস্যা হয়েছে")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">নতুন ওষুধ যোগ করুন</DialogTitle>
          <DialogDescription className="text-base">
            আপনার ওষুধের বিবরণ দিন
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-medium">ওষুধের নাম</Label>
            <Input
              id="name"
              placeholder="যেমন: Napa Extra, Metformin"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="py-6 text-base rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dosage" className="text-base font-medium">ডোজ</Label>
              <Input
                id="dosage"
                placeholder="যেমন: 500mg, 1 ট্যাবলেট"
                value={form.dosage}
                onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                className="py-6 text-base rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency" className="text-base font-medium">ফ্রিকোয়েন্সি</Label>
              <Select value={form.frequency} onValueChange={(v) => v && setForm({ ...form, frequency: v })}>
                <SelectTrigger className="py-6 text-base rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">দিনে ১ বার</SelectItem>
                  <SelectItem value="2">দিনে ২ বার</SelectItem>
                  <SelectItem value="3">দিনে ৩ বার</SelectItem>
                  <SelectItem value="4">দিনে ৪ বার</SelectItem>
                  <SelectItem value="as-needed">প্রয়োজনমতো</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">খাওয়ার সময়</Label>
            <Select value={form.intakeTime} onValueChange={(v) => v && setForm({ ...form, intakeTime: v })}>
              <SelectTrigger className="py-6 text-base rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BEFORE_MEAL">খাবার আগে</SelectItem>
                <SelectItem value="AFTER_MEAL">খাবার পরে</SelectItem>
                <SelectItem value="WITH_MEAL">খাবারের সাথে</SelectItem>
                <SelectItem value="EMPTY_STOMACH">খালি পেটে</SelectItem>
                <SelectItem value="ANYTIME">যেকোনো সময়</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">সময় নির্বাচন করুন</Label>
            <div className="grid grid-cols-2 gap-2">
              {timeSlots.map((slot) => {
                const isSelected = form[slot.key as keyof typeof form] as boolean
                return (
                  <button
                    key={slot.key}
                    type="button"
                    onClick={() => setForm({ ...form, [slot.key]: !isSelected })}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 dark:bg-primary/10"
                        : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${slot.color} flex items-center justify-center`}>
                      <slot.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">{slot.label}</span>
                    {isSelected && (
                      <Badge className="ml-auto bg-primary text-white text-xs border-0">নির্বাচিত</Badge>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-base font-medium">বিশেষ নোট (ঐচ্ছিক)</Label>
            <textarea
              id="notes"
              placeholder="যেমন: খাওয়ার ৩০ মিনিট আগে নিতে হবে"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full min-h-[80px] px-4 py-3 rounded-xl border border-input bg-transparent text-base focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-900">
            <div>
              <p className="text-sm font-medium">রিমাইন্ডার সক্রিয় করুন</p>
              <p className="text-xs text-gray-500">পুশ নোটিফিকেশন ও অ্যালার্ম</p>
            </div>
            <Switch
              checked={form.reminderEnabled}
              onCheckedChange={(v) => setForm({ ...form, reminderEnabled: v })}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl py-6"
            >
              বাতিল
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl py-6 gradient-primary text-white"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              ওষুধ যোগ করুন
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
