"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Scan, Upload, Camera, FileText, Plus, ChevronRight, Calendar, User, Building, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { ScanPrescriptionDialog } from "@/components/medical/scan-prescription-dialog"
import type { Prescription } from "@/types"

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [showScanDialog, setShowScanDialog] = useState(false)

  useEffect(() => {
    fetchPrescriptions()
  }, [])

  const fetchPrescriptions = async () => {
    try {
      const res = await fetch("/api/prescriptions")
      if (res.ok) setPrescriptions(await res.json())
    } catch {
      toast.error("প্রেসক্রিপশন লোড করতে সমস্যা")
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">প্রেসক্রিপশন</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">স্ক্যান করুন, সংরক্ষণ করুন, ব্যবস্থাপনা করুন</p>
        </div>
        <Button className="rounded-full gradient-primary text-white" onClick={() => setShowScanDialog(true)}>
          <Scan className="w-4 h-4 mr-2" />
          স্ক্যান করুন
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {[
          { icon: Camera, label: "ক্যামেরা স্ক্যান", desc: "প্রেসক্রিপশনের ছবি তুলুন", color: "from-blue-400 to-indigo-500", onClick: () => setShowScanDialog(true) },
          { icon: Upload, label: "ফাইল আপলোড", desc: "PDF বা ইমেজ আপলোড করুন", color: "from-emerald-400 to-teal-500", onClick: () => setShowScanDialog(true) },
          { icon: Plus, label: "ম্যানুয়াল", desc: "হাতে লিখে যোগ করুন", color: "from-amber-400 to-orange-500", onClick: () => setShowScanDialog(true) },
        ].map((item, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={item.onClick}
            className="p-5 rounded-2xl bg-gradient-to-br text-white shadow-lg text-left hover:scale-[1.02] transition-transform"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} p-3 mb-4 shadow-lg`}>
              <item.icon className="w-full h-full text-white" />
            </div>
            <h3 className="font-bold text-lg">{item.label}</h3>
            <p className="text-white/80 text-sm">{item.desc}</p>
          </motion.button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((prescription, i) => (
            <motion.div
              key={prescription.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-0 shadow-lg shadow-black/5 hover:shadow-xl transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-7 h-7 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-semibold text-lg">
                            {prescription.doctorName || "অজানা ডাক্তার"}
                          </h4>
                          {prescription.hospitalName && (
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                              <Building className="w-3.5 h-3.5" />
                              {prescription.hospitalName}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {new Date(prescription.createdAt).toLocaleDateString("bn", { day: "numeric", month: "short" })}
                        </Badge>
                      </div>

                      {prescription.diagnosis && (
                        <div className="mt-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900">
                          <p className="text-sm font-medium">রোগ নির্ণয়:</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{prescription.diagnosis}</p>
                        </div>
                      )}

                      {prescription.medicines && prescription.medicines.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {prescription.medicines.map((med) => (
                            <Badge key={med.id} variant="secondary" className="text-xs">
                              {med.name} - {med.dosage}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {prescription.imageUrl && (
                        <div className="mt-3 relative w-full h-40 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900">
                          <Image
                            src={prescription.imageUrl}
                            alt="Prescription"
                            fill
                            className="object-contain"
                          />
                        </div>
                      )}

                      {prescription.followUpDate && (
                        <div className="flex items-center gap-1 mt-3 text-sm text-amber-600">
                          <Calendar className="w-4 h-4" />
                          ফলো-আপ: {new Date(prescription.followUpDate).toLocaleDateString("bn", { day: "numeric", month: "long", year: "numeric" })}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {prescriptions.length === 0 && (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">কোনো প্রেসক্রিপশন নেই</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                আপনার প্রথম প্রেসক্রিপশন স্ক্যান বা আপলোড করুন
              </p>
              <Button className="rounded-full gradient-primary text-white" onClick={() => setShowScanDialog(true)}>
                <Scan className="w-4 h-4 mr-2" /> স্ক্যান করুন
              </Button>
            </div>
          )}
        </div>
      )}

      <ScanPrescriptionDialog
        open={showScanDialog}
        onOpenChange={setShowScanDialog}
        onSuccess={() => { setShowScanDialog(false); fetchPrescriptions() }}
      />
    </motion.div>
  )
}
