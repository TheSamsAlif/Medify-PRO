"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, Heart, Pill, Activity, MessageSquare, Phone, Bell, AlertTriangle, Clock, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function GuardianPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const patients = [
    { name: "আব্দুর রহমান", age: 72, relation: "বাবা", adherence: 92, medicines: 5, status: "good" as const },
    { name: "ফাতেমা বেগম", age: 68, relation: "মা", adherence: 78, medicines: 3, status: "warning" as const },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">অভিভাবক ড্যাশবোর্ড</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">আপনার পরিবারের সদস্যদের স্বাস্থ্য পর্যবেক্ষণ</p>
        </div>
        <Badge className="text-sm px-4 py-2 gap-2">
          <Users className="w-4 h-4" />
          {patients.length} জন সদস্য
        </Badge>
      </div>

      <Tabs defaultValue="all" className="mb-6">
        <TabsList className="rounded-xl p-1">
          <TabsTrigger value="all" className="rounded-lg">সব</TabsTrigger>
          {patients.map((p, i) => (
            <TabsTrigger key={i} value={p.name} className="rounded-lg">{p.name}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {patients.map((patient, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border-0 shadow-lg shadow-black/5">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-5">
                      <Avatar className="w-16 h-16">
                        <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                          {patient.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-bold">{patient.name}</h3>
                        <p className="text-sm text-gray-500">
                          {patient.relation} • {patient.age} বছর
                        </p>
                      </div>
                      <Badge className={`ml-auto ${patient.status === "good" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                        {patient.status === "good" ? "ভাল" : "মনিটরিং"}
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">ওষুধ আদারেন্স</span>
                          <span className="font-bold">{patient.adherence}%</span>
                        </div>
                        <Progress value={patient.adherence} className="h-2" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 text-center">
                          <Pill className="w-5 h-5 mx-auto mb-1 text-primary" />
                          <p className="text-lg font-bold">{patient.medicines}</p>
                          <p className="text-xs text-gray-500">সক্রিয় ওষুধ</p>
                        </div>
                        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 text-center">
                          <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
                          <p className="text-lg font-bold">৮/৮</p>
                          <p className="text-xs text-gray-500">আজকের ডোজ</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="rounded-full flex-1">
                          <MessageSquare className="w-4 h-4 mr-1" /> মেসেজ
                        </Button>
                        <a href={`tel:phone`} className="flex-1">
                          <Button variant="outline" size="sm" className="rounded-full w-full">
                            <Phone className="w-4 h-4 mr-1" /> কল
                          </Button>
                        </a>
                        <Button variant="outline" size="sm" className="rounded-full">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {patients.map((patient, i) => (
          <TabsContent key={i} value={patient.name} className="mt-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-lg shadow-black/5 md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">{patient.name}-এর ওষুধের সময়সূচী</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[{ name: "Napa Extra 500mg", time: "সকাল ৮টা", status: "TAKEN" },
                    { name: "Metformin 850mg", time: "দুপুর ২টা", status: "TAKEN" },
                    { name: "Ecosprin 75mg", time: "রাত ৯টা", status: "PENDING" },
                  ].map((med, j) => (
                    <div key={j} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-900">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${med.status === "TAKEN" ? "bg-emerald-500" : "bg-amber-500"}`} />
                        <div>
                          <p className="font-medium text-sm">{med.name}</p>
                          <p className="text-xs text-gray-500">{med.time}</p>
                        </div>
                      </div>
                      <Badge variant={med.status === "TAKEN" ? "default" : "secondary"} className="text-xs">
                        {med.status === "TAKEN" ? "নেওয়া হয়েছে" : "বাকি"}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-0 shadow-lg shadow-black/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">স্বাস্থ্য স্কোর</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary">৮৫</div>
                      <p className="text-sm text-gray-500">গত সপ্তাহের স্কোর</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg shadow-black/5 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-gray-950">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-amber-600 mb-2">
                      <Bell className="w-4 h-4" />
                      <span className="text-sm font-medium">জরুরি নোটিফিকেশন</span>
                    </div>
                    <p className="text-xs text-gray-500">কোনো জরুরি অবস্থা নেই</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </motion.div>
  )
}
