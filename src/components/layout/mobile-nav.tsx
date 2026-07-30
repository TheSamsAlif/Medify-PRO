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
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "হোম", roles: ["PATIENT", "GUARDIAN", "DOCTOR"] },
  { href: "/medicines", icon: Pill, label: "ওষুধ", roles: ["PATIENT"] },
  { href: "/assistant", icon: Bot, label: "AI", roles: ["PATIENT", "DOCTOR"] },
  { href: "/records", icon: Activity, label: "রেকর্ড", roles: ["PATIENT"] },
  { href: "/prescriptions", icon: Scan, label: "স্ক্যান", roles: ["PATIENT"] },
  { href: "/guardian", icon: Users, label: "অভিভাবক", roles: ["GUARDIAN"] },
  { href: "/appointments", icon: Calendar, label: "অ্যাপয়েন্ট", roles: ["PATIENT", "GUARDIAN"] },
  { href: "/hospitals", icon: MapPin, label: "হাসপাতাল", roles: ["PATIENT", "GUARDIAN"] },
  { href: "/emergency", icon: PhoneCall, label: "জরুরি", roles: ["PATIENT", "GUARDIAN"] },
  { href: "/profile", icon: Heart, label: "প্রোফাইল", roles: ["PATIENT", "GUARDIAN"] },
]

export function MobileNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = (session?.user?.role as string) || "PATIENT"

  if (!session) return null

  const filteredItems = navItems.filter((item) => item.roles.includes(role))

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass rounded-none border-t border-white/[.12] lg:hidden pb-safe">
      <div className="flex items-center overflow-x-auto gap-1 px-1 h-16 scrollbar-none">
        {filteredItems.map((item) => {
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
