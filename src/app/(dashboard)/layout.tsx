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
      <div className="flex items-center justify-center min-h-screen"
        style={{
          backgroundImage: "url('/home-bg-2.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}>
        <div className="flex flex-col items-center gap-4 glass px-12 py-10">
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
    <div className="flex flex-col lg:flex-row min-h-screen"
      style={{
        backgroundImage: "url('/home-bg-2.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        <TopBar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 pt-[calc(4rem+env(safe-area-inset-top,0px))] lg:pt-20 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
          {children}
        </main>
        <p className="text-center text-sm font-semibold gradient-text pb-5">
          Developed by Sams Alif
        </p>
      </div>
      <MobileNav />
    </div>
  )
}