"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { User, Mail, Phone, Shield, Bell, Moon, LogOut, ChevronRight, Heart, Languages, Edit3, Loader2, CheckCircle2, MapPin, Calendar, Droplets, Stethoscope, ToggleLeft, ToggleRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { signOut } from "next-auth/react"
import { ThemeSettings } from "@/components/theme/theme-settings"
import { useI18n } from "@/lib/i18n"

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [profile, setProfile] = useState<{
    name?: string
    email?: string
    phone?: string
    age?: number
    gender?: string
    bloodGroup?: string
    address?: string
    patientId?: string
    role?: string
    image?: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [securityOpen, setSecurityOpen] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const [doctorSettingsOpen, setDoctorSettingsOpen] = useState(false)
  const { lang, setLang } = useI18n()
  const [langDialogOpen, setLangDialogOpen] = useState(false)

  const [form, setForm] = useState({
    name: "",
    phone: "",
    age: "",
    gender: "",
    bloodGroup: "",
    address: "",
  })

  const [doctorForm, setDoctorForm] = useState({
    registrationNumber: "",
    isAvailable: true,
    chamberLocation: "",
  })

  const [notifications, setNotifications] = useState({
    medicineReminders: true,
    sosAlerts: true,
    appointmentReminders: true,
    emailDigest: false,
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile")
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
        setForm({
          name: data.name || "",
          phone: data.phone || "",
          age: data.age?.toString() || "",
          gender: data.gender || "",
          bloodGroup: data.bloodGroup || "",
          address: data.address || "",
        })
        setDoctorForm({
          registrationNumber: data.registrationNumber || "",
          isAvailable: data.isAvailable !== false,
          chamberLocation: data.chamberLocation || "",
        })
      }
    } catch {
      toast.error("প্রোফাইল লোড করতে সমস্যা হয়েছে")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: Record<string, any> = {}
      if (form.name) payload.name = form.name
      if (form.phone) payload.phone = form.phone
      if (form.age) payload.age = parseInt(form.age)
      if (form.gender) payload.gender = form.gender
      if (form.bloodGroup) payload.bloodGroup = form.bloodGroup
      if (form.address) payload.address = form.address

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        setProfile(prev => ({ ...prev, ...data.user }))
        setForm({
          name: data.user.name || "",
          phone: data.user.phone || "",
          age: data.user.age?.toString() || "",
          gender: data.user.gender || "",
          bloodGroup: data.user.bloodGroup || "",
          address: data.user.address || "",
        })
        toast.success("প্রোফাইল সফলভাবে আপডেট হয়েছে")
        setEditOpen(false)
        update({ name: form.name })
      } else {
        toast.error(data.error || "প্রোফাইল আপডেট করতে সমস্যা হয়েছে")
      }
    } catch {
      toast.error("নেটওয়ার্ক ত্রুটি")
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border border-white/[.08] bg-[#0a0d16] overflow-hidden">
          <div className="gradient-primary p-6 text-[#160500] text-center relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
              className="absolute top-4 right-4 bg-white/20 border-white/30 text-[#160500] hover:bg-white/30 text-xs rounded-xl"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1.5" /> সম্পাদনা
            </Button>
            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-white/30 shadow-lg">
              <AvatarImage src={profile?.image || session?.user?.image || ""} />
              <AvatarFallback className="bg-white/25 text-[#160500] text-3xl font-bold">
                {profile?.name?.charAt(0) || session?.user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold">{profile?.name || session?.user?.name || "ব্যবহারকারী"}</h2>
            <p className="text-[#160500]/80 text-sm">{profile?.email || session?.user?.email}</p>
            
            <div className="flex items-center justify-center gap-2 mt-3">
              <Badge className="bg-white/25 text-[#160500] border-0 font-semibold">
                {profile?.role === "PATIENT" ? "রোগী" : profile?.role === "GUARDIAN" ? "অভিভাবক" : profile?.role === "DOCTOR" ? "ডাক্তার" : "সদস্য"}
              </Badge>
              {profile?.patientId && (
                <Badge className="bg-[#160500]/20 text-[#160500] border-0 font-mono font-bold">
                  ID: {profile.patientId}
                </Badge>
              )}
            </div>
          </div>
        </Card>

        <Card className="border border-white/[.08] bg-[#0a0d16]">
          <CardHeader>
            <CardTitle className="text-lg text-[#EFF2F2]">সেটিংস</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button
              onClick={() => setEditOpen(true)}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-white/[.04] transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F96801]/10 flex items-center justify-center text-[#F96801]">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-[#EFF2F2]">ব্যক্তিগত তথ্য</p>
                <p className="text-xs text-[#A5ABB0]">নাম, ফোন, বয়স, রক্তের গ্রুপ ও ঠিকানা</p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#A5ABB0]" />
            </button>

            <button
              onClick={() => setNotifOpen(true)}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-white/[.04] transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-[#25C2C3]/10 flex items-center justify-center text-[#25C2C3]">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-[#EFF2F2]">নোটিফিকেশন সেটিংস</p>
                <p className="text-xs text-[#A5ABB0]">ওষুধ রিমাইন্ডার ও অ্যালার্ট</p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#A5ABB0]" />
            </button>

            <button
              onClick={() => setSecurityOpen(true)}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-white/[.04] transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-[#EFF2F2]">প্রাইভেসি ও সিকিউরিটি</p>
                <p className="text-xs text-[#A5ABB0]">পাসওয়ার্ড ও ডেটা সুরক্ষা</p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#A5ABB0]" />
            </button>

            {profile?.role === "DOCTOR" && (
              <button
                onClick={() => setDoctorSettingsOpen(true)}
                className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-white/[.04] transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-[#EFF2F2]">ডাক্তার সেটিংস</p>
                  <p className="text-xs text-[#A5ABB0]">রেজিস্ট্রেশন নম্বর, চেম্বারের অবস্থান, উপলব্ধতা</p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#A5ABB0]" />
              </button>
            )}
          </CardContent>
        </Card>

        <Card className="border border-white/[.08] bg-[#0a0d16]">
          <CardHeader>
            <CardTitle className="text-lg text-[#EFF2F2]">প্রিফারেন্স</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <button
              onClick={() => setThemeOpen(true)}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-white/[.04] transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[.06] flex items-center justify-center text-[#A5ABB0]">
                <Moon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-[#EFF2F2]">অ্যাপের থিম</p>
                <p className="text-xs text-[#A5ABB0]">ডার্ক / লাইট / সিস্টেম থিম</p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#A5ABB0]" />
            </button>
            <button
              onClick={() => setLangDialogOpen(true)}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-white/[.04] transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[.06] flex items-center justify-center text-[#A5ABB0]">
                <Languages className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-[#EFF2F2]">ভাষা / Language</p>
                <p className="text-xs text-[#A5ABB0]">{lang === "bn" ? "বাংলা" : "English"}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#A5ABB0]" />
            </button>
          </CardContent>
        </Card>

        <Button
          variant="outline"
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="w-full rounded-xl py-6 text-red-400 border-red-500/20 hover:bg-red-500/10 bg-transparent"
        >
          <LogOut className="w-5 h-5 mr-2" />
          সাইন আউট
        </Button>

        <p className="text-center text-xs text-[#A5ABB0]">
          Medify PRO v1.0.0 • Healthcare SaaS Application
        </p>

        {/* Edit Profile Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="bg-[#0a0d16] border border-white/[.08] text-[#EFF2F2] max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">ব্যক্তিগত তথ্য সম্পাদনা</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#A5ABB0]">পূর্ণ নাম</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="bg-white/[.04] border-white/[.08] text-[#EFF2F2]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#A5ABB0]">ফোন নম্বর</Label>
                  <Input
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="bg-white/[.04] border-white/[.08] text-[#EFF2F2]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#A5ABB0]">বয়স</Label>
                  <Input
                    type="number"
                    value={form.age}
                    onChange={e => setForm({ ...form, age: e.target.value })}
                    className="bg-white/[.04] border-white/[.08] text-[#EFF2F2]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#A5ABB0]">লিঙ্গ (Gender)</Label>
                  <Input
                    value={form.gender}
                    onChange={e => setForm({ ...form, gender: e.target.value })}
                    placeholder="MALE / FEMALE / OTHER"
                    className="bg-white/[.04] border-white/[.08] text-[#EFF2F2]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#A5ABB0]">রক্তের গ্রুপ</Label>
                  <Input
                    value={form.bloodGroup}
                    onChange={e => setForm({ ...form, bloodGroup: e.target.value })}
                    placeholder="e.g. A+, O+"
                    className="bg-white/[.04] border-white/[.08] text-[#EFF2F2]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#A5ABB0]">ঠিকানা</Label>
                <Input
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  className="bg-white/[.04] border-white/[.08] text-[#EFF2F2]"
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="border-white/[.08] text-[#A5ABB0]">
                  বাতিল
                </Button>
                <Button type="submit" disabled={saving} className="gradient-primary text-[#160500]">
                  {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  সংরক্ষণ করুন
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Notification Settings Dialog */}
        <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
          <DialogContent className="bg-[#0a0d16] border border-white/[.08] text-[#EFF2F2] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">নোটিফিকেশন সেটিংস</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#EFF2F2]">ওষুধ রিমাইন্ডার</p>
                  <p className="text-xs text-[#A5ABB0]">সময়মতো ওষুধ খাওয়ার নোটিফিকেশন</p>
                </div>
                <Switch checked={notifications.medicineReminders} onCheckedChange={v => setNotifications({ ...notifications, medicineReminders: v })} />
              </div>
              <Separator className="bg-white/[.08]" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#EFF2F2]">SOS অ্যালার্ট</p>
                  <p className="text-xs text-[#A5ABB0]">জরুরি অবস্থার তাৎক্ষণিক নোটিফিকেশন</p>
                </div>
                <Switch checked={notifications.sosAlerts} onCheckedChange={v => setNotifications({ ...notifications, sosAlerts: v })} />
              </div>
              <Separator className="bg-white/[.08]" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#EFF2F2]">অ্যাপয়েন্টমেন্ট রিমাইন্ডার</p>
                  <p className="text-xs text-[#A5ABB0]">ডাক্তার সাক্ষাতের আগের অ্যালার্ট</p>
                </div>
                <Switch checked={notifications.appointmentReminders} onCheckedChange={v => setNotifications({ ...notifications, appointmentReminders: v })} />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button onClick={() => { setNotifOpen(false); toast.success("নোটিফিকেশন সেটিংস সংরক্ষিত হয়েছে") }} className="gradient-primary text-[#160500] w-full">
                সংরক্ষণ করুন
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Security Dialog */}
        <Dialog open={securityOpen} onOpenChange={setSecurityOpen}>
          <DialogContent className="bg-[#0a0d16] border border-white/[.08] text-[#EFF2F2] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">প্রাইভেসি ও সিকিউরিটি</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2 text-sm text-[#A5ABB0]">
              <p>আপনার অ্যাকাউন্ট সম্পূর্ণ নিরাপদ ও এনক্রিপ্টেড।</p>
              <div className="p-3 rounded-xl bg-white/[.04] border border-white/[.08] space-y-2">
                <p className="font-medium text-[#EFF2F2]">ডেটা এনক্রিপশন</p>
                <p className="text-xs">মেডিকেল রেকর্ড এবং প্রেসক্রিপশন সিকিউর ডাটাবেজে সংরক্ষিত।</p>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button onClick={() => setSecurityOpen(false)} className="gradient-primary text-[#160500] w-full">
                ঠিক আছে
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ThemeSettings open={themeOpen} onOpenChange={setThemeOpen} />

        {/* Doctor Settings Dialog */}
        <Dialog open={doctorSettingsOpen} onOpenChange={setDoctorSettingsOpen}>
          <DialogContent className="bg-[#0a0d16] border border-white/[.08] text-[#EFF2F2] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">ডাক্তার সেটিংস</DialogTitle>
            </DialogHeader>
            <form onSubmit={async (e) => {
              e.preventDefault()
              setSaving(true)
              try {
                const res = await fetch("/api/profile", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    registrationNumber: doctorForm.registrationNumber,
                    isAvailable: doctorForm.isAvailable,
                    chamberLocation: doctorForm.chamberLocation,
                  }),
                })
                if (res.ok) {
                  toast.success("সেটিংস সংরক্ষিত হয়েছে")
                  setDoctorSettingsOpen(false)
                } else {
                  toast.error("সমস্যা হয়েছে")
                }
              } catch {
                toast.error("নেটওয়ার্ক ত্রুটি")
              } finally {
                setSaving(false)
              }
            }} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#A5ABB0]">BM&DC Registration Number (ঐচ্ছিক)</Label>
                <Input
                  value={doctorForm.registrationNumber}
                  onChange={e => setDoctorForm({ ...doctorForm, registrationNumber: e.target.value })}
                  placeholder="e.g. A-12345"
                  className="bg-white/[.04] border-white/[.08] text-[#EFF2F2] font-mono"
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[.04] border border-white/[.08]">
                <div>
                  <p className="text-sm font-medium text-[#EFF2F2]">প্রাপ্তিসাধ্য (Available)</p>
                  <p className="text-xs text-[#A5ABB0]">রোগীরা আপনার উপলব্ধতা দেখতে পাবেন</p>
                </div>
                <Switch checked={doctorForm.isAvailable} onCheckedChange={v => setDoctorForm({ ...doctorForm, isAvailable: v })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#A5ABB0]">চেম্বারের অবস্থান (ঐচ্ছিক)</Label>
                <Input
                  value={doctorForm.chamberLocation}
                  onChange={e => setDoctorForm({ ...doctorForm, chamberLocation: e.target.value })}
                  placeholder="ঠিকানা লিখুন"
                  className="bg-white/[.04] border-white/[.08] text-[#EFF2F2]"
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setDoctorSettingsOpen(false)} className="border-white/[.08] text-[#A5ABB0]">
                  বাতিল
                </Button>
                <Button type="submit" disabled={saving} className="gradient-primary text-[#160500]">
                  {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  সংরক্ষণ করুন
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Language Dialog */}
        <Dialog open={langDialogOpen} onOpenChange={setLangDialogOpen}>
          <DialogContent className="bg-[#0a0d16] border border-white/[.08] text-[#EFF2F2] max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">ভাষা / Language</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => { setLang("bn"); setLangDialogOpen(false) }}
                className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors text-left ${lang === "bn" ? "bg-[#F96801]/20 border border-[#F96801]/30" : "hover:bg-white/[.04] border border-transparent"}`}
              >
                <span className="text-2xl">🇧🇩</span>
                <div>
                  <p className="font-medium text-sm text-[#EFF2F2]">বাংলা</p>
                  <p className="text-xs text-[#A5ABB0]">Bangla</p>
                </div>
                {lang === "bn" && <CheckCircle2 className="w-5 h-5 text-[#F96801] ml-auto" />}
              </button>
              <button
                onClick={() => { setLang("en"); setLangDialogOpen(false) }}
                className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors text-left ${lang === "en" ? "bg-[#F96801]/20 border border-[#F96801]/30" : "hover:bg-white/[.04] border border-transparent"}`}
              >
                <span className="text-2xl">🇬🇧</span>
                <div>
                  <p className="font-medium text-sm text-[#EFF2F2]">English</p>
                  <p className="text-xs text-[#A5ABB0]">ইংরেজি</p>
                </div>
                {lang === "en" && <CheckCircle2 className="w-5 h-5 text-[#F96801] ml-auto" />}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  )
}
