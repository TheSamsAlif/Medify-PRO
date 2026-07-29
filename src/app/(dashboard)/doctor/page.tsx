"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Stethoscope, Users, Calendar, Pill, FileText, ChevronRight, Plus, AlertTriangle, Sunrise, Sun, Sunset, Moon, Clock, CheckCircle2, Heart, Activity, Download, Trash2, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n"

interface Patient {
  id: string; name: string; email?: string; phone?: string; bloodGroup?: string; age?: number; patientId: string
  address?: string; medicines?: any[]; logs?: any[]
  contactRequested?: boolean; contactApproved?: boolean
}

interface Prescription {
  id: string; doctorName?: string; diagnosis?: string; notes?: string; advice?: string; followUpDate?: string
  createdAt: string; medicines: any[]
}

interface Appointment {
  id: string; doctorName: string; date: string; duration: number; status?: string;   user: { id: string; name?: string }
}

interface HealthRecordItem {
  id: string; type: string; title: string; description?: string; value?: string; unit?: string
  date: string; doctorName?: string; hospital?: string
}

export default function DoctorPage() {
  const { t } = useI18n()
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchId, setSearchId] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [activeTab, setActiveTab] = useState("patients")

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [healthRecords, setHealthRecords] = useState<HealthRecordItem[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [selectedPrescriptionPatient, setSelectedPrescriptionPatient] = useState<string>("")
  const [selectedRecordsPatient, setSelectedRecordsPatient] = useState<string>("")
  const [selectedApptPatient, setSelectedApptPatient] = useState<string>("all")

  const [prescribeOpen, setPrescribeOpen] = useState(false)
  const [prescribeForm, setPrescribeForm] = useState({ diagnosis: "", notes: "", advice: "", followUpDate: "", medicines: [{ name: "", dosage: "", frequency: "1+0+0", duration: "", morning: true, noon: false, evening: false, night: false, notes: "" }] })

  useEffect(() => { fetchPatients() }, [])

  const fetchPatients = async () => {
    try {
      const res = await fetch("/api/doctor/patients")
      if (res.ok) setPatients(await res.json())
    } catch { toast.error(t("doctor.title")) } finally { setLoading(false) }
  }

  useEffect(() => {
    if (activeTab === "prescriptions" && selectedPrescriptionPatient) {
      setDataLoading(true)
      fetch(`/api/doctor/prescriptions?patientId=${selectedPrescriptionPatient}`).then(r => r.ok && r.json()).then(d => setPrescriptions(d)).catch(() => {}).finally(() => setDataLoading(false))
    }
  }, [activeTab, selectedPrescriptionPatient])

  useEffect(() => {
    if (activeTab === "appointments") {
      setDataLoading(true)
      const params = selectedApptPatient === "all" ? "" : `?patientId=${selectedApptPatient}`
      fetch(`/api/doctor/appointments${params}`).then(r => r.ok && r.json()).then(d => setAppointments(d)).catch(() => {}).finally(() => setDataLoading(false))
    }
  }, [activeTab, selectedApptPatient])

  useEffect(() => {
    if (activeTab === "records" && selectedRecordsPatient) {
      setDataLoading(true)
      fetch(`/api/doctor/health-records?patientId=${selectedRecordsPatient}`).then(r => r.ok && r.json()).then(d => setHealthRecords(d)).catch(() => {}).finally(() => setDataLoading(false))
    }
  }, [activeTab, selectedRecordsPatient])

  const handleApproveContact = async (patientId: string, approve: boolean) => {
    try {
      const res = await fetch("/api/doctor/approve-contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patientId, approve }) })
      if (res.ok) { toast.success(approve ? "কন্টাক্ট শেয়ার করা হয়েছে" : "অনুরোধ প্রত্যাখ্যান করা হয়েছে"); fetchPatients() }
    } catch { toast.error("সমস্যা হয়েছে") }
  }

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchId.trim()) return
    setAdding(true)
    try {
      const res = await fetch("/api/doctor/patients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patientId: searchId.trim() }) })
      if (res.ok) { toast.success("রোগী সফলভাবে যুক্ত হয়েছে"); setSearchId(""); setAddOpen(false); fetchPatients() }
      else { const err = await res.json(); toast.error(err.error || "রোগী পাওয়া যায়নি") }
    } catch { toast.error("ত্রুটি ঘটেছে") } finally { setAdding(false) }
  }

  const openPatientDetail = (p: Patient) => { setSelectedPatient(p); setSelectedPrescriptionPatient(p.id); setSelectedRecordsPatient(p.id) }

  const handlePrescribe = async () => {
    if (!selectedPrescriptionPatient) { toast.error("রোগী নির্বাচন করুন"); return }
    const m = prescribeForm.medicines.filter(mm => mm.name.trim())
    if (m.length === 0) { toast.error("কমপক্ষে একটি ওষুধ দিন"); return }
    setDataLoading(true)
    try {
      const res = await fetch("/api/doctor/prescriptions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patientId: selectedPrescriptionPatient, ...prescribeForm, medicines: m }) })
      if (res.ok) { toast.success("প্রেসক্রিপশন তৈরি হয়েছে"); setPrescribeOpen(false); setPrescribeForm({ diagnosis: "", notes: "", advice: "", followUpDate: "", medicines: [{ name: "", dosage: "", frequency: "1+0+0", duration: "", morning: true, noon: false, evening: false, night: false, notes: "" }] }); fetch(`/api/doctor/prescriptions?patientId=${selectedPrescriptionPatient}`).then(r => r.ok && r.json()).then(d => setPrescriptions(d)) }
      else { const err = await res.json(); toast.error(err.error || "ত্রুটি") }
    } catch { toast.error("ত্রুটি") } finally { setDataLoading(false) }
  }

  const updateMedicine = (i: number, field: string, value: any) => {
    const meds = [...prescribeForm.medicines]
    meds[i] = { ...meds[i], [field]: value }
    setPrescribeForm({ ...prescribeForm, medicines: meds })
  }

  const addMedicine = () => {
    setPrescribeForm({ ...prescribeForm, medicines: [...prescribeForm.medicines, { name: "", dosage: "", frequency: "1+0+0", duration: "", morning: true, noon: false, evening: false, night: false, notes: "" }] })
  }

  const removeMedicine = (i: number) => {
    if (prescribeForm.medicines.length <= 1) return
    setPrescribeForm({ ...prescribeForm, medicines: prescribeForm.medicines.filter((_, idx) => idx !== i) })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 bg-white/[.04]" />
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl bg-white/[.04]" />)}
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#EFF2F2]">{t("doctor.title")}</h2>
          <p className="text-[#A5ABB0] mt-1">{t("doctor.subtitle")}</p>
        </div>
        <Badge className="text-sm px-4 py-2 gap-2 bg-white/[.06] text-[#EFF2F2] border-white/[.08]">
          <Users className="w-4 h-4 text-[#F96801]" />
          {patients.length} {t("doctor.totalPatients")}
        </Badge>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Users, label: t("doctor.totalPatients"), value: patients.length.toString(), color: "from-[#F96801] to-[#FF8A1E]" },
          { icon: Calendar, label: t("doctor.todayAppointments"), value: "২", color: "from-[#25C2C3] to-teal-500" },
          { icon: AlertTriangle, label: t("doctor.emergencyAlerts"), value: "০", color: "from-amber-500 to-orange-500" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="border border-white/[.08] bg-[#0a0d16]">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} p-3 flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-[#160500]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#EFF2F2]">{stat.value}</p>
                    <p className="text-sm text-[#A5ABB0]">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white/[.04] border border-white/[.08] p-1 rounded-xl mb-6">
          <TabsTrigger value="patients" className="data-[state=active]:bg-[#F96801] data-[state=active]:text-[#160500] rounded-lg text-sm">{t("doctor.tabPatients")}</TabsTrigger>
          <TabsTrigger value="appointments" className="data-[state=active]:bg-[#F96801] data-[state=active]:text-[#160500] rounded-lg text-sm">{t("doctor.tabAppointments")}</TabsTrigger>
          <TabsTrigger value="prescriptions" className="data-[state=active]:bg-[#F96801] data-[state=active]:text-[#160500] rounded-lg text-sm">{t("doctor.tabPrescriptions")}</TabsTrigger>
          <TabsTrigger value="records" className="data-[state=active]:bg-[#F96801] data-[state=active]:text-[#160500] rounded-lg text-sm">{t("doctor.tabRecords")}</TabsTrigger>
        </TabsList>

        {/* === PATIENTS TAB === */}
        <TabsContent value="patients">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#EFF2F2]">{t("doctor.patientList")}</h3>
            <Button onClick={() => setAddOpen(true)} className="gradient-primary text-[#160500] rounded-xl text-xs">
              <Plus className="w-4 h-4 mr-1" /> {t("doctor.addPatient")}
            </Button>
          </div>
          {patients.length === 0 ? (
            <Card className="border border-white/[.08] bg-[#0a0d16] p-12 text-center">
              <Users className="w-12 h-12 text-[#A5ABB0] mx-auto mb-3 opacity-50" />
              <p className="text-[#A5ABB0] text-sm mb-4">{t("doctor.noPatients")}</p>
              <Button onClick={() => setAddOpen(true)} className="gradient-primary text-[#160500] rounded-xl text-xs">
                <Plus className="w-4 h-4 mr-1" /> {t("doctor.addPatient")}
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {patients.map((patient, i) => (
                <Card key={i} className="border border-white/[.08] bg-[#0a0d16] hover:border-[#F96801]/30 transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-14 h-14 border border-white/[.08]">
                        <AvatarFallback className="bg-[#F96801]/20 text-[#F96801] text-lg font-bold">
                          {patient.name?.charAt(0) || "P"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-lg text-[#EFF2F2]">{patient.name}</h4>
                              <Badge className="bg-[#F96801]/20 text-[#F96801] font-mono text-xs">{patient.patientId}</Badge>
                            </div>
                            <p className="text-sm text-[#A5ABB0] mt-0.5">
                              {patient.age ? `${patient.age} বছর` : ""} {patient.bloodGroup ? `• রক্ত: ${patient.bloodGroup}` : ""} {patient.phone ? `• ${patient.phone}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button variant="outline" size="sm" onClick={() => openPatientDetail(patient)}
                            className="rounded-xl text-xs border-white/[.08] text-[#A5ABB0] hover:text-[#EFF2F2]">
                            <FileText className="w-3.5 h-3.5 mr-1 text-[#25C2C3]" /> {t("doctor.patientDetails")}
                          </Button>
                          {patient.phone && (
                            <a href={`tel:${patient.phone}`}>
                              <Button variant="outline" size="sm" className="rounded-xl text-xs border-white/[.08] text-[#A5ABB0] hover:text-[#EFF2F2]">
                                📞 {t("doctor.call")}
                              </Button>
                            </a>
                          )}
                          {patient.contactRequested && !patient.contactApproved && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleApproveContact(patient.id, true)}
                                className="rounded-xl text-xs border-[#25C2C3]/30 text-[#25C2C3] hover:bg-[#25C2C3]/10">
                                ✅ {t("doctor.share")}
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleApproveContact(patient.id, false)}
                                className="rounded-xl text-xs border-red-500/30 text-red-400 hover:bg-red-500/10">
                                ❌ {t("doctor.decline")}
                              </Button>
                            </>
                          )}
                          {patient.contactApproved && (
                            <Badge className="bg-[#25C2C3]/20 text-[#25C2C3] text-xs">{t("doctor.contactShared")}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* === APPOINTMENTS TAB === */}
        <TabsContent value="appointments">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-lg font-bold text-[#EFF2F2]">{t("doctor.appointments")}</h3>
            <Select value={selectedApptPatient} onValueChange={(v) => v !== null && setSelectedApptPatient(v)}>
              <SelectTrigger className="w-48 bg-white/[.04] border-white/[.08] text-[#EFF2F2] text-xs">
                <SelectValue placeholder="সব রোগী" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0d16] border-white/[.08] text-[#EFF2F2]">
                <SelectItem value="all">সব রোগী</SelectItem>
                {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.patientId})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {dataLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl bg-white/[.04]" />)}</div>
          ) : appointments.length === 0 ? (
            <Card className="border border-white/[.08] bg-[#0a0d16] p-12 text-center">
              <Calendar className="w-12 h-12 text-[#A5ABB0] mx-auto mb-3 opacity-50" />
              <p className="text-[#A5ABB0] text-sm">কোনো অ্যাপয়েন্টমেন্ট নেই</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {appointments.map((a, i) => (
                <Card key={i} className="border border-white/[.08] bg-[#0a0d16]">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#F96801]/20 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-[#F96801]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#EFF2F2]">{a.user?.name || "Unknown"}</p>
                      <p className="text-xs text-[#A5ABB0]">{new Date(a.date).toLocaleDateString("bn-BD", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} - {new Date(a.date).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <Badge className="bg-[#25C2C3]/20 text-[#25C2C3] text-xs">{a.duration} মিনিট</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* === PRESCRIPTIONS TAB === */}
        <TabsContent value="prescriptions">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-lg font-bold text-[#EFF2F2]">{t("doctor.prescriptions")}</h3>
            <Select value={selectedPrescriptionPatient} onValueChange={(v) => v !== null && setSelectedPrescriptionPatient(v)}>
              <SelectTrigger className="w-48 bg-white/[.04] border-white/[.08] text-[#EFF2F2] text-xs">
                <SelectValue placeholder="রোগী নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0d16] border-white/[.08] text-[#EFF2F2]">
                {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.patientId})</SelectItem>)}
              </SelectContent>
            </Select>
            {selectedPrescriptionPatient && (
              <Button onClick={() => { setPrescribeOpen(true) }} className="gradient-primary text-[#160500] rounded-xl text-xs ml-auto">
                <Plus className="w-4 h-4 mr-1" /> {t("doctor.addPrescription")}
              </Button>
            )}
          </div>
          {!selectedPrescriptionPatient ? (
            <Card className="border border-white/[.08] bg-[#0a0d16] p-12 text-center">
              <Pill className="w-12 h-12 text-[#A5ABB0] mx-auto mb-3 opacity-50" />
              <p className="text-[#A5ABB0] text-sm">রোগী নির্বাচন করে প্রেসক্রিপশন দেখুন</p>
            </Card>
          ) : dataLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl bg-white/[.04]" />)}</div>
          ) : prescriptions.length === 0 ? (
            <Card className="border border-white/[.08] bg-[#0a0d16] p-12 text-center">
              <Pill className="w-12 h-12 text-[#A5ABB0] mx-auto mb-3 opacity-50" />
              <p className="text-[#A5ABB0] text-sm mb-4">কোনো প্রেসক্রিপশন নেই</p>
              <Button onClick={() => setPrescribeOpen(true)} className="gradient-primary text-[#160500] rounded-xl text-xs">
                <Plus className="w-4 h-4 mr-1" /> {t("doctor.addPrescription")}
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {prescriptions.map((p, i) => (
                <Card key={i} className="border border-white/[.08] bg-[#0a0d16]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xs text-[#A5ABB0]">{new Date(p.createdAt).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })}</p>
                        {p.diagnosis && <p className="text-sm font-medium text-[#EFF2F2] mt-1">নির্ণয়: {p.diagnosis}</p>}
                      </div>
                      <Badge className="bg-[#25C2C3]/20 text-[#25C2C3] text-xs">{p.medicines?.length || 0}টি ওষুধ</Badge>
                    </div>
                    {p.medicines?.length > 0 && (
                      <div className="space-y-1 mt-2">
                        {p.medicines.map((m, mi) => (
                          <div key={mi} className="flex items-center gap-2 text-xs text-[#A5ABB0] bg-white/[.04] p-2 rounded-lg">
                            <Pill className="w-3 h-3 text-[#F96801]" />
                            <span className="text-[#EFF2F2] font-medium">{m.name}</span>
                            <span>{m.dosage}</span>
                            <span className="text-white/40">|</span>
                            <span>{m.frequency}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {p.advice && <p className="text-xs text-[#A5ABB0] mt-2">পরামর্শ: {p.advice}</p>}
                    {p.followUpDate && <p className="text-xs text-[#25C2C3] mt-1">ফলো-আপ: {new Date(p.followUpDate).toLocaleDateString("bn-BD")}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* === HEALTH RECORDS TAB === */}
        <TabsContent value="records">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-lg font-bold text-[#EFF2F2]">{t("doctor.healthRecords")}</h3>
            <Select value={selectedRecordsPatient} onValueChange={(v) => v !== null && setSelectedRecordsPatient(v)}>
              <SelectTrigger className="w-48 bg-white/[.04] border-white/[.08] text-[#EFF2F2] text-xs">
                <SelectValue placeholder="রোগী নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0d16] border-white/[.08] text-[#EFF2F2]">
                {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.patientId})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {!selectedRecordsPatient ? (
            <Card className="border border-white/[.08] bg-[#0a0d16] p-12 text-center">
              <Activity className="w-12 h-12 text-[#A5ABB0] mx-auto mb-3 opacity-50" />
              <p className="text-[#A5ABB0] text-sm">রোগী নির্বাচন করে স্বাস্থ্য রেকর্ড দেখুন</p>
            </Card>
          ) : dataLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl bg-white/[.04]" />)}</div>
          ) : healthRecords.length === 0 ? (
            <Card className="border border-white/[.08] bg-[#0a0d16] p-12 text-center">
              <Activity className="w-12 h-12 text-[#A5ABB0] mx-auto mb-3 opacity-50" />
              <p className="text-[#A5ABB0] text-sm">কোনো স্বাস্থ্য রেকর্ড নেই</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {healthRecords.map((r, i) => (
                <Card key={i} className="border border-white/[.08] bg-[#0a0d16]">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#25C2C3]/20 flex items-center justify-center">
                      {r.type === "LAB" ? <FileText className="w-5 h-5 text-[#25C2C3]" /> : r.type === "VITAL" ? <Heart className="w-5 h-5 text-[#25C2C3]" /> : <Activity className="w-5 h-5 text-[#25C2C3]" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[#EFF2F2]">{r.title}</p>
                        <Badge className="bg-white/[.06] text-[#A5ABB0] text-xs">{r.type}</Badge>
                      </div>
                      {r.description && <p className="text-xs text-[#A5ABB0] mt-0.5">{r.description}</p>}
                      {r.value && <p className="text-xs text-[#25C2C3] mt-0.5">{r.value} {r.unit}</p>}
                      <p className="text-xs text-white/30 mt-0.5">{new Date(r.date).toLocaleDateString("bn-BD")} {r.doctorName ? `- ${r.doctorName}` : ""}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Patient Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-[#0a0d16] border border-white/[.08] text-[#EFF2F2] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{t("doctor.searchPatient")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPatient} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs text-[#A5ABB0]">Patient ID (যেমন: PAT-A1B2C3)</label>
              <Input placeholder="PAT-..." value={searchId} onChange={e => setSearchId(e.target.value)} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2] uppercase font-mono" />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="border-white/[.08] text-[#A5ABB0]">বাতিল</Button>
              <Button type="submit" disabled={adding} className="gradient-primary text-[#160500]">
                {adding && <LoadingSpinner />} {t("doctor.addPatient")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Patient Detail Dialog */}
      {selectedPatient && (
        <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
          <DialogContent className="bg-[#0a0d16] border border-white/[.08] text-[#EFF2F2] max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{selectedPatient.name} - {t("doctor.patientDetails")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white/[.04] border border-white/[.08]">
                <div><span className="text-xs text-[#A5ABB0]">Patient ID:</span> <p className="font-mono text-[#EFF2F2]">{selectedPatient.patientId}</p></div>
                <div><span className="text-xs text-[#A5ABB0]">ইমেইল:</span> <p className="text-[#EFF2F2]">{selectedPatient.email || "নেই"}</p></div>
                <div><span className="text-xs text-[#A5ABB0]">ফোন:</span> <p className="text-[#EFF2F2]">{selectedPatient.phone || "নেই"}</p></div>
                <div><span className="text-xs text-[#A5ABB0]">রক্তের গ্রুপ:</span> <p className="text-[#EFF2F2]">{selectedPatient.bloodGroup || "নেই"}</p></div>
              </div>
              {((med) => med?.length ? (
                <div>
                  <p className="font-medium text-[#EFF2F2] mb-2 flex items-center gap-2"><Pill className="w-4 h-4 text-[#F96801]" /> ওষুধের তালিকা ({med.length}টি)</p>
                  <div className="space-y-2">
                    {med.map((m: any, i: number) => {
                      const times: { icon: any; label: string }[] = []
                      if (m.morning) times.push({ icon: Sunrise, label: "সকাল" })
                      if (m.noon) times.push({ icon: Sun, label: "দুপুর" })
                      if (m.evening) times.push({ icon: Sunset, label: "বিকাল" })
                      if (m.night) times.push({ icon: Moon, label: "রাত" })
                      const tl = selectedPatient.logs
                      const todayLogs = tl?.filter((l: any) => l.medicineId === m.id && new Date(l.takenAt).toDateString() === new Date().toDateString()) || []
                      return (
                        <div key={i} className="p-3 rounded-xl bg-white/[.04] border border-white/[.08]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-[#EFF2F2] font-medium">{m.name}</span>
                            <span className="text-xs text-[#A5ABB0]">{m.dosage}</span>
                          </div>
                          <div className="flex gap-2 flex-wrap mt-1">
                            {times.map((t, ti) => {
                              const taken = todayLogs.some((l: any) => l.status === "TAKEN" && l.scheduledTime === t.label)
                              return (
                                <span key={ti} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${taken ? "bg-[#25C2C3]/20 text-[#25C2C3]" : "bg-white/[.06] text-[#A5ABB0]"}`}>
                                  <t.icon className="w-3 h-3" />
                                  {t.label}
                                  {taken ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null)(selectedPatient.medicines)}
            </div>
            <DialogFooter>
              <Button onClick={() => setSelectedPatient(null)} className="gradient-primary text-[#160500] w-full">বন্ধ করুন</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Prescription Dialog */}
      <Dialog open={prescribeOpen} onOpenChange={setPrescribeOpen}>
        <DialogContent className="bg-[#0a0d16] border border-white/[.08] text-[#EFF2F2] max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{t("doctor.addPrescription")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input placeholder="নির্ণয় (Diagnosis)" value={prescribeForm.diagnosis} onChange={e => setPrescribeForm({ ...prescribeForm, diagnosis: e.target.value })} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2]" />
            <Textarea placeholder="নোটস" value={prescribeForm.notes} onChange={e => setPrescribeForm({ ...prescribeForm, notes: e.target.value })} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2] min-h-[60px]" />
            <Textarea placeholder="পরামর্শ (Advice)" value={prescribeForm.advice} onChange={e => setPrescribeForm({ ...prescribeForm, advice: e.target.value })} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2] min-h-[60px]" />
            <Input type="date" placeholder="ফলো-আপ তারিখ" value={prescribeForm.followUpDate} onChange={e => setPrescribeForm({ ...prescribeForm, followUpDate: e.target.value })} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2]" />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#EFF2F2]">ওষুধসমূহ</p>
                <Button type="button" variant="outline" size="sm" onClick={addMedicine} className="border-[#25C2C3]/30 text-[#25C2C3] rounded-xl text-xs">+ ওষুধ</Button>
              </div>
              {prescribeForm.medicines.map((med, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-white/[.04] border border-white/[.08] space-y-2">
                  <div className="flex items-center gap-2">
                    <Input placeholder="ওষুধের নাম" value={med.name} onChange={e => updateMedicine(idx, "name", e.target.value)} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2] text-xs flex-1" />
                    <Input placeholder="ডোজ" value={med.dosage} onChange={e => updateMedicine(idx, "dosage", e.target.value)} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2] text-xs w-20" />
                    <Button variant="ghost" size="icon" onClick={() => removeMedicine(idx)} className="text-red-400 h-8 w-8"><X className="w-4 h-4" /></Button>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <label className="flex items-center gap-1"><input type="checkbox" checked={med.morning} onChange={e => updateMedicine(idx, "morning", e.target.checked)} className="accent-[#F96801]" /> সকাল</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={med.noon} onChange={e => updateMedicine(idx, "noon", e.target.checked)} className="accent-[#F96801]" /> দুপুর</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={med.evening} onChange={e => updateMedicine(idx, "evening", e.target.checked)} className="accent-[#F96801]" /> বিকাল</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={med.night} onChange={e => updateMedicine(idx, "night", e.target.checked)} className="accent-[#F96801]" /> রাত</label>
                    <Input placeholder="বিধি" value={med.frequency} onChange={e => updateMedicine(idx, "frequency", e.target.value)} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2] text-xs w-20" />
                    <Input placeholder="মেয়াদ" value={med.duration} onChange={e => updateMedicine(idx, "duration", e.target.value)} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2] text-xs w-16" />
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={handlePrescribe} disabled={dataLoading} className="gradient-primary text-[#160500] w-full">
              {dataLoading && <LoadingSpinner />} প্রেসক্রিপশন তৈরি করুন
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

function LoadingSpinner() {
  return <span className="inline-block w-4 h-4 border-2 border-[#160500] border-t-transparent rounded-full animate-spin mr-2" />
}
