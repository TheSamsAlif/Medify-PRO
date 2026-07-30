"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Bell, Send, Mail, MailOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface NotificationItem {
  id: string
  userId: string
  title: string
  body: string
  type: string
  read: boolean
  createdAt: string
  user?: { name: string | null; email: string | null }
}

export default function AdminNotificationsPage() {
  const { data: session, status } = useSession()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sendOpen, setSendOpen] = useState(false)
  const [formData, setFormData] = useState({ userId: "", title: "", body: "", type: "GENERAL" })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user?.role !== "ADMIN") redirect("/dashboard")
  }, [session, status])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/notifications")
      if (!res.ok) throw new Error("Failed")
      const d = await res.json()
      setNotifications(d.notifications || [])
    } catch {
      toast.error("নোটিফিকেশন লোড করতে সমস্যা")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNotifications() }, [status])

  const handleSend = async () => {
    if (!formData.title || !formData.body) {
      toast.error("টাইটেল ও বডি দিন")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("নোটিফিকেশন পাঠানো হয়েছে")
      setSendOpen(false)
      setFormData({ userId: "", title: "", body: "", type: "GENERAL" })
      fetchNotifications()
    } catch {
      toast.error("পাঠাতে সমস্যা")
    } finally {
      setSubmitting(false)
    }
  }

  if (status === "loading" || !session || session.user?.role !== "ADMIN") {
    if (status === "loading") return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-2 border-[#F96801] border-t-transparent rounded-full animate-spin" /></div>
    return null
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">নোটিফিকেশন</h2>
          <p className="text-muted-foreground mt-1">সব নোটিফিকেশন দেখুন ও পাঠান</p>
        </div>
        <Dialog open={sendOpen} onOpenChange={setSendOpen}>
          <DialogTrigger className="gradient-primary text-[#160500] rounded-xl inline-flex items-center justify-center px-4 py-2 text-sm font-medium">
            <Send className="w-4 h-4 mr-1.5" /> নোটিফিকেশন পাঠান
          </DialogTrigger>
          <DialogContent className="dialog-glass sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">নতুন নোটিফিকেশন</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="ব্যবহারকারী ID (ফাঁকা রেখে সব ব্যবহারকারী)" value={formData.userId}
                onChange={e => setFormData(p => ({ ...p, userId: e.target.value }))} className="glass border-white/[.08] text-foreground" />
              <Select value={formData.type} onValueChange={(v) => setFormData(p => ({ ...p, type: v || "GENERAL" }))}>
                <SelectTrigger className="glass border-white/[.08] text-foreground"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">সাধারণ</SelectItem>
                  <SelectItem value="APPOINTMENT">অ্যাপয়েন্টমেন্ট</SelectItem>
                  <SelectItem value="MEDICINE">ঔষধ</SelectItem>
                  <SelectItem value="ALERT">সতর্কতা</SelectItem>
                  <SelectItem value="PROMOTION">প্রচার</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="টাইটেল" value={formData.title}
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} className="glass border-white/[.08] text-foreground" />
              <Textarea placeholder="বডি" value={formData.body}
                onChange={e => setFormData(p => ({ ...p, body: e.target.value }))} className="glass border-white/[.08] text-foreground min-h-[100px]" />
              <Button onClick={handleSend} disabled={submitting} className="w-full gradient-primary text-[#160500] rounded-xl">
                {submitting ? <span className="w-4 h-4 border-2 border-[#160500] border-t-transparent rounded-full animate-spin mr-2" /> : null}
                পাঠান
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {loading ? (
          [1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl bg-white/[.04]" />)
        ) : notifications.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="text-center py-12">
              <Bell className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">কোনো নোটিফিকেশন নেই</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notif, i) => (
            <motion.div key={notif.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className={`glass-card ${!notif.read ? "border-[#F96801]/20" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      notif.read ? "bg-white/[.04]" : "bg-[#F96801]/20"
                    }`}>
                      {notif.read ? <MailOpen className="w-5 h-5 text-muted-foreground" /> : <Mail className="w-5 h-5 text-[#F96801]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`text-sm font-semibold ${notif.read ? "text-foreground" : "text-[#F96801]"}`}>
                          {notif.title}
                        </p>
                        <Badge className={`text-xs ${
                          notif.type === "ALERT" ? "bg-red-500/20 text-red-400" :
                          notif.type === "APPOINTMENT" ? "bg-blue-500/20 text-blue-400" :
                          notif.type === "MEDICINE" ? "bg-emerald-500/20 text-emerald-400" :
                          "bg-white/[.06] text-muted-foreground"
                        }`}>{notif.type}</Badge>
                        {!notif.read && <span className="w-2 h-2 rounded-full bg-[#F96801] animate-pulse" />}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{notif.body}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>প্রাপক: {notif.user?.name || notif.user?.email || notif.userId.slice(0, 8)}</span>
                        <span>{new Date(notif.createdAt).toLocaleString("bn")}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}
