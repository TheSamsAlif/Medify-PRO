"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { signOut } from "next-auth/react"
import { Bell, Sun, Moon, Search, Menu } from "lucide-react"
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
import { LanguageToggle } from "@/components/layout/language-toggle"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/layout/sidebar"

export function TopBar() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
    <header className="fixed top-0 left-0 right-0 z-30 lg:pl-64 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger>
              <Button variant="ghost" size="icon" className="lg:hidden rounded-full">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <Sidebar />
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-bold truncate">{currentTitle}</h1>
        </div>

        <div className="hidden md:flex items-center flex-1 max-w-sm mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="সার্চ করুন..."
              className="pl-9 h-9 rounded-full bg-gray-100 dark:bg-gray-900 border-0 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mounted && <LanguageToggle />}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full w-9 h-9"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          )}
          <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 ml-1">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={session?.user?.image || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {session?.user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{session?.user?.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{session?.user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <a href="/profile" className="block w-full">প্রোফাইল</a>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <a href="/dashboard" className="block w-full">ড্যাশবোর্ড</a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500" onClick={() => signOut()}>
                সাইন আউট
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
