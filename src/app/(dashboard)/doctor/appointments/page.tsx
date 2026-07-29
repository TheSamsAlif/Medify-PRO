"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Calendar, Clock, CheckCircle2, XCircle, Video, MapPin, Search, Phone, ChevronRight, AlertCircle, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n"

const statusColors: Record<string, string> = {
  SCHEDULED: "bg-amber-500/20 text-amber-400",
  CONFIRMED: "bg-[#25C2C3]/20 text-[#25C2C3]",
  COMPLETED: "bg-emerald-500/20 text-emerald-400",
  CANCELLED: "bg-red-500/20 text-red-400",
  RESCHEDULED: "bg-violet-500/20 text-violet-400",
}

export default function DoctorAppointments() {
  const { t } = useI18n()
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("today")
  const [search, setSearch] = useState("")
  const [selectedAppt, setSelectedAppt] = useState<any>(null)

  useEffect(() => { fetchAppts() }, [filter])

  const fetchAppts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/doctor/appointments?filter=${filter}`)
      if (res.ok) setAppointments(await res.json())
    } catch {} finally { setLoading(false) }
  }

  const handleAction = async (id: string, action: string) => {
    try {
      const body: any = { status: action === "approve" ? "CONFIRMED" : action === "reject" ? "CANCELLED" : action === "complete" ? "COMPLETED" : undefined }
      if (action === "reschedule") {
        const newDate = prompt("নতুন তারিখ ও সময় (YYYY-MM-DD HH:MM):")
        if (!newDate) return
        body.date = new Date(newDate).toISOString()
        body.status = "RESCHEDULED"
      }
      const res = await fetch(`/api/doctor/appointments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (res.ok) { toast.success("আপডেট করা হয়েছে"); fetchAppts(); setSelectedAppt(null) }
      else toast.error("সমস্যা হয়েছে")
    } catch { toast.error("ত্রুটি") }
  }

  const filtered = appointments.filter(a => !search || a.patientName?.toLowerCase().includes(search.toLowerCase()))

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#EFF2F2]">{t("doctor.appointments")}</h2>
          <p className="text-[#A5ABB0] mt-1">অ্যাপয়েন্টমেন্ট ব্যবস্থাপনা</p>
        </div>
        <Button variant="outline" onClick={fetchAppts} className="border-white/[.08] text-[#A5ABB0] rounded-xl text-xs"><RefreshCw className="w-4 h-4 mr-1" /> রিফ্রেশ</Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A5ABB0]" />
        <Input placeholder="রোগীর নামে খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white/[.04] border-white/[.08] text-[#EFF2F2] text-xs w-full md:w-72" />
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="bg-white/[.04] border border-white/[.08] p-1 rounded-xl mb-6">
          <TabsTrigger value="today" className="data-[state=active]:bg-[#F96801] data-[state=active]:text-[#160500] rounded-lg text-xs">আজ</TabsTrigger>
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-[#F96801] data-[state=active]:text-[#160500] rounded-lg text-xs">আসন্ন</TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-[#F96801] data-[state=active]:text-[#160500] rounded-lg text-xs">সম্পন্ন</TabsTrigger>
          <TabsTrigger value="cancelled" className="data-[state=active]:bg-[#F96801] data-[state=active]:text-[#160500] rounded-lg text-xs">বাতিল</TabsTrigger>
        </TabsList>

        <TabsContent value={filter}>
          {loading ? (
            <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl bg-white/[.04]" />)}</div>
          ) : filtered.length === 0 ? (
            <Card className="border border-white/[.08] bg-[#0a0d16] p-12 text-center">
              <Calendar className="w-12 h-12 text-[#A5ABB0] mx-auto mb-3 opacity-50" />
              <p className="text-[#A5ABB0] text-sm">কোনো অ্যাপয়েন্টমেন্ট নেই</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((a, i) => (
                <Card key={i} className="border border-white/[.08] bg-[#0a0d16] hover:border-[#F96801]/30 transition-all cursor-pointer" onClick={() => setSelectedAppt(a)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12 border border-white/[.08]">
                        <AvatarFallback className="bg-[#F96801]/20 text-[#F96801] font-bold">{a.patientName?.charAt(0) || "P"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[#EFF2F2]">{a.patientName}</p>
                          <Badge className={`text-xs ${statusColors[a.status] || "bg-white/[.06] text-[#A5ABB0]"}`}>{a.status}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#A5ABB0] mt-0.5">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(a.date).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(a.date).toLocaleDateString("bn-BD")}</span>
                          <span>{a.duration} মিনিট</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#A5ABB0]" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!selectedAppt} onOpenChange={() => setSelectedAppt(null)}>
        <DialogContent className="bg-[#0a0d16] border border-white/[.08] text-[#EFF2F2] max-w-lg">
          {selectedAppt && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-3">
                  <Avatar className="w-10 h-10 border border-white/[.08]">
                    <AvatarFallback className="bg-[#F96801]/20 text-[#F96801] font-bold">{selectedAppt.patientName?.charAt(0) || "P"}</AvatarFallback>
                  </Avatar>
                  {selectedAppt.patientName}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-white/[.04] border border-white/[.08] text-sm">
                  <div><span className="text-xs text-[#A5ABB0]">তারিখ</span><p className="text-[#EFF2F2]">{new Date(selectedAppt.date).toLocaleDateString("bn-BD")}</p></div>
                  <div><span className="text-xs text-[#A5ABB0]">সময়</span><p className="text-[#EFF2F2]">{new Date(selectedAppt.date).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}</p></div>
                  <div><span className="text-xs text-[#A5ABB0]">সময়কাল</span><p className="text-[#EFF2F2]">{selectedAppt.duration} মিনিট</p></div>
                  <div><span className="text-xs text-[#A5ABB0]">স্ট্যাটাস</span><Badge className={`text-xs ${statusColors[selectedAppt.status]}`}>{selectedAppt.status}</Badge></div>
                  {selectedAppt.specialty && <div><span className="text-xs text-[#A5ABB0]">বিশেষত্ব</span><p className="text-[#EFF2F2]">{selectedAppt.specialty}</p></div>}
                  {selectedAppt.hospitalName && <div><span className="text-xs text-[#A5ABB0]">হাসপাতাল</span><p className="text-[#EFF2F2]">{selectedAppt.hospitalName}</p></div>}
                </div>
                {selectedAppt.notes && (
                  <div className="p-3 rounded-xl bg-white/[.04] border border-white/[.08]">
                    <span className="text-xs text-[#A5ABB0]">নোটস</span>
                    <p className="text-sm text-[#EFF2F2] mt-1">{selectedAppt.notes}</p>
                  </div>
                )}
                {selectedAppt.meetingLink && (
                  <a href={selectedAppt.meetingLink} target="_blank" className="block">
                    <Button variant="outline" className="w-full border-[#25C2C3]/30 text-[#25C2C3] rounded-xl text-xs">
                      <Video className="w-4 h-4 mr-1" /> মিটিংয়ে যোগ দিন
                    </Button>
                  </a>
                )}
                {selectedAppt.patientPhone && (
                  <a href={`tel:${selectedAppt.patientPhone}`}>
                    <Button variant="outline" className="w-full border-white/[.08] text-[#A5ABB0] rounded-xl text-xs">
                      <Phone className="w-4 h-4 mr-1" /> কল করুন: {selectedAppt.patientPhone}
                    </Button>
                  </a>
                )}
                {selectedAppt.status !== "COMPLETED" && selectedAppt.status !== "CANCELLED" && (
                  <div className="flex gap-2 pt-2">
                    {selectedAppt.status === "SCHEDULED" && (
                      <>
                        <Button onClick={() => handleAction(selectedAppt.id, "approve")} className="flex-1 bg-[#25C2C3]/20 text-[#25C2C3] rounded-xl text-xs hover:bg-[#25C2C3]/30">
                          <CheckCircle2 className="w-4 h-4 mr-1" /> অনুমোদন
                        </Button>
                        <Button onClick={() => handleAction(selectedAppt.id, "reject")} className="flex-1 bg-red-500/20 text-red-400 rounded-xl text-xs hover:bg-red-500/30">
                          <XCircle className="w-4 h-4 mr-1" /> বাতিল
                        </Button>
                      </>
                    )}
                    {selectedAppt.status === "CONFIRMED" && (
                      <>
                        <Button onClick={() => handleAction(selectedAppt.id, "complete")} className="flex-1 bg-emerald-500/20 text-emerald-400 rounded-xl text-xs hover:bg-emerald-500/30">
                          <CheckCircle2 className="w-4 h-4 mr-1" /> সম্পন্ন
                        </Button>
                        <Button onClick={() => handleAction(selectedAppt.id, "reschedule")} variant="outline" className="flex-1 border-amber-500/30 text-amber-400 rounded-xl text-xs">
                          <RefreshCw className="w-4 h-4 mr-1" /> পুনঃনির্ধারণ
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
