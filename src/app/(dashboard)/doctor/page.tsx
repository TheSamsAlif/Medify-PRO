"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Stethoscope, Users, Calendar, Pill, AlertTriangle, Clock, CheckCircle2, Activity, TrendingUp, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useI18n } from "@/lib/i18n"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import Link from "next/link"

export default function DoctorDashboard() {
  const { t } = useI18n()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/doctor/dashboard").then(r => r.ok && r.json()).then(d => setStats(d)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 bg-white/[.04]" />
        <div className="grid md:grid-cols-3 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl bg-white/[.04]" />)}
        </div>
      </div>
    )
  }

  const statCards = [
    { icon: Calendar, label: t("doctor.todayAppointments"), value: stats?.todayAppointments ?? 0, color: "from-[#F96801] to-[#FF8A1E]", href: "/doctor/appointments" },
    { icon: Users, label: t("doctor.totalPatients"), value: stats?.totalPatients ?? 0, color: "from-[#25C2C3] to-teal-500", href: "/doctor/patients" },
    { icon: Clock, label: t("doctor.pendingPrescriptions"), value: stats?.pendingPrescriptions ?? 0, color: "from-amber-500 to-orange-500", href: "/doctor/prescriptions" },
    { icon: AlertTriangle, label: t("doctor.emergencyAlerts"), value: stats?.emergencyCases ?? 0, color: "from-red-500 to-rose-600", href: "/doctor/emergency" },
    { icon: CheckCircle2, label: t("doctor.completedAppointments"), value: stats?.completedAppointments ?? 0, color: "from-emerald-500 to-green-600", href: "/doctor/appointments" },
    { icon: Activity, label: "আগামী অ্যাপয়েন্টমেন্ট", value: stats?.upcomingAppointments ?? 0, color: "from-violet-500 to-purple-600", href: "/doctor/appointments" },
    { icon: TrendingUp, label: "রোগী সন্তুষ্টি", value: stats?.satisfaction ? `${stats.satisfaction}%` : "-", color: "from-pink-500 to-rose-600", href: "/doctor/appointments" },
  ]

  const weeklyData = stats?.weeklyStats?.labels?.map((label: string, i: number) => ({
    day: label, appointments: stats.weeklyStats.data[i] || 0,
  })) || []

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#EFF2F2]">{t("doctor.title")}</h2>
          <p className="text-[#A5ABB0] mt-1">{t("doctor.subtitle")}</p>
        </div>
        <Link href="/doctor/patients">
          <Button className="gradient-primary text-[#160500] rounded-xl">
            <Users className="w-4 h-4 mr-1.5" /> {t("doctor.addPatient")}
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
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
                  <Tooltip
                    contentStyle={{ background: "#0a0d16", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}
                    labelStyle={{ color: "#EFF2F2" }}
                  />
                  <Line type="monotone" dataKey="appointments" stroke="#F96801" strokeWidth={2} dot={{ fill: "#F96801" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-white/[.08] bg-[#0a0d16]">
          <CardHeader>
            <CardTitle className="text-lg text-[#EFF2F2] flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-[#25C2C3]" /> দ্রুত অ্যাকশন
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { icon: Users, label: "নতুন রোগী যুক্ত করুন", href: "/doctor/patients", color: "text-[#F96801]" },
              { icon: Pill, label: "প্রেসক্রিপশন তৈরি করুন", href: "/doctor/prescriptions", color: "text-[#25C2C3]" },
              { icon: Calendar, label: "অ্যাপয়েন্টমেন্ট দেখুন", href: "/doctor/appointments", color: "text-amber-400" },
              { icon: AlertTriangle, label: "জরুরি কেস", href: "/doctor/emergency", color: "text-red-400" },
            ].map((action, i) => (
              <Link key={i} href={action.href}>
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[.04] transition-colors cursor-pointer">
                  <div className={`w-9 h-9 rounded-xl bg-white/[.06] flex items-center justify-center ${action.color}`}>
                    <action.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-[#EFF2F2] flex-1">{action.label}</span>
                  <ChevronRight className="w-4 h-4 text-[#A5ABB0]" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border border-white/[.08] bg-[#0a0d16]">
        <CardHeader>
          <CardTitle className="text-lg text-[#EFF2F2]">{t("doctor.tabAppointments")}</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.statusBreakdown ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(stats.statusBreakdown).map(([status, count]: [string, any]) => (
                <div key={status} className="p-3 rounded-xl bg-white/[.04] border border-white/[.08] text-center">
                  <p className="text-2xl font-bold text-[#EFF2F2]">{count as number}</p>
                  <p className="text-xs text-[#A5ABB0] mt-1">{status}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#A5ABB0] text-sm text-center py-4">কোনো ডেটা নেই</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
