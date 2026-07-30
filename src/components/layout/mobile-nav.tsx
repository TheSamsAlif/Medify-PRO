"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  LayoutDashboard,
  Pill,
  Bot,
  Activity,
  PhoneCall,
  Calendar,
  MapPin,
  Scan,
  Heart,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "হোম" },
  { href: "/medicines", icon: Pill, label: "ওষুধ" },
  { href: "/assistant", icon: Bot, label: "AI" },
  { href: "/records", icon: Activity, label: "রেকর্ড" },
  { href: "/prescriptions", icon: Scan, label: "স্ক্যান" },
  { href: "/appointments", icon: Calendar, label: "অ্যাপয়েন্ট" },
  { href: "/hospitals", icon: MapPin, label: "হাসপাতাল" },
  { href: "/emergency", icon: PhoneCall, label: "জরুরি" },
  { href: "/profile", icon: Heart, label: "প্রোফাইল" },
]

export function MobileNav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  if (!session) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass rounded-none border-t border-white/[.12] lg:hidden pb-safe">
      <div className="flex items-center overflow-x-auto gap-1 px-1 h-16 scrollbar-none">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-2.5 py-1.5 rounded-xl min-w-[56px] flex-shrink-0 transition-all touch-min",
                isActive
                  ? "text-[#F96801]"
                  : "text-[#A5ABB0]"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "fill-[#F96801]/20")} />
              <span className="text-[9px] font-medium whitespace-nowrap">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
