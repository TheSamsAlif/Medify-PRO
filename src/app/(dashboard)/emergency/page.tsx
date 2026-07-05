"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Phone, PhoneCall, AlertTriangle, Ambulance, Shield, Building, FlaskRoundIcon as Flask, Droplets, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { EmergencyContact } from "@/types"

const emergencyCategories = [
  { name: "জাতীয় জরুরি সেবা", nameEn: "National Emergency", color: "from-red-500 to-rose-600" },
  { name: "চিকিৎসা সেবা", nameEn: "Medical Services", color: "from-blue-500 to-indigo-600" },
  { name: "আইনশৃঙ্খলা", nameEn: "Law & Order", color: "from-amber-500 to-orange-600" },
  { name: "অন্যান্য সেবা", nameEn: "Other Services", color: "from-gray-500 to-gray-600" },
]

export default function EmergencyPage() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      const res = await fetch("/api/emergency-contacts")
      if (res.ok) setContacts(await res.json())
    } catch {
      setContacts([
        { id: "1", name: "জাতীয় জরুরি সেবা", phone: "999", type: "জাতীয় জরুরি সেবা", priority: 1 },
        { id: "2", name: "আম্বুলেন্স", phone: "16263", type: "National Emergency", priority: 2 },
        { id: "3", name: "ফায়ার সার্ভিস", phone: "16163", type: "National Emergency", priority: 3 },
        { id: "4", name: "পুলিশ", phone: "999", type: "National Emergency", priority: 4 },
        { id: "5", name: "ময়মনসিংহ মেডিকেল", phone: "01769000999", type: "Medical Services", priority: 5 },
        { id: "6", name: "স্বাস্থ্য বাতায়ন", phone: "16263", type: "Medical Services", priority: 6 },
        { id: "7", name: "নারী সাহায্য", phone: "10921", type: "Medical Services", priority: 7 },
        { id: "8", name: "শিশু হেল্পলাইন", phone: "1098", type: "Medical Services", priority: 8 },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">জরুরি সেবা</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            ২৪/৭ ইমারজেন্সি কন্টাক্ট ও হেল্পলাইন
          </p>
        </div>
        <Link href="/sos">
          <Button className="rounded-full gradient-danger text-white shadow-lg shadow-red-500/20">
            <AlertTriangle className="w-4 h-4 mr-2" />
            SOS অ্যালার্ট
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Link href="/hospitals">
          <Card className="border-0 shadow-lg shadow-black/5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:scale-[1.02] transition-transform cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <Building className="w-10 h-10 text-white/80" />
              <div className="flex-1">
                <h3 className="font-bold text-lg">নিকটস্থ হাসপাতাল</h3>
                <p className="text-white/80 text-sm">আপনার অবস্থানের নিকটে হাসপাতাল খুঁজুন</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/60" />
            </CardContent>
          </Card>
        </Link>
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-0 shadow-lg shadow-black/5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <CardContent className="p-4 text-center">
              <Ambulance className="w-8 h-8 mx-auto mb-2 text-white/80" />
              <p className="font-bold text-lg">16263</p>
              <p className="text-xs text-white/80">আম্বুলেন্স</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg shadow-black/5 bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <CardContent className="p-4 text-center">
              <Flask className="w-8 h-8 mx-auto mb-2 text-white/80" />
              <p className="font-bold text-lg">16263</p>
              <p className="text-xs text-white/80">স্বাস্থ্য বাতায়ন</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <h3 className="text-xl font-bold mb-4">জরুরি যোগাযোগ</h3>
      <div className="grid md:grid-cols-2 gap-4">
        {loading
          ? [1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-0 shadow-lg shadow-black/5">
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))
          : contacts.map((contact, i) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-0 shadow-lg shadow-black/5 hover:shadow-xl transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{contact.name}</p>
                        <p className="text-xs text-gray-500">{contact.type}</p>
                      </div>
                    </div>
                    <a href={`tel:${contact.phone}`}>
                      <Button className="rounded-full gradient-primary text-white shadow-md shadow-primary/20">
                        <PhoneCall className="w-4 h-4 mr-2" />
                        {contact.phone}
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
      </div>
    </motion.div>
  )
}
