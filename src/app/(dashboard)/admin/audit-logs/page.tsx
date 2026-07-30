"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { ChevronLeft, ChevronRight, ClipboardList } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId: string | null
  details: any
  adminName: string | null
  adminEmail: string | null
  createdAt: string
}

const actionColors: Record<string, string> = {
  PASSWORD_RESET: "bg-red-500/20 text-red-400 border-red-500/20",
  DELETE: "bg-red-500/20 text-red-400 border-red-500/20",
  ROLE_CHANGE: "bg-yellow-500/20 text-yellow-400 border-yellow-500/20",
  CREATE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
  UPDATE: "bg-blue-500/20 text-blue-400 border-blue-500/20",
}

export default function AdminAuditLogsPage() {
  const { data: session, status } = useSession()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const limit = 15

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user?.role !== "ADMIN") redirect("/dashboard")
  }, [session, status])

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/audit-logs?page=${page}&limit=${limit}`)
      if (!res.ok) throw new Error("Failed")
      const d = await res.json()
      setLogs(d.logs || [])
      setTotal(d.total || 0)
    } catch {
      toast.error("অডিট লগ লোড করতে সমস্যা")
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const totalPages = Math.ceil(total / limit)

  if (status === "loading" || !session || session.user?.role !== "ADMIN") {
    if (status === "loading") return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-2 border-[#F96801] border-t-transparent rounded-full animate-spin" /></div>
    return null
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">অডিট লগ</h2>
        <p className="text-muted-foreground mt-1">সব প্রশাসনিক কার্যকলাপের লগ</p>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#F96801]" />
            অডিট লগসমূহ ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl bg-white/[.04]" />)}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">কোনো অডিট লগ নেই</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log, i) => (
                <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                  className="flex items-center justify-between p-4 rounded-xl glass border-white/[.06] hover:border-white/[.12] transition-all">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Badge className={`text-xs ${actionColors[log.action] || "bg-white/[.06] text-muted-foreground"}`}>
                      {log.action}
                    </Badge>
                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-1">
                      <p className="text-sm text-foreground truncate">{log.entityType}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">{log.entityId || "—"}</p>
                      <div className="text-xs text-muted-foreground truncate">
                        <span>{log.adminName || "—"}</span>
                        {log.adminEmail && <span className="ml-1">({log.adminEmail})</span>}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2 flex-shrink-0">
                    {new Date(log.createdAt).toLocaleString("bn")}
                  </span>
                </motion.div>
              ))}
            </div>
          )}

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
        </CardContent>
      </Card>
    </motion.div>
  )
}
