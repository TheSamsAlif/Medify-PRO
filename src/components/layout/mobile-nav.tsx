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
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "হোম" },
  { href: "/medicines", icon: Pill, label: "ওষুধ" },
  { href: "/assistant", icon: Bot, label: "AI" },
  { href: "/records", icon: Activity, label: "রেকর্ড" },
  { href: "/emergency", icon: PhoneCall, label: "জরুরি" },
]

export function MobileNav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  if (!session) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-white/[.06] lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl min-w-[56px] transition-all",
                isActive
                  ? "text-[#F96801]"
                  : "text-[#A5ABB0]"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "fill-[#F96801]/20")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
