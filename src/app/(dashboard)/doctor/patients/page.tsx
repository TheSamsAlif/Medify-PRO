"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, Search, Phone, Mail, MapPin, AlertTriangle, Calendar, Heart, Droplets, FileText, Pill, Activity, X, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n"
import Link from "next/link"

export default function DoctorPatients() {
  const { t } = useI18n()
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [patientDetail, setPatientDetail] = useState<any>(null)
  const [patientRecords, setPatientRecords] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => { fetchPatients() }, [])

  const fetchPatients = async () => {
    try {
      const res = await fetch("/api/doctor/patients")
      if (res.ok) setPatients(await res.json())
    } catch {} finally { setLoading(false) }
  }

  const openPatientDetail = async (p: any) => {
    setSelectedPatient(p)
    setDetailLoading(true)
    try {
      const [detailRes, recordsRes] = await Promise.all([
        fetch(`/api/doctor/patients/${p.patientId}`),
        fetch(`/api/doctor/patients/${p.patientId}/records`),
      ])
      if (detailRes.ok) setPatientDetail(await detailRes.json())
      if (recordsRes.ok) setPatientRecords(await recordsRes.json())
    } catch { toast.error("ডেটা লোড করতে সমস্যা") } finally { setDetailLoading(false) }
  }

  const filtered = patients.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search) || p.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#EFF2F2]">{t("doctor.patientList")}</h2>
          <p className="text-[#A5ABB0] mt-1">রোগীদের সম্পূর্ণ তথ্য দেখুন</p>
        </div>
        <Badge className="text-sm px-4 py-2 bg-white/[.06] text-[#EFF2F2] border-white/[.08]">
          <Users className="w-4 h-4 text-[#F96801] mr-2" />
          {patients.length} জন
        </Badge>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A5ABB0]" />
        <Input
          placeholder="নাম, ফোন বা ইমেইল দিয়ে খুঁজুন..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 bg-white/[.04] border-white/[.08] text-[#EFF2F2] w-full md:w-96"
        />
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl bg-white/[.04]" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border border-white/[.08] bg-[#0a0d16] p-12 text-center">
          <Users className="w-12 h-12 text-[#A5ABB0] mx-auto mb-3 opacity-50" />
          <p className="text-[#A5ABB0] text-sm">{t("doctor.noPatients")}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((patient, i) => (
            <Card key={i} className="border border-white/[.08] bg-[#0a0d16] hover:border-[#F96801]/30 transition-all cursor-pointer" onClick={() => openPatientDetail(patient)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 border border-white/[.08]">
                    <AvatarImage src={patient.image || ""} />
                    <AvatarFallback className="bg-[#F96801]/20 text-[#F96801] font-bold">{patient.name?.charAt(0) || "P"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-[#EFF2F2]">{patient.name}</h4>
                      {patient.gender && <Badge className="bg-white/[.06] text-[#A5ABB0] text-xs">{patient.gender}</Badge>}
                    </div>
                    <p className="text-xs text-[#A5ABB0] mt-0.5">
                      {patient.age ? `${patient.age} বছর` : ""} {patient.bloodGroup ? `• ${patient.bloodGroup}` : ""} {patient.phone ? `• ${patient.phone}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {patient.phone && (
                      <a href={`tel:${patient.phone}`} onClick={e => e.stopPropagation()}>
                        <Button variant="outline" size="sm" className="rounded-xl text-xs border-white/[.08] text-[#A5ABB0] h-8 w-8 p-0"><Phone className="w-4 h-4" /></Button>
                      </a>
                    )}
                    <ChevronRight className="w-5 h-5 text-[#A5ABB0]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Patient Detail Dialog */}
      <Dialog open={!!selectedPatient} onOpenChange={() => { setSelectedPatient(null); setPatientDetail(null); setPatientRecords(null) }}>
        <DialogContent className="bg-[#0a0d16] border border-white/[.08] text-[#EFF2F2] max-w-3xl max-h-[85vh] overflow-y-auto">
          {detailLoading ? (
            <div className="space-y-4 p-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl bg-white/[.04]" />)}</div>
          ) : patientDetail ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-3">
                  <Avatar className="w-10 h-10 border border-white/[.08]">
                    <AvatarFallback className="bg-[#F96801]/20 text-[#F96801] font-bold">{patientDetail.name?.charAt(0) || "P"}</AvatarFallback>
                  </Avatar>
                  {patientDetail.name} - রোগীর বিবরণ
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="info" className="w-full">
                <TabsList className="bg-white/[.04] border border-white/[.08] p-1 rounded-xl mb-4">
                  <TabsTrigger value="info" className="data-[state=active]:bg-[#F96801] data-[state=active]:text-[#160500] rounded-lg text-xs">তথ্য</TabsTrigger>
                  <TabsTrigger value="medical" className="data-[state=active]:bg-[#F96801] data-[state=active]:text-[#160500] rounded-lg text-xs">মেডিকেল</TabsTrigger>
                  <TabsTrigger value="prescriptions" className="data-[state=active]:bg-[#F96801] data-[state=active]:text-[#160500] rounded-lg text-xs">প্রেসক্রিপশন</TabsTrigger>
                  <TabsTrigger value="records" className="data-[state=active]:bg-[#F96801] data-[state=active]:text-[#160500] rounded-lg text-xs">রেকর্ড</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white/[.04] border border-white/[.08]">
                    <div><span className="text-xs text-[#A5ABB0]">নাম</span><p className="text-[#EFF2F2]">{patientDetail.name}</p></div>
                    <div><span className="text-xs text-[#A5ABB0]">ইমেইল</span><p className="text-[#EFF2F2]">{patientDetail.email || "নেই"}</p></div>
                    <div><span className="text-xs text-[#A5ABB0]">ফোন</span><p className="text-[#EFF2F2]">{patientDetail.phone || "নেই"}</p></div>
                    <div><span className="text-xs text-[#A5ABB0]">জরুরি ফোন</span><p className="text-[#EFF2F2]">{patientDetail.emergencyPhone || "নেই"}</p></div>
                    <div><span className="text-xs text-[#A5ABB0]">বয়স</span><p className="text-[#EFF2F2]">{patientDetail.age ? `${patientDetail.age} বছর` : "নেই"}</p></div>
                    <div><span className="text-xs text-[#A5ABB0]">লিঙ্গ</span><p className="text-[#EFF2F2]">{patientDetail.gender || "নেই"}</p></div>
                    <div><span className="text-xs text-[#A5ABB0]">রক্তের গ্রুপ</span><p className="text-[#EFF2F2]">{patientDetail.bloodGroup || "নেই"}</p></div>
                    <div><span className="text-xs text-[#A5ABB0]">রক্তের ধরন</span><p className="text-[#EFF2F2]">{patientDetail.bloodType || "নেই"}</p></div>
                    <div className="col-span-2"><span className="text-xs text-[#A5ABB0]">ঠিকানা</span><p className="text-[#EFF2F2]">{patientDetail.address || "নেই"}</p></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-white/[.04] border border-white/[.08] text-center">
                      <p className="text-lg font-bold text-[#EFF2F2]">{patientDetail.heightCm || "-"}</p>
                      <p className="text-xs text-[#A5ABB0]">উচ্চতা (cm)</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[.04] border border-white/[.08] text-center">
                      <p className="text-lg font-bold text-[#EFF2F2]">{patientDetail.weightKg || "-"}</p>
                      <p className="text-xs text-[#A5ABB0]">ওজন (kg)</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[.04] border border-white/[.08] text-center">
                      <p className="text-lg font-bold text-[#EFF2F2]">{patientDetail.bmi || "-"}</p>
                      <p className="text-xs text-[#A5ABB0]">BMI</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="medical" className="space-y-4">
                  <div>
                    <p className="font-medium text-[#EFF2F2] mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" /> এলার্জি</p>
                    <div className="flex gap-2 flex-wrap">
                      {patientDetail.allergies?.length > 0 ? patientDetail.allergies.map((a: string, i: number) => (
                        <Badge key={i} className="bg-red-500/20 text-red-400 text-xs">{a}</Badge>
                      )) : <p className="text-xs text-[#A5ABB0]">কোনো এলার্জি নেই</p>}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-[#EFF2F2] mb-2 flex items-center gap-2"><Heart className="w-4 h-4 text-amber-400" /> দীর্ঘমেয়াদী রোগ</p>
                    <div className="flex gap-2 flex-wrap">
                      {patientDetail.chronicConditions?.length > 0 ? patientDetail.chronicConditions.map((c: string, i: number) => (
                        <Badge key={i} className="bg-amber-500/20 text-amber-400 text-xs">{c}</Badge>
                      )) : <p className="text-xs text-[#A5ABB0]">কোনো দীর্ঘমেয়াদী রোগ নেই</p>}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-[#EFF2F2] mb-2">জরুরি যোগাযোগ</p>
                    <div className="p-3 rounded-xl bg-white/[.04] border border-white/[.08]">
                      <p className="text-[#EFF2F2]">{patientDetail.emergencyContact || "নেই"}</p>
                      <p className="text-xs text-[#A5ABB0]">{patientDetail.emergencyRelation || ""}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="prescriptions" className="space-y-3">
                  {patientRecords?.prescriptions?.length > 0 ? patientRecords.prescriptions.map((p: any, i: number) => (
                    <Card key={i} className="border border-white/[.08] bg-[#0a0d16]">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs text-[#A5ABB0]">{new Date(p.createdAt).toLocaleDateString("bn-BD")}</p>
                            {p.diagnosis && <p className="text-sm font-medium text-[#EFF2F2] mt-1">{p.diagnosis}</p>}
                          </div>
                          <Badge className="bg-[#25C2C3]/20 text-[#25C2C3] text-xs">{p.medicines?.length || 0}টি ওষুধ</Badge>
                        </div>
                        {p.medicines?.map((m: any, mi: number) => (
                          <div key={mi} className="flex items-center gap-2 text-xs text-[#A5ABB0] bg-white/[.04] p-1.5 rounded-lg mt-1">
                            <Pill className="w-3 h-3 text-[#F96801]" />
                            <span className="text-[#EFF2F2]">{m.name}</span>
                            <span>{m.dosage}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )) : <p className="text-[#A5ABB0] text-sm text-center py-4">কোনো প্রেসক্রিপশন নেই</p>}
                </TabsContent>

                <TabsContent value="records" className="space-y-3">
                  {patientRecords?.healthRecords?.length > 0 ? patientRecords.healthRecords.map((r: any, i: number) => (
                    <Card key={i} className="border border-white/[.08] bg-[#0a0d16]">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#25C2C3]/20 flex items-center justify-center">
                          {r.type === "LAB" ? <FileText className="w-4 h-4 text-[#25C2C3]" /> : <Activity className="w-4 h-4 text-[#25C2C3]" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#EFF2F2]">{r.title}</p>
                          <p className="text-xs text-[#A5ABB0]">{r.type} • {new Date(r.date).toLocaleDateString("bn-BD")}</p>
                        </div>
                        {r.value && <Badge className="bg-white/[.06] text-[#A5ABB0] text-xs">{r.value} {r.unit}</Badge>}
                      </CardContent>
                    </Card>
                  )) : <p className="text-[#A5ABB0] text-sm text-center py-4">কোনো রেকর্ড নেই</p>}

                  {patientRecords?.healthMetrics?.length > 0 && (
                    <div>
                      <p className="font-medium text-[#EFF2F2] mb-2 mt-4">ভাইটাল সিগনস</p>
                      {patientRecords.healthMetrics.slice(0, 10).map((m: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/[.04] mb-1">
                          <span className="text-xs text-[#A5ABB0]">{m.type}</span>
                          <span className="text-sm text-[#EFF2F2]">{m.value} {m.unit}</span>
                          <span className="text-xs text-white/30">{new Date(m.date).toLocaleDateString("bn-BD")}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 mt-4">
                {patientDetail.phone && (
                  <a href={`tel:${patientDetail.phone}`} className="flex-1">
                    <Button className="gradient-primary text-[#160500] w-full rounded-xl text-xs"><Phone className="w-4 h-4 mr-1" /> কল করুন</Button>
                  </a>
                )}
                <Link href={`/doctor/prescriptions?patientId=${selectedPatient?.patientId}`} className="flex-1">
                  <Button variant="outline" className="border-white/[.08] text-[#A5ABB0] w-full rounded-xl text-xs">
                    <Pill className="w-4 h-4 mr-1" /> প্রেসক্রিপশন
                  </Button>
                </Link>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
