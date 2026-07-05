"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Calendar, Clock, MapPin, Plus, Video, ChevronRight, Stethoscope } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { AddAppointmentDialog } from "@/components/medical/add-appointment-dialog"
import type { Appointment } from "@/types"

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      const res = await fetch("/api/appointments")
      if (res.ok) setAppointments(await res.json())
    } catch {
      toast.error("ডাটা লোড করতে সমস্যা")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      case "CONFIRMED": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      case "COMPLETED": return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-400"
      case "CANCELLED": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return {
      date: date.toLocaleDateString("bn", { day: "numeric", month: "long", year: "numeric" }),
      time: date.toLocaleTimeString("bn", { hour: "2-digit", minute: "2-digit" }),
    }
  }

  const upcoming = appointments.filter(a => a.status === "SCHEDULED" || a.status === "CONFIRMED")
  const past = appointments.filter(a => a.status === "COMPLETED" || a.status === "CANCELLED")

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">অ্যাপয়েন্টমেন্ট</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">ডাক্তারের অ্যাপয়েন্টমেন্ট ব্যবস্থাপনা</p>
        </div>
        <Button className="rounded-full gradient-primary text-white" onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          নতুন অ্যাপয়েন্টমেন্ট
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">আসন্ন অ্যাপয়েন্টমেন্ট</h3>
              <div className="space-y-3">
                {upcoming.map(apt => {
                  const { date, time } = formatDate(apt.date)
                  return (
                    <motion.div key={apt.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                      <Card className="border-0 shadow-lg shadow-black/5 hover:shadow-xl transition-shadow">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <Stethoscope className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h4 className="font-semibold text-lg">{apt.doctorName}</h4>
                                  <p className="text-sm text-gray-500">{apt.specialty}</p>
                                </div>
                                <Badge className={getStatusColor(apt.status)}>
                                  {apt.status === "SCHEDULED" ? "নির্ধারিত" : apt.status === "CONFIRMED" ? "নিশ্চিত" : apt.status}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" /> {date}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" /> {time}
                                </span>
                                {apt.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" /> {apt.location}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">পূর্বের অ্যাপয়েন্টমেন্ট</h3>
              <div className="space-y-3">
                {past.map(apt => {
                  const { date, time } = formatDate(apt.date)
                  return (
                    <Card key={apt.id} className="border-0 shadow-sm bg-gray-50 dark:bg-gray-900">
                      <CardContent className="p-4 opacity-70">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                            <Stethoscope className="w-5 h-5 text-gray-500" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{apt.doctorName}</p>
                            <p className="text-xs text-gray-500">{date} - {time}</p>
                          </div>
                          <Badge variant="outline">{apt.status === "COMPLETED" ? "সম্পন্ন" : "বাতিল"}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {appointments.length === 0 && (
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">কোনো অ্যাপয়েন্টমেন্ট নেই</h3>
              <p className="text-gray-500 mb-6">আপনার প্রথম অ্যাপয়েন্টমেন্ট যোগ করুন</p>
              <Button className="rounded-full gradient-primary text-white" onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" /> অ্যাপয়েন্টমেন্ট যোগ করুন
              </Button>
            </div>
          )}
        </div>
      )}

      <AddAppointmentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => { setShowAddDialog(false); fetchAppointments() }}
      />
    </motion.div>
  )
}
