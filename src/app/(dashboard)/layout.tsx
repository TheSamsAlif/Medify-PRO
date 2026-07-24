"use client"

import type React from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { TopBar } from "@/components/layout/top-bar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#040406]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#F96801] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[#A5ABB0] font-mono">Loading...</span>
        </div>
      </div>
    )
  }

  if (!session) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-[#040406]">
      <Sidebar />
      <div className="lg:pl-64">
        <TopBar />
        <main className="p-4 md:p-6 lg:p-8 pt-20 lg:pt-24 pb-24">
          {children}
        </main>
        <footer className="border-t border-white/[.06] glass py-4 lg:ml-0">
          <p className="text-center text-sm font-semibold gradient-text">
            Developed by Sams Alif
          </p>
        </footer>
      </div>
      <MobileNav />
    </div>
  )
}
