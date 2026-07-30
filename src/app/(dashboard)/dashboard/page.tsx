"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  Pill, Activity, Heart, Bell, AlertTriangle, Calendar, ChevronRight, Clock, CheckCircle2, XCircle,
  TrendingUp, Droplets, Moon, Zap, Bot, MapPin, PhoneCall, Plus, Scan, Users, Stethoscope,
  Ambulance, FileText, ClipboardList, Search, Shield, Check, X, UserCheck, MessageSquare,
  GraduationCap, Star, DollarSign, Building, BadgeCheck, ToggleLeft, ToggleRight, ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { DashboardData, DoctorDashboardData } from "@/types"
import { useI18n } from "@/lib/i18n"
import { toast } from "sonner"

export default function DashboardPage() {
  const { data: session } = useSession()
  const { t } = useI18n()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const role = (session?.user?.role as string) || "PATIENT"

  const patientQuickActions = [
    { icon: Plus, label: t("dashboard.addMedicine"), href: "/medicines?add=true", color: "from-blue-400 to-blue-500", roles: ["PATIENT", "GUARDIAN"] },
    { icon: Scan, label: t("dashboard.scanPrescription"), href: "/prescriptions", color: "from-emerald-400 to-emerald-500", roles: ["PATIENT", "DOCTOR"] },
    { icon: Bot, label: t("dashboard.aiAssistant"), href: "/assistant", color: "from-purple-400 to-purple-500", roles: ["PATIENT", "GUARDIAN", "DOCTOR"] },
    { icon: AlertTriangle, label: "SOS", href: "/sos", color: "from-red-400 to-red-500", roles: ["PATIENT"] },
  ]

  const doctorQuickActions = [
    { icon: Users, label: t("dashboardDr.addPatient"), href: "/doctor/patients", color: "from-[#F96801] to-[#FF8A1E]" },
    { icon: FileText, label: t("dashboardDr.createPrescription"), href: "/doctor/prescriptions", color: "from-[#25C2C3] to-teal-500" },
    { icon: Ambulance, label: t("dashboardDr.viewEmergency"), href: "/doctor/emergency", color: "from-red-500 to-rose-600" },
    { icon: Activity, label: t("dashboardDr.viewRecords"), href: "/doctor/records", color: "from-violet-500 to-purple-600" },
    { icon: Calendar, label: t("dashboardDr.viewAppointments"), href: "/doctor/appointments", color: "from-amber-500 to-orange-500" },
  ]

  useEffect(() => {
    fetch("/api/dashboard").then(r => r.ok && r.json()).then(d => setData(d)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (role === "DOCTOR") {
    const d = data as DoctorDashboardData | null
    const [doctorProfile, setDoctorProfile] = useState<any>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResult, setSearchResult] = useState<any>(null)
    const [searching, setSearching] = useState(false)
    const [contactRequests, setContactRequests] = useState<any[]>([])
    const [profileLoading, setProfileLoading] = useState(true)

    useEffect(() => {
      if (role === "DOCTOR") {
        fetch("/api/doctor/profile").then(r => r.ok && r.json()).then(p => setDoctorProfile(p)).catch(() => {}).finally(() => setProfileLoading(false))
        fetch("/api/doctor/patients?q=").then(r => r.ok && r.json()).then(pl => {
          setContactRequests(pl.filter((p: any) => p.relation === "requested"))
        }).catch(() => {})
      }
    }, [])

    const weeklyData = d?.weeklyStats?.labels?.map((label: string, i: number) => ({
      day: label, appointments: d.weeklyStats.data[i] || 0,
    })) || []

    const statusColor: Record<string, string> = {
      SCHEDULED: "bg-blue-500/20 text-blue-400",
      CONFIRMED: "bg-green-500/20 text-green-400",
      COMPLETED: "bg-emerald-500/20 text-emerald-400",
      CANCELLED: "bg-red-500/20 text-red-400",
      RESCHEDULED: "bg-amber-500/20 text-amber-400",
    }

    const statCards = [
      { icon: Calendar, label: "আজকের অ্যাপয়েন্টমেন্ট", value: d?.todayAppointments ?? 0, color: "from-[#F96801] to-[#FF8A1E]", href: "/doctor/appointments" },
      { icon: Users, label: "মোট রোগী", value: d?.totalPatients ?? 0, color: "from-[#25C2C3] to-teal-500", href: "/doctor/patients" },
      { icon: ClipboardList, label: "পেন্ডিং প্রেসক্রিপশন", value: d?.pendingPrescriptions ?? 0, color: "from-amber-500 to-orange-500", href: "/doctor/prescriptions" },
      { icon: AlertTriangle, label: "জরুরিケース", value: d?.emergencyCases ?? 0, color: "from-red-500 to-rose-600", href: "/doctor/emergency" },
      { icon: CheckCircle2, label: "সম্পন্ন অ্যাপয়েন্টমেন্ট", value: d?.completedAppointments ?? 0, color: "from-emerald-500 to-green-600", href: "/doctor/appointments" },
      { icon: Clock, label: "আসন্ন অ্যাপয়েন্টমেন্ট", value: d?.upcomingAppointments ?? 0, color: "from-violet-500 to-purple-600", href: "/doctor/appointments" },
    ]

    const handleSearchPatient = async () => {
      if (!searchQuery.trim()) return
      setSearching(true)
      try {
        const res = await fetch(`/api/doctor/patients?q=${encodeURIComponent(searchQuery)}`)
        if (res.ok) {
          const results = await res.json()
          setSearchResult(results)
        }
      } catch {} finally {
        setSearching(false)
      }
    }

    const handleToggleAvailability = async () => {
      const newStatus = doctorProfile?.isAvailable !== false ? false : true
      try {
        const res = await fetch("/api/doctor/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isAvailable: newStatus }),
        })
        if (res.ok) {
          setDoctorProfile((prev: any) => ({ ...prev, isAvailable: newStatus }))
          toast.success(newStatus ? "বর্তমান অবস্থা: সক্রিয়" : "বর্তমান অবস্থা: নিষ্ক্রিয়")
        }
      } catch {
        toast.error("সমস্যা হয়েছে")
      }
    }

    const handleApproveContact = async (patientId: string, approve: boolean) => {
      try {
        const res = await fetch("/api/doctor/approve-contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId, approve }),
        })
        if (res.ok) {
          toast.success(approve ? "যোগাযোগ অনুমোদিত" : "অনুরোধ প্রত্যাখ্যান")
          setContactRequests(prev => prev.filter(r => r.patientId !== patientId))
        }
      } catch {
        toast.error("সমস্যা হয়েছে")
      }
    }

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Header with Doctor Info */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">ডক্টর ড্যাশবোর্ড</h2>
              <p className="text-muted-foreground mt-1">ডাঃ {session?.user?.name || ""} — স্বাগতম</p>
            </div>
            {doctorProfile && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-white/[.08]">
                <BadgeCheck className="w-4 h-4 text-[#F96801]" />
                <span className="text-xs font-mono text-muted-foreground">
                  {doctorProfile.registrationNumber ? `Reg: ${doctorProfile.registrationNumber}` : ""}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {doctorProfile && (
              <button onClick={handleToggleAvailability}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-all hover:scale-105 ${
                  doctorProfile.isAvailable !== false
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-white/[.04] border-white/[.08] text-muted-foreground"
                }`}>
                <div className={`w-2 h-2 rounded-full ${doctorProfile.isAvailable !== false ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground"}`} />
                {doctorProfile.isAvailable !== false ? "সক্রিয়" : "নিষ্ক্রিয়"}
              </button>
            )}
            <Link href="/doctor/patients">
              <Button className="gradient-primary text-[#160500] rounded-xl">
                <Plus className="w-4 h-4 mr-1.5" /> রোগী যুক্ত করুন
              </Button>
            </Link>
          </div>
        </div>

        {/* Doctor Profile Quick Card */}
        {!profileLoading && doctorProfile && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5 border border-white/[.08] mb-8">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[.02] to-transparent pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
              <Avatar className="w-16 h-16 shadow-[0_0_25px_rgba(220,38,38,0.25)]">
                <AvatarFallback className="bg-gradient-to-br from-[#DC2626] to-[#F96801] text-white text-xl font-bold">
                  {doctorProfile.name?.charAt(0) || "D"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-sm">
                <div>
                  <p className="font-semibold text-foreground">{doctorProfile.name}</p>
                  {doctorProfile.specialization && <p className="text-xs text-muted-foreground">{doctorProfile.specialization}</p>}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">অভিজ্ঞতা</p>
                  <p className="text-foreground">{doctorProfile.experience ? `${doctorProfile.experience} বছর` : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ফি</p>
                  <p className="text-foreground">{doctorProfile.consultationFee ? `৳${doctorProfile.consultationFee}` : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">হাসপাতাল</p>
                  <p className="text-foreground truncate">{doctorProfile.hospitalName || "—"}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stat Cards */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl bg-white/[.04]" />)}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {statCards.map((stat, i) => (
              <Link key={i} href={stat.href}>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="glass-card hover:border-[#F96801]/40 transition-all cursor-pointer">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} p-3 flex items-center justify-center`}>
                          <stat.icon className="w-6 h-6 text-[#160500]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>
            ))}
          </div>
        )}

        {/* Patient Search & Contact Requests */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          <div className="lg:col-span-2">
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-foreground flex items-center gap-2">
                  <Search className="w-5 h-5 text-[#F96801]" /> রোগী খুঁজুন
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input placeholder="Patient ID বা নাম লিখুন..." value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSearchPatient()}
                    className="glass border-white/[.08] text-foreground flex-1" />
                  <Button onClick={handleSearchPatient} disabled={searching}
                    className="gradient-primary text-[#160500] rounded-xl">
                    {searching ? <span className="w-4 h-4 border-2 border-[#160500] border-t-transparent rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
                {searchResult && searchResult.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                    {searchResult.slice(0, 5).map((p: any) => (
                      <div key={p.patientId} className="flex items-center justify-between p-3 rounded-xl glass border border-white/[.06]">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-gradient-to-br from-[#2563EB] to-[#60A5FA] text-white text-xs">{p.name?.charAt(0) || "P"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-foreground">{p.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{p.patientId}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${
                            p.relation === "connected" ? "bg-emerald-500/20 text-emerald-400" :
                            p.relation === "requested" ? "bg-amber-500/20 text-amber-400" : "bg-white/[.06] text-muted-foreground"
                          }`}>{p.relation === "connected" ? "সংযুক্ত" : p.relation === "requested" ? "অনুরোধ" : "লিংকড"}</Badge>
                          <Link href={`/doctor/patients?patientId=${p.patientId}`}>
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-8 w-8 p-0 rounded-lg">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {searchResult && searchResult.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-2">কোনো রোগী পাওয়া যায়নি</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact Requests */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#25C2C3]" /> যোগাযোগ অনুরোধ
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contactRequests.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">কোনো অনুরোধ নেই</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {contactRequests.slice(0, 5).map((req: any) => (
                    <div key={req.patientId} className="p-3 rounded-xl glass border border-amber-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-gradient-to-br from-[#2563EB] to-[#60A5FA] text-white text-xs">{req.name?.charAt(0) || "P"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{req.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{req.patientId}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApproveContact(req.patientId, true)}
                          className="flex-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/20 text-xs">
                          <Check className="w-3 h-3 mr-1" /> অনুমোদন
                        </Button>
                        <Button size="sm" onClick={() => handleApproveContact(req.patientId, false)}
                          className="flex-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20 text-xs">
                          <X className="w-3 h-3 mr-1" /> প্রত্যাখ্যান
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg text-foreground">{t("dashboardDr.quickActions")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {doctorQuickActions.map((action, i) => (
                    <Link key={i} href={action.href}>
                      <div className="flex flex-col items-center gap-2 p-4 rounded-2xl glass hover:border-[#F96801]/20 transition-all cursor-pointer group">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} p-2.5 shadow-lg group-hover:scale-110 transition-transform`}>
                          <action.icon className="w-full h-full text-white" />
                        </div>
                        <span className="text-xs font-medium text-center text-foreground">{action.label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg text-foreground">{t("dashboardDr.recentAppointments")}</CardTitle>
                <Link href="/doctor/appointments">
                  <Button variant="ghost" size="sm" className="text-[#F96801] text-sm">{t("dashboard.seeAll")} <ChevronRight className="w-3 h-3 ml-1" /></Button>
                </Link>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl bg-white/[.04]" />)}</div>
                ) : d?.recentAppointments && d.recentAppointments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-muted-foreground text-xs border-b border-white/[.08]">
                          <th className="text-left py-3 px-2">{t("dashboardDr.patientCol")}</th>
                          <th className="text-left py-3 px-2">{t("dashboardDr.timeCol")}</th>
                          <th className="text-left py-3 px-2">{t("dashboardDr.problemCol")}</th>
                          <th className="text-left py-3 px-2">{t("dashboardDr.statusCol")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.recentAppointments.map((apt) => (
                          <tr key={apt.id} className="border-b border-white/[.04] hover:bg-white/[.02]">
                            <td className="py-3 px-2 text-foreground font-medium">{apt.patientName}</td>
                            <td className="py-3 px-2 text-muted-foreground">{new Date(apt.time).toLocaleTimeString("bn", { hour: "2-digit", minute: "2-digit" })}</td>
                            <td className="py-3 px-2 text-muted-foreground">{apt.problem}</td>
                            <td className="py-3 px-2">
                              <Badge className={`text-xs ${statusColor[apt.status] || "bg-white/[.06] text-muted-foreground"}`}>{apt.status}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">{t("dashboardDr.noAppointments")}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg text-foreground flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#F96801]" /> {t("dashboardDr.weeklyChart")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="day" stroke="#A5ABB0" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#A5ABB0" tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: "#0a0d16", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }} labelStyle={{ color: "#EFF2F2" }} />
                      <Line type="monotone" dataKey="appointments" stroke="#F96801" strokeWidth={2} dot={{ fill: "#F96801" }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="glass">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg text-foreground">{t("dashboardDr.emergencyPatients")}</CardTitle>
                <Link href="/doctor/emergency">
                  <Button variant="ghost" size="sm" className="text-[#F96801] text-sm">{t("dashboard.seeAll")} <ChevronRight className="w-3 h-3 ml-1" /></Button>
                </Link>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-16 w-full rounded-xl bg-white/[.04]" />
                ) : d?.emergencyPatients && d.emergencyPatients.length > 0 ? (
                  <div className="space-y-3">
                    {d.emergencyPatients.slice(0, 3).map((ep) => (
                      <div key={ep.id} className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                          <Ambulance className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{ep.patientName}</p>
                          <p className="text-xs text-muted-foreground truncate">{ep.message || t("dashboardDr.emergencyHelp")}</p>
                        </div>
                        {ep.phone && (
                          <a href={`tel:${ep.phone}`}>
                            <Button variant="outline" size="sm" className="rounded-xl text-xs border-red-500/30 text-red-400 h-8 w-8 p-0">
                              <PhoneCall className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">{t("dashboardDr.noEmergency")}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg text-foreground">{t("dashboardDr.recentPrescriptions")}</CardTitle>
                <Link href="/doctor/prescriptions">
                  <Button variant="ghost" size="sm" className="text-[#F96801] text-sm">{t("dashboard.seeAll")} <ChevronRight className="w-3 h-3 ml-1" /></Button>
                </Link>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-16 w-full rounded-xl bg-white/[.04]" />
                ) : d?.recentPrescriptions && d.recentPrescriptions.length > 0 ? (
                  <div className="space-y-3">
                    {d.recentPrescriptions.slice(0, 4).map((p) => (
                      <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[.04]">
                        <div className="w-10 h-10 rounded-xl bg-[#25C2C3]/20 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-[#25C2C3]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{p.patientName}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.diagnosis || t("common.noData")} • {t("patients.prescriptionCount").replace("{n}", String(p.medicinesCount))}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString("bn", { day: "numeric", month: "short" })}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">{t("dashboardDr.noPrescriptions")}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Link href="/doctor/emergency">
              <div className="p-6 rounded-2xl gradient-danger text-white shadow-lg cursor-pointer hover:scale-[1.02] transition-transform">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="w-6 h-6" />
                  <h3 className="font-bold text-lg">{t("dashboardDr.emergencyHelp")}</h3>
                </div>
                <p className="text-white/80 text-sm">{t("dashboardDr.emergencyHelpDesc")}</p>
              </div>
            </Link>
          </div>
        </div>
      </motion.div>
    )
  }

  const patientData = data as DashboardData | null
  const adherenceColor = patientData?.adherence
    ? patientData.adherence >= 80 ? "text-emerald-500" : patientData.adherence >= 50 ? "text-amber-500" : "text-red-500"
    : "text-gray-400"
  const adherenceBg = patientData?.adherence
    ? patientData.adherence >= 80 ? "bg-emerald-500" : patientData.adherence >= 50 ? "bg-amber-500" : "bg-red-500"
    : "bg-gray-400"

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">{t("dashboard.welcome").replace("{name}", session?.user?.name || t("profile.user"))}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t("dashboard.patientSummary")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/medicines?add=true">
            <Button className="rounded-full gradient-primary text-white shadow-md shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" /> {t("dashboard.newMedicine")}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { label: t("dashboard.activeMedicines"), value: patientData?.activeMedicines ?? 0, icon: Pill, color: "from-blue-500 to-blue-600", iconBg: "bg-blue-500/20", iconColor: "text-blue-400" },
          { label: t("dashboard.adherence"), value: patientData ? `${patientData.adherence}%` : "0%", icon: TrendingUp, color: "from-emerald-500 to-emerald-600", iconBg: "bg-emerald-500/20", iconColor: `text-emerald-400 ${adherenceColor}` },
          { label: t("dashboard.todayReminders"), value: patientData?.todayLogs?.length ?? 0, icon: Bell, color: "from-amber-500 to-amber-600", iconBg: "bg-amber-500/20", iconColor: "text-amber-400" },
          { label: t("dashboard.upcoming"), value: patientData?.upcomingAppointments?.length ?? 0, icon: Calendar, color: "from-rose-500 to-rose-600", iconBg: "bg-rose-500/20", iconColor: "text-rose-400" },
        ].map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * (i + 1) }}>
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                    <p className={`text-3xl font-bold mt-1 ${typeof card.value === "string" ? card.value.includes("%") ? adherenceColor : "" : ""}`}>
                      {loading ? <Skeleton className="h-8 w-16" /> : card.value}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center`}>
                    <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">{t("dashboard.quickActions")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {patientQuickActions.filter(a => a.roles.includes(role)).map((action, i) => (
                    <Link key={i} href={action.href}>
                      <div className="flex flex-col items-center gap-2 p-4 rounded-2xl glass hover:border-[#F96801]/20 transition-all cursor-pointer group">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} p-2.5 shadow-lg group-hover:scale-110 transition-transform`}>
                          <action.icon className="w-full h-full text-white" />
                        </div>
                        <span className="text-xs font-medium text-center">{action.label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">{t("dashboard.todayMedicines")}</CardTitle>
                <Link href="/medicines">
                  <Button variant="ghost" size="sm" className="text-primary text-sm">{t("dashboard.viewAll")} <ChevronRight className="w-3 h-3 ml-1" /></Button>
                </Link>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
                ) : patientData?.todayLogs && patientData.todayLogs.length > 0 ? (
                  <div className="space-y-3">
                    {patientData.todayLogs.slice(0, 5).map(log => (
                      <div key={log.id} className="flex items-center justify-between p-4 rounded-xl glass">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${log.status === "TAKEN" ? "bg-emerald-500" : log.status === "SKIPPED" ? "bg-red-500" : "bg-amber-500"}`} />
                          <div>
                            <p className="font-medium text-sm">{log.medicine?.name || "Medicine"}</p>
                            <p className="text-xs text-gray-500">{log.scheduledTime}</p>
                          </div>
                        </div>
                        <Badge variant={log.status === "TAKEN" ? "default" : log.status === "SKIPPED" ? "destructive" : "secondary"} className="text-xs">
                          {log.status === "TAKEN" ? t("dashboard.taken") : log.status === "SKIPPED" ? t("dashboard.skipped") : t("dashboard.pending")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">{t("dashboard.noMedicinesToday")}</p>
                    <Link href="/medicines?add=true">
                      <Button variant="outline" size="sm" className="mt-3 rounded-full"><Plus className="w-4 h-4 mr-1" /> {t("dashboard.addMedicine")}</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{t("dashboard.adherenceScore")}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                {loading ? <Skeleton className="h-32 w-32 rounded-full mx-auto" /> : (
                  <>
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-gray-200 dark:text-gray-800" strokeWidth="8" />
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className={adherenceBg} strokeWidth="8" strokeDasharray={`${2 * Math.PI * 45}`} strokeDashoffset={`${2 * Math.PI * 45 * (1 - (patientData?.adherence || 0) / 100)}`} strokeLinecap="round" transform="rotate(-90 50 50)" />
                        <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold" fill="currentColor">{patientData?.adherence || 0}%</text>
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t("dashboard.last30Days")}</p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">{t("dashboard.upcomingAppointments")}</CardTitle>
                <Link href="/appointments"><Button variant="ghost" size="sm" className="text-primary text-sm">{t("dashboard.seeAll")} <ChevronRight className="w-3 h-3 ml-1" /></Button></Link>
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-16 w-full rounded-xl" /> : patientData?.upcomingAppointments && patientData.upcomingAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {patientData.upcomingAppointments.slice(0, 3).map(apt => (
                      <div key={apt.id} className="flex items-center gap-3 p-3 rounded-xl glass">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{apt.doctorName}</p>
                          <p className="text-xs text-gray-500 truncate">{apt.specialty}</p>
                        </div>
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {new Date(apt.date).toLocaleDateString("bn", { day: "numeric", month: "short" })}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">{t("dashboard.noAppointments")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {role === "PATIENT" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
              <Link href="/sos">
                <div className="p-6 rounded-2xl gradient-danger text-white shadow-lg cursor-pointer hover:scale-[1.02] transition-transform">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="w-6 h-6" />
                    <h3 className="font-bold text-lg">{t("dashboard.sosBtn")}</h3>
                  </div>
                  <p className="text-white/80 text-sm">{t("dashboard.sosHelp")}</p>
                </div>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
