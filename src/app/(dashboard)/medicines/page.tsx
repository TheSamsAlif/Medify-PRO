"use client"

import { useState, useEffect } from "react"
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
  Moon,
  Sunset,
  MoonStar,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { AddMedicineDialog } from "@/components/medical/add-medicine-dialog"
import type { Medicine } from "@/types"

const timeSlots = [
  { key: "morning", label: "সকাল", labelEn: "Morning", icon: Sun, color: "from-amber-400 to-orange-500", time: "6:00 - 9:00" },
  { key: "noon", label: "দুপুর", labelEn: "Noon", icon: Clock, color: "from-yellow-400 to-amber-500", time: "12:00 - 14:00" },
  { key: "evening", label: "বিকাল", labelEn: "Evening", icon: Sunset, color: "from-orange-400 to-red-500", time: "17:00 - 19:00" },
  { key: "night", label: "রাত", labelEn: "Night", icon: MoonStar, color: "from-indigo-400 to-purple-500", time: "21:00 - 23:00" },
]

export default function MedicinesPage() {
  const searchParams = useSearchParams()
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(searchParams.get("add") === "true")

  useEffect(() => {
    fetchMedicines()
  }, [])

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
            <Card key={i} className="border-0 shadow-lg shadow-black/5">
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
            return (
              <motion.div
                key={slot.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="border-0 shadow-lg shadow-black/5 overflow-hidden">
                  <div className={`bg-gradient-to-r ${slot.color} p-4`}>
                    <div className="flex items-center gap-3 text-white">
                      <SlotIcon className="w-6 h-6" />
                      <div>
                        <h3 className="font-bold text-lg">{slot.label}</h3>
                        <p className="text-white/80 text-sm">{slot.time}</p>
                      </div>
                      <Badge className="ml-auto bg-white/20 text-white border-0">
                        {slotMedicines.length}টি ওষুধ
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    {slotMedicines.map((medicine) => (
                      <div
                        key={medicine.id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 group hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${slot.color} p-2 flex-shrink-0`}>
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
