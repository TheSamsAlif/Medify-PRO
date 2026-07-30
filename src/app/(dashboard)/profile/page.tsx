"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { User, Mail, Phone, Shield, Bell, Moon, LogOut, ChevronRight, Heart, Languages, Edit3, Loader2, CheckCircle2, MapPin, Calendar, Droplets, Stethoscope, ToggleLeft, ToggleRight, Plus, X, BadgeCheck, Search, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
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
  const { t, lang, setLang } = useI18n()
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

  const [doctors, setDoctors] = useState<any[]>([])
  const [doctorAddOpen, setDoctorAddOpen] = useState(false)
  const [doctorIdInput, setDoctorIdInput] = useState("")
  const [addingDoctor, setAddingDoctor] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  useEffect(() => {
    if (profile?.role === "PATIENT") {
      fetch("/api/patient/doctors").then(r => r.ok && r.json()).then(setDoctors).catch(() => {})
    }
  }, [profile])

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
      toast.error(t("profile.loadError"))
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
        toast.success(t("profile.updated"))
        setEditOpen(false)
        update({ name: form.name })
      } else {
        toast.error(data.error || t("profile.updateError"))
      }
    } catch {
      toast.error(t("profile.networkError"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="relative glass-card rounded-2xl p-8 text-center border border-white/[.08] shadow-[0_8px_32px_rgba(37,194,195,0.06)]">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[.02] to-transparent pointer-events-none" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
            className="absolute top-4 right-4 glass border-white/[.08] text-muted-foreground hover:text-foreground text-xs rounded-xl"
          >
            <Edit3 className="w-3.5 h-3.5 mr-1.5" /> {t("profile.editPersonalInfo")}
          </Button>
          <Avatar className="w-24 h-24 mx-auto mb-4 shadow-[0_0_30px_rgba(37,194,195,0.2)]">
            <AvatarImage src={profile?.image || session?.user?.image || ""} />
            <AvatarFallback className={`text-white text-3xl font-bold ${
              profile?.role === "DOCTOR"
                ? "bg-gradient-to-br from-[#DC2626] to-[#F96801]"
                : profile?.role === "GUARDIAN"
                  ? "bg-gradient-to-br from-[#0EA5E9] to-[#38BDF8]"
                  : "bg-gradient-to-br from-[#2563EB] to-[#60A5FA]"
            }`}>
              {profile?.name?.charAt(0) || session?.user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold text-foreground">{profile?.name || session?.user?.name || t("profile.user")}</h2>
          <p className="text-muted-foreground text-sm">{profile?.email || session?.user?.email}</p>
          
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/[.06] border border-white/[.08] text-foreground ${
              profile?.role === "DOCTOR"
                ? "shadow-[0_0_12px_rgba(220,38,38,0.1)]"
                : profile?.role === "GUARDIAN"
                  ? "shadow-[0_0_12px_rgba(14,165,233,0.1)]"
                  : "shadow-[0_0_12px_rgba(37,99,235,0.1)]"
            }`}>
              {profile?.role === "PATIENT" ? t("profile.patient") : profile?.role === "GUARDIAN" ? t("profile.guardian") : profile?.role === "DOCTOR" ? t("profile.doctor") : t("profile.member")}
            </span>
            {profile?.patientId && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono bg-white/[.06] border border-white/[.08] text-muted-foreground">
                ID: {profile.patientId}
              </span>
            )}
          </div>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">{t("profile.settings")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button
              onClick={() => setEditOpen(true)}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:glass transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F96801]/10 flex items-center justify-center text-[#F96801]">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-foreground">{t("profile.personalInfo")}</p>
                <p className="text-xs text-muted-foreground">{t("profile.personalInfoDesc")}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              onClick={() => setNotifOpen(true)}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:glass transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-[#25C2C3]/10 flex items-center justify-center text-[#25C2C3]">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-foreground">{t("profile.notifications")}</p>
                <p className="text-xs text-muted-foreground">{t("profile.notifDesc")}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              onClick={() => setSecurityOpen(true)}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:glass transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-foreground">{t("profile.security")}</p>
                <p className="text-xs text-muted-foreground">{t("profile.securityDesc")}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            {profile?.role === "DOCTOR" && (
              <button
                onClick={() => setDoctorSettingsOpen(true)}
                className="w-full flex items-center gap-3 p-4 rounded-xl hover:glass transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">{t("profile.doctorSettings")}</p>
                  <p className="text-xs text-muted-foreground">{t("profile.doctorSettingsDesc")}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">{t("profile.settings")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <button
              onClick={() => setThemeOpen(true)}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:glass transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[.06] flex items-center justify-center text-muted-foreground">
                <Moon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-foreground">{t("profile.theme")}</p>
                <p className="text-xs text-muted-foreground">{t("profile.themeDesc")}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              onClick={() => setLangDialogOpen(true)}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:glass transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[.06] flex items-center justify-center text-muted-foreground">
                <Languages className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-foreground">{t("profile.langLabel")}</p>
                <p className="text-xs text-muted-foreground">{lang === "bn" ? t("profile.bangla") : t("profile.english")}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>

        {profile?.role === "PATIENT" && (
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-[#F96801]" /> আমার ডাক্তার
              </CardTitle>
              <Button size="sm" onClick={() => setDoctorAddOpen(true)}
                className="gradient-primary text-[#160500] rounded-xl text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" /> ডাক্তার যোগ
              </Button>
            </CardHeader>
            <CardContent>
              {doctors.length === 0 ? (
                <div className="text-center py-6">
                  <Stethoscope className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">কোনো ডাক্তার যুক্ত নেই</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">ডাক্তারের Doctor ID দিয়ে যুক্ত করুন</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {doctors.map((doc: any) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl glass border border-white/[.06]">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-br from-[#DC2626] to-[#F96801] text-white text-sm">
                          {doc.name?.charAt(0) || "D"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                          <BadgeCheck className="w-3.5 h-3.5 text-[#F96801]" />
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">{doc.doctorId}</p>
                        {doc.isAvailable !== false && (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> সক্রিয়
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {doc.phone ? (
                          <a href={`tel:${doc.phone}`}>
                            <Button variant="outline" size="sm" className="rounded-lg border-white/[.08] text-muted-foreground h-8 w-8 p-0">
                              <Phone className="w-3.5 h-3.5 text-[#25C2C3]" />
                            </Button>
                          </a>
                        ) : (
                          <Button variant="outline" size="sm" onClick={async () => {
                            const res = await fetch("/api/patient/doctors", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ doctorId: doc.id, action: "request_contact" }),
                            })
                            if (res.ok) toast.success("অনুরোধ পাঠানো হয়েছে")
                            else toast.error("সমস্যা হয়েছে")
                          }} className="rounded-lg border-white/[.08] text-muted-foreground text-xs h-8 px-2">
                            অনুরোধ
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={async () => {
                          if (!confirm("এই ডাক্তারকে সরাবেন?")) return
                          const res = await fetch("/api/patient/doctors", {
                            method: "DELETE",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ doctorId: doc.id }),
                          })
                          if (res.ok) {
                            toast.success("ডাক্তার সরানো হয়েছে")
                            setDoctors(doctors.filter((d: any) => d.id !== doc.id))
                          } else toast.error("সরাতে সমস্যা হয়েছে")
                        }} className="rounded-lg border-white/[.08] text-muted-foreground h-8 w-8 p-0 hover:border-red-500/30 hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Button
          variant="outline"
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="w-full rounded-xl py-6 text-red-400 border-red-500/20 hover:bg-red-500/10 bg-transparent"
        >
          <LogOut className="w-5 h-5 mr-2" />
          {t("profile.signOut")}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          {t("app.name")} PRO {t("app.version")} • {t("app.tagline")}
        </p>

        {/* Edit Profile Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="glass-card text-foreground max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{t("profile.editPersonalInfo")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t("profile.fullName")}</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="glass border-white/[.08] text-foreground"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t("profile.phoneNumber")}</Label>
                  <Input
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="glass border-white/[.08] text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t("profile.age")}</Label>
                  <Input
                    type="number"
                    value={form.age}
                    onChange={e => setForm({ ...form, age: e.target.value })}
                    className="glass border-white/[.08] text-foreground"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t("profile.gender")}</Label>
                  <Input
                    value={form.gender}
                    onChange={e => setForm({ ...form, gender: e.target.value })}
                    placeholder="MALE / FEMALE / OTHER"
                    className="glass border-white/[.08] text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t("profile.bloodGroup")}</Label>
                  <Input
                    value={form.bloodGroup}
                    onChange={e => setForm({ ...form, bloodGroup: e.target.value })}
                    placeholder="e.g. A+, O+"
                    className="glass border-white/[.08] text-foreground"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t("profile.address")}</Label>
                <Input
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  className="glass border-white/[.08] text-foreground"
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="border-white/[.08] text-muted-foreground">
                  {t("profile.cancel")}
                </Button>
                <Button type="submit" disabled={saving} className="gradient-primary text-[#160500]">
                  {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {t("profile.save")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Notification Settings Dialog */}
        <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
          <DialogContent className="glass-card text-foreground max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{t("profile.notifications")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("profile.medicineReminders")}</p>
                  <p className="text-xs text-muted-foreground">{t("profile.medicineRemindersDesc")}</p>
                </div>
                <Switch checked={notifications.medicineReminders} onCheckedChange={v => setNotifications({ ...notifications, medicineReminders: v })} />
              </div>
              <Separator className="bg-white/[.08]" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("profile.sosAlerts")}</p>
                  <p className="text-xs text-muted-foreground">{t("profile.sosAlertsDesc")}</p>
                </div>
                <Switch checked={notifications.sosAlerts} onCheckedChange={v => setNotifications({ ...notifications, sosAlerts: v })} />
              </div>
              <Separator className="bg-white/[.08]" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("profile.appointmentReminders")}</p>
                  <p className="text-xs text-muted-foreground">{t("profile.appointmentRemindersDesc")}</p>
                </div>
                <Switch checked={notifications.appointmentReminders} onCheckedChange={v => setNotifications({ ...notifications, appointmentReminders: v })} />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button onClick={() => { setNotifOpen(false); toast.success(t("profile.notifSaved")) }} className="gradient-primary text-[#160500] w-full">
                {t("profile.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Security Dialog */}
        <Dialog open={securityOpen} onOpenChange={setSecurityOpen}>
          <DialogContent className="glass-card text-foreground max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{t("profile.securityTitle")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2 text-sm text-muted-foreground">
              <p>{t("profile.securityDesc")}</p>
              <div className="p-3 rounded-xl glass border border-white/[.08] space-y-2">
                <p className="font-medium text-foreground">{t("profile.encryption")}</p>
                <p className="text-xs">{t("profile.encryptionDesc")}</p>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button onClick={() => setSecurityOpen(false)} className="gradient-primary text-[#160500] w-full">
                {t("profile.ok")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ThemeSettings open={themeOpen} onOpenChange={setThemeOpen} />

        {/* Doctor Settings Dialog */}
        <Dialog open={doctorSettingsOpen} onOpenChange={setDoctorSettingsOpen}>
          <DialogContent className="glass-card text-foreground max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{t("profile.doctorSettingsTitle")}</DialogTitle>
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
                  toast.success(t("profile.settingsSaved"))
                  setDoctorSettingsOpen(false)
                } else {
                  toast.error(t("profile.settingsError"))
                }
              } catch {
                toast.error(t("profile.networkError"))
              } finally {
                setSaving(false)
              }
            }} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t("profile.registration")}</Label>
                <Input
                  value={doctorForm.registrationNumber}
                  onChange={e => setDoctorForm({ ...doctorForm, registrationNumber: e.target.value })}
                  placeholder="e.g. A-12345"
                  className="glass border-white/[.08] text-foreground font-mono"
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl glass border border-white/[.08]">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("profile.availability")}</p>
                  <p className="text-xs text-muted-foreground">{t("profile.availabilityDesc")}</p>
                </div>
                <Switch checked={doctorForm.isAvailable} onCheckedChange={v => setDoctorForm({ ...doctorForm, isAvailable: v })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t("profile.chamberLocation")}</Label>
                <Input
                  value={doctorForm.chamberLocation}
                  onChange={e => setDoctorForm({ ...doctorForm, chamberLocation: e.target.value })}
                  placeholder={t("profile.chamberPlaceholder")}
                  className="glass border-white/[.08] text-foreground"
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setDoctorSettingsOpen(false)} className="border-white/[.08] text-muted-foreground">
                  {t("profile.cancel")}
                </Button>
                <Button type="submit" disabled={saving} className="gradient-primary text-[#160500]">
                  {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {t("profile.save")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Language Dialog */}
        <Dialog open={langDialogOpen} onOpenChange={setLangDialogOpen}>
          <DialogContent className="glass-card text-foreground max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{t("profile.langDialogTitle")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => { setLang("bn"); setLangDialogOpen(false) }}
                className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors text-left ${lang === "bn" ? "bg-[#F96801]/20 border border-[#F96801]/30" : "hover:glass border border-transparent"}`}
              >
                <span className="text-2xl">🇧🇩</span>
                <div>
                  <p className="font-medium text-sm text-foreground">{t("profile.bangla")}</p>
                  <p className="text-xs text-muted-foreground">{t("language.bangla")}</p>
                </div>
                {lang === "bn" && <CheckCircle2 className="w-5 h-5 text-[#F96801] ml-auto" />}
              </button>
              <button
                onClick={() => { setLang("en"); setLangDialogOpen(false) }}
                className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors text-left ${lang === "en" ? "bg-[#F96801]/20 border border-[#F96801]/30" : "hover:glass border border-transparent"}`}
              >
                <span className="text-2xl">🇬🇧</span>
                <div>
                  <p className="font-medium text-sm text-foreground">{t("profile.english")}</p>
                  <p className="text-xs text-muted-foreground">{t("language.english")}</p>
                </div>
                {lang === "en" && <CheckCircle2 className="w-5 h-5 text-[#F96801] ml-auto" />}
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Doctor Dialog */}
        <Dialog open={doctorAddOpen} onOpenChange={setDoctorAddOpen}>
          <DialogContent className="glass-card text-foreground max-w-md border border-white/[.08]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Doctor ID দিয়ে ডাক্তার যুক্ত করুন</DialogTitle>
            </DialogHeader>
            <form onSubmit={async (e) => {
              e.preventDefault()
              if (!doctorIdInput.trim()) return
              setAddingDoctor(true)
              try {
                const res = await fetch("/api/patient/doctors", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ doctorId: doctorIdInput.trim(), action: "add_doctor" }),
                })
                if (res.ok) {
                  toast.success("ডাক্তার সফলভাবে যুক্ত হয়েছে")
                  setDoctorIdInput("")
                  setDoctorAddOpen(false)
                  const updated = await fetch("/api/patient/doctors").then(r => r.ok && r.json())
                  if (updated) setDoctors(updated)
                } else {
                  const err = await res.json()
                  toast.error(err.error || "ডাক্তার পাওয়া যায়নি")
                }
              } catch {
                toast.error("সমস্যা হয়েছে")
              } finally {
                setAddingDoctor(false)
              }
            }} className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Doctor ID</label>
                <Input placeholder="যেমন: DOC-E4DC" value={doctorIdInput}
                  onChange={e => setDoctorIdInput(e.target.value)}
                  className="glass border-white/[.08] text-foreground uppercase font-mono" />
                <p className="text-[10px] text-muted-foreground/60">ডাক্তারকে তার Doctor ID জিজ্ঞেস করে নিন</p>
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setDoctorAddOpen(false)}
                  className="border-white/[.08] text-muted-foreground">বাতিল</Button>
                <Button type="submit" disabled={addingDoctor} className="gradient-primary text-[#160500]">
                  {addingDoctor && <span className="inline-block w-4 h-4 border-2 border-[#160500] border-t-transparent rounded-full animate-spin mr-2" />}
                  যুক্ত করুন
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  )
}
