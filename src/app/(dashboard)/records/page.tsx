"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Activity, Plus, FileText, Heart, Droplets, Thermometer, Weight, TrendingUp, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import Link from "next/link"
import type { HealthRecord } from "@/types"

export default function RecordsPage() {
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/health-records")
      if (res.ok) setRecords(await res.json())
    } catch {
      toast.error("রেকর্ড লোড করতে সমস্যা")
    } finally {
      setLoading(false)
    }
  }

  const typeColors: Record<string, string> = {
    blood_pressure: "from-red-400 to-rose-500",
    blood_sugar: "from-blue-400 to-indigo-500",
    weight: "from-emerald-400 to-teal-500",
    temperature: "from-amber-400 to-orange-500",
    heart_rate: "from-rose-400 to-pink-500",
    lab_report: "from-purple-400 to-violet-500",
    xray: "from-cyan-400 to-blue-500",
    mri: "from-indigo-400 to-purple-500",
    other: "from-gray-400 to-gray-500",
  }

  const typeIcons: Record<string, React.ElementType> = {
    blood_pressure: Heart,
    blood_sugar: Droplets,
    weight: Weight,
    temperature: Thermometer,
    heart_rate: Heart,
    lab_report: FileText,
    xray: Activity,
    mri: Activity,
  }

  const filtered = filter === "all" ? records : records.filter(r => r.type === filter)

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">স্বাস্থ্য রেকর্ড</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">আপনার সকল স্বাস্থ্য তথ্য এক জায়গায়</p>
        </div>
        <Link href="/records/add">
          <Button className="rounded-full gradient-primary text-white">
            <Plus className="w-4 h-4 mr-2" />
            নতুন রেকর্ড
          </Button>
        </Link>
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList className="rounded-xl p-1 overflow-x-auto">
          <TabsTrigger value="all" className="rounded-lg text-sm">সব</TabsTrigger>
          <TabsTrigger value="blood_pressure" className="rounded-lg text-sm">ব্লাড প্রেসার</TabsTrigger>
          <TabsTrigger value="blood_sugar" className="rounded-lg text-sm">ব্লাড সুগার</TabsTrigger>
          <TabsTrigger value="weight" className="rounded-lg text-sm">ওজন</TabsTrigger>
          <TabsTrigger value="heart_rate" className="rounded-lg text-sm">হার্ট রেট</TabsTrigger>
          <TabsTrigger value="lab_report" className="rounded-lg text-sm">ল্যাব রিপোর্ট</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((record, i) => {
            const Icon = typeIcons[record.type] || Activity
            const color = typeColors[record.type] || "from-gray-400 to-gray-500"
            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="border-0 shadow-lg shadow-black/5 hover:shadow-xl transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} p-2.5 flex-shrink-0`}>
                        <Icon className="w-full h-full text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{record.title}</h4>
                            <p className="text-sm text-gray-500">
                              {new Date(record.date).toLocaleDateString("bn", { day: "numeric", month: "long", year: "numeric" })}
                            </p>
                          </div>
                          {record.value && (
                            <Badge variant="secondary" className="text-sm font-bold">
                              {record.value} {record.unit}
                            </Badge>
                          )}
                        </div>
                        {record.description && (
                          <p className="text-sm text-gray-500 mt-2 line-clamp-2">{record.description}</p>
                        )}
                        {record.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {record.tags.map((tag, j) => (
                              <Badge key={j} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <Activity className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">কোনো রেকর্ড নেই</h3>
              <p className="text-gray-500 mb-6">আপনার প্রথম স্বাস্থ্য রেকর্ড যোগ করুন</p>
              <Link href="/records/add">
                <Button className="rounded-full gradient-primary text-white">
                  <Plus className="w-4 h-4 mr-2" /> রেকর্ড যোগ করুন
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}
