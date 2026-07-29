"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  Pill, Activity, Heart, Bell, AlertTriangle, Calendar, ChevronRight, Clock, CheckCircle2, XCircle,
  TrendingUp, Droplets, Moon, Zap, Bot, MapPin, PhoneCall, Plus, Scan, Users, Stethoscope,
  Ambulance, FileText, ClipboardList,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { DashboardData, DoctorDashboardData } from "@/types"

const patientQuickActions = [
  { icon: Plus, label: "ওষুধ যোগ", href: "/medicines?add=true", color: "from-blue-400 to-blue-500", roles: ["PATIENT", "GUARDIAN"] },
  { icon: Scan, label: "স্ক্যান করুন", href: "/prescriptions", color: "from-emerald-400 to-emerald-500", roles: ["PATIENT", "DOCTOR"] },
  { icon: Bot, label: "AI সহায়ক", href: "/assistant", color: "from-purple-400 to-purple-500", roles: ["PATIENT", "GUARDIAN", "DOCTOR"] },
  { icon: AlertTriangle, label: "SOS", href: "/sos", color: "from-red-400 to-red-500", roles: ["PATIENT"] },
]

const doctorQuickActions = [
  { icon: Users, label: "নতুন রোগী", href: "/doctor/patients", color: "from-[#F96801] to-[#FF8A1E]" },
  { icon: FileText, label: "প্রেসক্রিপশন", href: "/doctor/prescriptions", color: "from-[#25C2C3] to-teal-500" },
  { icon: Ambulance, label: "জরুরি বিভাগ", href: "/doctor/emergency", color: "from-red-500 to-rose-600" },
  { icon: Activity, label: "হেলথ রেকর্ড", href: "/doctor/records", color: "from-violet-500 to-purple-600" },
  { icon: Calendar, label: "অ্যাপয়েন্টমেন্ট", href: "/doctor/appointments", color: "from-amber-500 to-orange-500" },
]

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const role = (session?.user?.role as string) || "PATIENT"

  useEffect(() => {
    fetch("/api/dashboard").then(r => r.ok && r.json()).then(d => setData(d)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (role === "DOCTOR") {
    const d = data as DoctorDashboardData | null
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
      { icon: AlertTriangle, label: "জরুরি কেস", value: d?.emergencyCases ?? 0, color: "from-red-500 to-rose-600", href: "/doctor/emergency" },
      { icon: CheckCircle2, label: "সম্পন্ন অ্যাপয়েন্টমেন্ট", value: d?.completedAppointments ?? 0, color: "from-emerald-500 to-green-600", href: "/doctor/appointments" },
      { icon: Clock, label: "আগামী অ্যাপয়েন্টমেন্ট", value: d?.upcomingAppointments ?? 0, color: "from-violet-500 to-purple-600", href: "/doctor/appointments" },
    ]

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">ড্যাশবোর্ড</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">ডাক্তার, {session?.user?.name}! আপনার আজকের সারসংক্ষেপ</p>
          </div>
          <Link href="/doctor/patients">
            <Button className="rounded-full gradient-primary text-white shadow-md shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" /> নতুন রোগী যোগ করুন
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl bg-white/[.04]" />)}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {statCards.map((stat, i) => (
              <Link key={i} href={stat.href}>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="border border-white/[.08] bg-[#0a0d16] hover:border-[#F96801]/30 transition-all cursor-pointer">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} p-3 flex items-center justify-center`}>
                          <stat.icon className="w-6 h-6 text-[#160500]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-2xl font-bold text-[#EFF2F2]">{stat.value}</p>
                          <p className="text-sm text-[#A5ABB0]">{stat.label}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#A5ABB0]" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>
            ))}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-white/[.08] bg-[#0a0d16]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg text-[#EFF2F2]">দ্রুত অ্যাকশন</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {doctorQuickActions.map((action, i) => (
                    <Link key={i} href={action.href}>
                      <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer group">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} p-2.5 shadow-lg group-hover:scale-110 transition-transform`}>
                          <action.icon className="w-full h-full text-white" />
                        </div>
                        <span className="text-xs font-medium text-center text-[#EFF2F2]">{action.label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-white/[.08] bg-[#0a0d16]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg text-[#EFF2F2]">সাম্প্রতিক অ্যাপয়েন্টমেন্ট</CardTitle>
                <Link href="/doctor/appointments">
                  <Button variant="ghost" size="sm" className="text-[#F96801] text-sm">সব দেখুন <ChevronRight className="w-3 h-3 ml-1" /></Button>
                </Link>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl bg-white/[.04]" />)}</div>
                ) : d?.recentAppointments && d.recentAppointments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[#A5ABB0] text-xs border-b border-white/[.08]">
                          <th className="text-left py-3 px-2">রোগী</th>
                          <th className="text-left py-3 px-2">সময়</th>
                          <th className="text-left py-3 px-2">বিষয়</th>
                          <th className="text-left py-3 px-2">স্ট্যাটাস</th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.recentAppointments.map((apt) => (
                          <tr key={apt.id} className="border-b border-white/[.04] hover:bg-white/[.02]">
                            <td className="py-3 px-2 text-[#EFF2F2] font-medium">{apt.patientName}</td>
                            <td className="py-3 px-2 text-[#A5ABB0]">{new Date(apt.time).toLocaleTimeString("bn", { hour: "2-digit", minute: "2-digit" })}</td>
                            <td className="py-3 px-2 text-[#A5ABB0]">{apt.problem}</td>
                            <td className="py-3 px-2">
                              <Badge className={`text-xs ${statusColor[apt.status] || "bg-white/[.06] text-[#A5ABB0]"}`}>{apt.status}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-10 h-10 text-[#A5ABB0] mx-auto mb-2" />
                    <p className="text-[#A5ABB0] text-sm">কোনো অ্যাপয়েন্টমেন্ট নেই</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-white/[.08] bg-[#0a0d16]">
              <CardHeader>
                <CardTitle className="text-lg text-[#EFF2F2] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#F96801]" /> সাপ্তাহিক পরিসংখ্যান
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
            <Card className="border border-white/[.08] bg-[#0a0d16]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg text-[#EFF2F2]">জরুরি কেস</CardTitle>
                <Link href="/doctor/emergency">
                  <Button variant="ghost" size="sm" className="text-[#F96801] text-sm">সব <ChevronRight className="w-3 h-3 ml-1" /></Button>
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
                          <p className="text-sm font-medium text-[#EFF2F2] truncate">{ep.patientName}</p>
                          <p className="text-xs text-[#A5ABB0] truncate">{ep.message || "জরুরি অবস্থা"}</p>
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
                    <p className="text-[#A5ABB0] text-sm">কোনো জরুরি কেস নেই</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-white/[.08] bg-[#0a0d16]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg text-[#EFF2F2]">সাম্প্রতিক প্রেসক্রিপশন</CardTitle>
                <Link href="/doctor/prescriptions">
                  <Button variant="ghost" size="sm" className="text-[#F96801] text-sm">সব <ChevronRight className="w-3 h-3 ml-1" /></Button>
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
                          <p className="text-sm font-medium text-[#EFF2F2] truncate">{p.patientName}</p>
                          <p className="text-xs text-[#A5ABB0] truncate">{p.diagnosis || "নির্ণয় নেই"} • {p.medicinesCount}টি ওষুধ</p>
                        </div>
                        <span className="text-xs text-[#A5ABB0] whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString("bn", { day: "numeric", month: "short" })}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <FileText className="w-10 h-10 text-[#A5ABB0] mx-auto mb-2" />
                    <p className="text-[#A5ABB0] text-sm">কোনো প্রেসক্রিপশন নেই</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Link href="/doctor/emergency">
              <div className="p-6 rounded-2xl gradient-danger text-white shadow-lg cursor-pointer hover:scale-[1.02] transition-transform">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="w-6 h-6" />
                  <h3 className="font-bold text-lg">জরুরি সাহায্য</h3>
                </div>
                <p className="text-white/80 text-sm">দ্রুত জরুরি রোগীদের দেখুন</p>
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
          <h2 className="text-2xl md:text-3xl font-bold">স্বাগতম, {session?.user?.name || "ব্যবহারকারী"}!</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">আপনার আজকের স্বাস্থ্য সারসংক্ষেপ</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/medicines?add=true">
            <Button className="rounded-full gradient-primary text-white shadow-md shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" /> নতুন ওষুধ
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { label: "সক্রিয় ওষুধ", value: patientData?.activeMedicines ?? 0, icon: Pill, color: "from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-950", iconBg: "bg-blue-100 dark:bg-blue-900/30", iconColor: "text-blue-600 dark:text-blue-400" },
          { label: "আদারেন্স", value: patientData ? `${patientData.adherence}%` : "0%", icon: TrendingUp, color: "from-emerald-50 to-white dark:from-emerald-950/20 dark:to-gray-950", iconBg: "bg-emerald-100 dark:bg-emerald-900/30", iconColor: `text-emerald-600 dark:text-emerald-400 ${adherenceColor}` },
          { label: "আজকের রিমাইন্ডার", value: patientData?.todayLogs?.length ?? 0, icon: Bell, color: "from-amber-50 to-white dark:from-amber-950/20 dark:to-gray-950", iconBg: "bg-amber-100 dark:bg-amber-900/30", iconColor: "text-amber-600 dark:text-amber-400" },
          { label: "আপকামিং", value: patientData?.upcomingAppointments?.length ?? 0, icon: Calendar, color: "from-rose-50 to-white dark:from-rose-950/20 dark:to-gray-950", iconBg: "bg-rose-100 dark:bg-rose-900/30", iconColor: "text-rose-600 dark:text-rose-400" },
        ].map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * (i + 1) }}>
            <Card className="border-0 shadow-lg shadow-black/5 bg-gradient-to-br {card.color}">
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
            <Card className="border-0 shadow-lg shadow-black/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">দ্রুত অ্যাকশন</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {patientQuickActions.filter(a => a.roles.includes(role)).map((action, i) => (
                    <Link key={i} href={action.href}>
                      <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer group">
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
            <Card className="border-0 shadow-lg shadow-black/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">আজকের ওষুধ</CardTitle>
                <Link href="/medicines">
                  <Button variant="ghost" size="sm" className="text-primary text-sm">সব দেখুন <ChevronRight className="w-3 h-3 ml-1" /></Button>
                </Link>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
                ) : patientData?.todayLogs && patientData.todayLogs.length > 0 ? (
                  <div className="space-y-3">
                    {patientData.todayLogs.slice(0, 5).map(log => (
                      <div key={log.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-900">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${log.status === "TAKEN" ? "bg-emerald-500" : log.status === "SKIPPED" ? "bg-red-500" : "bg-amber-500"}`} />
                          <div>
                            <p className="font-medium text-sm">{log.medicine?.name || "Medicine"}</p>
                            <p className="text-xs text-gray-500">{log.scheduledTime}</p>
                          </div>
                        </div>
                        <Badge variant={log.status === "TAKEN" ? "default" : log.status === "SKIPPED" ? "destructive" : "secondary"} className="text-xs">
                          {log.status === "TAKEN" ? "নেওয়া হয়েছে" : log.status === "SKIPPED" ? "বাদ দেওয়া" : "বাকি"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">আজকের জন্য কোনো ওষুধ নেই</p>
                    <Link href="/medicines?add=true">
                      <Button variant="outline" size="sm" className="mt-3 rounded-full"><Plus className="w-4 h-4 mr-1" /> ওষুধ যোগ করুন</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Card className="border-0 shadow-lg shadow-black/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">আদারেন্স স্কোর</CardTitle>
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">গত ৩০ দিনের আদারেন্স</p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <Card className="border-0 shadow-lg shadow-black/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">আসন্ন অ্যাপয়েন্টমেন্ট</CardTitle>
                <Link href="/appointments"><Button variant="ghost" size="sm" className="text-primary text-sm">সব <ChevronRight className="w-3 h-3 ml-1" /></Button></Link>
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-16 w-full rounded-xl" /> : patientData?.upcomingAppointments && patientData.upcomingAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {patientData.upcomingAppointments.slice(0, 3).map(apt => (
                      <div key={apt.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900">
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
                    <p className="text-sm text-gray-500">কোনো অ্যাপয়েন্টমেন্ট নেই</p>
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
                    <h3 className="font-bold text-lg">SOS ইমারজেন্সি</h3>
                  </div>
                  <p className="text-white/80 text-sm">জরুরি অবস্থায় এক ক্লিকে সাহায্য কল করুন</p>
                </div>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
