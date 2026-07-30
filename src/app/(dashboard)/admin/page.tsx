"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Users, Stethoscope, Heart, Shield, Activity, Calendar, Pill, Bot, CheckCircle2, ArrowRight, UserCog, FileText, Bell, Clock, Settings, HardDrive, MessageSquare, BarChart3, Eye } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface DashboardData {
  totalPatients: number
  totalGuardians: number
  totalDoctors: number
  totalAdmins: number
  activeUsers: number
  todayAppointments: number
  prescriptions: number
  aiUsage: number
  systemStatus: string
}

const quickLinks = [
  { icon: UserCog, label: "ব্যবহারকারী ব্যবস্থাপনা", href: "/admin/users", color: "from-blue-500 to-blue-600" },
  { icon: FileText, label: "অডিট লগ", href: "/admin/audit-logs", color: "from-purple-500 to-purple-600" },
  { icon: BarChart3, label: "রিপোর্ট", href: "/admin/reports", color: "from-emerald-500 to-emerald-600" },
  { icon: Bell, label: "নোটিফিকেশন", href: "/admin/notifications", color: "from-amber-500 to-amber-600" },
  { icon: Settings, label: "সেটিংস", href: "/admin/settings", color: "from-sky-500 to-sky-600" },
  { icon: HardDrive, label: "ব্যাকআপ", href: "/admin/backup", color: "from-rose-500 to-rose-600" },
  { icon: MessageSquare, label: "ফিডব্যাক", href: "/admin/feedback", color: "from-teal-500 to-teal-600" },
  { icon: Eye, label: "ভিউ সব", href: "/admin/users", color: "from-orange-500 to-orange-600" },
]

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user?.role !== "ADMIN") redirect("/dashboard")

    fetch("/api/admin/dashboard")
      .then(r => { if (!r.ok) throw new Error("Failed"); return r })
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => toast.error("ড্যাশবোর্ড ডাটা লোড করতে সমস্যা"))
      .finally(() => setLoading(false))
  }, [session, status])

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-2 border-[#F96801] border-t-transparent rounded-full animate-spin" /></div>
  }

  if (!session || session.user?.role !== "ADMIN") return null

  const stats = [
    { icon: Users, label: "মোট রোগী", value: data?.totalPatients ?? 0, color: "from-blue-500 to-blue-600", bg: "bg-blue-500/20" },
    { icon: Heart, label: "মোট অভিভাবক", value: data?.totalGuardians ?? 0, color: "from-sky-400 to-sky-500", bg: "bg-sky-400/20" },
    { icon: Stethoscope, label: "মোট ডাক্তার", value: data?.totalDoctors ?? 0, color: "from-red-500 to-red-600", bg: "bg-red-500/20" },
    { icon: Shield, label: "মোট এডমিন", value: data?.totalAdmins ?? 0, color: "from-purple-500 to-purple-600", bg: "bg-purple-500/20" },
    { icon: Activity, label: "সক্রিয় ব্যবহারকারী", value: data?.activeUsers ?? 0, color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-500/20" },
    { icon: Calendar, label: "আজকের অ্যাপয়েন্টমেন্ট", value: data?.todayAppointments ?? 0, color: "from-orange-500 to-orange-600", bg: "bg-orange-500/20" },
  ]

  const secondaryStats = [
    { icon: Pill, label: "প্রেসক্রিপশন", value: data?.prescriptions ?? 0, color: "from-teal-500 to-teal-600", bg: "bg-teal-500/20" },
    { icon: Bot, label: "AI ব্যবহার", value: data?.aiUsage ?? 0, color: "from-violet-500 to-violet-600", bg: "bg-violet-500/20" },
    { icon: CheckCircle2, label: "সিস্টেম স্ট্যাটাস", value: data?.systemStatus ?? "সক্রিয়", color: data?.systemStatus === "সক্রিয়" ? "from-green-500 to-green-600" : "from-red-500 to-red-600", bg: data?.systemStatus === "সক্রিয়" ? "bg-green-500/20" : "bg-red-500/20" },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">এডমিন ড্যাশবোর্ড</h2>
          <p className="text-muted-foreground mt-1">{session?.user?.name ? `${session.user.name} — স্বাগতম` : "এডমিন প্যানেলে স্বাগতম"}</p>
        </div>
        <Link href="/admin/settings">
          <Button className="gradient-primary text-[#160500] rounded-xl">
            <Settings className="w-4 h-4 mr-1.5" /> সেটিংস
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        {stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="glass-card">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} p-3 flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-[#160500]" />
                  </div>
                  <div className="flex-1">
                    {loading ? <Skeleton className="h-7 w-16 bg-white/[.06]" /> : <p className="text-2xl font-bold text-foreground">{stat.value}</p>}
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {secondaryStats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}>
            <Card className="glass-card">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${stat.bg} p-3 flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color.replace("from-", "text-").split(" ")[0]}`} />
                  </div>
                  <div className="flex-1">
                    {loading ? <Skeleton className="h-7 w-16 bg-white/[.06]" /> : <p className="text-2xl font-bold text-foreground">{stat.value}</p>}
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="glass-card">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">দ্রুত লিংক</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickLinks.map((link, i) => (
                <Link key={i} href={link.href}>
                  <div className="flex flex-col items-center gap-2 p-4 rounded-2xl glass hover:border-[#F96801]/20 transition-all cursor-pointer group">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} p-2.5 shadow-lg group-hover:scale-110 transition-transform`}>
                      <link.icon className="w-full h-full text-white" />
                    </div>
                    <span className="text-xs font-medium text-center text-foreground">{link.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
