"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Activity, FileText, Heart, Search, Calendar, Droplets, Eye, Bone, Brain, TestTube, Microscope, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n"

export default function DoctorRecords() {
  const { t } = useI18n()
  const [patients, setPatients] = useState<any[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState("")
  const [records, setRecords] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)

  useEffect(() => {
    fetch("/api/doctor/patients").then(r => r.ok && r.json()).then(d => setPatients(d)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedPatientId) {
      setDataLoading(true)
      fetch(`/api/doctor/patients/${selectedPatientId}/records`).then(r => r.ok && r.json()).then(d => setRecords(d)).catch(() => toast.error(t("records.loadError"))).finally(() => setDataLoading(false))
    }
  }, [selectedPatientId])

  const recordTypes = [
    { key: "ALL", labelKey: "records.all", icon: FileText },
    { key: "LAB", labelKey: "records.lab", icon: TestTube },
    { key: "RADIOLOGY", labelKey: "records.radiology", icon: Microscope },
    { key: "VITAL", labelKey: "records.vital", icon: Heart },
    { key: "ECG", labelKey: "records.ecg", icon: Activity },
  ]

  const groupedRecords = (type: string) => {
    if (!records?.healthRecords) return []
    return type === "ALL" ? records.healthRecords : records.healthRecords.filter((r: any) => r.type === type)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t("doctor.healthRecords")}</h2>
          <p className="text-muted-foreground mt-1">{t("records.subtitle")}</p>
        </div>
      </div>

      <Select value={selectedPatientId} onValueChange={(v) => v !== null && setSelectedPatientId(v)}>
        <SelectTrigger className="w-64 glass border-white/[.08] text-foreground text-xs mb-6">
          <SelectValue placeholder={t("records.selectPatient")} />
        </SelectTrigger>
        <SelectContent className="glass-card border-white/[.08] text-foreground">
          {patients.map(p => <SelectItem key={p.patientId} value={p.patientId}>{p.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {!selectedPatientId ? (
        <Card className="border border-white/[.08] glass-card p-12 text-center">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground text-sm">{t("records.selectPatient")}</p>
        </Card>
      ) : dataLoading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl glass" />)}</div>
      ) : records && (records.healthRecords?.length > 0 || records.healthMetrics?.length > 0) ? (
        <Tabs defaultValue="ALL">
          <TabsList className="glass border border-white/[.08] p-1 rounded-xl mb-6 flex-wrap">
            {recordTypes.map(rt => (
              <TabsTrigger key={rt.key} value={rt.key} className="data-[state=active]:bg-[#F96801] data-[state=active]:text-[#160500] rounded-lg text-xs">
                <rt.icon className="w-3.5 h-3.5 mr-1" /> {t(rt.labelKey)}
              </TabsTrigger>
            ))}
          </TabsList>

          {recordTypes.map(rt => (
            <TabsContent key={rt.key} value={rt.key}>
              {groupedRecords(rt.key).length === 0 ? (
                <Card className="border border-white/[.08] glass-card p-8 text-center">
                  <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground text-sm">{t("records.noRecords")}</p>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {groupedRecords(rt.key).map((r: any, i: number) => (
                    <Card key={i} className="border border-white/[.08] glass-card">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#25C2C3]/20 flex items-center justify-center">
                          {r.type === "LAB" ? <TestTube className="w-5 h-5 text-[#25C2C3]" /> : r.type === "RADIOLOGY" ? <Microscope className="w-5 h-5 text-[#25C2C3]" /> : <Heart className="w-5 h-5 text-[#25C2C3]" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{r.title}</p>
                          <p className="text-xs text-muted-foreground">{r.doctorName || r.hospital || ""} • {new Date(r.date).toLocaleDateString("bn-BD")}</p>
                          {r.value && <p className="text-xs text-[#25C2C3] mt-0.5">{r.value} {r.unit}</p>}
                        </div>
                        {r.imageUrl && (
                          <Button variant="outline" size="sm" className="rounded-xl text-xs border-white/[.08] text-muted-foreground">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}

          {records.healthMetrics?.length > 0 && (
            <Card className="border border-white/[.08] glass-card mt-6">
              <CardHeader>
                <CardTitle className="text-lg text-foreground flex items-center gap-2"><Heart className="w-5 h-5 text-[#F96801]" /> {t("records.vitalTimeline")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {records.healthMetrics.slice(0, 20).map((m: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg glass">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#25C2C3]" />
                      <span className="text-xs text-muted-foreground">{m.type}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{m.value} {m.unit}</span>
                    <span className="text-xs text-white/30">{new Date(m.date).toLocaleDateString("bn-BD")}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </Tabs>
      ) : (
        <Card className="border border-white/[.08] glass-card p-12 text-center">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground text-sm">{t("records.noRecords")}</p>
        </Card>
      )}
    </motion.div>
  )
}
