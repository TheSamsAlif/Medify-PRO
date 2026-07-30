"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { useSession } from "next-auth/react"
import { Moon, Sun, Monitor, Check, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const themes = [
  { id: "dark", label: "ডার্ক", icon: Moon, desc: "গাঢ় থিম (ডিফল্ট)" },
  { id: "light", label: "লাইট", icon: Sun, desc: "হালকা থিম" },
  { id: "system", label: "সিস্টেম", icon: Monitor, desc: "ডিভাইস সেটিংস অনুসরণ করুন" },
] as const

interface ThemeSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ThemeSettings({ open, onOpenChange }: ThemeSettingsProps) {
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()
  const [saving, setSaving] = useState(false)

  const handleSelect = async (t: string) => {
    setTheme(t)
    setSaving(true)
    try {
      await fetch("/api/profile/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: t }),
      })
    } catch {
      // localStorage is already set by next-themes
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border border-white/[.12] text-[#EFF2F2] max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold gradient-text">অ্যাপের থিম</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          {themes.map((t) => {
            const Icon = t.icon
            const isActive = theme === t.id
            return (
              <button
                key={t.id}
                onClick={() => handleSelect(t.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                  isActive
                    ? "border-[#F96801] bg-[#F96801]/10"
                    : "border-white/[.08] bg-white/[.04] hover:border-white/[.15]"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isActive ? "bg-[#F96801] text-[#160500]" : "bg-white/[.06] text-[#A5ABB0]"
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-[#EFF2F2]">{t.label}</p>
                  <p className="text-xs text-[#A5ABB0]">{t.desc}</p>
                </div>
                {isActive && <Check className="w-5 h-5 text-[#F96801]" />}
              </button>
            )
          })}
        </div>
        <div className="pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full rounded-xl border border-white/[.08] text-[#A5ABB0] hover:text-[#EFF2F2]"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            ঠিক আছে
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
