"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useSearchParams } from "next/navigation"
import {
  Pill,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Bell,
  BellOff,
  Trash2,
  Sun,
  Sunset,
  MoonStar,
  Palette,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { AddMedicineDialog } from "@/components/medical/add-medicine-dialog"
import type { Medicine } from "@/types"

const defaultSlotColors: Record<string, string> = {
  morning: "#F59E0B",
  noon: "#EAB308",
  evening: "#EA580C",
  night: "#8B5CF6",
}

const presetColors = [
  "#F59E0B", "#EAB308", "#EA580C", "#8B5CF6",
  "#06B6D4", "#10B981", "#EC4899", "#6366F1",
  "#F97316", "#84CC16", "#14B8A6", "#E11D48",
]

const timeSlots = [
  { key: "morning", label: "সকাল", labelEn: "Morning", icon: Sun, defColor: "#F59E0B", time: "6:00 - 9:00" },
  { key: "noon", label: "দুপুর", labelEn: "Noon", icon: Clock, defColor: "#EAB308", time: "12:00 - 14:00" },
  { key: "evening", label: "বিকাল", labelEn: "Evening", icon: Sunset, defColor: "#EA580C", time: "17:00 - 19:00" },
  { key: "night", label: "রাত", labelEn: "Night", icon: MoonStar, defColor: "#8B5CF6", time: "21:00 - 23:00" },
]

export default function MedicinesPage() {
  const searchParams = useSearchParams()
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(searchParams.get("add") === "true")
  const [slotColors, setSlotColors] = useState<Record<string, string>>({})
  const [pickerOpen, setPickerOpen] = useState<string | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  const getColor = (key: string) => slotColors[key] || defaultSlotColors[key]

  useEffect(() => {
    const stored = localStorage.getItem("medicine-slot-colors")
    if (stored) {
      try { setSlotColors(JSON.parse(stored)) } catch { /* ignore */ }
    }
    fetchMedicines()
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(null)
      }
    }
    if (pickerOpen) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [pickerOpen])

  const setColor = (slotKey: string, color: string) => {
    const next = { ...slotColors, [slotKey]: color }
    setSlotColors(next)
    localStorage.setItem("medicine-slot-colors", JSON.stringify(next))
  }

  const fetchMedicines = async () => {
    try {
      const res = await fetch("/api/medicines")
      if (res.ok) {
        const data = await res.json()
        setMedicines(data)
      }
    } catch (err) {
      console.error("Fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  const toggleReminder = async (medicine: Medicine) => {
    try {
      const res = await fetch(`/api/medicines/${medicine.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminderEnabled: !medicine.reminderEnabled }),
      })
      if (res.ok) {
        setMedicines(medicines.map(m => m.id === medicine.id ? { ...m, reminderEnabled: !m.reminderEnabled } : m))
        toast.success(`রিমাইন্ডার ${medicine.reminderEnabled ? "বন্ধ" : "চালু"} করা হয়েছে`)
      }
    } catch {
      toast.error("সমস্যা হয়েছে")
    }
  }

  const deleteMedicine = async (id: string) => {
    try {
      const res = await fetch(`/api/medicines/${id}`, { method: "DELETE" })
      if (res.ok) {
        setMedicines(medicines.filter(m => m.id !== id))
        toast.success("ওষুধ মুছে ফেলা হয়েছে")
      }
    } catch {
      toast.error("মুছতে সমস্যা হয়েছে")
    }
  }

  const logMedicine = async (medicineId: string, status: string) => {
    try {
      const res = await fetch("/api/medicine-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicineId, status }),
      })
      if (res.ok) {
        toast.success(status === "TAKEN" ? "নেওয়া হয়েছে ✅" : "বাদ দেওয়া হয়েছে")
        fetchMedicines()
      }
    } catch {
      toast.error("লগ করতে সমস্যা হয়েছে")
    }
  }

  const getMedicinesForSlot = (slot: string) =>
    medicines.filter((m) => m.status === "ACTIVE" && m[slot as keyof Medicine])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">ওষুধসমূহ</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            আপনার সব ওষুধের তালিকা ও সময়সূচী
          </p>
        </div>
        <Button
          className="rounded-full gradient-primary text-white shadow-md shadow-primary/20"
          onClick={() => setShowAddDialog(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          নতুন ওষুধ
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {timeSlots.map((slot, idx) => {
            const slotMedicines = getMedicinesForSlot(slot.key)
            if (slotMedicines.length === 0) return null
            const SlotIcon = slot.icon
            const color = getColor(slot.key)
            return (
              <motion.div
                key={slot.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="glass-card">
                  <CardContent className="pt-4 pb-0">
                    <div className="flex items-center gap-3 mb-3 relative">
                      <button
                        onClick={() => setPickerOpen(pickerOpen === slot.key ? null : slot.key)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-white text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                        style={{ backgroundColor: color }}
                      >
                        <SlotIcon className="w-4 h-4" />
                        <span>{slot.label}</span>
                        <Palette className="w-3 h-3 opacity-60" />
                      </button>
                      <span className="text-xs text-muted-foreground">{slot.time}</span>
                      <Badge className="ml-auto bg-white/[.08] text-muted-foreground border-0">
                        {slotMedicines.length}টি ওষুধ
                      </Badge>

                      {pickerOpen === slot.key && (
                        <div
                          ref={pickerRef}
                          className="absolute top-full left-0 mt-2 z-50 p-3 rounded-xl glass-card border border-white/[.12] shadow-xl flex gap-1.5 flex-wrap max-w-[240px]"
                        >
                          {presetColors.map((pc) => (
                            <button
                              key={pc}
                              onClick={() => { setColor(slot.key, pc); setPickerOpen(null) }}
                              className="w-7 h-7 rounded-lg border border-white/[.12] transition-transform hover:scale-110 active:scale-95"
                              style={{ backgroundColor: pc }}
                            />
                          ))}
                          <label className="w-7 h-7 rounded-lg border border-white/[.12] flex items-center justify-center cursor-pointer hover:bg-white/[.06]">
                            <input
                              type="color"
                              value={color}
                              onChange={(e) => { setColor(slot.key, e.target.value); setPickerOpen(null) }}
                              className="w-0 h-0 opacity-0 absolute"
                            />
                            <span className="text-[10px] text-muted-foreground font-bold">+</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardContent className="p-4 pt-0 space-y-3">
                    {slotMedicines.map((medicine) => (
                      <div
                        key={medicine.id}
                        className="flex items-center gap-4 p-4 rounded-xl glass group hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl p-2 flex-shrink-0" style={{ backgroundColor: color }}>
                          <Pill className="w-full h-full text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{medicine.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">{medicine.dosage}</span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">{medicine.frequency}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="text-xs" variant={medicine.intakeTime === "BEFORE_MEAL" ? "default" : "secondary"}>
                            {medicine.intakeTime === "BEFORE_MEAL" ? "খাবার আগে" :
                             medicine.intakeTime === "AFTER_MEAL" ? "খাবার পরে" :
                             medicine.intakeTime === "WITH_MEAL" ? "খাবারের সাথে" : "যেকোনো সময়"}
                          </Badge>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 rounded-full text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                              onClick={() => logMedicine(medicine.id, "TAKEN")}
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                              onClick={() => logMedicine(medicine.id, "SKIPPED")}
                            >
                              <XCircle className="w-5 h-5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-600"
                              onClick={() => toggleReminder(medicine)}
                            >
                              {medicine.reminderEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 rounded-full text-red-400 hover:text-red-600"
                              onClick={() => deleteMedicine(medicine.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}

          {medicines.filter(m => m.status === "ACTIVE").length === 0 && (
            <div className="text-center py-16">
              <Pill className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">কোনো ওষুধ নেই</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                এখনি আপনার প্রথম ওষুধ যোগ করুন
              </p>
              <Button
                className="rounded-full gradient-primary text-white"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                ওষুধ যোগ করুন
              </Button>
            </div>
          )}
        </div>
      )}

      <AddMedicineDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          setShowAddDialog(false)
          fetchMedicines()
        }}
      />
    </motion.div>
  )
}
