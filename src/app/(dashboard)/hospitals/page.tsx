"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { MapPin, Phone, Navigation, Star, Building, Search, Filter, Ambulance, FlaskRoundIcon as Flask, Droplets } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import type { Hospital } from "@/types"

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    getUserLocation()
  }, [])

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          fetchHospitals(pos.coords.latitude, pos.coords.longitude)
        },
        () => fetchHospitals(),
        { enableHighAccuracy: true, timeout: 10000 }
      )
    } else {
      fetchHospitals()
    }
  }

  const fetchHospitals = async (lat?: number, lng?: number) => {
    try {
      const params = new URLSearchParams()
      if (lat && lng) {
        params.set("lat", lat.toString())
        params.set("lng", lng.toString())
      }
      if (filter !== "all") params.set("type", filter)
      params.set("limit", "50")

      const res = await fetch(`/api/hospitals?${params}`)
      if (res.ok) setHospitals(await res.json())
    } catch {
      toast.error("হাসপাতালের ডাটা লোড করতে সমস্যা")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHospitals(userLocation?.lat, userLocation?.lng)
  }, [filter])

  const filtered = hospitals.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.address.toLowerCase().includes(search.toLowerCase()) ||
    h.specialties.some(s => s.toLowerCase().includes(search.toLowerCase()))
  )

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "hospital": return Building
      case "diagnostic": return Flask
      case "pharmacy": return Droplets
      case "blood_bank": return Droplets
      default: return Building
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold">নিকটস্থ হাসপাতাল</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">আপনার অবস্থানের নিকটে স্বাস্থ্য সেবা কেন্দ্র</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="হাসপাতালের নাম বা ঠিকানা সার্চ করুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 py-6 text-base rounded-xl"
          />
        </div>
        {userLocation && (
          <Badge variant="outline" className="px-4 py-3 text-sm gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            অবস্থান সনাক্ত করা হয়েছে
          </Badge>
        )}
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList className="rounded-xl p-1">
          <TabsTrigger value="all" className="rounded-lg text-sm">সব</TabsTrigger>
          <TabsTrigger value="hospital" className="rounded-lg text-sm">হাসপাতাল</TabsTrigger>
          <TabsTrigger value="diagnostic" className="rounded-lg text-sm">ডায়াগনস্টিক</TabsTrigger>
          <TabsTrigger value="pharmacy" className="rounded-lg text-sm">ফার্মেসী</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-36 w-full rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((hospital, i) => {
            const Icon = getTypeIcon(hospital.type)
            return (
              <motion.div
                key={hospital.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="border-0 shadow-lg shadow-black/5 hover:shadow-xl transition-all group">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-base truncate">{hospital.name}</h3>
                            <p className="text-sm text-gray-500 mt-0.5">{hospital.address}</p>
                          </div>
                          {hospital.rating && (
                            <div className="flex items-center gap-1 text-amber-500 text-sm flex-shrink-0">
                              <Star className="w-4 h-4 fill-current" />
                              {hospital.rating}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                          {hospital.emergency && <Badge variant="secondary" className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600">জরুরি</Badge>}
                          {hospital.ambulance && <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600">আম্বুলেন্স</Badge>}
                          {hospital.bloodBank && <Badge variant="secondary" className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600">ব্লাড ব্যাংক</Badge>}
                          {hospital.diagnostic && <Badge variant="secondary" className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600">ডায়াগনস্টিক</Badge>}
                        </div>

                        {hospital.distance !== undefined && (
                          <p className="text-xs text-gray-400 mt-2">
                            দূরত্ব: {hospital.distance.toFixed(1)} কিমি
                          </p>
                        )}

                        <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          {hospital.phone && (
                            <a href={`tel:${hospital.phone}`}>
                              <Button variant="outline" size="sm" className="rounded-full text-xs h-8">
                                <Phone className="w-3 h-3 mr-1" /> কল
                              </Button>
                            </a>
                          )}
                          {userLocation && (
                            <a href={`https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${hospital.latitude},${hospital.longitude}`} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm" className="rounded-full text-xs h-8">
                                <Navigation className="w-3 h-3 mr-1" /> দিকনির্দেশ
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-16">
              <MapPin className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">কোনো হাসপাতাল পাওয়া যায়নি</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}
