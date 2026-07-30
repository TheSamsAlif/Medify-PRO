"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User, Mail, Phone, Stethoscope, GraduationCap, Star, DollarSign, MapPin, Globe, Clock, Hospital, BadgeCheck, Edit3, Loader2, Save, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { useI18n } from "@/lib/i18n"

export default function DoctorProfile() {
  const { t, lang, setLang } = useI18n()
  const { data: session, update } = useSession()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState<any>({})

  useEffect(() => {
    fetch("/api/doctor/profile").then(r => r.ok && r.json()).then(d => { setProfile(d); setForm(d || {}) }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/doctor/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      if (res.ok) {
        const data = await res.json()
        setProfile(data.user || form)
        toast.success(t("doctorProfile.updated"))
        setEditOpen(false)
        update({ name: form.name })
      } else toast.error(t("doctorProfile.updateError"))
    } catch { toast.error(t("doctorProfile.networkError")) } finally { setSaving(false) }
  }

  if (loading) {
    return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl glass" />)}</div>
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="relative glass-card rounded-2xl p-8 text-center border border-white/[.08] shadow-[0_8px_32px_rgba(249,104,1,0.08)]">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[.02] to-transparent pointer-events-none" />
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}
            className="absolute top-4 right-4 glass border-white/[.08] text-muted-foreground hover:text-foreground text-xs rounded-xl">
            <Edit3 className="w-3.5 h-3.5 mr-1.5" /> {t("doctorProfile.edit")}
          </Button>
          <Avatar className="w-24 h-24 mx-auto mb-4 shadow-[0_0_30px_rgba(220,38,38,0.3)]">
            <AvatarImage src={profile?.image || session?.user?.image || ""} />
            <AvatarFallback className="bg-gradient-to-br from-[#DC2626] to-[#F96801] text-white text-3xl font-bold">
              {profile?.name?.charAt(0) || "D"}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold text-foreground">{profile?.name || t("profile.doctor")}</h2>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/[.06] border border-white/[.08] text-foreground shadow-[0_0_12px_rgba(220,38,38,0.1)]">
              {t("profile.doctor")}
            </span>
            {profile?.registrationNumber && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono bg-white/[.06] border border-white/[.08] text-muted-foreground">
                Reg: {profile.registrationNumber}
              </span>
            )}
          </div>
        </div>

        {/* Professional Info */}
        <Card className="border border-white/[.08] glass-card">
          <CardHeader>
            <CardTitle className="text-lg text-foreground flex items-center gap-2"><Stethoscope className="w-5 h-5 text-[#F96801]" /> {t("doctorProfile.professionalInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: GraduationCap, label: t("doctorProfile.degree"), value: profile?.degree },
                { icon: Star, label: t("doctorProfile.specialization"), value: profile?.specialization },
                { icon: Clock, label: t("doctorProfile.experience"), value: profile?.experience ? t("doctorProfile.experienceYears").replace("{n}", String(profile.experience)) : "" },
                { icon: DollarSign, label: t("doctorProfile.consultationFee"), value: profile?.consultationFee ? t("doctorProfile.feeTk").replace("{n}", String(profile.consultationFee)) : "" },
                { icon: Hospital, label: t("doctorProfile.hospital"), value: profile?.hospitalName },
                { icon: BadgeCheck, label: t("doctorProfile.registrationNo"), value: profile?.registrationNumber },
              ].map((item, i) => (
                <div key={i} className="p-3 rounded-xl glass border border-white/[.08]">
                  <div className="flex items-center gap-2 mb-1">
                    <item.icon className="w-4 h-4 text-[#F96801]" />
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                  <p className="text-sm text-foreground">{item.value || "—"}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact & Location */}
        <Card className="border border-white/[.08] glass-card">
          <CardHeader>
            <CardTitle className="text-lg text-foreground flex items-center gap-2"><MapPin className="w-5 h-5 text-[#25C2C3]" /> {t("doctorProfile.contactLocation")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl glass border border-white/[.08]">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div><p className="text-sm text-foreground">{profile?.email || t("common.noData")}</p><p className="text-xs text-muted-foreground">{t("doctorProfile.email")}</p></div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl glass border border-white/[.08]">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <div><p className="text-sm text-foreground">{profile?.phone || t("common.noData")}</p><p className="text-xs text-muted-foreground">{t("doctorProfile.phone")}</p></div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl glass border border-white/[.08]">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div><p className="text-sm text-foreground">{profile?.chamberLocation || t("common.noData")}</p><p className="text-xs text-muted-foreground">{t("doctorProfile.chamberLocation")}</p></div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl glass border border-white/[.08]">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-foreground">{t(profile?.isAvailable ? "doctorProfile.available" : "doctorProfile.notAvailable")}</p>
                  <p className="text-xs text-muted-foreground">{t("doctorProfile.availability")}</p>
                </div>
              </div>
              <Switch checked={profile?.isAvailable !== false} disabled />
            </div>
            {profile?.languagesSpoken?.length > 0 && (
              <div className="p-3 rounded-xl glass border border-white/[.08]">
                <p className="text-xs text-muted-foreground mb-2">{t("doctorProfile.languages")}</p>
                <div className="flex gap-2 flex-wrap">
                  {profile.languagesSpoken.map((l: string, i: number) => (
                    <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-white/[.06] border border-white/[.08] text-[#25C2C3]">{l}</span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="glass-card border border-white/[.08] text-foreground max-w-xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{t("doctorProfile.editProfile")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t("doctorProfile.name")}</Label>
                  <Input value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} className="glass border-white/[.08] text-foreground" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t("doctorProfile.phone")}</Label>
                  <Input value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} className="glass border-white/[.08] text-foreground" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t("doctorProfile.degree")}</Label>
                  <Input value={form.degree || ""} onChange={e => setForm({ ...form, degree: e.target.value })} placeholder="MBBS, FCPS, MD" className="glass border-white/[.08] text-foreground" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t("doctorProfile.specialization")}</Label>
                  <Input value={form.specialization || ""} onChange={e => setForm({ ...form, specialization: e.target.value })} placeholder="Cardiology, Neurology" className="glass border-white/[.08] text-foreground" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t("doctorProfile.experience")}</Label>
                  <Input type="number" value={form.experience || ""} onChange={e => setForm({ ...form, experience: e.target.value })} className="glass border-white/[.08] text-foreground" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t("doctorProfile.consultationFee")}</Label>
                  <Input type="number" value={form.consultationFee || ""} onChange={e => setForm({ ...form, consultationFee: e.target.value })} className="glass border-white/[.08] text-foreground" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t("doctorProfile.hospital")}</Label>
                  <Input value={form.hospitalName || ""} onChange={e => setForm({ ...form, hospitalName: e.target.value })} className="glass border-white/[.08] text-foreground" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t("doctorProfile.registrationNo")}</Label>
                  <Input value={form.registrationNumber || ""} onChange={e => setForm({ ...form, registrationNumber: e.target.value })} className="glass border-white/[.08] text-foreground font-mono" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t("doctorProfile.address")}</Label>
                <Textarea value={form.address || ""} onChange={e => setForm({ ...form, address: e.target.value })} className="glass border-white/[.08] text-foreground min-h-[60px]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t("doctorProfile.chamberLocation")}</Label>
                <Input value={form.chamberLocation || ""} onChange={e => setForm({ ...form, chamberLocation: e.target.value })} className="glass border-white/[.08] text-foreground" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl glass border border-white/[.08]">
                <span className="text-sm text-foreground">{t("doctorProfile.available")}</span>
                <Switch checked={form.isAvailable !== false} onCheckedChange={v => setForm({ ...form, isAvailable: v })} />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="border-white/[.08] text-muted-foreground">{t("doctorProfile.cancel")}</Button>
                <Button type="submit" disabled={saving} className="gradient-primary text-[#160500]">
                  {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {t("doctorProfile.save")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  )
}
