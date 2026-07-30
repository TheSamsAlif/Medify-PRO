"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users, Heart, Pill, Activity, Phone, PhoneCall, Bell, AlertTriangle, CheckCircle2, Plus, XCircle,
  Clock, Calendar, TrendingUp, ChevronDown, ChevronUp, Trash2, User as UserIcon,
  Stethoscope, Search, Eye, MessageSquare, FileText, ExternalLink, Zap, AlertCircle,
  Thermometer, Droplets, Weight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

type MedicationLog = {
  id: string
  medicineId: string
  status: "TAKEN" | "MISSED" | "SKIPPED" | "PENDING"
  takenAt: string
  scheduledTime: string
  medicine: { name: string; dosage: string }
}

type Patient = {
  id: string
  patientId: string
  relation: string
  name: string
  email: string
  phone: string
  age: number
  gender: string
  bloodGroup: string
  image: string
  medicines: any[]
  logs: MedicationLog[]
  metrics: any[]
}

export default function GuardianPage() {
  const { data: session } = useSession()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [patientId, setPatientId] = useState("")
  const [relation, setRelation] = useState("পরিবার")
  const [adding, setAdding] = useState(false)
  const [viewPatient, setViewPatient] = useState<Patient | null>(null)
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null)

  useEffect(() => { fetchPatients() }, [])

  const fetchPatients = async () => {
    try {
      const res = await fetch("/api/guardian/patients")
      if (res.ok) setPatients(await res.json())
    } catch { toast.error("তথ্য লোড করতে সমস্যা হয়েছে") }
    finally { setLoading(false) }
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
        setPatientId(""); setAddOpen(false); fetchPatients()
      } else {
        const err = await res.json()
        toast.error(err.error || "রোগী পাওয়া যায়নি")
      }
    } catch { toast.error("ত্রুটি ঘটেছে") }
    finally { setAdding(false) }
  }

  const handleRemovePatient = async (pid: string) => {
    try {
      const res = await fetch("/api/guardian/patients", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: pid }),
      })
      if (res.ok) { toast.success("রোগী সরানো হয়েছে"); setRemoveConfirm(null); fetchPatients() }
      else toast.error("সরাতে সমস্যা হয়েছে")
    } catch { toast.error("সরাতে সমস্যা হয়েছে") }
  }

  const stats = useMemo(() => {
    const today = new Date().toDateString()
    let totalMeds = 0, taken = 0, missed = 0, alerts = 0, doctors = 0
    patients.forEach(p => {
      const meds = p.medicines || []
      totalMeds += meds.length
      const todayLogs = p.logs?.filter((l: MedicationLog) => new Date(l.takenAt).toDateString() === today) || []
      taken += todayLogs.filter(l => l.status === "TAKEN").length
      missed += todayLogs.filter(l => l.status === "MISSED").length
      if (todayLogs.some(l => l.status === "MISSED")) alerts++
      if (p.logs?.some(l => l.status === "MISSED" && l.medicine?.name?.toLowerCase().includes("emergency"))) alerts++
    })
    return { total: patients.length, totalMeds, taken, missed, alerts, doctors }
  }, [patients])

  const statusBadge = (patient: Patient) => {
    const today = new Date().toDateString()
    const todayLogs = patient.logs?.filter((l: MedicationLog) => new Date(l.takenAt).toDateString() === today) || []
    const hasMissed = todayLogs.some(l => l.status === "MISSED")
    const allTaken = patient.medicines?.length > 0 && todayLogs.filter(l => l.status === "TAKEN").length >= patient.medicines.length
    if (hasMissed) return { label: "মিসড", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" }
    if (!allTaken && todayLogs.length > 0) return { label: "বাকি", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" }
    if (allTaken) return { label: "সম্পন্ন", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" }
    return { label: "সুস্থ", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" }
  }

  const nextMedicine = (patient: Patient) => {
    const today = new Date().toDateString()
    const todayLogs = patient.logs?.filter((l: MedicationLog) => new Date(l.takenAt).toDateString() === today) || []
    const upcoming = (patient.medicines || []).find((m: any) => {
      const taken = todayLogs.filter(l => l.medicineId === m.id && l.status === "TAKEN").length
      const times = [m.morning, m.noon, m.evening, m.night].filter(Boolean).length
      return taken < times
    })
    if (!upcoming) return null
    const timeLabel = upcoming.morning ? "সকাল" : upcoming.noon ? "দুপুর" : upcoming.evening ? "বিকাল" : "রাত"
    return { name: upcoming.name, time: timeLabel, dosage: upcoming.dosage }
  }

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-72 glass" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {[1,2,3,4,5,6,7].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl glass" />)}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {[1,2].map(i => <Skeleton key={i} className="h-72 w-full rounded-2xl glass" />)}
      </div>
    </div>
  )

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            স্বাগতম, {session?.user?.name || "অভিভাবক"}
          </h2>
          <p className="text-muted-foreground mt-1">পরিবারের সদস্যদের স্বাস্থ্য পর্যবেক্ষণ ও ওষুধ ব্যবস্থাপনা</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gradient-primary text-[#160500] rounded-xl">
          <Plus className="w-4 h-4 mr-1.5" /> Patient ID যুক্ত করুন
        </Button>
      </div>

      {/* At a Glance Summary */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">At a Glance</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
          {[
            { icon: Users, label: "সংযুক্ত রোগী", value: stats.total, color: "from-[#0EA5E9] to-[#38BDF8]" },
            { icon: Pill, label: "আজকের ওষুধ", value: stats.totalMeds, color: "from-[#F96801] to-[#FF8A1E]" },
            { icon: CheckCircle2, label: "নেওয়া হয়েছে", value: stats.taken, color: "from-emerald-500 to-green-600" },
            { icon: XCircle, label: "মিসড", value: stats.missed, color: "from-red-500 to-rose-600", urgent: true },
            { icon: Calendar, label: "আসন্ন অ্যাপয়েন্টমেন্ট", value: "—", color: "from-violet-500 to-purple-600" },
            { icon: Stethoscope, label: "সক্রিয় ডাক্তার", value: stats.doctors, color: "from-[#25C2C3] to-teal-500" },
            { icon: AlertTriangle, label: "সতর্কতা", value: stats.alerts, color: "from-rose-500 to-pink-600", urgent: true },
          ].map((card, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className={`glass-card ${card.urgent && (card.value as number) > 0 ? "border-red-500/30" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} p-2.5 flex items-center justify-center`}>
                      <card.icon className="w-5 h-5 text-[#160500]" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-lg font-bold text-foreground ${card.urgent && (card.value as number) > 0 ? "text-red-400" : ""}`}>
                        {typeof card.value === "number" ? card.value : card.value}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{card.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {patients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center mb-4">
            <Users className="w-10 h-10 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm mb-2">কোনো সদস্য যুক্ত করা হয়নি</p>
          <p className="text-muted-foreground/60 text-xs mb-6">রোগীর Patient ID দিয়ে যুক্ত করুন (যেমন: PAT-A1B2C3)</p>
          <Button onClick={() => setAddOpen(true)} className="gradient-primary text-[#160500] rounded-xl">
            <Plus className="w-4 h-4 mr-1.5" /> সদস্য যুক্ত করুন
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Patient Monitoring Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#F96801]" /> রোগী পর্যবেক্ষণ
              </h3>
              <span className="text-xs text-muted-foreground bg-white/[.04] px-2.5 py-1 rounded-full">
                {patients.length} জন সংযুক্ত
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {patients.map((patient, i) => {
                const sb = statusBadge(patient)
                const next = nextMedicine(patient)
                const todayLogs = patient.logs?.filter((l: MedicationLog) => new Date(l.takenAt).toDateString() === new Date().toDateString()) || []
                const takenToday = todayLogs.filter(l => l.status === "TAKEN").length
                const totalSlots = (patient.medicines || []).reduce((acc: number, m: any) => {
                  if (m.morning) acc++; if (m.noon) acc++; if (m.evening) acc++; if (m.night) acc++
                  return acc
                }, 0)
                const pct = totalSlots > 0 ? Math.round((takenToday / totalSlots) * 100) : 0
                const lastLog = todayLogs.filter(l => l.status === "TAKEN").sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime())[0]
                const lastMetric = patient.metrics?.length > 0 ? patient.metrics[patient.metrics.length - 1] : null

                return (
                  <motion.div key={patient.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <Card className={`glass-card overflow-hidden ${sb.label === "মিসড" ? "border-red-500/25" : ""}`}>
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[.015] to-transparent pointer-events-none" />
                      <CardContent className="p-5 relative">
                        {/* Top Row */}
                        <div className="flex items-start gap-4 mb-4">
                          <Avatar className="w-14 h-14 shadow-[0_0_20px_rgba(14,165,233,0.2)] ring-2 ring-white/[.06]">
                            <AvatarFallback className="bg-gradient-to-br from-[#0EA5E9] to-[#38BDF8] text-white text-lg font-bold">
                              {patient.name?.charAt(0) || "P"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-lg font-bold text-foreground">{patient.name}</h4>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${sb.bg} ${sb.color}`}>{sb.label}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <span className="font-mono">{patient.patientId}</span>
                              {patient.age && <span>• {patient.age} বছর</span>}
                              {patient.bloodGroup && <span>• {patient.bloodGroup}</span>}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 text-xs">
                              <span className="flex items-center gap-1"><Pill className="w-3 h-3 text-[#F96801]" />{(patient.medicines || []).length}টি</span>
                              <span className="flex items-center gap-1"><TrendingUp className={`w-3 h-3 ${pct >= 80 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-red-400"}`} />{pct}%</span>
                              {lastMetric && <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-[#25C2C3]" />{lastMetric.value}{lastMetric.unit}</span>}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setViewPatient(patient)}
                            className="text-[#F96801] hover:bg-[#F96801]/10 rounded-lg h-8 w-8 p-0">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Medicine Timeline */}
                        <div className="space-y-1.5 mb-3">
                          {(patient.medicines || []).slice(0, 3).map((m: any, mi: number) => {
                            const times = []
                            if (m.morning) times.push({ label: "08:00", period: "AM" })
                            if (m.noon) times.push({ label: "12:00", period: "PM" })
                            if (m.evening) times.push({ label: "03:00", period: "PM" })
                            if (m.night) times.push({ label: "09:00", period: "PM" })
                            return times.map((t, ti) => {
                              const log = todayLogs.find(l => l.medicineId === m.id && l.scheduledTime === (t.label.includes("08") ? "সকাল" : t.label.includes("12") ? "দুপুর" : t.label.includes("03") ? "বিকাল" : "রাত"))
                              const taken = log?.status === "TAKEN"
                              const missed = log?.status === "MISSED"
                              return (
                                <div key={`${mi}-${ti}`} className="flex items-center gap-2 text-xs">
                                  <span className="font-mono text-muted-foreground w-12">{t.label} {t.period}</span>
                                  <span className={`w-2 h-2 rounded-full ${taken ? "bg-emerald-500" : missed ? "bg-red-500" : "bg-amber-500"}`} />
                                  <span className="text-foreground flex-1">{m.name} {mi === 0 && ti === 2 ? `(${m.dosage})` : ""}</span>
                                  <span className={`font-medium ${taken ? "text-emerald-400" : missed ? "text-red-400" : "text-amber-400"}`}>
                                    {taken ? "✓" : missed ? "✕" : "Pending"}
                                  </span>
                                </div>
                              )
                            })
                          })}
                          {(patient.medicines || []).length > 3 && (
                            <p className="text-[10px] text-muted-foreground/60 text-center pt-1">+ আরও {(patient.medicines || []).length - 3}টি ওষুধ</p>
                          )}
                        </div>

                        {/* Bottom Info Bar */}
                        <div className="flex items-center justify-between pt-3 border-t border-white/[.06]">
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                            {next && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> পরবর্তী: {next.name} ({next.time})
                              </span>
                            )}
                            {lastLog && (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> শেষ: {lastLog.medicine?.name}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {patient.phone && (
                              <a href={`tel:${patient.phone}`}>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-[#25C2C3]">
                                  <Phone className="w-3.5 h-3.5" />
                                </Button>
                              </a>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => setRemoveConfirm(patient.id)}
                              className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-red-400">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Critical Alerts */}
          {patients.some(p => {
            const today = new Date().toDateString()
            const todayLogs = p.logs?.filter((l: MedicationLog) => new Date(l.takenAt).toDateString() === today) || []
            return todayLogs.some(l => l.status === "MISSED")
          }) && (
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-red-400" /> জরুরি সতর্কতা
              </h3>
              <div className="space-y-2">
                {patients.map(p => {
                  const today = new Date().toDateString()
                  const missedLogs = p.logs?.filter((l: MedicationLog) => new Date(l.takenAt).toDateString() === today && l.status === "MISSED") || []
                  return missedLogs.map((log, li) => (
                    <div key={`${p.id}-${li}`} className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/15">
                      <div className="w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-red-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{p.name} — {log.medicine?.name || "ওষুধ"} মিসড</p>
                        <p className="text-xs text-muted-foreground">{log.scheduledTime} • {log.medicine?.dosage || ""}</p>
                      </div>
                      {p.phone && (
                        <a href={`tel:${p.phone}`}>
                          <Button variant="outline" size="sm" className="rounded-lg border-red-500/20 text-red-400 h-8 text-xs">
                            <Phone className="w-3 h-3 mr-1" /> কল
                          </Button>
                        </a>
                      )}
                    </div>
                  ))
                })}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-[#F96801]" /> দ্রুত
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { icon: Plus, label: "Patient ID যুক্ত করুন", onClick: () => setAddOpen(true), color: "from-[#F96801] to-[#FF8A1E]" },
                { icon: Users, label: "রোগী দেখুন", href: patients.length > 0 ? undefined : undefined, onClick: patients.length > 0 ? () => document.querySelector('[data-patient-card]')?.scrollIntoView({ behavior: "smooth" }) : undefined, color: "from-[#0EA5E9] to-[#38BDF8]" },
                { icon: Stethoscope, label: "ডাক্তার", href: "/my-doctors", color: "from-[#25C2C3] to-teal-500" },
                { icon: Calendar, label: "অ্যাপয়েন্টমেন্ট", href: "/appointments", color: "from-violet-500 to-purple-600" },
                { icon: PhoneCall, label: "জরুরি যোগাযোগ", href: "/emergency", color: "from-red-500 to-rose-600" },
              ].map((action, i) =>
                action.href ? (
                  <a key={i} href={action.href}>
                    <div className="flex flex-col items-center gap-2 p-4 rounded-2xl glass hover:border-[#F96801]/20 transition-all cursor-pointer group">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.color} p-2.5 shadow-lg group-hover:scale-110 transition-transform`}>
                        <action.icon className="w-full h-full text-[#160500]" />
                      </div>
                      <span className="text-xs font-medium text-center text-foreground">{action.label}</span>
                    </div>
                  </a>
                ) : (
                  <button key={i} onClick={action.onClick}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl glass hover:border-[#F96801]/20 transition-all cursor-pointer group">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.color} p-2.5 shadow-lg group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-full h-full text-[#160500]" />
                    </div>
                    <span className="text-xs font-medium text-center text-foreground">{action.label}</span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Patient Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="glass-card text-foreground max-w-md border border-white/[.08]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Patient ID দিয়ে সদস্য যুক্ত করুন</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPatient} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Patient ID</label>
              <Input placeholder="যেমন: PAT-A1B2C3" value={patientId}
                onChange={e => setPatientId(e.target.value)}
                className="glass border-white/[.08] text-foreground uppercase font-mono" />
              <p className="text-[10px] text-muted-foreground/60">রোগীকে তার Patient ID জিজ্ঞেস করে নিন</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">সম্পর্ক</label>
              <Input value={relation} onChange={e => setRelation(e.target.value)}
                className="glass border-white/[.08] text-foreground" />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}
                className="border-white/[.08] text-muted-foreground">বাতিল</Button>
              <Button type="submit" disabled={adding} className="gradient-primary text-[#160500]">
                {adding && <span className="inline-block w-4 h-4 border-2 border-[#160500] border-t-transparent rounded-full animate-spin mr-2" />}
                যুক্ত করুন
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick View Dialog */}
      <Dialog open={!!viewPatient} onOpenChange={() => setViewPatient(null)}>
        <DialogContent className="glass-card text-foreground max-w-2xl border border-white/[.08] max-h-[85vh] overflow-y-auto">
          {viewPatient && (() => {
            const p = viewPatient
            const todayLogs = p.logs?.filter((l: MedicationLog) => new Date(l.takenAt).toDateString() === new Date().toDateString()) || []
            const takenToday = todayLogs.filter(l => l.status === "TAKEN").length
            const totalSlots = (p.medicines || []).reduce((acc: number, m: any) => {
              if (m.morning) acc++; if (m.noon) acc++; if (m.evening) acc++; if (m.night) acc++
              return acc
            }, 0)
            const pct = totalSlots > 0 ? Math.round((takenToday / totalSlots) * 100) : 0
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gradient-to-br from-[#0EA5E9] to-[#38BDF8] text-white text-sm">
                        {p.name?.charAt(0) || "P"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span>{p.name}</span>
                      <p className="text-xs text-muted-foreground font-mono font-normal">{p.patientId}</p>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label: "বয়স", value: p.age ? `${p.age} বছর` : "—" },
                      { label: "রক্তের গ্রুপ", value: p.bloodGroup || "—" },
                      { label: "সম্পর্ক", value: p.relation },
                      { label: "আনুগত্য", value: `${pct}%`, color: pct >= 80 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-red-400" },
                    ].map((item, i) => (
                      <div key={i} className="p-3 rounded-xl glass border border-white/[.06]">
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className={`text-sm font-semibold text-foreground ${item.color || ""}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#F96801]" /> আজকের ওষুধের সময়সূচী
                    </h4>
                    <div className="space-y-1.5">
                      {(p.medicines || []).length === 0 ? (
                        <p className="text-xs text-muted-foreground/70">কোনো সক্রিয় ওষুধ নেই</p>
                      ) : (
                        (p.medicines || []).map((m: any, mi: number) => {
                          const timeSlots = []
                          if (m.morning) timeSlots.push({ time: "08:00 AM", label: "সকাল" })
                          if (m.noon) timeSlots.push({ time: "12:00 PM", label: "দুপুর" })
                          if (m.evening) timeSlots.push({ time: "03:00 PM", label: "বিকাল" })
                          if (m.night) timeSlots.push({ time: "09:00 PM", label: "রাত" })
                          return timeSlots.map((ts, ti) => {
                            const log = todayLogs.find(l => l.medicineId === m.id && l.scheduledTime === ts.label)
                            const taken = log?.status === "TAKEN"
                            const missed = log?.status === "MISSED"
                            return (
                              <div key={`${mi}-${ti}`} className={`flex items-center gap-3 p-2.5 rounded-xl ${
                                taken ? "bg-emerald-500/5 border border-emerald-500/10" :
                                missed ? "bg-red-500/5 border border-red-500/10" :
                                "bg-white/[.03] border border-white/[.06]"
                              }`}>
                                <span className="font-mono text-xs text-muted-foreground w-16">{ts.time}</span>
                                <span className={`w-2 h-2 rounded-full ${taken ? "bg-emerald-500" : missed ? "bg-red-500" : "bg-amber-500"}`} />
                                <div className="flex-1">
                                  <span className="text-sm text-foreground">{m.name}</span>
                                  <span className="text-xs text-muted-foreground ml-1">({m.dosage})</span>
                                </div>
                                <span className={`text-xs font-medium flex items-center gap-1 ${
                                  taken ? "text-emerald-400" : missed ? "text-red-400" : "text-amber-400"
                                }`}>
                                  {taken ? <CheckCircle2 className="w-3 h-3" /> : missed ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                  {taken ? "Taken" : missed ? "Missed" : "Pending"}
                                </span>
                              </div>
                            )
                          })
                        })
                      )}
                    </div>
                  </div>

                  {p.metrics && p.metrics.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#25C2C3]" /> স্বাস্থ্য তথ্য
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {p.metrics.slice(0, 6).map((metric: any, mi: number) => {
                          const icons: Record<string, any> = { weight: Weight, blood_pressure: Activity, blood_sugar: Droplets, heart_rate: Heart, temperature: Thermometer }
                          const labels: Record<string, string> = { weight: "ওজন", blood_pressure: "বিপি", blood_sugar: "সুগার", heart_rate: "হৃদস্পন্দন", temperature: "তাপমাত্রা" }
                          const MIcon = icons[metric.type] || Activity
                          return (
                            <div key={mi} className="p-2.5 rounded-xl glass border border-white/[.06]">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <MIcon className="w-3 h-3 text-[#F96801]" />
                                <span className="text-[10px] text-muted-foreground">{labels[metric.type] || metric.type}</span>
                              </div>
                              <p className="text-sm font-semibold text-foreground">{metric.value} {metric.unit}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {p.phone && (
                      <a href={`tel:${p.phone}`} className="flex-1">
                        <Button variant="outline" className="w-full rounded-xl border-white/[.08] text-muted-foreground">
                          <Phone className="w-4 h-4 mr-1.5 text-[#25C2C3]" /> কল করুন
                        </Button>
                      </a>
                    )}
                    <Button variant="outline" onClick={() => { setViewPatient(null); setRemoveConfirm(p.id) }}
                      className="rounded-xl border-white/[.08] text-red-400 hover:text-red-400">
                      <Trash2 className="w-4 h-4 mr-1.5" /> সরান
                    </Button>
                  </div>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Remove Confirm Dialog */}
      <Dialog open={!!removeConfirm} onOpenChange={() => setRemoveConfirm(null)}>
        <DialogContent className="glass-card text-foreground max-w-sm border border-white/[.08]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">রোগী সরান?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">এই রোগীকে আপনার তালিকা থেকে সরিয়ে ফেলা হবে।</p>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setRemoveConfirm(null)}
              className="border-white/[.08] text-muted-foreground">বাতিল</Button>
            <Button onClick={() => removeConfirm && handleRemovePatient(removeConfirm)}
              className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30">সরান</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
