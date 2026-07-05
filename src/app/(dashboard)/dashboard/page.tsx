"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  Pill,
  Activity,
  Heart,
  Bell,
  AlertTriangle,
  Calendar,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Droplets,
  Moon,
  Zap,
  Bot,
  MapPin,
  PhoneCall,
  Plus,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { DashboardData, Medicine, Appointment } from "@/types"

const quickActions = [
  { icon: Plus, label: "ওষুধ যোগ", labelEn: "Add Medicine", href: "/medicines?add=true", color: "from-blue-400 to-blue-500" },
  { icon: Scan, label: "স্ক্যান করুন", labelEn: "Scan Prescription", href: "/prescriptions", color: "from-emerald-400 to-emerald-500" },
  { icon: Bot, label: "AI সহায়ক", labelEn: "AI Assistant", href: "/assistant", color: "from-purple-400 to-purple-500" },
  { icon: AlertTriangle, label: "SOS", labelEn: "Emergency", href: "/sos", color: "from-red-400 to-red-500" },
]

import { Scan } from "lucide-react"

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/dashboard")
      const json = await res.json()
      if (res.ok) setData(json)
    } catch (err) {
      console.error("Dashboard fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  const adherenceColor = data?.adherence
    ? data.adherence >= 80 ? "text-emerald-500" : data.adherence >= 50 ? "text-amber-500" : "text-red-500"
    : "text-gray-400"

  const adherenceBg = data?.adherence
    ? data.adherence >= 80 ? "bg-emerald-500" : data.adherence >= 50 ? "bg-amber-500" : "bg-red-500"
    : "bg-gray-400"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">
            স্বাগতম, {session?.user?.name || "ব্যবহারকারী"}!
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            আপনার আজকের স্বাস্থ্য সারসংক্ষেপ
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/medicines?add=true">
            <Button className="rounded-full gradient-primary text-white shadow-md shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" />
              নতুন ওষুধ
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg shadow-black/5 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-950">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">সক্রিয় ওষুধ</p>
                  <p className="text-3xl font-bold mt-1">
                    {loading ? <Skeleton className="h-8 w-16" /> : data?.activeMedicines || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Pill className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg shadow-black/5 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-gray-950">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">আদারেন্স</p>
                  <p className={`text-3xl font-bold mt-1 ${adherenceColor}`}>
                    {loading ? <Skeleton className="h-8 w-16" /> : `${data?.adherence || 0}%`}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg shadow-black/5 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-gray-950">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">আজকের রিমাইন্ডার</p>
                  <p className="text-3xl font-bold mt-1">
                    {loading ? <Skeleton className="h-8 w-16" /> : data?.todayLogs?.length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg shadow-black/5 bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/20 dark:to-gray-950">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">আপকামিং</p>
                  <p className="text-3xl font-bold mt-1">
                    {loading ? <Skeleton className="h-8 w-16" /> : data?.upcomingAppointments?.length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-0 shadow-lg shadow-black/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">দ্রুত অ্যাকশন</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {quickActions.map((action, i) => (
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-0 shadow-lg shadow-black/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">আজকের ওষুধ</CardTitle>
                <Link href="/medicines">
                  <Button variant="ghost" size="sm" className="text-primary text-sm">
                    সব দেখুন <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                  </div>
                ) : data?.todayLogs && data.todayLogs.length > 0 ? (
                  <div className="space-y-3">
                    {data.todayLogs.slice(0, 5).map((log) => (
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
                      <Button variant="outline" size="sm" className="mt-3 rounded-full">
                        <Plus className="w-4 h-4 mr-1" />
                        ওষুধ যোগ করুন
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="border-0 shadow-lg shadow-black/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">আদারেন্স স্কোর</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                {loading ? (
                  <Skeleton className="h-32 w-32 rounded-full mx-auto" />
                ) : (
                  <>
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-gray-200 dark:text-gray-800" strokeWidth="8" />
                        <circle
                          cx="50" cy="50" r="45" fill="none"
                          stroke="currentColor"
                          className={adherenceBg}
                          strokeWidth="8"
                          strokeDasharray={`${2 * Math.PI * 45}`}
                          strokeDashoffset={`${2 * Math.PI * 45 * (1 - (data?.adherence || 0) / 100)}`}
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                        />
                        <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold" fill="currentColor">
                          {data?.adherence || 0}%
                        </text>
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      গত ৩০ দিনের আদারেন্স
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="border-0 shadow-lg shadow-black/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">আসন্ন অ্যাপয়েন্টমেন্ট</CardTitle>
                <Link href="/appointments">
                  <Button variant="ghost" size="sm" className="text-primary text-sm">
                    সব <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-16 w-full rounded-xl" />
                ) : data?.upcomingAppointments && data.upcomingAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {data.upcomingAppointments.slice(0, 3).map((apt) => (
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Link href="/sos">
              <div className="p-6 rounded-2xl gradient-danger text-white shadow-lg cursor-pointer hover:scale-[1.02] transition-transform">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="w-6 h-6" />
                  <h3 className="font-bold text-lg">SOS ইমারজেন্সি</h3>
                </div>
                <p className="text-white/80 text-sm">
                  জরুরি অবস্থায় এক ক্লিকে সাহায্য কল করুন
                </p>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
