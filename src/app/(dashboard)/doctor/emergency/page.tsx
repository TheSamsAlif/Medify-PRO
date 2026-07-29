"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { AlertTriangle, Phone, MapPin, Clock, Heart, Droplets, User, ChevronRight, RefreshCw, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n"

export default function DoctorEmergency() {
  const { t } = useI18n()
  const [emergencies, setEmergencies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchEmergencies() }, [])

  const fetchEmergencies = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/doctor/emergency")
      if (res.ok) setEmergencies(await res.json())
    } catch {} finally { setLoading(false) }
  }

  const priorityColor = (p: string) => p === "CRITICAL" ? "text-red-400 bg-red-500/20" : "text-amber-400 bg-amber-500/20"

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/doctor/emergency", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
      if (res.ok) { toast.success("রিকোয়েস্ট সরানো হয়েছে"); fetchEmergencies() }
      else toast.error("সরাতে সমস্যা হয়েছে")
    } catch { toast.error("নেটওয়ার্ক ত্রুটি") }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#EFF2F2]">জরুরি বিভাগ</h2>
          <p className="text-[#A5ABB0] mt-1">ক্রিটিকাল পেশেন্ট ও জরুরি রিকোয়েস্ট</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchEmergencies} className="border-white/[.08] text-[#A5ABB0] rounded-xl text-xs"><RefreshCw className="w-4 h-4 mr-1" /> রিফ্রেশ</Button>
          <Badge className="bg-red-500/20 text-red-400 text-sm px-3 py-1.5">
            <AlertTriangle className="w-4 h-4 mr-1" /> {emergencies.length}টি
          </Badge>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl bg-white/[.04]" />)}</div>
      ) : emergencies.length === 0 ? (
        <Card className="border border-white/[.08] bg-[#0a0d16] p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-[#A5ABB0] mx-auto mb-3 opacity-50" />
          <p className="text-[#A5ABB0] text-lg mb-1">কোনো জরুরি কেস নেই</p>
          <p className="text-xs text-[#A5ABB0]">সব রোগী নিরাপদ আছেন</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {emergencies.map((e, i) => (
            <Card key={i} className={`border ${e.priority === "CRITICAL" ? "border-red-500/30" : "border-amber-500/30"} bg-[#0a0d16]`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14 border-2 border-red-500/30">
                    <AvatarFallback className="bg-red-500/20 text-red-400 text-lg font-bold">{e.patientName?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-lg text-[#EFF2F2]">{e.patientName}</h4>
                      <Badge className={`text-xs ${priorityColor(e.priority)}`}>{e.priority}</Badge>
                      {e.bloodGroup && <Badge className="bg-red-500/20 text-red-400 font-mono text-xs">{e.bloodGroup}</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#A5ABB0] mt-1">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {e.patientAge ? `${e.patientAge} বছর` : ""}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(e.createdAt).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}</span>
                      {e.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {e.address}</span>}
                    </div>
                    {e.message && <p className="text-sm text-[#EFF2F2] mt-2 bg-red-500/10 p-2 rounded-lg">{e.message}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    {e.patientPhone && (
                      <a href={`tel:${e.patientPhone}`}>
                        <Button className="gradient-primary text-[#160500] rounded-xl text-xs"><Phone className="w-4 h-4 mr-1" /> কল</Button>
                      </a>
                    )}
                    {e.latitude && e.longitude && (
                      <a href={`https://www.google.com/maps?q=${e.latitude},${e.longitude}`} target="_blank">
                        <Button variant="outline" className="border-white/[.08] text-[#A5ABB0] rounded-xl text-xs"><MapPin className="w-4 h-4 mr-1" /> লোকেশন</Button>
                      </a>
                    )}
                    {e.emergencyPhone && (
                      <a href={`tel:${e.emergencyPhone}`}>
                        <Button variant="outline" className="border-red-500/30 text-red-400 rounded-xl text-xs"><Heart className="w-4 h-4 mr-1" /> ইমারজেন্সি</Button>
                      </a>
                    )}
                    <Button variant="ghost" onClick={() => handleDelete(e.id)} className="text-red-500/50 hover:text-red-400 h-8 w-8 p-0"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  )
}
