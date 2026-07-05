"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { User, Mail, Phone, Shield, Bell, Moon, Sun, LogOut, ChevronRight, Heart, Languages } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { signOut } from "next-auth/react"
import { useTheme } from "next-themes"

export default function ProfilePage() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [notifications, setNotifications] = useState(true)

  const menuItems = [
    { icon: User, label: "ব্যক্তিগত তথ্য", labelEn: "Personal Info", href: "#" },
    { icon: Bell, label: "নোটিফিকেশন সেটিংস", labelEn: "Notification Settings", href: "#" },
    { icon: Shield, label: "প্রাইভেসি ও সিকিউরিটি", labelEn: "Privacy & Security", href: "#" },
    { icon: Languages, label: "ভাষা সেটিংস", labelEn: "Language Settings", href: "#" },
    { icon: Heart, label: "স্বাস্থ্য তথ্য", labelEn: "Health Information", href: "#" },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-0 shadow-lg shadow-black/5 overflow-hidden">
          <div className="gradient-primary p-6 text-white text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-white/30">
              <AvatarImage src={session?.user?.image || ""} />
              <AvatarFallback className="bg-white/20 text-white text-3xl font-bold">
                {session?.user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold">{session?.user?.name || "ব্যবহারকারী"}</h2>
            <p className="text-white/80">{session?.user?.email}</p>
            <Badge className="mt-2 bg-white/20 text-white border-0">
              {session?.user?.role === "PATIENT" ? "রোগী" : session?.user?.role === "GUARDIAN" ? "অভিভাবক" : session?.user?.role === "DOCTOR" ? "ডাক্তার" : session?.user?.role}
            </Badge>
          </div>
        </Card>

        <Card className="border-0 shadow-lg shadow-black/5">
          <CardHeader>
            <CardTitle className="text-lg">সেটিংস</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {menuItems.map((item, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.labelEn}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-black/5">
          <CardHeader>
            <CardTitle className="text-lg">প্রিফারেন্স</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === "dark" ? <Moon className="w-5 h-5 text-gray-500" /> : <Sun className="w-5 h-5 text-gray-500" />}
                <div>
                  <p className="text-sm font-medium">ডার্ক মোড</p>
                  <p className="text-xs text-gray-500">অ্যাপের থিম পরিবর্তন করুন</p>
                </div>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">নোটিফিকেশন</p>
                  <p className="text-xs text-gray-500">পুশ নোটিফিকেশন চালু/বন্ধ</p>
                </div>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
          </CardContent>
        </Card>

        <Button
          variant="outline"
          onClick={() => signOut()}
          className="w-full rounded-xl py-6 text-red-500 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/50"
        >
          <LogOut className="w-5 h-5 mr-2" />
          সাইন আউট
        </Button>

        <p className="text-center text-xs text-gray-400">
          Medify v1.0.0 • Built with care for everyone
        </p>
      </div>
    </motion.div>
  )
}
