"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Stethoscope, Users, Calendar, MessageSquare, Pill, FileText, ChevronRight, Search, Plus, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"

export default function DoctorPage() {
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchId, setSearchId] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null)

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      const res = await fetch("/api/doctor/patients")
      if (res.ok) {
        const data = await res.json()
        setPatients(data)
      }
    } catch {
      toast.error("রোগীদের তালিকা লোড করতে সমস্যা হয়েছে")
    } finally {
      setLoading(false)
    }
  }

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchId.trim()) return
    setAdding(true)
    try {
      const res = await fetch("/api/doctor/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: searchId.trim() }),
      })
      if (res.ok) {
        toast.success("রোগী সফলভাবে যুক্ত হয়েছে")
        setSearchId("")
        setAddOpen(false)
        fetchPatients()
      } else {
        const err = await res.json()
        toast.error(err.error || "রোগী পাওয়া যায়নি")
      }
    } catch {
      toast.error("ত্রুটি ঘটেছে")
    } finally {
      setAdding(false)
    }
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
          <h2 className="text-2xl md:text-3xl font-bold text-[#EFF2F2]">ডাক্তার ড্যাশবোর্ড</h2>
          <p className="text-[#A5ABB0] mt-1">Patient ID দিয়ে রোগী খুঁজুন এবং স্বাস্থ্য পর্যবেক্ষণ করুন</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setAddOpen(true)} className="gradient-primary text-[#160500] rounded-xl">
            <Plus className="w-4 h-4 mr-1.5" /> রোগী যুক্ত করুন
          </Button>
          <Badge className="text-sm px-4 py-2 gap-2 bg-white/[.06] text-[#EFF2F2] border-white/[.08]">
            <Users className="w-4 h-4 text-[#F96801]" />
            {patients.length} জন রোগী
          </Badge>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Users, label: "মোট রোগী", value: patients.length.toString(), color: "from-[#F96801] to-[#FF8A1E]" },
          { icon: Calendar, label: "আজকের অ্যাপয়েন্টমেন্ট", value: "২", color: "from-[#25C2C3] to-teal-500" },
          { icon: AlertTriangle, label: "জরুরি অ্যালার্ট", value: "০", color: "from-amber-500 to-orange-500" },
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

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#EFF2F2]">সংযুক্ত রোগীদের তালিকা</h3>
        {patients.length === 0 ? (
          <Card className="border border-white/[.08] bg-[#0a0d16] p-12 text-center">
            <Users className="w-12 h-12 text-[#A5ABB0] mx-auto mb-3 opacity-50" />
            <p className="text-[#A5ABB0] text-sm mb-4">কোনো রোগী যুক্ত করা হয়নি। রোগীর Patient ID দিয়ে যুক্ত করুন।</p>
            <Button onClick={() => setAddOpen(true)} className="gradient-primary text-[#160500] rounded-xl text-xs">
              <Plus className="w-4 h-4 mr-1" /> রোগী যুক্ত করুন
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
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={() => setSelectedPatient(patient)}
                          className="rounded-xl text-xs border-white/[.08] text-[#A5ABB0] hover:text-[#EFF2F2]">
                          <FileText className="w-3.5 h-3.5 mr-1 text-[#25C2C3]" /> বিস্তারিত রেকর্ড
                        </Button>
                        <a href={`tel:${patient.phone}`}>
                          <Button variant="outline" size="sm" className="rounded-xl text-xs border-white/[.08] text-[#A5ABB0] hover:text-[#EFF2F2]">
                            📞 কল করুন
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Patient Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-[#0a0d16] border border-white/[.08] text-[#EFF2F2] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Patient ID দিয়ে রোগী খুঁজুন</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPatient} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs text-[#A5ABB0]">Patient ID (যেমন: PAT-A1B2C3)</label>
              <Input
                placeholder="PAT-..."
                value={searchId}
                onChange={e => setSearchId(e.target.value)}
                className="bg-white/[.04] border-white/[.08] text-[#EFF2F2] uppercase font-mono"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="border-white/[.08] text-[#A5ABB0]">
                বাতিল
              </Button>
              <Button type="submit" disabled={adding} className="gradient-primary text-[#160500]">
                {adding && <LoadingSpinner />} যুক্ত করুন
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Patient Detail Dialog */}
      {selectedPatient && (
        <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
          <DialogContent className="bg-[#0a0d16] border border-white/[.08] text-[#EFF2F2] max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{selectedPatient.name} - রোগীর বিবরণ</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm text-[#A5ABB0]">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white/[.04] border border-white/[.08]">
                <div><span className="text-xs text-[#A5ABB0]">Patient ID:</span> <p className="font-mono text-[#EFF2F2]">{selectedPatient.patientId}</p></div>
                <div><span className="text-xs text-[#A5ABB0]">ইমেইল:</span> <p className="text-[#EFF2F2]">{selectedPatient.email || "নেই"}</p></div>
                <div><span className="text-xs text-[#A5ABB0]">ফোন:</span> <p className="text-[#EFF2F2]">{selectedPatient.phone || "নেই"}</p></div>
                <div><span className="text-xs text-[#A5ABB0]">রক্তের গ্রুপ:</span> <p className="text-[#EFF2F2]">{selectedPatient.bloodGroup || "নেই"}</p></div>
              </div>
              <div>
                <p className="font-medium text-[#EFF2F2] mb-1">ঠিকানা</p>
                <p className="p-3 rounded-xl bg-white/[.04] border border-white/[.08] text-[#EFF2F2]">{selectedPatient.address || "দেওয়া হয়নি"}</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setSelectedPatient(null)} className="gradient-primary text-[#160500] w-full">
                বন্ধ করুন
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  )
}

function LoadingSpinner() {
  return <span className="inline-block w-4 h-4 border-2 border-[#160500] border-t-transparent rounded-full animate-spin mr-2" />
}
