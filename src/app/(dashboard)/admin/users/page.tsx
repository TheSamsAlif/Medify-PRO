"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Search, Plus, Pencil, Trash2, Lock, Check, X, ChevronLeft, ChevronRight, Filter, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface AdminUser {
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
}

const roleColors: Record<string, string> = {
  PATIENT: "bg-blue-500/20 text-blue-400 border-blue-500/20",
  GUARDIAN: "bg-sky-400/20 text-sky-400 border-sky-400/20",
  DOCTOR: "bg-red-500/20 text-red-400 border-red-500/20",
  ADMIN: "bg-purple-500/20 text-purple-400 border-purple-500/20",
}

const roleGradients: Record<string, string> = {
  PATIENT: "from-blue-500 to-blue-600",
  GUARDIAN: "from-sky-400 to-sky-500",
  DOCTOR: "from-red-500 to-red-600",
  ADMIN: "from-purple-500 to-purple-600",
}

const roleLabels: Record<string, string> = {
  PATIENT: "রোগী",
  GUARDIAN: "অভিভাবক",
  DOCTOR: "ডাক্তার",
  ADMIN: "এডমিন",
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "", role: "PATIENT", bloodGroup: "", age: "", gender: "MALE" })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user?.role !== "ADMIN") redirect("/dashboard")
  }, [session, status])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, roleFilter])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (roleFilter) params.set("role", roleFilter)
      const res = await fetch(`/api/admin/users?${params}`)
      if (!res.ok) throw new Error("Failed")
      const d = await res.json()
      setUsers(d.users || [])
      setTotal(d.total || 0)
    } catch {
      toast.error("ব্যবহারকারী লোড করতে সমস্যা")
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, roleFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const totalPages = Math.ceil(total / limit)

  const handleCreate = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("নাম, ইমেইল ও পাসওয়ার্ড দিন")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, age: formData.age ? Number(formData.age) : null }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("ব্যবহারকারী তৈরি হয়েছে")
      setAddOpen(false)
      setFormData({ name: "", email: "", phone: "", password: "", role: "PATIENT", bloodGroup: "", age: "", gender: "MALE" })
      fetchUsers()
    } catch {
      toast.error("ব্যবহারকারী তৈরি করতে সমস্যা")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedUser) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name, email: formData.email, phone: formData.phone, role: formData.role, bloodGroup: formData.bloodGroup, age: formData.age ? Number(formData.age) : null, gender: formData.gender }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("ব্যবহারকারী আপডেট হয়েছে")
      setEditOpen(false)
      fetchUsers()
    } catch {
      toast.error("আপডেট করতে সমস্যা")
    } finally {
      setSubmitting(false)
    }
  }

  const handleResetPassword = async () => {
    if (!selectedUser) return
    if (!formData.password) { toast.error("নতুন পাসওয়ার্ড দিন"); return }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: formData.password }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("পাসওয়ার্ড রিসেট হয়েছে")
      setResetOpen(false)
      setFormData(prev => ({ ...prev, password: "" }))
    } catch {
      toast.error("পাসওয়ার্ড রিসেট করতে সমস্যা")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      toast.success("ব্যবহারকারী মুছে ফেলা হয়েছে")
      setDeleteOpen(false)
      setSelectedUser(null)
      fetchUsers()
    } catch {
      toast.error("মুছতে সমস্যা")
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (user: AdminUser) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !user.isAvailable }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success(user.isAvailable ? "ব্যবহারকারী নিষ্ক্রিয় হয়েছে" : "ব্যবহারকারী সক্রিয় হয়েছে")
      fetchUsers()
    } catch {
      toast.error("স্ট্যাটাস পরিবর্তন করতে সমস্যা")
    }
  }

  const openEdit = (user: AdminUser) => {
    setSelectedUser(user)
    setFormData({ name: user.name || "", email: user.email || "", phone: user.phone || "", password: "", role: user.role, bloodGroup: user.bloodGroup || "", age: String(user.age || ""), gender: user.gender || "MALE" })
    setEditOpen(true)
  }

  if (status === "loading" || !session || session.user?.role !== "ADMIN") {
    if (status === "loading") return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-2 border-[#F96801] border-t-transparent rounded-full animate-spin" /></div>
    return null
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">ব্যবহারকারী ব্যবস্থাপনা</h2>
          <p className="text-muted-foreground mt-1">সব ব্যবহারকারী দেখুন ও পরিচালনা করুন</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger className="gradient-primary text-[#160500] rounded-xl inline-flex items-center justify-center px-4 py-2 text-sm font-medium">
            <Plus className="w-4 h-4 mr-1.5" /> ব্যবহারকারী যোগ করুন
          </DialogTrigger>
          <DialogContent className="dialog-glass sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">নতুন ব্যবহারকারী</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="নাম" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="glass border-white/[.08] text-foreground" />
              <Input placeholder="ইমেইল" type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className="glass border-white/[.08] text-foreground" />
              <Input placeholder="ফোন" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} className="glass border-white/[.08] text-foreground" />
              <Input placeholder="পাসওয়ার্ড" type="password" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} className="glass border-white/[.08] text-foreground" />
              <div className="grid grid-cols-2 gap-3">
                <Select value={formData.role} onValueChange={v => setFormData(p => ({ ...p, role: v || "PATIENT" }))}>
                <SelectTrigger className="glass border-white/[.08] text-foreground"><SelectValue placeholder="রোল" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PATIENT">রোগী</SelectItem>
                  <SelectItem value="GUARDIAN">অভিভাবক</SelectItem>
                  <SelectItem value="DOCTOR">ডাক্তার</SelectItem>
                  <SelectItem value="ADMIN">এডমিন</SelectItem>
                </SelectContent>
              </Select>
              <Select value={formData.gender} onValueChange={v => setFormData(p => ({ ...p, gender: v || "" }))}>
                  <SelectTrigger className="glass border-white/[.08] text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">পুরুষ</SelectItem>
                    <SelectItem value="FEMALE">মহিলা</SelectItem>
                    <SelectItem value="OTHER">অন্যান্য</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="বয়স" type="number" value={formData.age} onChange={e => setFormData(p => ({ ...p, age: e.target.value }))} className="glass border-white/[.08] text-foreground" />
                <Input placeholder="ব্লাড গ্রুপ" value={formData.bloodGroup} onChange={e => setFormData(p => ({ ...p, bloodGroup: e.target.value }))} className="glass border-white/[.08] text-foreground" />
              </div>
              <Button onClick={handleCreate} disabled={submitting} className="w-full gradient-primary text-[#160500] rounded-xl mt-2">
                {submitting ? <span className="w-4 h-4 border-2 border-[#160500] border-t-transparent rounded-full animate-spin mr-2" /> : null}
                তৈরি করুন
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="ID, নাম, ইমেইল বা ফোন দিয়ে সার্চ..." value={search} onChange={e => setSearch(e.target.value)} className="glass border-white/[.08] text-foreground pl-10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["", "PATIENT", "GUARDIAN", "DOCTOR", "ADMIN"].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                roleFilter === r ? "bg-[#F96801]/20 text-[#F96801] border border-[#F96801]/30" : "glass text-muted-foreground hover:text-foreground border-white/[.08]"
              }`}>
              {r ? roleLabels[r] : "সব"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          [1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl bg-white/[.04]" />)
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">কোনো ব্যবহারকারী পাওয়া যায়নি</p>
          </div>
        ) : (
          users.map((user, i) => (
            <motion.div key={user.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 shadow-lg">
                      <AvatarFallback className={`bg-gradient-to-br ${roleGradients[user.role] || "from-gray-500 to-gray-600"} text-white text-lg font-bold`}>
                        {(user.name || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-1 text-sm">
                      <div>
                        <p className="font-semibold text-foreground truncate">{user.name || "—"}</p>
                        <p className="text-xs text-muted-foreground truncate font-mono">{user.email || "—"}</p>
                      </div>
                      <div>
                        <Badge className={`text-xs ${roleColors[user.role] || "bg-white/[.06] text-muted-foreground"}`}>
                          {roleLabels[user.role] || user.role}
                        </Badge>
                        <p className="text-xs text-muted-foreground font-mono mt-1">{user.id?.slice(0, 8)}...</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">ফোন</p>
                        <p className="text-foreground text-sm">{user.phone || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">যুক্ত হয়েছে</p>
                        <p className="text-foreground text-sm">{new Date(user.createdAt).toLocaleDateString("bn")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleToggleStatus(user)}
                        className={`p-2 rounded-xl text-xs cursor-pointer transition-all hover:scale-105 ${
                          user.isAvailable ? "bg-emerald-500/20 text-emerald-400" : "bg-white/[.04] text-muted-foreground"
                        }`}>
                        {user.isAvailable ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </button>
                      <button onClick={() => openEdit(user)} className="p-2 rounded-xl bg-blue-500/20 text-blue-400 hover:scale-105 transition-all cursor-pointer">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setSelectedUser(user); setResetOpen(true) }} className="p-2 rounded-xl bg-amber-500/20 text-amber-400 hover:scale-105 transition-all cursor-pointer">
                        <Lock className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setSelectedUser(user); setDeleteOpen(true) }} className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:scale-105 transition-all cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 rounded-xl glass border-white/[.08] text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                p === page ? "bg-[#F96801] text-[#160500]" : "glass text-muted-foreground hover:text-foreground border-white/[.08]"
              }`}>
              {p}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-2 rounded-xl glass border-white/[.08] text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="dialog-glass sm:max-w-md">
          <DialogHeader><DialogTitle className="text-foreground">ব্যবহারকারী সম্পাদনা</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="নাম" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="glass border-white/[.08] text-foreground" />
            <Input placeholder="ইমেইল" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className="glass border-white/[.08] text-foreground" />
            <Input placeholder="ফোন" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} className="glass border-white/[.08] text-foreground" />
            <div className="grid grid-cols-2 gap-3">
              <Select value={formData.role} onValueChange={v => setFormData(p => ({ ...p, role: v || "PATIENT" }))}>
                <SelectTrigger className="glass border-white/[.08] text-foreground"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PATIENT">রোগী</SelectItem>
                  <SelectItem value="GUARDIAN">অভিভাবক</SelectItem>
                  <SelectItem value="DOCTOR">ডাক্তার</SelectItem>
                  <SelectItem value="ADMIN">এডমিন</SelectItem>
                </SelectContent>
              </Select>
              <Select value={formData.gender} onValueChange={v => setFormData(p => ({ ...p, gender: v || "" }))}>
                <SelectTrigger className="glass border-white/[.08] text-foreground"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">পুরুষ</SelectItem>
                  <SelectItem value="FEMALE">মহিলা</SelectItem>
                  <SelectItem value="OTHER">অন্যান্য</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="বয়স" type="number" value={formData.age} onChange={e => setFormData(p => ({ ...p, age: e.target.value }))} className="glass border-white/[.08] text-foreground" />
              <Input placeholder="ব্লাড গ্রুপ" value={formData.bloodGroup} onChange={e => setFormData(p => ({ ...p, bloodGroup: e.target.value }))} className="glass border-white/[.08] text-foreground" />
            </div>
            <Button onClick={handleUpdate} disabled={submitting} className="w-full gradient-primary text-[#160500] rounded-xl mt-2">
              {submitting ? <span className="w-4 h-4 border-2 border-[#160500] border-t-transparent rounded-full animate-spin mr-2" /> : null}
              আপডেট করুন
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="dialog-glass sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-foreground">পাসওয়ার্ড রিসেট</DialogTitle></DialogHeader>
          <Input placeholder="নতুন পাসওয়ার্ড" type="password" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} className="glass border-white/[.08] text-foreground" />
          <Button onClick={handleResetPassword} disabled={submitting} className="w-full gradient-primary text-[#160500] rounded-xl">
            {submitting ? <span className="w-4 h-4 border-2 border-[#160500] border-t-transparent rounded-full animate-spin mr-2" /> : null}
            রিসেট করুন
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="dialog-glass sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-foreground">ব্যবহারকারী মুছবেন?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{selectedUser?.name || selectedUser?.email} কে মুছে ফেলা হবে। এটি পূর্বাবস্থায় ফেরানো যাবে না।</p>
          <div className="flex gap-3">
            <Button onClick={() => setDeleteOpen(false)} variant="outline" className="flex-1 rounded-xl">বাতিল</Button>
            <Button onClick={handleDelete} disabled={submitting} className="flex-1 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20">
              {submitting ? <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin mr-2" /> : null}
              মুছুন
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
