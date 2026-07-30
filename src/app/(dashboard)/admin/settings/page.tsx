"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Settings as SettingsIcon, Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface Setting {
  key: string
  value: string
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession()
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user?.role !== "ADMIN") redirect("/dashboard")
  }, [session, status])

  useEffect(() => {
    if (status !== "authenticated") return
    setLoading(true)
    fetch("/api/admin/settings")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        const arr = Array.isArray(d) ? d : []
        setSettings(arr)
        const f: Record<string, string> = {}
        arr.forEach((s: Setting) => { f[s.key] = s.value })
        setForm(f)
      })
      .catch(() => toast.error("সেটিংস লোড করতে সমস্যা"))
      .finally(() => setLoading(false))
  }, [status])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: Object.entries(form).map(([key, value]) => ({ key, value })) }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("সেটিংস সংরক্ষিত হয়েছে")
    } catch {
      toast.error("সংরক্ষণ করতে সমস্যা")
    } finally {
      setSaving(false)
    }
  }

  const settingConfig: Record<string, { label: string; type: string; options?: string[] }> = {
    siteName: { label: "সাইটের নাম", type: "text" },
    maintenanceMode: { label: "মেইন্টেন্যান্স মোড", type: "boolean" },
    allowRegistration: { label: "রেজিস্ট্রেশন অনুমতি", type: "boolean" },
    defaultLanguage: { label: "ডিফল্ট ভাষা", type: "text" },
  }

  if (status === "loading" || !session || session.user?.role !== "ADMIN") {
    if (status === "loading") return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-2 border-[#F96801] border-t-transparent rounded-full animate-spin" /></div>
    return null
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">সিস্টেম সেটিংস</h2>
          <p className="text-muted-foreground mt-1">সিস্টেম কনফিগারেশন পরিচালনা করুন</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gradient-primary text-[#160500] rounded-xl">
          {saving ? <span className="w-4 h-4 border-2 border-[#160500] border-t-transparent rounded-full animate-spin mr-2" /> : <Save className="w-4 h-4 mr-1.5" />}
          সংরক্ষণ
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-[#F96801]" />
            কনফিগারেশন
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl bg-white/[.04]" />)}
            </div>
          ) : settings.length === 0 ? (
            <div className="text-center py-8">
              <SettingsIcon className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">কোনো সেটিংস কনফিগার করা হয়নি</p>
            </div>
          ) : (
            <div className="space-y-4">
              {settings.map((setting) => {
                const config = settingConfig[setting.key] || { label: setting.key, type: "text" }
                return (
                  <div key={setting.key} className="flex items-center justify-between p-4 rounded-xl glass border-white/[.06]">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{config.label}</p>
                      <p className="text-xs text-muted-foreground font-mono">{setting.key}</p>
                    </div>
                    {config.type === "boolean" ? (
                      <Switch
                        checked={form[setting.key] === "true"}
                        onCheckedChange={v => setForm(p => ({ ...p, [setting.key]: String(v) }))}
                      />
                    ) : (
                      <Input
                        value={form[setting.key] || ""}
                        onChange={e => setForm(p => ({ ...p, [setting.key]: e.target.value }))}
                        className="glass border-white/[.08] text-foreground max-w-[200px] text-sm"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
