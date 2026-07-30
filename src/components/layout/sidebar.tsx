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
  ChevronLeft,
  LogOut,
  Users,
  Stethoscope,
  Apple,
  AlertCircle,
  Clock,
  Bell,
  Shield,
  Ambulance,
  FileText,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { signOut } from "next-auth/react"
import { useI18n } from "@/lib/i18n"

const navigation = [
  { key: "sidebar.dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["PATIENT", "GUARDIAN", "DOCTOR"] },
  { key: "sidebar.medicines", href: "/medicines", icon: Pill, roles: ["PATIENT"] },
  { key: "sidebar.prescriptions", href: "/prescriptions", icon: Scan, roles: ["PATIENT"] },
  { key: "sidebar.ai", href: "/assistant", icon: Bot, roles: ["PATIENT", "DOCTOR"] },
  { key: "sidebar.records", href: "/records", icon: Activity, roles: ["PATIENT"] },
  { key: "sidebar.myDoctors", href: "/my-doctors", icon: Stethoscope, roles: ["PATIENT", "GUARDIAN"] },
  { key: "sidebar.medicineHistory", href: "/medicine-history", icon: Clock, roles: ["PATIENT"] },
  { key: "sidebar.appointments", href: "/appointments", icon: Calendar, roles: ["PATIENT", "GUARDIAN"] },
  { key: "sidebar.hospitals", href: "/hospitals", icon: MapPin, roles: ["PATIENT", "GUARDIAN"] },
  { key: "sidebar.drugChecker", href: "/interactions", icon: AlertCircle, roles: ["PATIENT", "GUARDIAN"] },
  { key: "sidebar.lifestyle", href: "/lifestyle", icon: Apple, roles: ["PATIENT"] },
  { key: "sidebar.guardian", href: "/guardian", icon: Users, roles: ["GUARDIAN"] },
  { key: "sidebar.emergency", href: "/emergency", icon: PhoneCall, roles: ["PATIENT", "GUARDIAN"] },
  { key: "sidebar.profile", href: "/profile", icon: User, roles: ["PATIENT", "GUARDIAN"] },
  { key: "sidebar.doctorPatients", href: "/doctor/patients", icon: Users, roles: ["DOCTOR"] },
  { key: "sidebar.doctorPrescriptions", href: "/doctor/prescriptions", icon: FileText, roles: ["DOCTOR"] },
  { key: "sidebar.doctorRecords", href: "/doctor/records", icon: Activity, roles: ["DOCTOR"] },
  { key: "sidebar.doctorAppointments", href: "/doctor/appointments", icon: Calendar, roles: ["DOCTOR"] },
  { key: "sidebar.doctorEmergency", href: "/doctor/emergency", icon: Ambulance, roles: ["DOCTOR"] },
  { key: "sidebar.doctorProfile", href: "/doctor/profile", icon: Settings, roles: ["DOCTOR"] },
  { key: "sidebar.adminDashboard", href: "/admin", icon: LayoutDashboard, roles: ["ADMIN"] },
  { key: "sidebar.adminUsers", href: "/admin/users", icon: Users, roles: ["ADMIN"] },
  { key: "sidebar.adminAuditLogs", href: "/admin/audit-logs", icon: Clock, roles: ["ADMIN"] },
  { key: "sidebar.adminReports", href: "/admin/reports", icon: Activity, roles: ["ADMIN"] },
  { key: "sidebar.adminNotifications", href: "/admin/notifications", icon: Bell, roles: ["ADMIN"] },
  { key: "sidebar.adminSettings", href: "/admin/settings", icon: Settings, roles: ["ADMIN"] },
  { key: "sidebar.adminBackup", href: "/admin/backup", icon: Shield, roles: ["ADMIN"] },
  { key: "sidebar.adminFeedback", href: "/admin/feedback", icon: Heart, roles: ["ADMIN"] },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { t } = useI18n()
  const [collapsed, setCollapsed] = useState(false)
  const role = (session?.user?.role as string) || "PATIENT"

  const filteredNav = navigation.filter((item) => item.roles.includes(role))

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-full sidebar-glass transition-all duration-300 hidden lg:flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/[.08]">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#F96801]/30">
            <Heart className="w-5 h-5" fill="currentColor" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold gradient-text">
              Medify
            </span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-full w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-white/[.08]"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-medium transition-all duration-300",
                isActive
                  ? "text-[#F96801] glass border border-[#F96801]/20 shadow-[0_0_30px_-8px_rgba(249,104,1,0.35)]"
                  : "text-[#A5ABB0] hover:text-[#EFF2F2] hover:bg-[rgba(249,104,1,0.08)] hover:border hover:border-[#F96801]/15 hover:shadow-[0_0_20px_-10px_rgba(249,104,1,0.2)]"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-[#F96801]")} />
              {!collapsed && <span className="truncate">{t(item.key)}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/[.06] p-3">
        <div className="flex items-center gap-3 px-3 py-3 rounded-2xl glass-light">
          <Avatar className="w-9 h-9 ring-2 ring-[#F96801]/30">
            <AvatarImage src={session?.user?.image || ""} />
            <AvatarFallback className="bg-[#F96801]/20 text-[#F96801] text-sm font-medium">
              {session?.user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#EFF2F2] truncate">{session?.user?.name}</p>
              <p className="text-xs text-[#A5ABB0] truncate">{session?.user?.email}</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className={cn(
            "text-[#A5ABB0] hover:text-[#f87171] hover:bg-[#f87171]/10 mt-2 w-full rounded-2xl",
            collapsed ? "justify-center" : "justify-start gap-3"
          )}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="text-sm">Sign Out</span>}
        </Button>
      </div>
    </aside>
  )
}