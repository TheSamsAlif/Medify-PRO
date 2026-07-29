"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, Heart, Pill, Activity, MessageSquare, Phone, Bell, AlertTriangle, CheckCircle2, Plus, XCircle, Sunrise, Sun, Sunset, Moon, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"

export default function GuardianPage() {
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [patientId, setPatientId] = useState("")
  const [relation, setRelation] = useState("family")
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      const res = await fetch("/api/guardian/patients")
      if (res.ok) {
        const data = await res.json()
        setPatients(data)
      }
    } catch {
      toast.error("তথ্য লোড করতে সমস্যা হয়েছে")
    } finally {
      setLoading(false)
    }
  }

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientId.trim()) return
    setAdding(true)
    try {
      const res = await fetch("/api/guardian/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: patientId.trim(), relation }),
      })
      if (res.ok) {
        toast.success("রোগী সফলভাবে যুক্ত হয়েছে")
        setPatientId("")
        setAddOpen(false)
        fetchPatients()
      } else {
        const err = await res.json()
        toast.error(err.error || "রোগী পাওয়া যায়নি")
      }
    } catch {
      toast.error("ত্রুটি ঘটেছে")
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 bg-white/[.04]" />
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl bg-white/[.04]" />)}
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#EFF2F2]">অভিভাবক ড্যাশবোর্ড</h2>
          <p className="text-[#A5ABB0] mt-1">পরিবারের সদস্যদের স্বাস্থ্য এবং ওষুধের সময়সূচী পর্যবেক্ষণ</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setAddOpen(true)} className="gradient-primary text-[#160500] rounded-xl">
            <Plus className="w-4 h-4 mr-1.5" /> রোগী যুক্ত করুন
          </Button>
          <Badge className="text-sm px-4 py-2 gap-2 bg-white/[.06] text-[#EFF2F2] border-white/[.08]">
            <Users className="w-4 h-4 text-[#F96801]" />
            {patients.length} জন সদস্য
          </Badge>
        </div>
      </div>

      {patients.length === 0 ? (
        <Card className="border border-white/[.08] bg-[#0a0d16] p-12 text-center">
          <Users className="w-12 h-12 text-[#A5ABB0] mx-auto mb-3 opacity-50" />
          <p className="text-[#A5ABB0] text-sm mb-4">কোনো সদস্য যুক্ত করা হয়নি। রোগীর Patient ID দিয়ে যুক্ত করুন।</p>
          <Button onClick={() => setAddOpen(true)} className="gradient-primary text-[#160500] rounded-xl text-xs">
            <Plus className="w-4 h-4 mr-1" /> সদস্য যুক্ত করুন
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {patients.map((patient, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="border border-white/[.08] bg-[#0a0d16]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-5">
                    <Avatar className="w-16 h-16 border border-white/[.08]">
                      <AvatarFallback className="bg-[#F96801]/20 text-[#F96801] text-xl font-bold">
                        {patient.name?.charAt(0) || "P"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-[#EFF2F2]">{patient.name}</h3>
                        <Badge className="bg-[#F96801]/20 text-[#F96801] font-mono text-xs">{patient.patientId}</Badge>
                      </div>
                      <p className="text-sm text-[#A5ABB0]">
                        {patient.relation} {patient.age ? `• ${patient.age} বছর` : ""} {patient.bloodGroup ? `• রক্ত: ${patient.bloodGroup}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#A5ABB0]">সক্রিয় ওষুধ</span>
                        <span className="font-bold text-[#EFF2F2]">{patient.medicines?.length || 0}টি</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-[#A5ABB0] font-medium">ওষুধের তালিকা</p>
                      {patient.medicines?.length === 0 ? (
                        <p className="text-xs text-[#A5ABB0]/70">কোনো সক্রিয় ওষুধ নেই</p>
                      ) : (
                        <div className="space-y-2">
                          {patient.medicines?.map((m: any, j: number) => {
                            const times = []
                            if (m.morning) times.push({ icon: Sunrise, label: "সকাল" })
                            if (m.noon) times.push({ icon: Sun, label: "দুপুর" })
                            if (m.evening) times.push({ icon: Sunset, label: "বিকাল" })
                            if (m.night) times.push({ icon: Moon, label: "রাত" })
                            const todayLogs = patient.logs?.filter((l: any) => l.medicineId === m.id && new Date(l.takenAt).toDateString() === new Date().toDateString()) || []
                            const takenToday = todayLogs.filter((l: any) => l.status === "TAKEN").length
                            const totalExpected = times.length
                            return (
                              <div key={j} className="p-3 rounded-xl bg-white/[.04] border border-white/[.08]">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Pill className="w-4 h-4 text-[#F96801]" />
                                    <span className="text-sm font-medium text-[#EFF2F2]">{m.name}</span>
                                    <span className="text-xs text-[#A5ABB0]">({m.dosage})</span>
                                  </div>
                                  <Badge className={`text-xs ${totalExpected > 0 && takenToday >= totalExpected ? "bg-[#25C2C3]/20 text-[#25C2C3]" : "bg-[#F96801]/20 text-[#F96801]"}`}>
                                    {totalExpected > 0 ? `${takenToday}/${totalExpected} খাওয়া` : "সক্রিয়"}
                                  </Badge>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                  {times.map((t, ti) => {
                                    const taken = todayLogs.some((l: any) => l.status === "TAKEN" && l.scheduledTime === t.label)
                                    return (
                                      <span key={ti} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${taken ? "bg-[#25C2C3]/20 text-[#25C2C3]" : "bg-white/[.06] text-[#A5ABB0]"}`}>
                                        <t.icon className="w-3 h-3" />
                                        {t.label}
                                        {taken ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                      </span>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <a href={`tel:${patient.phone}`} className="flex-1">
                        <Button variant="outline" size="sm" className="rounded-xl w-full border-white/[.08] text-[#A5ABB0] hover:text-[#EFF2F2]">
                          <Phone className="w-4 h-4 mr-1 text-[#25C2C3]" /> কল করুন
                        </Button>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Patient Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-[#0a0d16] border border-white/[.08] text-[#EFF2F2] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Patient ID দিয়ে সদস্য যুক্ত করুন</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPatient} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs text-[#A5ABB0]">Patient ID (যেমন: PAT-A1B2C3)</label>
              <Input
                placeholder="PAT-..."
                value={patientId}
                onChange={e => setPatientId(e.target.value)}
                className="bg-white/[.04] border-white/[.08] text-[#EFF2F2] uppercase font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-[#A5ABB0]">সম্পর্ক (Relation)</label>
              <Input
                placeholder="যেমন: বাবা, মা, ভাই"
                value={relation}
                onChange={e => setRelation(e.target.value)}
                className="bg-white/[.04] border-white/[.08] text-[#EFF2F2]"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="border-white/[.08] text-[#A5ABB0]">
                বাতিল
              </Button>
              <Button type="submit" disabled={adding} className="gradient-primary text-[#160500]">
                {adding && <LoadingSpinner />} যুক্ত করুন
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

function LoadingSpinner() {
  return <span className="inline-block w-4 h-4 border-2 border-[#160500] border-t-transparent rounded-full animate-spin mr-2" />
}
