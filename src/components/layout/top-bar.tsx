"use client"

import { useState, useEffect, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { Bell, Search, Menu, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/layout/sidebar"
import { toast } from "sonner"

export function TopBar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

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
    toast.success("সব নোটিফিকেশন পড়া হয়েছে")
  }
  const pageTitles: Record<string, string> = {
    "/dashboard": "ড্যাশবোর্ড",
    "/medicines": "ওষুধসমূহ",
    "/prescriptions": "প্রেসক্রিপশন",
    "/assistant": "AI স্বাস্থ্য সহায়ক",
    "/records": "স্বাস্থ্য রেকর্ড",
    "/guardian": "অভিভাবক ড্যাশবোর্ড",
    "/doctor": "ডাক্তার ড্যাশবোর্ড",
    "/appointments": "অ্যাপয়েন্টমেন্ট",
    "/hospitals": "নিকটস্থ হাসপাতাল",
    "/emergency": "জরুরি সেবা",
    "/profile": "প্রোফাইল",
    "/sos": "SOS",
    "/interactions": "ড্রাগ ইন্টারঅ্যাকশন চেকার",
    "/lifestyle": "স্বাস্থ্যকর জীবনযাপন",
  }

  const currentTitle = pageTitles[pathname] || "Medify"

  return (
    <header className="fixed top-0 left-0 right-0 z-30 lg:pl-64 nav-glass">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger>
              <Button variant="ghost" size="icon" className="lg:hidden rounded-full text-[#A5ABB0] hover:text-[#EFF2F2]">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-[#040406] border-r border-white/[.06]">
              <Sidebar />
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-bold text-[#EFF2F2]">{currentTitle}</h1>
        </div>

        <div className="hidden md:flex items-center flex-1 max-w-sm mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A5ABB0]" />
            <Input
              placeholder="সার্চ করুন..."
              className="pl-9 h-9 rounded-full bg-white/[.04] border border-white/[.08] text-sm text-[#EFF2F2] placeholder:text-[#A5ABB0] focus:border-[#F96801]/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
            <DropdownMenuTrigger className="relative rounded-full w-9 h-9 flex items-center justify-center text-[#A5ABB0] hover:text-[#EFF2F2] hover:bg-white/[.06] transition-colors outline-none">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-[#DE1B2D] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-[#0a0d16] border border-white/[.08] text-[#EFF2F2] max-h-96 overflow-y-auto">
              <DropdownMenuLabel>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">নোটিফিকেশন</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-[#25C2C3] hover:underline">
                      সব পড়া হয়েছে
                    </button>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/[.06]" />
              {notifLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-[#A5ABB0]" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#A5ABB0]">
                  কোনো নোটিফিকেশন নেই
                </div>
              ) : (
                notifications.slice(0, 20).map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    className={`focus:bg-white/[.06] cursor-default ${!n.read ? "bg-white/[.03]" : ""}`}
                    onPointerLeave={(e) => e.preventDefault()}
                  >
                    <div className="flex items-start gap-3 py-1 w-full">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.read ? "bg-[#2B3856]" : "bg-[#F96801]"}`} />
                      <div className="flex-1 min-w-0" onClick={() => !n.read && markAsRead(n.id)}>
                        <p className={`text-sm ${n.read ? "text-[#A5ABB0]" : "text-[#EFF2F2] font-medium"}`}>{n.title}</p>
                        <p className="text-xs text-[#A5ABB0] mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-[10px] text-[#A5ABB0]/60 mt-1">{new Date(n.createdAt).toLocaleString("bn-BD")}</p>
                      </div>
                      {!n.read && (
                        <button onClick={() => markAsRead(n.id)} className="text-[#25C2C3] hover:text-[#25C2C3]/80 flex-shrink-0 mt-1">
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 ml-1">
                <Avatar className="w-8 h-8 ring-2 ring-[#F96801]/30">
                  <AvatarImage src={session?.user?.image || ""} />
                  <AvatarFallback className="bg-[#F96801]/20 text-[#F96801] text-xs font-medium">
                    {session?.user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#0a0d16] border border-white/[.08] text-[#EFF2F2]">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{session?.user?.name}</span>
                  <span className="text-xs text-[#A5ABB0]">{session?.user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/[.06]" />
              <DropdownMenuItem className="focus:bg-[#F96801]/12 focus:text-[#F96801]">
                <a href="/profile" className="block w-full">প্রোফাইল</a>
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-[#F96801]/12 focus:text-[#F96801]">
                <a href="/dashboard" className="block w-full">ড্যাশবোর্ড</a>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/[.06]" />
              <DropdownMenuItem className="text-[#f87171] focus:bg-[#f87171]/12" onClick={() => signOut()}>
                সাইন আউট
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
