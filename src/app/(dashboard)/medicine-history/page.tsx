"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Pill, CheckCircle2, XCircle, Clock, Sunrise, Sun, Sunset, Moon, CalendarDays } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const timeSlotIcon: Record<string, any> = {
  সকাল: Sunrise, দুপুর: Sun, বিকাল: Sunset, রাত: Moon,
}

export default function MedicineHistoryPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(14)

  useEffect(() => {
    fetchLogs()
  }, [days])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/medicine-logs?days=${days}`)
      if (res.ok) setLogs(await res.json())
    } catch {
      toast.error("লোড করতে সমস্যা")
    } finally {
      setLoading(false)
    }
  }

  const groupedByDate = logs.reduce((acc: Record<string, any[]>, log: any) => {
    const date = new Date(log.takenAt).toLocaleDateString("bn")
    if (!acc[date]) acc[date] = []
    acc[date].push(log)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#EFF2F2]">ওষুধের ইতিহাস</h2>
          <p className="text-[#A5ABB0] mt-1">কোন দিন কোন ওষুধ কখন খেয়েছেন তার পূর্ণ ইতিহাস</p>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30].map(d => (
            <Button key={d} variant={days === d ? "default" : "outline"} size="sm" onClick={() => setDays(d)}
              className={days === d ? "gradient-primary text-[#160500]" : "border-white/[.08] text-[#A5ABB0]"}>
              শেষ {d} দিন
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl bg-white/[.04]" />)}</div>
      ) : Object.keys(groupedByDate).length === 0 ? (
        <Card className="border border-white/[.08] bg-[#0a0d16] p-12 text-center">
          <CalendarDays className="w-12 h-12 text-[#A5ABB0] mx-auto mb-3 opacity-50" />
          <p className="text-[#A5ABB0] text-sm">কোনো লগ পাওয়া যায়নি। ওষুধ খাওয়ার পর আবার দেখুন।</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByDate).map(([date, dayLogs]) => {
            const taken = dayLogs.filter(l => l.status === "TAKEN").length
            const missed = dayLogs.filter(l => l.status !== "TAKEN").length
            return (
              <Card key={date} className="border border-white/[.08] bg-[#0a0d16]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-[#EFF2F2]">{date}</h3>
                    <div className="flex gap-2 text-xs">
                      <Badge className="bg-[#25C2C3]/20 text-[#25C2C3]">{taken} টি খাওয়া</Badge>
                      {missed > 0 && <Badge className="bg-red-500/20 text-red-400">{missed} টি বাকি</Badge>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {dayLogs.map((log: any) => {
                      const Icon = timeSlotIcon[log.scheduledTime] || Clock
                      const time = new Date(log.takenAt).toLocaleTimeString("bn", { hour: "2-digit", minute: "2-digit" })
                      return (
                        <div key={log.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/[.04] border border-white/[.08]">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${log.status === "TAKEN" ? "bg-[#25C2C3]/20" : "bg-red-500/20"}`}>
                            {log.status === "TAKEN" ? <CheckCircle2 className="w-4 h-4 text-[#25C2C3]" /> : <XCircle className="w-4 h-4 text-red-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#EFF2F2]">{log.medicine?.name || "Unknown"}</p>
                            <p className="text-xs text-[#A5ABB0]">{log.medicine?.dosage || ""}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#A5ABB0]">
                            {log.scheduledTime && (
                              <span className="flex items-center gap-1">
                                <Icon className="w-3 h-3" /> {log.scheduledTime}
                              </span>
                            )}
                            <span>{time}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
