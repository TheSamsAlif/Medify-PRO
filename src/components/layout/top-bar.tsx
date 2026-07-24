"use client"

import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Bell, Search, Menu } from "lucide-react"
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

export function TopBar() {
  const { data: session } = useSession()
  const pathname = usePathname()
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
          <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 text-[#A5ABB0] hover:text-[#EFF2F2] relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#DE1B2D] rounded-full animate-pulse" />
          </Button>
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
