"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Stethoscope, Phone, MapPin, BadgeCheck, Clock, Eye, EyeOff, Loader2, Send, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"

export default function MyDoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [searchId, setSearchId] = useState("")
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async () => {
    try {
      const res = await fetch("/api/patient/doctors")
      if (res.ok) setDoctors(await res.json())
    } catch {
      toast.error("ডাক্তারদের তথ্য লোড করতে সমস্যা")
    } finally {
      setLoading(false)
    }
  }

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchId.trim()) return
    setAdding(true)
    try {
      const res = await fetch("/api/patient/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId: searchId.trim(), action: "add_doctor" }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`ডাক্তার ${data.doctor?.name || ""} যুক্ত হয়েছে`)
        setSearchId("")
        setAddOpen(false)
        fetchDoctors()
      } else {
        toast.error(data.error || "ডাক্তার পাওয়া যায়নি")
      }
    } catch {
      toast.error("ত্রুটি ঘটেছে")
    } finally {
      setAdding(false)
    }
  }

  const requestContact = async (doctorId: string) => {
    try {
      const res = await fetch("/api/patient/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId, action: "request_contact" }),
      })
      if (res.ok) {
        toast.success("অনুরোধ পাঠানো হয়েছে")
        fetchDoctors()
      } else {
        toast.error("সমস্যা হয়েছে")
      }
    } catch {
      toast.error("নেটওয়ার্ক ত্রুটি")
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#EFF2F2]">আমার ডাক্তার</h2>
          <p className="text-[#A5ABB0] mt-1">সংযুক্ত ডাক্তারদের তথ্য ও যোগাযোগ</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setAddOpen(true)} className="gradient-primary text-[#160500] rounded-xl">
            <Plus className="w-4 h-4 mr-1.5" /> ডাক্তার যোগ করুন
          </Button>
          <Badge className="text-sm px-4 py-2 bg-white/[.06] text-[#EFF2F2] border-white/[.08]">
            <Stethoscope className="w-4 h-4 text-[#F96801] mr-1" />
            {doctors.length} জন ডাক্তার
          </Badge>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-40 w-full rounded-2xl bg-white/[.04]" />)}
        </div>
      ) : doctors.length === 0 ? (
        <Card className="border border-white/[.08] bg-[#0a0d16] p-12 text-center">
          <Stethoscope className="w-12 h-12 text-[#A5ABB0] mx-auto mb-3 opacity-50" />
          <p className="text-[#A5ABB0] text-sm">কোনো ডাক্তার সংযুক্ত নেই।</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {doctors.map((doc, i) => (
            <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="border border-white/[.08] bg-[#0a0d16] hover:border-[#F96801]/30 transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                      <Stethoscope className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg text-[#EFF2F2]">{doc.name}</h3>
                        {doc.isAvailable ? (
                          <Badge className="bg-[#25C2C3]/20 text-[#25C2C3] text-xs">Available</Badge>
                        ) : (
                          <Badge className="bg-[#A5ABB0]/20 text-[#A5ABB0] text-xs">Unavailable</Badge>
                        )}
                      </div>
                      <p className="text-xs text-[#A5ABB0] font-mono">{doc.doctorId}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {doc.registrationNumber && (
                      <div className="flex items-center gap-2 text-[#A5ABB0]">
                        <BadgeCheck className="w-4 h-4 text-[#25C2C3]" />
                        <span>BM&DC: {doc.registrationNumber}</span>
                      </div>
                    )}
                    {doc.chamberLocation && (
                      <div className="flex items-center gap-2 text-[#A5ABB0]">
                        <MapPin className="w-4 h-4 text-[#F96801]" />
                        <span>{doc.chamberLocation}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[#A5ABB0]">
                      <Clock className="w-4 h-4 text-[#A5ABB0]" />
                      <span>{doc.isAvailable ? "বর্তমানে Available" : "বর্তমানে unavailable"}</span>
                    </div>

                    {doc.phone ? (
                      <div className="flex items-center gap-2 text-[#EFF2F2] font-medium">
                        <Phone className="w-4 h-4 text-[#25C2C3]" />
                        <span>{doc.phone}</span>
                      </div>
                    ) : doc.contactRequested ? (
                      <p className="text-xs text-amber-400">⏳ অনুরোধ পাঠানো হয়েছে, অপেক্ষা করুন...</p>
                    ) : (
                      <Button size="sm" variant="outline" className="w-full mt-2 border-white/[.08] text-xs" onClick={() => requestContact(doc.id)}>
                        <Send className="w-3 h-3 mr-1" /> কন্টাক্ট দেখার অনুরোধ পাঠান
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Doctor Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-[#0a0d16] border border-white/[.08] text-[#EFF2F2] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Doctor ID দিয়ে ডাক্তার খুঁজুন</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddDoctor} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs text-[#A5ABB0]">Doctor ID (যেমন: DOC-A1B2C3)</label>
              <Input
                placeholder="DOC-..."
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
                {adding && <span className="inline-block w-4 h-4 border-2 border-[#160500] border-t-transparent rounded-full animate-spin mr-2" />}
                যুক্ত করুন
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
