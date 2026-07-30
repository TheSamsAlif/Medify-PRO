"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, Search, Phone, Mail, MapPin, AlertTriangle, Calendar, Heart, Droplets, FileText, Pill, Activity, X, ChevronRight, Plus } from "lucide-react"
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
  const [addOpen, setAddOpen] = useState(false)
  const [addPatientId, setAddPatientId] = useState("")
  const [adding, setAdding] = useState(false)

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
    } catch { toast.error(t("patients.loadError")) } finally { setDetailLoading(false) }
  }

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addPatientId.trim()) return
    setAdding(true)
    try {
      const res = await fetch("/api/doctor/patients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patientId: addPatientId.trim() }) })
      if (res.ok) { toast.success(t("doctor.patientAdded")); setAddPatientId(""); setAddOpen(false); fetchPatients() }
      else { const err = await res.json(); toast.error(err.error || t("patients.patientNotFound")) }
    } catch { toast.error(t("patients.addError")) } finally { setAdding(false) }
  }

  const filtered = patients.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search) || p.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t("doctor.patientList")}</h2>
          <p className="text-muted-foreground mt-1">{t("patients.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="text-sm px-4 py-2 bg-white/[.06] text-foreground border-white/[.08]">
            <Users className="w-4 h-4 text-[#F96801] mr-2" />
            {t("patients.count").replace("{n}", String(patients.length))}
          </Badge>
          <Button onClick={() => setAddOpen(true)} className="gradient-primary text-[#160500] rounded-xl text-xs h-9">
            <Plus className="w-4 h-4 mr-1" /> {t("patients.addPatient")}
          </Button>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder={t("patients.search")}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 glass border-white/[.08] text-foreground w-full md:w-96"
        />
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl glass" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border border-white/[.08] glass-card p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground text-sm">{t("patients.noPatients")}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((patient, i) => (
            <Card key={i} className="border border-white/[.08] glass-card hover:border-[#F96801]/30 transition-all cursor-pointer" onClick={() => openPatientDetail(patient)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 border border-white/[.08]">
                    <AvatarImage src={patient.image || ""} />
                    <AvatarFallback className="bg-[#F96801]/20 text-[#F96801] font-bold">{patient.name?.charAt(0) || "P"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground">{patient.name}</h4>
                      {patient.gender && <Badge className="bg-white/[.06] text-muted-foreground text-xs">{patient.gender}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {patient.age ? t("emergency.age").replace("{n}", String(patient.age)) : ""} {patient.bloodGroup ? `• ${patient.bloodGroup}` : ""} {patient.phone ? `• ${patient.phone}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {patient.phone && (
                      <a href={`tel:${patient.phone}`} onClick={e => e.stopPropagation()}>
                        <Button variant="outline" size="sm" className="rounded-xl text-xs border-white/[.08] text-muted-foreground h-8 w-8 p-0"><Phone className="w-4 h-4" /></Button>
                      </a>
                    )}
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Patient Detail Dialog */}
      <Dialog open={!!selectedPatient} onOpenChange={() => { setSelectedPatient(null); setPatientDetail(null); setPatientRecords(null) }}>
        <DialogContent className="dialog-glass text-foreground max-w-3xl max-h-[85vh] overflow-y-auto">
          {detailLoading ? (
            <div className="space-y-4 p-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl glass" />)}</div>
          ) : patientDetail ? (
            <>
              <DialogHeader className="glass-light rounded-2xl p-4 mb-2">
                <DialogTitle className="text-xl font-bold flex items-center gap-3">
                  <Avatar className="w-10 h-10 border border-white/[.10] ring-2 ring-[#F96801]/20">
                    <AvatarFallback className="bg-[#F96801]/20 text-[#F96801] font-bold">{patientDetail.name?.charAt(0) || "P"}</AvatarFallback>
                  </Avatar>
                  <span className="text-white">{patientDetail.name}</span>
                  <span className="text-sm text-muted-foreground font-normal">- {t("doctor.patientDetails")}</span>
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="info" className="w-full">
                <TabsList className="glass-light p-1.5 rounded-2xl mb-4">
                  <TabsTrigger value="info" className="data-[state=active]:bg-[#F96801] data-[state=active]:text-[#160500] rounded-xl text-xs py-2">{t("patients.tabInfo")}</TabsTrigger>
                  <TabsTrigger value="medical" className="data-[state=active]:bg-[#F96801] data-[state=active]:text-[#160500] rounded-xl text-xs py-2">{t("patients.tabMedical")}</TabsTrigger>
                  <TabsTrigger value="prescriptions" className="data-[state=active]:bg-[#F96801] data-[state=active]:text-[#160500] rounded-xl text-xs py-2">{t("patients.tabPrescriptions")}</TabsTrigger>
                  <TabsTrigger value="records" className="data-[state=active]:bg-[#F96801] data-[state=active]:text-[#160500] rounded-xl text-xs py-2">{t("patients.tabRecords")}</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl glass-light">
                    <div><span className="text-xs text-muted-foreground">{t("patients.name")}</span><p className="text-sm font-medium text-white">{patientDetail.name}</p></div>
                    <div><span className="text-xs text-muted-foreground">{t("patients.email")}</span><p className="text-sm text-white">{patientDetail.email || t("patients.none")}</p></div>
                    <div><span className="text-xs text-muted-foreground">{t("patients.phone")}</span><p className="text-sm text-white">{patientDetail.phone || t("patients.none")}</p></div>
                    <div><span className="text-xs text-muted-foreground">{t("patients.emergencyPhone")}</span><p className="text-sm text-white">{patientDetail.emergencyPhone || t("patients.none")}</p></div>
                    <div><span className="text-xs text-muted-foreground">{t("patients.age")}</span><p className="text-sm text-white">{patientDetail.age ? t("emergency.age").replace("{n}", String(patientDetail.age)) : t("patients.none")}</p></div>
                    <div><span className="text-xs text-muted-foreground">{t("patients.gender")}</span><p className="text-sm text-white">{patientDetail.gender || t("patients.none")}</p></div>
                    <div><span className="text-xs text-muted-foreground">{t("patients.bloodGroup")}</span><p className="text-sm text-white">{patientDetail.bloodGroup || t("patients.none")}</p></div>
                    <div><span className="text-xs text-muted-foreground">{t("patients.bloodType")}</span><p className="text-sm text-white">{patientDetail.bloodType || t("patients.none")}</p></div>
                    <div className="col-span-2"><span className="text-xs text-muted-foreground">{t("patients.address")}</span><p className="text-sm text-white">{patientDetail.address || t("patients.none")}</p></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl glass-light text-center">
                      <p className="text-xl font-bold text-white">{patientDetail.heightCm || "-"}</p>
                      <p className="text-xs text-muted-foreground">{t("patients.height")}</p>
                    </div>
                    <div className="p-4 rounded-2xl glass-light text-center">
                      <p className="text-xl font-bold text-white">{patientDetail.weightKg || "-"}</p>
                      <p className="text-xs text-muted-foreground">{t("patients.weight")}</p>
                    </div>
                    <div className="p-4 rounded-2xl glass-light text-center">
                      <p className="text-xl font-bold text-white">{patientDetail.bmi || "-"}</p>
                      <p className="text-xs text-muted-foreground">{t("patients.bmi")}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="medical" className="space-y-4">
                  <div>
                    <p className="font-medium text-foreground mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" /> {t("patients.allergies")}</p>
                    <div className="flex gap-2 flex-wrap">
                      {patientDetail.allergies?.length > 0 ? patientDetail.allergies.map((a: string, i: number) => (
                        <Badge key={i} className="bg-red-500/20 text-red-400 text-xs">{a}</Badge>
                      )) : <p className="text-xs text-muted-foreground">{t("patients.noAllergies")}</p>}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-2 flex items-center gap-2"><Heart className="w-4 h-4 text-amber-400" /> {t("patients.chronicConditions")}</p>
                    <div className="flex gap-2 flex-wrap">
                      {patientDetail.chronicConditions?.length > 0 ? patientDetail.chronicConditions.map((c: string, i: number) => (
                        <Badge key={i} className="bg-amber-500/20 text-amber-400 text-xs">{c}</Badge>
                      )) : <p className="text-xs text-muted-foreground">{t("patients.noChronic")}</p>}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-2">{t("patients.emergencyContact")}</p>
                    <div className="p-3 rounded-xl glass border border-white/[.08]">
                      <p className="text-foreground">{patientDetail.emergencyContact || t("patients.none")}</p>
                      <p className="text-xs text-muted-foreground">{patientDetail.emergencyRelation || ""}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="prescriptions" className="space-y-3">
                  {patientRecords?.prescriptions?.length > 0 ? patientRecords.prescriptions.map((p: any, i: number) => (
                    <Card key={i} className="border border-white/[.08] glass-card">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("bn-BD")}</p>
                            {p.diagnosis && <p className="text-sm font-medium text-foreground mt-1">{p.diagnosis}</p>}
                          </div>
                          <Badge className="bg-[#25C2C3]/20 text-[#25C2C3] text-xs">{t("patients.prescriptionCount").replace("{n}", String(p.medicines?.length || 0))}</Badge>
                        </div>
                        {p.medicines?.map((m: any, mi: number) => (
                          <div key={mi} className="flex items-center gap-2 text-xs text-muted-foreground glass p-1.5 rounded-lg mt-1">
                            <Pill className="w-3 h-3 text-[#F96801]" />
                            <span className="text-foreground">{m.name}</span>
                            <span>{m.dosage}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )) : <p className="text-muted-foreground text-sm text-center py-4">{t("patients.noPrescriptions")}</p>}
                </TabsContent>

                <TabsContent value="records" className="space-y-3">
                  {patientRecords?.healthRecords?.length > 0 ? patientRecords.healthRecords.map((r: any, i: number) => (
                    <Card key={i} className="border border-white/[.08] glass-card">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#25C2C3]/20 flex items-center justify-center">
                          {r.type === "LAB" ? <FileText className="w-4 h-4 text-[#25C2C3]" /> : <Activity className="w-4 h-4 text-[#25C2C3]" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{r.title}</p>
                          <p className="text-xs text-muted-foreground">{r.type} • {new Date(r.date).toLocaleDateString("bn-BD")}</p>
                        </div>
                        {r.value && <Badge className="bg-white/[.06] text-muted-foreground text-xs">{r.value} {r.unit}</Badge>}
                      </CardContent>
                    </Card>
                  )) : <p className="text-muted-foreground text-sm text-center py-4">{t("patients.noRecords")}</p>}

                  {patientRecords?.healthMetrics?.length > 0 && (
                    <div>
                      <p className="font-medium text-foreground mb-2 mt-4">{t("patients.vitalSigns")}</p>
                      {patientRecords.healthMetrics.slice(0, 10).map((m: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg glass mb-1">
                          <span className="text-xs text-muted-foreground">{m.type}</span>
                          <span className="text-sm text-foreground">{m.value} {m.unit}</span>
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
                    <Button className="gradient-primary text-[#160500] w-full rounded-xl text-xs"><Phone className="w-4 h-4 mr-1" /> {t("patients.call")}</Button>
                  </a>
                )}
                <Link href={`/doctor/prescriptions?patientId=${selectedPatient?.patientId}`} className="flex-1">
                  <Button variant="outline" className="border-white/[.08] text-muted-foreground w-full rounded-xl text-xs">
                    <Pill className="w-4 h-4 mr-1" /> {t("patients.prescription")}
                  </Button>
                </Link>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
      {/* Add Patient Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="dialog-glass text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{t("patients.addDialogTitle")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPatient} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">{t("patients.patientIdLabel")}</label>
              <Input placeholder={t("patients.patientIdLabel")} value={addPatientId} onChange={e => setAddPatientId(e.target.value)} className="glass border-white/[.08] text-foreground uppercase font-mono" />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="border-white/[.08] text-muted-foreground">{t("patients.cancel")}</Button>
              <Button type="submit" disabled={adding} className="gradient-primary text-[#160500]">
                {adding && <span className="inline-block w-4 h-4 border-2 border-[#160500] border-t-transparent rounded-full animate-spin mr-2" />}
                {t("patients.add")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
