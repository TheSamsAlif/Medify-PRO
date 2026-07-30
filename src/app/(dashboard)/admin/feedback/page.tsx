"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { MessageSquare, Star, Reply, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface FeedbackItem {
  id: string
  userName: string | null
  userEmail: string | null
  type: string
  message: string
  rating: number | null
  status: string
  adminReply: string | null
  createdAt: string
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-500/20 text-amber-400 border-amber-500/20",
  REVIEWED: "bg-blue-500/20 text-blue-400 border-blue-500/20",
  RESOLVED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
}

const typeLabels: Record<string, string> = {
  BUG: "বাগ",
  FEATURE: "ফিচার",
  COMPLAINT: "অভিযোগ",
  SUGGESTION: "পরামর্শ",
  OTHER: "অন্যান্য",
}

export default function AdminFeedbackPage() {
  const { data: session, status } = useSession()
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [replyOpen, setReplyOpen] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null)
  const [replyText, setReplyText] = useState("")
  const [replyStatus, setReplyStatus] = useState("REVIEWED")
  const [submitting, setSubmitting] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user?.role !== "ADMIN") redirect("/dashboard")
  }, [session, status])

  const fetchFeedback = async () => {
    setLoading(true)
    try {
      const params = statusFilter ? `?status=${statusFilter}` : ""
      const res = await fetch(`/api/admin/feedback${params}`)
      if (!res.ok) throw new Error("Failed")
      const d = await res.json()
      setFeedbacks(d || [])
    } catch {
      toast.error("ফিডব্যাক লোড করতে সমস্যা")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFeedback() }, [status, statusFilter])

  const openReply = (fb: FeedbackItem) => {
    setSelectedFeedback(fb)
    setReplyText(fb.adminReply || "")
    setReplyStatus(fb.status)
    setReplyOpen(true)
  }

  const handleReply = async () => {
    if (!selectedFeedback) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/feedback", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedFeedback.id, status: replyStatus, adminReply: replyText }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("ফিডব্যাক আপডেট হয়েছে")
      setReplyOpen(false)
      setSelectedFeedback(null)
      fetchFeedback()
    } catch {
      toast.error("আপডেট করতে সমস্যা")
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
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">ফিডব্যাক</h2>
          <p className="text-muted-foreground mt-1">ব্যবহারকারীর ফিডব্যাক ও রিভিউ</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {["", "PENDING", "REVIEWED", "RESOLVED"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              statusFilter === s ? "bg-[#F96801]/20 text-[#F96801] border border-[#F96801]/30" : "glass text-muted-foreground hover:text-foreground border-white/[.08]"
            }`}>
            {s ? (s === "PENDING" ? "পেন্ডিং" : s === "REVIEWED" ? "রিভিউড" : "রিসলভড") : "সব"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          [1,2,3,4].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl bg-white/[.04]" />)
        ) : feedbacks.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">কোনো ফিডব্যাক নেই</p>
            </CardContent>
          </Card>
        ) : (
          feedbacks.map((fb, i) => (
            <motion.div key={fb.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4 cursor-pointer" onClick={() => setExpandedId(expandedId === fb.id ? null : fb.id)}>
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F96801] to-[#FF8A1E] flex items-center justify-center shrink-0">
                      <MessageSquare className="w-5 h-5 text-[#160500]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground">{fb.userName || "অজানা"}</p>
                        <Badge className={`text-xs ${statusColors[fb.status] || "bg-white/[.06] text-muted-foreground"}`}>
                          {fb.status === "PENDING" ? "পেন্ডিং" : fb.status === "REVIEWED" ? "রিভিউড" : "রিসলভড"}
                        </Badge>
                        <Badge className="text-xs bg-white/[.06] text-muted-foreground">
                          {typeLabels[fb.type] || fb.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground mb-1">{fb.message}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{fb.userEmail || "—"}</span>
                        {fb.rating && (
                          <span className="flex items-center gap-1">
                            {Array.from({ length: 5 }, (_, j) => (
                              <Star key={j} className={`w-3 h-3 ${j < fb.rating! ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`} />
                            ))}
                          </span>
                        )}
                        <span>{new Date(fb.createdAt).toLocaleString("bn")}</span>
                      </div>
                      {fb.adminReply && (
                        <div className="mt-2 p-2 rounded-lg bg-white/[.03] border border-white/[.06]">
                          <p className="text-xs text-muted-foreground">প্রশাসকের জবাব:</p>
                          <p className="text-xs text-foreground mt-0.5">{fb.adminReply}</p>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {expandedId === fb.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                  {expandedId === fb.id && (
                    <div className="mt-3 pt-3 border-t border-white/[.06]">
                      <Button onClick={() => openReply(fb)} size="sm" className="rounded-xl bg-[#F96801]/20 text-[#F96801] hover:bg-[#F96801]/30 border border-[#F96801]/20">
                        <Reply className="w-3 h-3 mr-1" /> জবাব দিন
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent className="dialog-glass sm:max-w-md">
          <DialogHeader><DialogTitle className="text-foreground">ফিডব্যাকে জবাব দিন</DialogTitle></DialogHeader>
          {selectedFeedback && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-white/[.04]">
                <p className="text-sm font-medium text-foreground">{selectedFeedback.userName || "অজানা"}</p>
                <p className="text-xs text-muted-foreground mt-1">{selectedFeedback.message}</p>
              </div>
              <div className="flex gap-2">
                {["PENDING", "REVIEWED", "RESOLVED"].map(s => (
                  <button key={s} onClick={() => setReplyStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      replyStatus === s ? "bg-[#F96801]/20 text-[#F96801] border border-[#F96801]/30" : "glass text-muted-foreground border-white/[.08]"
                    }`}>
                    {s === "PENDING" ? "পেন্ডিং" : s === "REVIEWED" ? "রিভিউড" : "রিসলভড"}
                  </button>
                ))}
              </div>
              <Textarea placeholder="আপনার জবাব..." value={replyText} onChange={e => setReplyText(e.target.value)}
                className="glass border-white/[.08] text-foreground min-h-[100px]" />
              <Button onClick={handleReply} disabled={submitting} className="w-full gradient-primary text-[#160500] rounded-xl">
                {submitting ? <span className="w-4 h-4 border-2 border-[#160500] border-t-transparent rounded-full animate-spin mr-2" /> : null}
                সংরক্ষণ
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
