"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Stethoscope, Users, Calendar, MessageSquare, Pill, FileText, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function DoctorPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const patients = [
    { name: "আব্দুর রহমান", age: 72, condition: "ডায়াবেটিস, উচ্চ রক্তচাপ", lastVisit: "২৫ জুন, ২০২৬", medicines: 5 },
    { name: "ফাতেমা বেগম", age: 68, condition: "ডায়াবেটিস", lastVisit: "২০ জুন, ২০২৬", medicines: 3 },
    { name: "করিম মিয়া", age: 65, condition: "উচ্চ রক্তচাপ", lastVisit: "১৫ জুন, ২০২৬", medicines: 2 },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">ডাক্তার ড্যাশবোর্ড</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">আপনার রোগীদের স্বাস্থ্য পর্যবেক্ষণ করুন</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="text-sm px-4 py-2 gap-2">
            <Users className="w-4 h-4" />
            {patients.length} জন রোগী
          </Badge>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Users, label: "মোট রোগী", value: "১২", color: "from-blue-400 to-indigo-500" },
          { icon: Calendar, label: "আজকের অ্যাপয়েন্টমেন্ট", value: "৩", color: "from-emerald-400 to-teal-500" },
          { icon: MessageSquare, label: "অপঠিত মেসেজ", value: "৫", color: "from-amber-400 to-orange-500" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-0 shadow-lg shadow-black/5">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} p-3`}>
                    <stat.icon className="w-full h-full text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="all" className="mb-6">
        <TabsList className="rounded-xl p-1">
          <TabsTrigger value="all" className="rounded-lg">সব রোগী</TabsTrigger>
          <TabsTrigger value="critical" className="rounded-lg">গুরুতর</TabsTrigger>
          <TabsTrigger value="followup" className="rounded-lg">ফলো-আপ</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="space-y-3">
            {patients.map((patient, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-0 shadow-lg shadow-black/5 hover:shadow-xl transition-all cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-14 h-14">
                        <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                          {patient.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-lg">{patient.name}</h4>
                            <p className="text-sm text-gray-500">{patient.age} বছর • {patient.condition}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                          <span>শেষ ভিজিট: {patient.lastVisit}</span>
                          <span className="flex items-center gap-1">
                            <Pill className="w-3.5 h-3.5" /> {patient.medicines}টি ওষুধ
                          </span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button variant="outline" size="sm" className="rounded-full text-xs h-8">
                            <MessageSquare className="w-3 h-3 mr-1" /> মেসেজ
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-full text-xs h-8">
                            <FileText className="w-3 h-3 mr-1" /> প্রেসক্রিপশন
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-full text-xs h-8">
                            <Calendar className="w-3 h-3 mr-1" /> অ্যাপয়েন্টমেন্ট
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
