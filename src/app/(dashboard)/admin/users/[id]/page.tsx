"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { redirect, useParams } from "next/navigation"
import { ArrowLeft, Pencil, Lock, Trash2, Save, X, Check, Eye, EyeOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { toast } from "sonner"

interface UserDetail {
  id: string
  name: string | null
  email: string | null
  role: string
  phone: string | null
  age: number | null
  gender: string | null
  bloodGroup: string | null
  isAvailable: boolean
  createdAt: string
  updatedAt: string
}

interface AuditLogEntry {
  id: string
  action: string
  entityType: string
  entityId: string | null
  details: any
  adminName: string | null
  createdAt: string
}

const roleLabels: Record<string, string> = {
  PATIENT: "রোগী", GUARDIAN: "অভিভাবক", DOCTOR: "ডাক্তার", ADMIN: "এডমিন",
}

const roleGradients: Record<string, string> = {
  PATIENT: "from-blue-500 to-blue-600",
  GUARDIAN: "from-sky-400 to-sky-500",
  DOCTOR: "from-red-500 to-red-600",
  ADMIN: "from-purple-500 to-purple-600",
}

export default function AdminUserDetailPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const id = params.id as string

  const [user, setUser] = useState<UserDetail | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", role: "", bloodGroup: "", age: "", gender: "" })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user?.role !== "ADMIN") redirect("/dashboard")
  }, [session, status])

  useEffect(() => {
    if (!id || status !== "authenticated") return
    setLoading(true)
    Promise.all([
      fetch(`/api/admin/users/${id}`).then(r => r.ok ? r.json() : Promise.reject()),
      fetch(`/api/admin/audit-logs?page=1&limit=20`).then(r => r.ok ? r.json() : Promise.reject()),
    ]).then(([uData, aData]) => {
      setUser(uData)
      const logs = (aData.logs || []).filter((l: AuditLogEntry) => l.entityId === id)
      setAuditLogs(logs)
      setFormData({
        name: uData.name || "",
        email: uData.email || "",
        phone: uData.phone || "",
        role: uData.role || "",
        bloodGroup: uData.bloodGroup || "",
        age: String(uData.age || ""),
        gender: uData.gender || "",
      })
    }).catch(() => toast.error("ব্যবহারকারী তথ্য লোড করতে সমস্যা"))
    .finally(() => setLoading(false))
  }, [id, status])

  if (status === "loading" || !session || session.user?.role !== "ADMIN") {
    if (status === "loading") return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-2 border-[#F96801] border-t-transparent rounded-full animate-spin" /></div>
    return null
  }

  const handleUpdate = async () => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name, email: formData.email, phone: formData.phone,
          role: formData.role, bloodGroup: formData.bloodGroup,
          age: formData.age ? Number(formData.age) : null, gender: formData.gender,
        }),
      })
      if (!res.ok) throw new Error("Failed")
      const updated = await res.json()
      setUser(prev => prev ? { ...prev, ...updated } : prev)
      toast.success("আপডেট হয়েছে")
      setEditing(false)
    } catch {
      toast.error("আপডেট করতে সমস্যা")
    } finally {
      setSubmitting(false)
    }
  }

  const handleResetPassword = async () => {
    if (!newPassword) { toast.error("নতুন পাসওয়ার্ড দিন"); return }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/users/${id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("পাসওয়ার্ড রিসেট হয়েছে")
      setResetOpen(false)
      setNewPassword("")
    } catch {
      toast.error("রিসেট করতে সমস্যা")
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!user) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !user.isAvailable }),
      })
      if (!res.ok) throw new Error("Failed")
      setUser(prev => prev ? { ...prev, isAvailable: !prev.isAvailable } : prev)
      toast.success(user.isAvailable ? "নিষ্ক্রিয় করা হয়েছে" : "সক্রিয় করা হয়েছে")
    } catch {
      toast.error("স্ট্যাটাস পরিবর্তন করতে সমস্যা")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`${user?.name || user?.email} কে মুছে ফেলবেন?`)) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      toast.success("মুছে ফেলা হয়েছে")
      redirect("/admin/users")
    } catch {
      toast.error("মুছতে সমস্যা")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-foreground">ব্যবহারকারী প্রোফাইল</h2>
          <p className="text-muted-foreground text-sm">{id}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl bg-white/[.04]" />
          <Skeleton className="h-32 w-full rounded-2xl bg-white/[.04]" />
        </div>
      ) : user ? (
        <>
          <div className="grid gap-6 lg:grid-cols-3 mb-6">
            <div className="lg:col-span-2">
              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg text-foreground">ব্যবহারকারীর তথ্য</CardTitle>
                  <Button onClick={() => setEditing(!editing)} variant="ghost" size="sm" className="text-[#F96801]">
                    <Pencil className="w-4 h-4 mr-1" /> {editing ? "বাতিল" : "সম্পাদনা"}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="w-16 h-16 shadow-lg">
                      <AvatarFallback className={`bg-gradient-to-br ${roleGradients[user.role] || "from-gray-500 to-gray-600"} text-white text-xl font-bold`}>
                        {(user.name || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-lg font-bold text-foreground">{user.name || "—"}</p>
                      <Badge className={`text-xs mt-1 ${
                        user.role === "PATIENT" ? "bg-blue-500/20 text-blue-400" :
                        user.role === "GUARDIAN" ? "bg-sky-400/20 text-sky-400" :
                        user.role === "DOCTOR" ? "bg-red-500/20 text-red-400" : "bg-purple-500/20 text-purple-400"
                      }`}>{roleLabels[user.role] || user.role}</Badge>
                    </div>
                    <div className="ml-auto">
                      <button onClick={handleToggleStatus} disabled={submitting}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-all hover:scale-105 ${
                          user.isAvailable ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-white/[.04] border-white/[.08] text-muted-foreground"
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${user.isAvailable ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground"}`} />
                        {user.isAvailable ? "সক্রিয়" : "নিষ্ক্রিয়"}
                      </button>
                    </div>
                  </div>

                  {editing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Input placeholder="নাম" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="glass border-white/[.08] text-foreground" />
                        <Input placeholder="ইমেইল" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className="glass border-white/[.08] text-foreground" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input placeholder="ফোন" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} className="glass border-white/[.08] text-foreground" />
                        <Select value={formData.role} onValueChange={v => setFormData(p => ({ ...p, role: v || "PATIENT" }))}>
                          <SelectTrigger className="glass border-white/[.08] text-foreground"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PATIENT">রোগী</SelectItem>
                            <SelectItem value="GUARDIAN">অভিভাবক</SelectItem>
                            <SelectItem value="DOCTOR">ডাক্তার</SelectItem>
                            <SelectItem value="ADMIN">এডমিন</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <Input placeholder="বয়স" type="number" value={formData.age} onChange={e => setFormData(p => ({ ...p, age: e.target.value }))} className="glass border-white/[.08] text-foreground" />
                        <Select value={formData.gender} onValueChange={v => setFormData(p => ({ ...p, gender: v || "" }))}>
                          <SelectTrigger className="glass border-white/[.08] text-foreground"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MALE">পুরুষ</SelectItem>
                            <SelectItem value="FEMALE">মহিলা</SelectItem>
                            <SelectItem value="OTHER">অন্যান্য</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input placeholder="ব্লাড গ্রুপ" value={formData.bloodGroup} onChange={e => setFormData(p => ({ ...p, bloodGroup: e.target.value }))} className="glass border-white/[.08] text-foreground" />
                      </div>
                      <Button onClick={handleUpdate} disabled={submitting} className="gradient-primary text-[#160500] rounded-xl">
                        <Save className="w-4 h-4 mr-1.5" /> সংরক্ষণ
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {[
                        { label: "ইমেইল", value: user.email || "—" },
                        { label: "ফোন", value: user.phone || "—" },
                        { label: "বয়স", value: user.age ? `${user.age} বছর` : "—" },
                        { label: "জেন্ডার", value: user.gender === "MALE" ? "পুরুষ" : user.gender === "FEMALE" ? "মহিলা" : user.gender || "—" },
                        { label: "ব্লাড গ্রুপ", value: user.bloodGroup || "—" },
                        { label: "যুক্ত হয়েছে", value: new Date(user.createdAt).toLocaleDateString("bn") },
                      ].map((f, i) => (
                        <div key={i} className="p-3 rounded-xl bg-white/[.04]">
                          <p className="text-xs text-muted-foreground">{f.label}</p>
                          <p className="text-sm font-medium text-foreground mt-0.5">{f.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="glass-card">
                <CardHeader><CardTitle className="text-lg text-foreground">অ্যাকশন</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={() => setResetOpen(true)} className="w-full rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/20">
                    <Lock className="w-4 h-4 mr-1.5" /> পাসওয়ার্ড রিসেট
                  </Button>
                  <button onClick={handleToggleStatus} disabled={submitting}
                    className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-sm cursor-pointer transition-all ${
                      user.isAvailable ? "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                    }`}>
                    {user.isAvailable ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    {user.isAvailable ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
                  </button>
                  <Button onClick={handleDelete} disabled={submitting} className="w-full rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20">
                    <Trash2 className="w-4 h-4 mr-1.5" /> মুছুন
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="glass-card">
            <CardHeader><CardTitle className="text-lg text-foreground">অডিট লগ</CardTitle></CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">কোনো অডিট লগ নেই</p>
              ) : (
                <div className="space-y-2">
                  {auditLogs.map((log, i) => (
                    <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[.04]">
                      <div className="flex items-center gap-3">
                        <Badge className={`text-xs ${
                          log.action === "PASSWORD_RESET" || log.action === "DELETE" ? "bg-red-500/20 text-red-400" :
                          log.action === "ROLE_CHANGE" ? "bg-yellow-500/20 text-yellow-400" :
                          log.action === "CREATE" ? "bg-emerald-500/20 text-emerald-400" :
                          "bg-blue-500/20 text-blue-400"
                        }`}>{log.action}</Badge>
                        <div>
                          <p className="text-xs text-foreground">{log.entityType}</p>
                          {log.entityId && <p className="text-xs text-muted-foreground font-mono">{log.entityId.slice(0, 12)}...</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{log.adminName || "—"}</p>
                        <p className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString("bn")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">ব্যবহারকারী পাওয়া যায়নি</p>
        </div>
      )}

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="dialog-glass sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-foreground">পাসওয়ার্ড রিসেট</DialogTitle></DialogHeader>
          <div className="relative">
            <Input placeholder="নতুন পাসওয়ার্ড" type={showPassword ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="glass border-white/[.08] text-foreground pr-10" />
            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Button onClick={handleResetPassword} disabled={submitting || !newPassword} className="w-full gradient-primary text-[#160500] rounded-xl">
            {submitting ? <span className="w-4 h-4 border-2 border-[#160500] border-t-transparent rounded-full animate-spin mr-2" /> : null}
            রিসেট করুন
          </Button>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
