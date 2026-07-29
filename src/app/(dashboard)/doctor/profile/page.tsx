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
import { Badge } from "@/components/ui/badge"
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
        toast.success("প্রোফাইল আপডেট হয়েছে")
        setEditOpen(false)
        update({ name: form.name })
      } else toast.error("সমস্যা হয়েছে")
    } catch { toast.error("নেটওয়ার্ক ত্রুটি") } finally { setSaving(false) }
  }

  if (loading) {
    return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl bg-white/[.04]" />)}</div>
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="border border-white/[.08] bg-[#0a0d16] overflow-hidden">
          <div className="gradient-primary p-6 text-[#160500] text-center relative">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}
              className="absolute top-4 right-4 bg-white/20 border-white/30 text-[#160500] hover:bg-white/30 text-xs rounded-xl">
              <Edit3 className="w-3.5 h-3.5 mr-1.5" /> সম্পাদনা
            </Button>
            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-white/30 shadow-lg">
              <AvatarImage src={profile?.image || session?.user?.image || ""} />
              <AvatarFallback className="bg-white/25 text-[#160500] text-3xl font-bold">
                {profile?.name?.charAt(0) || "D"}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold">{profile?.name || "ডাক্তার"}</h2>
            <p className="text-[#160500]/80 text-sm">{profile?.specialization || ""}</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Badge className="bg-white/25 text-[#160500] border-0 font-semibold">ডাক্তার</Badge>
              {profile?.registrationNumber && (
                <Badge className="bg-[#160500]/20 text-[#160500] border-0 font-mono font-bold">
                  Reg: {profile.registrationNumber}
                </Badge>
              )}
            </div>
          </div>
        </Card>

        {/* Professional Info */}
        <Card className="border border-white/[.08] bg-[#0a0d16]">
          <CardHeader>
            <CardTitle className="text-lg text-[#EFF2F2] flex items-center gap-2"><Stethoscope className="w-5 h-5 text-[#F96801]" /> পেশাগত তথ্য</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: GraduationCap, label: "ডিগ্রী", value: profile?.degree },
                { icon: Star, label: "স্পেশালাইজেশন", value: profile?.specialization },
                { icon: Clock, label: "অভিজ্ঞতা", value: profile?.experience ? `${profile.experience} বছর` : "" },
                { icon: DollarSign, label: "কনসালটেশন ফি", value: profile?.consultationFee ? `৳${profile.consultationFee}` : "" },
                { icon: Hospital, label: "হাসপাতাল", value: profile?.hospitalName },
                { icon: BadgeCheck, label: "রেজিস্ট্রেশন নং", value: profile?.registrationNumber },
              ].map((item, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/[.04] border border-white/[.08]">
                  <div className="flex items-center gap-2 mb-1">
                    <item.icon className="w-4 h-4 text-[#F96801]" />
                    <span className="text-xs text-[#A5ABB0]">{item.label}</span>
                  </div>
                  <p className="text-sm text-[#EFF2F2]">{item.value || "—"}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact & Location */}
        <Card className="border border-white/[.08] bg-[#0a0d16]">
          <CardHeader>
            <CardTitle className="text-lg text-[#EFF2F2] flex items-center gap-2"><MapPin className="w-5 h-5 text-[#25C2C3]" /> যোগাযোগ ও অবস্থান</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[.04] border border-white/[.08]">
              <Mail className="w-5 h-5 text-[#A5ABB0]" />
              <div><p className="text-sm text-[#EFF2F2]">{profile?.email || "নেই"}</p><p className="text-xs text-[#A5ABB0]">ইমেইল</p></div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[.04] border border-white/[.08]">
              <Phone className="w-5 h-5 text-[#A5ABB0]" />
              <div><p className="text-sm text-[#EFF2F2]">{profile?.phone || "নেই"}</p><p className="text-xs text-[#A5ABB0]">ফোন</p></div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[.04] border border-white/[.08]">
              <MapPin className="w-5 h-5 text-[#A5ABB0]" />
              <div><p className="text-sm text-[#EFF2F2]">{profile?.chamberLocation || "দেওয়া হয়নি"}</p><p className="text-xs text-[#A5ABB0]">চেম্বারের অবস্থান</p></div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[.04] border border-white/[.08]">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-[#A5ABB0]" />
                <div>
                  <p className="text-sm text-[#EFF2F2]">{profile?.isAvailable ? "প্রাপ্তিসাধ্য" : "অপ্রাপ্তিসাধ্য"}</p>
                  <p className="text-xs text-[#A5ABB0]">বর্তমান অবস্থা</p>
                </div>
              </div>
              <Switch checked={profile?.isAvailable !== false} disabled />
            </div>
            {profile?.languagesSpoken?.length > 0 && (
              <div className="p-3 rounded-xl bg-white/[.04] border border-white/[.08]">
                <p className="text-xs text-[#A5ABB0] mb-2">ভাষা</p>
                <div className="flex gap-2 flex-wrap">
                  {profile.languagesSpoken.map((l: string, i: number) => (
                    <Badge key={i} className="bg-[#25C2C3]/20 text-[#25C2C3] text-xs">{l}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="bg-[#0a0d16] border border-white/[.08] text-[#EFF2F2] max-w-xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">প্রোফাইল সম্পাদনা</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#A5ABB0]">নাম</Label>
                  <Input value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#A5ABB0]">ফোন</Label>
                  <Input value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#A5ABB0]">ডিগ্রী</Label>
                  <Input value={form.degree || ""} onChange={e => setForm({ ...form, degree: e.target.value })} placeholder="MBBS, FCPS, MD" className="bg-white/[.04] border-white/[.08] text-[#EFF2F2]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#A5ABB0]">স্পেশালাইজেশন</Label>
                  <Input value={form.specialization || ""} onChange={e => setForm({ ...form, specialization: e.target.value })} placeholder="Cardiology, Neurology" className="bg-white/[.04] border-white/[.08] text-[#EFF2F2]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#A5ABB0]">অভিজ্ঞতা (বছর)</Label>
                  <Input type="number" value={form.experience || ""} onChange={e => setForm({ ...form, experience: e.target.value })} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#A5ABB0]">কনসালটেশন ফি (৳)</Label>
                  <Input type="number" value={form.consultationFee || ""} onChange={e => setForm({ ...form, consultationFee: e.target.value })} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#A5ABB0]">হাসপাতাল</Label>
                  <Input value={form.hospitalName || ""} onChange={e => setForm({ ...form, hospitalName: e.target.value })} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#A5ABB0]">রেজিস্ট্রেশন নম্বর</Label>
                  <Input value={form.registrationNumber || ""} onChange={e => setForm({ ...form, registrationNumber: e.target.value })} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2] font-mono" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#A5ABB0]">ঠিকানা</Label>
                <Textarea value={form.address || ""} onChange={e => setForm({ ...form, address: e.target.value })} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2] min-h-[60px]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#A5ABB0]">চেম্বারের অবস্থান</Label>
                <Input value={form.chamberLocation || ""} onChange={e => setForm({ ...form, chamberLocation: e.target.value })} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2]" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[.04] border border-white/[.08]">
                <span className="text-sm text-[#EFF2F2]">প্রাপ্তিসাধ্য</span>
                <Switch checked={form.isAvailable !== false} onCheckedChange={v => setForm({ ...form, isAvailable: v })} />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="border-white/[.08] text-[#A5ABB0]">বাতিল</Button>
                <Button type="submit" disabled={saving} className="gradient-primary text-[#160500]">
                  {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  সংরক্ষণ করুন
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  )
}
