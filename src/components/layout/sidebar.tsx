"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  LayoutDashboard,
  Pill,
  Scan,
  Bot,
  Heart,
  Activity,
  MapPin,
  PhoneCall,
  Calendar,
  User,
  Shield,
  AlertTriangle,
  ChevronLeft,
  LogOut,
  Users,
  Stethoscope,
  Apple,
  Droplets,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { signOut } from "next-auth/react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const navigation = [
  { name: "Dashboard", nameBn: "ড্যাশবোর্ড", href: "/dashboard", icon: LayoutDashboard, roles: ["PATIENT", "GUARDIAN", "DOCTOR"] },
  { name: "Medicines", nameBn: "ওষুধ", href: "/medicines", icon: Pill, roles: ["PATIENT", "GUARDIAN"] },
  { name: "Prescriptions", nameBn: "প্রেসক্রিপশন", href: "/prescriptions", icon: Scan, roles: ["PATIENT", "DOCTOR"] },
  { name: "AI Assistant", nameBn: "AI সহায়ক", href: "/assistant", icon: Bot, roles: ["PATIENT", "GUARDIAN", "DOCTOR"] },
  { name: "Health Records", nameBn: "স্বাস্থ্য রেকর্ড", href: "/records", icon: Activity, roles: ["PATIENT", "GUARDIAN", "DOCTOR"] },
  { name: "Guardian", nameBn: "অভিভাবক", href: "/guardian", icon: Users, roles: ["GUARDIAN"] },
  { name: "Doctor", nameBn: "ডাক্তার", href: "/doctor", icon: Stethoscope, roles: ["DOCTOR"] },
  { name: "Appointments", nameBn: "অ্যাপয়েন্টমেন্ট", href: "/appointments", icon: Calendar, roles: ["PATIENT", "DOCTOR"] },
  { name: "Hospitals", nameBn: "হাসপাতাল", href: "/hospitals", icon: MapPin, roles: ["PATIENT", "GUARDIAN"] },
  { name: "Drug Interactions", nameBn: "ড্রাগ চেকার", href: "/interactions", icon: AlertCircle, roles: ["PATIENT", "GUARDIAN", "DOCTOR"] },
  { name: "Lifestyle", nameBn: "লাইফস্টাইল", href: "/lifestyle", icon: Apple, roles: ["PATIENT", "GUARDIAN"] },
  { name: "Emergency", nameBn: "জরুরি সেবা", href: "/emergency", icon: PhoneCall, roles: ["PATIENT", "GUARDIAN"] },
  { name: "Profile", nameBn: "প্রোফাইল", href: "/profile", icon: User, roles: ["PATIENT", "GUARDIAN", "DOCTOR"] },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(false)
  const role = (session?.user?.role as string) || "PATIENT"

  const filteredNav = navigation.filter((item) => item.roles.includes(role))

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-full bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 hidden lg:flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
            <Heart className="w-5 h-5 text-white" fill="white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Medify
            </span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-full w-8 h-8"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Tooltip key={item.name}>
              <TooltipTrigger>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 dark:bg-primary/20 text-primary"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-gray-200"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
                  {!collapsed && (
                    <span className="truncate">{item.nameBn}</span>
                  )}
                </Link>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="text-sm">
                  {item.name}
                </TooltipContent>
              )}
            </Tooltip>
          )
        })}
      </nav>

      <div className="border-t border-gray-200 dark:border-gray-800 p-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="w-9 h-9">
            <AvatarImage src={session?.user?.image || ""} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {session?.user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session?.user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {session?.user?.email}
              </p>
            </div>
          )}
        </div>
        {collapsed && (
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                className="w-full mt-2 rounded-xl"
              >
                <LogOut className="w-5 h-5 text-gray-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Sign Out</TooltipContent>
          </Tooltip>
        )}
        {!collapsed && (
          <Button
            variant="ghost"
            onClick={() => signOut()}
            className="w-full justify-start gap-3 text-sm text-gray-600 dark:text-gray-400 hover:text-red-500 mt-1"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        )}
      </div>
    </aside>
  )
}
