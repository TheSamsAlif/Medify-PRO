"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { HardDrive, Download, RefreshCw, Database, Clock, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function AdminBackupPage() {
  const { data: session, status } = useSession()
  const [backupData, setBackupData] = useState<any>(null)
  const [backing, setBacking] = useState(false)
  const [backupTime, setBackupTime] = useState<string | null>(null)

  if (status === "loading") return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-2 border-[#F96801] border-t-transparent rounded-full animate-spin" /></div>
  if (!session || session.user?.role !== "ADMIN") { redirect("/dashboard"); return null }

  const handleBackup = async () => {
    setBacking(true)
    try {
      const res = await fetch("/api/admin/backup", { method: "POST" })
      if (!res.ok) throw new Error("Failed")
      const d = await res.json()
      setBackupData(d)
      setBackupTime(new Date().toLocaleString("bn"))
      toast.success("ব্যাকআপ সফল হয়েছে")
    } catch {
      toast.error("ব্যাকআপ নিতে সমস্যা")
    } finally {
      setBacking(false)
    }
  }

  const handleDownloadJSON = () => {
    if (!backupData) return
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `medify-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("JSON ডাউনলোড শুরু হয়েছে")
  }

  const summaryCards = backupData ? [
    { label: "মোট ব্যবহারকারী", value: backupData.totalUsers ?? "—", icon: Database },
    { label: "মোট রোগী", value: backupData.totalPatients ?? "—", icon: Database },
    { label: "মোট প্রেসক্রিপশন", value: backupData.totalPrescriptions ?? "—", icon: Database },
    { label: "মোট অ্যাপয়েন্টমেন্ট", value: backupData.totalAppointments ?? "—", icon: Database },
  ] : []

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">ব্যাকআপ ও রিস্টোর</h2>
          <p className="text-muted-foreground mt-1">ডাটাবেস ব্যাকআপ ও পুনরুদ্ধার</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleBackup} disabled={backing} className="gradient-primary text-[#160500] rounded-xl">
            {backing ? <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> : <HardDrive className="w-4 h-4 mr-1.5" />}
            {backing ? "ব্যাকআপ হচ্ছে..." : "ব্যাকআপ নিন"}
          </Button>
          {backupData && (
            <Button onClick={handleDownloadJSON} variant="outline" className="rounded-xl border-white/[.08] text-foreground">
              <Download className="w-4 h-4 mr-1.5" /> ডাউনলোড JSON
            </Button>
          )}
        </div>
      </div>

      <Card className="glass-card mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 p-3 flex items-center justify-center">
              <HardDrive className="w-8 h-8 text-[#160500]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">ডাটাবেস ব্যাকআপ</h3>
              <p className="text-sm text-muted-foreground">সম্পূর্ণ ডাটাবেসের স্ন্যাপশট নিন</p>
            </div>
          </div>
          {backupTime && (
            <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 rounded-xl px-3 py-2 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
              শেষ ব্যাকআপ: {backupTime}
            </div>
          )}
        </CardContent>
      </Card>

      {backupData && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {summaryCards.map((card, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="glass-card">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 p-2.5 flex items-center justify-center">
                      <card.icon className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-foreground">{card.value}</p>
                      <p className="text-xs text-muted-foreground">{card.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-[#F96801]" />
            রিস্টোর
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">রিস্টোর ফিচার শীঘ্রই আসছে। বর্তমানে আপনি ব্যাকআপ নিতে ও JSON ডাউনলোড করতে পারেন।</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
