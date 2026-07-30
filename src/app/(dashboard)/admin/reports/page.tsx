"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { BarChart3, Users, Stethoscope, Heart, Shield, TrendingUp, Calendar, Activity, Pill } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

export default function AdminReportsPage() {
  const { data: session, status } = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user?.role !== "ADMIN") redirect("/dashboard")
  }, [session, status])

  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/admin/dashboard")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setData(d))
      .catch(() => toast.error("রিপোর্ট ডাটা লোড করতে সমস্যা"))
      .finally(() => setLoading(false))
  }, [status])

  if (status === "loading" || !session || session.user?.role !== "ADMIN") {
    if (status === "loading") return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-2 border-[#F96801] border-t-transparent rounded-full animate-spin" /></div>
    return null
  }

  const sections = [
    {
      title: "ব্যবহারকারী রিপোর্ট",
      icon: Users,
      stats: [
        { label: "মোট রোগী", value: data?.totalPatients ?? 0, icon: Users, color: "from-blue-500 to-blue-600", bg: "bg-blue-500/20" },
        { label: "মোট অভিভাবক", value: data?.totalGuardians ?? 0, icon: Heart, color: "from-sky-400 to-sky-500", bg: "bg-sky-400/20" },
        { label: "মোট ডাক্তার", value: data?.totalDoctors ?? 0, icon: Stethoscope, color: "from-red-500 to-red-600", bg: "bg-red-500/20" },
        { label: "মোট এডমিন", value: data?.totalAdmins ?? 0, icon: Shield, color: "from-purple-500 to-purple-600", bg: "bg-purple-500/20" },
        { label: "সক্রিয় ব্যবহারকারী", value: data?.activeUsers ?? 0, icon: TrendingUp, color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-500/20" },
      ],
    },
    {
      title: "সিস্টেম অ্যাক্টিভিটি",
      icon: Activity,
      stats: [
        { label: "আজকের অ্যাপয়েন্টমেন্ট", value: data?.todayAppointments ?? 0, icon: Calendar, color: "from-orange-500 to-orange-600", bg: "bg-orange-500/20" },
        { label: "AI ব্যবহার", value: data?.aiUsage ?? 0, icon: Activity, color: "from-violet-500 to-violet-600", bg: "bg-violet-500/20" },
        { label: "সিস্টেম স্ট্যাটাস", value: data?.systemStatus ?? "সক্রিয়", icon: Activity, color: "from-green-500 to-green-600", bg: "bg-green-500/20" },
      ],
    },
    {
      title: "প্রেসক্রিপশন পরিসংখ্যান",
      icon: Pill,
      stats: [
        { label: "মোট প্রেসক্রিপশন", value: data?.prescriptions ?? 0, icon: Pill, color: "from-teal-500 to-teal-600", bg: "bg-teal-500/20" },
        { label: "একটিভ প্রেসক্রিপশন", value: "—", icon: Pill, color: "from-cyan-500 to-cyan-600", bg: "bg-cyan-500/20" },
        { label: "ডিজিটাল প্রেসক্রিপশন", value: "—", icon: Pill, color: "from-indigo-500 to-indigo-600", bg: "bg-indigo-500/20" },
      ],
    },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">রিপোর্ট</h2>
        <p className="text-muted-foreground mt-1">সিস্টেমের বিভিন্ন পরিসংখ্যান ও রিপোর্ট</p>
      </div>

      {sections.map((section, si) => (
        <motion.div key={si} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.1 }} className="mb-6">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <section.icon className="w-5 h-5 text-[#F96801]" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {section.stats.map((stat, i) => (
                  <div key={i} className={`p-4 rounded-2xl ${stat.bg} border border-white/[.06]`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} p-2.5 flex items-center justify-center`}>
                        <stat.icon className="w-5 h-5 text-[#160500]" />
                      </div>
                      <div>
                        {loading ? <Skeleton className="h-6 w-12 bg-white/[.06]" /> : <p className="text-xl font-bold text-foreground">{stat.value}</p>}
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      <Card className="glass-card">
        <CardContent className="p-6 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">বিস্তারিত চার্ট ও গ্রাফ শীঘ্রই আসছে</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
