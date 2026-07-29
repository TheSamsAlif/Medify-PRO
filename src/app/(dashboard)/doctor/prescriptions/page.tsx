"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Pill, Plus, Search, Printer, Download, Save, FileText, X, Check, AlertTriangle, Clock, Stethoscope } from "lucide-react"
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
import { useSearchParams } from "next/navigation"

export default function DoctorPrescriptions() {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const initialPatientId = searchParams.get("patientId") || ""
  const printRef = useRef<HTMLDivElement>(null)

  const [patients, setPatients] = useState<any[]>([])
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [drafts, setDrafts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId)
  const [activeTab, setActiveTab] = useState(initialPatientId ? "create" : "list")

  const [form, setForm] = useState({
    patientId: initialPatientId, diagnosis: "", symptoms: "", notes: "", advice: "",
    bloodPressure: "", temperature: "", patientWeight: "", followUpDate: "",
    hospitalName: "", signature: "", isDraft: false,
    medicines: [] as any[],
  })

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)

  useEffect(() => {
    fetch("/api/doctor/patients").then(r => r.ok && r.json()).then(d => setPatients(d)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedPatientId) {
      setLoading(true)
      fetch(`/api/doctor/prescriptions?patientId=${selectedPatientId}`).then(r => r.ok && r.json()).then(d => setPrescriptions(d)).catch(() => {}).finally(() => setLoading(false))
    }
  }, [selectedPatientId])

  useEffect(() => {
    fetch("/api/doctor/prescriptions/draft").then(r => r.ok && r.json()).then(d => setDrafts(d)).catch(() => {})
  }, [])

  const addMedicine = () => {
    setForm({ ...form, medicines: [...form.medicines, { name: "", dosage: "", frequency: "1+0+0", duration: "", morning: true, noon: false, evening: false, night: false, notes: "", intakeTime: "ANYTIME" }] })
  }

  const updateMedicine = (idx: number, field: string, value: any) => {
    const meds = [...form.medicines]
    meds[idx] = { ...meds[idx], [field]: value }
    setForm({ ...form, medicines: meds })
  }

  const removeMedicine = (idx: number) => {
    if (form.medicines.length <= 1) return
    setForm({ ...form, medicines: form.medicines.filter((_, i) => i !== idx) })
  }

  const handleSubmit = async (isDraft: boolean) => {
    if (!form.patientId) { toast.error(t("doctor.selectPatientReq")); return }
    if (!isDraft && form.medicines.filter(m => m.name.trim()).length === 0) { toast.error(t("doctor.minMedicineReq")); return }
    setLoading(true)
    try {
      const res = await fetch("/api/doctor/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, isDraft, patientId: form.patientId, medicines: form.medicines.filter(m => m.name.trim()) }),
      })
      if (res.ok) {
        toast.success(isDraft ? t("doctor.draftSaved") : t("doctor.prescriptionCreated"))
        setForm({ patientId: form.patientId, diagnosis: "", symptoms: "", notes: "", advice: "", bloodPressure: "", temperature: "", patientWeight: "", followUpDate: "", hospitalName: "", signature: "", isDraft: false, medicines: [] })
        fetch(`/api/doctor/prescriptions?patientId=${form.patientId}`).then(r => r.ok && r.json()).then(d => setPrescriptions(d))
      } else { const err = await res.json(); toast.error(err.error || t("common.error")) }
    } catch { toast.error(t("common.error")) } finally { setLoading(false) }
  }

  const handlePrint = (prescription: any) => {
    setPreviewData(prescription)
    setTimeout(() => {
      const w = window.open("", "_blank")
      if (!w) return
      w.document.write(`
        <html><head><title>Prescription</title>
        <style>body{font-family:Arial;padding:40px;color:#333}table{width:100%;border-collapse:collapse}td,th{padding:8px;border:1px solid #ddd}h2{color:#F96801}.header{text-align:center;margin-bottom:30px}</style></head><body>
        <div class="header"><h2>Medify - Prescription</h2></div>
        <p><strong>Doctor:</strong> ${prescription.doctorName || ""} | <strong>Hospital:</strong> ${prescription.hospitalName || ""}</p>
        <p><strong>Patient:</strong> ${prescription.userId || ""} | <strong>Date:</strong> ${new Date(prescription.createdAt).toLocaleDateString()}</p>
        ${prescription.diagnosis ? `<p><strong>Diagnosis:</strong> ${prescription.diagnosis}</p>` : ""}
        ${prescription.symptoms ? `<p><strong>Symptoms:</strong> ${prescription.symptoms}</p>` : ""}
        ${prescription.bloodPressure ? `<p><strong>BP:</strong> ${prescription.bloodPressure} | <strong>Temp:</strong> ${prescription.temperature || ""} | <strong>Weight:</strong> ${prescription.patientWeight || ""}</p>` : ""}
        <table><tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr>
        ${(prescription.medicines || []).map((m: any) => `<tr><td>${m.name}</td><td>${m.dosage}</td><td>${m.frequency}</td><td>${m.duration || ""}</td></tr>`).join("")}
        </table>
        ${prescription.advice ? `<p><strong>Advice:</strong> ${prescription.advice}</p>` : ""}
        ${prescription.followUpDate ? `<p><strong>Follow-up:</strong> ${new Date(prescription.followUpDate).toLocaleDateString()}</p>` : ""}
        ${prescription.signature ? `<p style="margin-top:40px"><strong>Signature:</strong> ${prescription.signature}</p>` : ""}
        <p style="margin-top:20px;font-size:12px;color:#999">Generated by Medify Healthcare</p>
        </body></html>
      `)
      w.document.close()
      w.print()
    }, 300)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#EFF2F2]">{t("doctor.prescriptions")}</h2>
          <p className="text-[#A5ABB0] mt-1">{t("doctor.managePrescriptions")}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/[.04] border border-white/[.08] p-1 rounded-xl mb-6">
          <TabsTrigger value="list" className="data-[state=active]:bg-[#F96801] data-[state=active]:text-[#160500] rounded-lg text-xs">{t("doctor.prescriptions")}</TabsTrigger>
          <TabsTrigger value="create" className="data-[state=active]:bg-[#F96801] data-[state=active]:text-[#160500] rounded-lg text-xs">{t("doctor.addPrescription")}</TabsTrigger>
          <TabsTrigger value="drafts" className="data-[state=active]:bg-[#F96801] data-[state=active]:text-[#160500] rounded-lg text-xs">{t("doctor.draft")}</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Select value={selectedPatientId} onValueChange={(v) => v !== null && setSelectedPatientId(v)}>
            <SelectTrigger className="w-64 bg-white/[.04] border-white/[.08] text-[#EFF2F2] text-xs mb-4">
              <SelectValue placeholder={t("doctor.selectPatientHint")} />
            </SelectTrigger>
            <SelectContent className="bg-[#0a0d16] border-white/[.08] text-[#EFF2F2]">
              {patients.map(p => <SelectItem key={p.patientId} value={p.patientId}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>

          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl bg-white/[.04]" />)}</div>
          ) : !selectedPatientId ? (
            <Card className="border border-white/[.08] bg-[#0a0d16] p-12 text-center">
              <Pill className="w-12 h-12 text-[#A5ABB0] mx-auto mb-3 opacity-50" />
              <p className="text-[#A5ABB0] text-sm">{t("doctor.selectPatientView")}</p>
            </Card>
          ) : prescriptions.length === 0 ? (
            <Card className="border border-white/[.08] bg-[#0a0d16] p-12 text-center">
              <Pill className="w-12 h-12 text-[#A5ABB0] mx-auto mb-3 opacity-50" />
              <p className="text-[#A5ABB0] text-sm mb-4">{t("doctor.noPrescriptions")}</p>
              <Button onClick={() => setActiveTab("create")} className="gradient-primary text-[#160500] rounded-xl text-xs"><Plus className="w-4 h-4 mr-1" /> {t("doctor.addPrescription")}</Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {prescriptions.filter(p => !p.isDraft).map((p, i) => (
                <Card key={i} className="border border-white/[.08] bg-[#0a0d16]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs text-[#A5ABB0]">{new Date(p.createdAt).toLocaleDateString("bn-BD")}</p>
                          {p.hospitalName && <Badge className="bg-white/[.06] text-[#A5ABB0] text-xs">{p.hospitalName}</Badge>}
                        </div>
                        {p.diagnosis && <p className="text-sm font-medium text-[#EFF2F2]">{p.diagnosis}</p>}
                        {p.symptoms && <p className="text-xs text-[#A5ABB0] mt-0.5">{t("doctor.symptomsLabel").replace("{s}", p.symptoms)}</p>}
                        {(p.bloodPressure || p.temperature) && <p className="text-xs text-[#A5ABB0]">{t("doctor.bpLabel").replace("{bp}", p.bloodPressure || "-").replace("{t}", p.temperature || "-")}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-[#25C2C3]/20 text-[#25C2C3] text-xs">{t("patients.prescriptionCount").replace("{n}", String(p.medicines?.length || 0))}</Badge>
                        <Button variant="outline" size="sm" onClick={() => handlePrint(p)} className="rounded-xl text-xs border-white/[.08] text-[#A5ABB0] h-8 w-8 p-0"><Printer className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    {p.medicines?.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {p.medicines.map((m: any, mi: number) => (
                          <span key={mi} className="text-xs bg-white/[.04] text-[#A5ABB0] px-2 py-1 rounded-lg">{m.name} {m.dosage}</span>
                        ))}
                      </div>
                    )}
                    {p.advice && <p className="text-xs text-[#25C2C3] mt-2">{t("doctor.adviceLabel").replace("{a}", p.advice)}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create">
          <Card className="border border-white/[.08] bg-[#0a0d16]">
            <CardHeader>
              <CardTitle className="text-lg text-[#EFF2F2]">{t("doctor.addPrescription")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <Select value={form.patientId} onValueChange={(v) => v !== null && setForm({ ...form, patientId: v })}>
                  <SelectTrigger className="bg-white/[.04] border-white/[.08] text-[#EFF2F2] text-xs">
                    <SelectValue placeholder={t("doctor.selectPatient")} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0d16] border-white/[.08] text-[#EFF2F2]">
                    {patients.map(p => <SelectItem key={p.patientId} value={p.patientId}>{p.name} ({p.phone || ""})</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder={t("doctor.hospitalName")} value={form.hospitalName} onChange={e => setForm({ ...form, hospitalName: e.target.value })} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2] text-xs" />
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <Input placeholder={t("doctor.diagnosis")} value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2] text-xs" />
                <Input placeholder={t("doctor.symptoms")} value={form.symptoms} onChange={e => setForm({ ...form, symptoms: e.target.value })} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2] text-xs" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Input placeholder={t("doctor.bloodPressure")} value={form.bloodPressure} onChange={e => setForm({ ...form, bloodPressure: e.target.value })} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2] text-xs" />
                <Input placeholder={t("doctor.temperature")} value={form.temperature} onChange={e => setForm({ ...form, temperature: e.target.value })} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2] text-xs" />
                <Input placeholder={t("doctor.weight")} type="number" value={form.patientWeight} onChange={e => setForm({ ...form, patientWeight: e.target.value })} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2] text-xs" />
              </div>

              <Textarea placeholder={t("doctor.notes")} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2] text-xs min-h-[60px]" />
              <Textarea placeholder={t("doctor.advice")} value={form.advice} onChange={e => setForm({ ...form, advice: e.target.value })} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2] text-xs min-h-[60px]" />

              <div className="grid md:grid-cols-2 gap-3">
                <Input type="date" placeholder={t("doctor.followUp")} value={form.followUpDate} onChange={e => setForm({ ...form, followUpDate: e.target.value })} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2] text-xs" />
                <Input placeholder={t("doctor.signature")} value={form.signature} onChange={e => setForm({ ...form, signature: e.target.value })} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2] text-xs font-mono" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#EFF2F2]">{t("doctor.medicines")}</p>
                  <Button type="button" variant="outline" size="sm" onClick={addMedicine} className="border-[#25C2C3]/30 text-[#25C2C3] rounded-xl text-xs"><Plus className="w-3 h-3 mr-1" /> {t("doctor.addMedicine")}</Button>
                </div>
                {form.medicines.map((med: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/[.04] border border-white/[.08] space-y-2">
                    <div className="flex items-center gap-2">
                      <Input placeholder={t("doctor.medicineName")} value={med.name} onChange={e => updateMedicine(idx, "name", e.target.value)} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2] text-xs flex-1" />
                      <Input placeholder={t("doctor.dosage")} value={med.dosage} onChange={e => updateMedicine(idx, "dosage", e.target.value)} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2] text-xs w-20" />
                      <Button variant="ghost" size="icon" onClick={() => removeMedicine(idx)} className="text-red-400 h-7 w-7"><X className="w-3.5 h-3.5" /></Button>
                    </div>
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <label className="flex items-center gap-1"><input type="checkbox" checked={med.morning} onChange={e => updateMedicine(idx, "morning", e.target.checked)} className="accent-[#F96801]" /> {t("doctor.morning")}</label>
                      <label className="flex items-center gap-1"><input type="checkbox" checked={med.noon} onChange={e => updateMedicine(idx, "noon", e.target.checked)} className="accent-[#F96801]" /> {t("doctor.noon")}</label>
                      <label className="flex items-center gap-1"><input type="checkbox" checked={med.evening} onChange={e => updateMedicine(idx, "evening", e.target.checked)} className="accent-[#F96801]" /> {t("doctor.evening")}</label>
                      <label className="flex items-center gap-1"><input type="checkbox" checked={med.night} onChange={e => updateMedicine(idx, "night", e.target.checked)} className="accent-[#F96801]" /> {t("doctor.night")}</label>
                      <Input placeholder={t("doctor.frequency")} value={med.frequency} onChange={e => updateMedicine(idx, "frequency", e.target.value)} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2] text-xs w-16" />
                      <Input placeholder={t("doctor.duration")} value={med.duration} onChange={e => updateMedicine(idx, "duration", e.target.value)} className="bg-white/[.04] border-white/[.08] text-[#EFF2F2] text-xs w-16" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={() => handleSubmit(true)} disabled={loading} variant="outline" className="flex-1 border-white/[.08] text-[#A5ABB0] rounded-xl text-xs">
                  <Save className="w-4 h-4 mr-1" /> {t("doctor.saveDraft")}
                </Button>
                <Button onClick={() => handleSubmit(false)} disabled={loading} className="flex-1 gradient-primary text-[#160500] rounded-xl text-xs">
                  {loading ? <LoadingSpinner /> : null} {t("doctor.addPrescription")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drafts">
          {drafts.length === 0 ? (
            <Card className="border border-white/[.08] bg-[#0a0d16] p-12 text-center">
              <Save className="w-12 h-12 text-[#A5ABB0] mx-auto mb-3 opacity-50" />
              <p className="text-[#A5ABB0] text-sm">{t("doctor.noDrafts")}</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {drafts.map((d, i) => (
                <Card key={i} className="border border-white/[.08] bg-[#0a0d16]">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#EFF2F2]">{d.diagnosis || t("doctor.noTitle")}</p>
                        <p className="text-xs text-[#A5ABB0]">{new Date(d.updatedAt).toLocaleDateString("bn-BD")}</p>
                      </div>
                      <Badge className="bg-amber-500/20 text-amber-400 text-xs">{t("doctor.draft")}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

function LoadingSpinner() {
  return <span className="inline-block w-4 h-4 border-2 border-[#160500] border-t-transparent rounded-full animate-spin mr-2" />
}
