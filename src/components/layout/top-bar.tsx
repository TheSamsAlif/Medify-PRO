"use client"

import { useState, useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Bell, Search, Menu, Loader2, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSession } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/layout/sidebar"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n"

export function TopBar() {
  const { data: session } = useSession()
  const { t } = useI18n()
  const pathname = usePathname()
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  const fetchNotifications = useCallback(async () => {
    setNotifLoading(true)
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch {
      // silent
    } finally {
      setNotifLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "PATCH" })
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch {
      // silent
    }
  }

  const markAllRead = async () => {
    for (const n of notifications.filter(n => !n.read)) {
      await markAsRead(n.id)
    }
    toast.success(t("nav.markAllRead"))
  }

  const formatDate = (d: unknown) => {
    try {
      if (!d) return ""
      const date = new Date(d as string)
      if (isNaN(date.getTime())) return ""
      return date.toLocaleString("bn-BD")
    } catch {
      return ""
    }
  }

  const currentTitle = t("nav.dashboard")

  useEffect(() => {
    setSheetOpen(false)
  }, [pathname])

  return (
    <header className="fixed top-0 left-0 right-0 z-30 lg:pl-64 nav-glass py-1 pt-safe">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger className="lg:hidden rounded-full w-9 h-9 flex items-center justify-center text-[#A5ABB0] hover:text-[#EFF2F2] hover:bg-white/[.06] transition-colors touch-min">
              <Menu className="w-5 h-5" />
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-transparent border-r border-white/[.06] pt-safe">
              <Sidebar mobile onNavClick={() => setSheetOpen(false)} />
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-bold text-[#EFF2F2]">{currentTitle}</h1>
        </div>

        <div className="hidden md:flex items-center flex-1 max-w-sm mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A5ABB0]" />
            <Input
              placeholder={t("nav.search")}
              className="pl-9 h-9 rounded-full bg-white/[.04] border border-white/[.08] text-sm text-[#EFF2F2] placeholder:text-[#A5ABB0] focus:border-[#F96801]/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden rounded-full w-9 h-9 flex items-center justify-center text-[#A5ABB0] hover:text-[#EFF2F2] hover:bg-white/[.06] transition-colors touch-min"
          >
            <Search className="w-4 h-4" />
          </button>
          <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
            <DropdownMenuTrigger className="relative rounded-full w-9 h-9 flex items-center justify-center text-[#A5ABB0] hover:text-[#EFF2F2] hover:bg-white/[.06] transition-colors outline-none">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-[#DE1B2D] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 glass border border-white/[.12] text-[#EFF2F2] max-h-96 overflow-y-auto shadow-2xl">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t("nav.notifications")}</span>
                    {unreadCount > 0 && (
                      <span onClick={markAllRead} className="text-xs text-[#25C2C3] hover:underline cursor-pointer">
                        {t("nav.markAllRead")}
                      </span>
                    )}
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-white/[.06]" />
              {notifLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-[#A5ABB0]" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#A5ABB0]">
                  {t("nav.noNotifications")}
                </div>
              ) : (
                notifications.slice(0, 20).map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    className={`focus:bg-white/[.06] cursor-pointer ${!n.read ? "bg-white/[.03]" : ""}`}
                    onClick={() => {
                      if (!n.read) markAsRead(n.id)
                      const d = n.data as { mapsLink?: string; alertId?: string } | null
                      if (n.type === "SOS" && d?.mapsLink) {
                        window.open(d.mapsLink, "_blank")
                      }
                    }}
                  >
                    <div className="flex items-start gap-3 py-1 w-full">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.read ? "bg-[#2B3856]" : "bg-[#F96801]"}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${n.read ? "text-[#A5ABB0]" : "text-[#EFF2F2] font-medium"}`}>{n.title || ""}</p>
                        <p className="text-xs text-[#A5ABB0] mt-0.5 line-clamp-2">{n.body || ""}</p>
                        <p className="text-[10px] text-[#A5ABB0]/60 mt-1">{formatDate(n.createdAt)}</p>
                      </div>
                      {!n.read && (
                        <span className="text-[#25C2C3] flex-shrink-0 mt-1">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full w-9 h-9 ml-1 flex items-center justify-center outline-none">
                <Avatar className="w-8 h-8 ring-2 ring-[#F96801]/30">
                  <AvatarImage src={session?.user?.image || ""} />
                  <AvatarFallback className="bg-[#F96801]/20 text-[#F96801] text-xs font-medium">
                    {session?.user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass border border-white/[.12] text-[#EFF2F2] shadow-2xl">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{session?.user?.name}</span>
                    <span className="text-xs text-[#A5ABB0]">{session?.user?.email}</span>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-white/[.06]" />
              <DropdownMenuItem className="focus:bg-[#F96801]/12 focus:text-[#F96801]" onClick={() => window.location.href = "/profile"}>
                {t("nav.profile")}
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-[#F96801]/12 focus:text-[#F96801]" onClick={() => window.location.href = "/dashboard"}>
                {t("nav.dashboard")}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/[.06]" />
              <DropdownMenuItem className="text-[#f87171] focus:bg-[#f87171]/12" onClick={() => signOut({ callbackUrl: "/auth/login" })}>
                {t("nav.signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {mobileSearchOpen && (
        <div className="md:hidden px-4 pb-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A5ABB0]" />
            <Input
              placeholder={t("nav.search")}
              className="pl-9 h-10 rounded-full bg-white/[.04] border border-white/[.08] text-sm text-[#EFF2F2] placeholder:text-[#A5ABB0] focus:border-[#F96801]/50 w-full"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  )
}
