"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import dynamic from "next/dynamic"
import { MapPin, Phone, Navigation, Star, Building, Search, FlaskRoundIcon as Flask, Droplets, Clock, Crosshair, Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import L from "leaflet"
import type { Hospital } from "@/types"

const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then(m => m.Popup), { ssr: false })
import "leaflet/dist/leaflet.css"

const defaultCenter: [number, number] = [23.8103, 90.4125] // Dhaka

const typeColors: Record<string, string> = {
  hospital: "#F96801",
  diagnostic: "#25C2C3",
  pharmacy: "#DE1B2D",
}

function createIcon(type: string) {
  const color = typeColors[type] || "#F96801"
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="width:32px;height:32px;background:${color};border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  })
}

const userIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="width:24px;height:24px;background:#25C2C3;border:3px solid #fff;border-radius:50%;box-shadow:0 0 16px rgba(37,194,195,.8);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [selected, setSelected] = useState<Hospital | null>(null)
  const [eta, setEta] = useState<string | null>(null)
  const [tracking, setTracking] = useState(false)
  const [routeDist, setRouteDist] = useState<string | null>(null)
  const watchId = useRef<number | null>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    getUserLocation()
    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current)
    }
  }, [])

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude]
          setUserLocation(loc)
          fetchHospitals(loc[0], loc[1])
        },
        (err) => {
          console.error("Geolocation error:", err)
          setError("GPS অনুমতি পাওয়া যায়নি। ঢাকার ডিফল্ট লোকেশন ব্যবহৃত হচ্ছে।")
          fetchHospitals(defaultCenter[0], defaultCenter[1])
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    } else {
      setError("আপনার ব্রাউজার GPS সমর্থন করে না।")
      fetchHospitals(defaultCenter[0], defaultCenter[1])
    }
  }

  const toggleTracking = () => {
    if (tracking) {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current)
      setTracking(false)
      toast.info("GPS ট্র্যাকিং বন্ধ করা হয়েছে")
    } else {
      if (!navigator.geolocation) {
        toast.error("GPS সমর্থিত নয়")
        return
      }
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude]
          setUserLocation(loc)
          fetchHospitals(loc[0], loc[1])
          mapRef.current?.panTo(loc)
        },
        () => toast.error("GPS অবস্থান পাওয়া যায়নি"),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      )
      setTracking(true)
      toast.success("GPS ট্র্যাকিং চালু হয়েছে")
    }
  }

  const fetchHospitals = async (lat?: number, lng?: number) => {
    setLoading(true)
    setError("")
    try {
      if (!lat || !lng) {
        lat = defaultCenter[0]
        lng = defaultCenter[1]
      }

      // Call Overpass API directly from browser (avoids Vercel server-side issues)
      const type = filter !== "all" ? filter : "all"
      const around = `(around:5000,${lat},${lng})`
      let filters = ""
      if (type === "pharmacy") {
        filters = `node["amenity"="pharmacy"]${around};`
      } else if (type === "diagnostic") {
        filters = `node["healthcare"="doctor"]${around};`
      } else if (type === "hospital") {
        filters = `node["amenity"="hospital"]${around};way["amenity"="hospital"]${around};node["amenity"="clinic"]${around};`
      } else {
        filters = `node["amenity"="hospital"]${around};node["amenity"="clinic"]${around};node["amenity"="pharmacy"]${around};node["healthcare"="doctor"]${around};way["amenity"="hospital"]${around};`
      }
      const query = `[out:json][timeout:8];(${filters});out center 20;`

      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
      })

      if (!res.ok) {
        setError(`Overpass API error: ${res.status}`)
        setLoading(false)
        return
      }

      const data = await res.json()
      if (!data.elements?.length) {
        setError("এই এলাকায় কোনো হাসপাতাল পাওয়া যায়নি। অন্য এলাকা সার্চ করুন।")
        setHospitals([])
        setLoading(false)
        return
      }

      const hospitals = data.elements
        .filter((el: Record<string, unknown>) => el.tags)
        .map((el: Record<string, unknown>) => {
          const t = el.tags as Record<string, string>
          const lat2 = el.type === "way" ? ((el.center as Record<string, number>)?.lat ?? lat!) : (el.lat as number)
          const lng2 = el.type === "way" ? ((el.center as Record<string, number>)?.lon ?? lng!) : (el.lon as number)
          const ot = t.amenity || t.healthcare || "hospital"
          const typeLabel: Record<string, string> = { hospital: "hospital", clinic: "hospital", pharmacy: "pharmacy", doctor: "diagnostic" }
          return {
            id: `${el.type}-${el.id}`,
            name: t.name || t["name:bn"] || (ot === "hospital" ? "হাসপাতাল" : ot === "pharmacy" ? "ফার্মেসী" : ot === "clinic" ? "ক্লিনিক" : "ডাক্তার"),
            type: typeLabel[ot] || "hospital",
            address: t["addr:full"] || t["addr:street"] || t["addr:city"] || "",
            latitude: lat2,
            longitude: lng2,
            phone: t.phone || t["contact:phone"] || null,
            rating: null,
            emergency: ot === "hospital",
            ambulance: t.ambulance === "yes",
            bloodBank: false,
            specialties: [ot],
            distance: calcDist(lat!, lng!, lat2, lng2),
          }
        })
        .sort((a: { distance: number }, b: { distance: number }) => a.distance - b.distance)
        .slice(0, 50)

      setHospitals(hospitals)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "নেটওয়ার্ক ত্রুটি"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userLocation) fetchHospitals(userLocation[0], userLocation[1])
  }, [filter])

  const onSelect = useCallback(async (hospital: Hospital) => {
    setSelected(hospital)
    setRouteDist(null)
    setEta(null)
    if (userLocation) {
      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${userLocation[1]},${userLocation[0]};${hospital.longitude},${hospital.latitude}?overview=false`
        )
        const data = await res.json()
        if (data.code === "Ok" && data.routes?.[0]) {
          const route = data.routes[0]
          const distKm = (route.distance / 1000).toFixed(1)
          const mins = Math.round(route.duration / 60)
          setRouteDist(`${distKm} কিমি`)
          setEta(`${mins} মিনিট`)
        }
      } catch {
        // OSRM may be rate limited, use straight-line estimate
        const dist = calcDist(userLocation[0], userLocation[1], hospital.latitude, hospital.longitude)
        setRouteDist(`${dist.toFixed(1)} কিমি`)
        setEta(`${Math.round(dist * 3)} মিনিট`)
      }
    }
  }, [userLocation])

  const getDirections = (hospital: Hospital) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}&travelmode=driving`
    window.open(url, "_blank")
  }

  const searchPlace = async (q: string) => {
    if (!q.trim()) return
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`)
      const data = await res.json()
      if (data?.[0]) {
        const loc: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)]
        setUserLocation(loc)
        mapRef.current?.panTo(loc)
        mapRef.current?.setZoom(14)
        fetchHospitals(loc[0], loc[1])
      }
    } catch {
      toast.error("ঠিকানা পাওয়া যায়নি")
    }
  }

  const filtered = hospitals.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.address.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-4">
      {/* Left Panel */}
      <div className="lg:w-[420px] xl:w-[480px] flex flex-col gap-4 overflow-hidden">
        <div>
          <h2 className="text-xl font-bold text-[#EFF2F2]">নিকটস্থ হাসপাতাল</h2>
          <p className="text-sm text-[#A5ABB0] mt-0.5">OpenStreetMap - সম্পূর্ণ ফ্রি, কোনো API key লাগবে না</p>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A5ABB0] z-10" />
            <Input
              placeholder="ঠিকানা সার্চ করুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") searchPlace(search) }}
              className="pl-9 h-10 text-sm bg-white/[.04] border border-white/[.08] text-[#EFF2F2] placeholder:text-[#A5ABB0] rounded-xl"
            />
          </div>
          <Button onClick={() => fetchHospitals(userLocation?.[0], userLocation?.[1])} disabled={loading}
            className="h-10 px-3 rounded-xl glass text-[#A5ABB0] hover:text-[#EFF2F2]">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
          <Button onClick={toggleTracking}
            className={`h-10 w-10 p-0 rounded-xl ${tracking ? "bg-[#F96801] text-[#160500]" : "glass text-[#A5ABB0]"}`}>
            <Crosshair className={`w-4 h-4 ${tracking ? "animate-pulse" : ""}`} />
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="rounded-xl p-1 bg-white/[.04] border border-white/[.08]">
            <TabsTrigger value="all" className="rounded-lg text-xs data-[state=active]:bg-[#F96801] data-[state=active]:text-[#160500]">সব</TabsTrigger>
            <TabsTrigger value="hospital" className="rounded-lg text-xs data-[state=active]:bg-[#F96801] data-[state=active]:text-[#160500]">হাসপাতাল</TabsTrigger>
            <TabsTrigger value="diagnostic" className="rounded-lg text-xs data-[state=active]:bg-[#F96801] data-[state=active]:text-[#160500]">ডায়াগনস্টিক</TabsTrigger>
            <TabsTrigger value="pharmacy" className="rounded-lg text-xs data-[state=active]:bg-[#F96801] data-[state=active]:text-[#160500]">ফার্মেসী</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
          {loading ? (
            [1,2,3,4].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl bg-white/[.04]" />)
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-[#2B3856] mx-auto mb-3" />
              <p className="text-[#A5ABB0] text-sm">কোনো হাসপাতাল পাওয়া যায়নি</p>
              <Button variant="outline" size="sm" onClick={() => fetchHospitals(userLocation?.[0], userLocation?.[1])}
                className="mt-4 text-xs rounded-xl border-white/[.1] text-[#A5ABB0]">
                <RefreshCw className="w-3 h-3 mr-1" /> আবার চেষ্টা করুন
              </Button>
            </div>
          ) : filtered.map((h, i) => {
            const Icon = h.type === "hospital" ? Building : h.type === "diagnostic" ? Flask : Droplets
            const isSelected = selected?.id === h.id
            return (
              <div
                key={h.id}
                onClick={() => onSelect(h)}
                className={`glass rounded-2xl p-4 cursor-pointer transition-all duration-200 ${
                  isSelected ? "border-[#F96801]/50 shadow-lg shadow-[#F96801]/5" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${typeColors[h.type]}20`, color: typeColors[h.type] }}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-[#EFF2F2] truncate">{h.name}</h3>
                      {h.rating && (
                        <div className="flex items-center gap-1 text-[#FBBF24] text-xs flex-shrink-0">
                          <Star className="w-3 h-3 fill-current" />
                          {h.rating}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-[#A5ABB0] mt-0.5 line-clamp-1">{h.address || "ঠিকানা নেই"}</p>
                    <div className="flex items-center gap-3 mt-2">
                      {h.distance !== undefined && (
                        <span className="text-xs text-[#A5ABB0] flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {h.distance.toFixed(1)} কিমি
                        </span>
                      )}
                      {isSelected && eta && (
                        <span className="text-xs text-[#25C2C3] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          ETA: {eta}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {h.emergency && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#DE1B2D]/20 text-[#f87171]">জরুরি</span>}
                      {h.ambulance && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#25C2C3]/20 text-[#25C2C3]">আম্বুলেন্স</span>}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right Panel - Map */}
      <div className="flex-1 rounded-2xl overflow-hidden glass-border-gradient min-h-[400px] relative">
        <MapContainer
          center={userLocation || defaultCenter}
          zoom={userLocation ? 13 : 12}
          className="h-full w-full"
          ref={mapRef}
          style={{ background: "#040406" }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {userLocation && (
            <Marker position={userLocation} icon={userIcon}>
              <Popup><span className="text-sm font-medium">আপনার অবস্থান</span></Popup>
            </Marker>
          )}

          {filtered.map((h) => (
            <Marker
              key={h.id}
              position={[h.latitude, h.longitude]}
              icon={createIcon(h.type)}
              eventHandlers={{ click: () => onSelect(h) }}
            >
              {selected?.id === h.id && (
                <Popup>
                  <div style={{ minWidth: 200, fontFamily: "system-ui,sans-serif" }}>
                    <h3 style={{ fontWeight: 600, fontSize: 14, margin: "0 0 4px", color: "#EFF2F2" }}>{h.name}</h3>
                    <p style={{ fontSize: 12, color: "#A5ABB0", margin: "0 0 8px" }}>{h.address || "ঠিকানা নেই"}</p>
                    {eta && routeDist && (
                      <p style={{ fontSize: 12, color: "#25C2C3", margin: "0 0 8px" }}>
                        🚗 {routeDist} · ETA: {eta}
                      </p>
                    )}
                    <div style={{ display: "flex", gap: 6 }}>
                      {h.phone && (
                        <a href={`tel:${h.phone}`} style={{
                          fontSize: 11, padding: "4px 10px", borderRadius: 999,
                          background: "rgba(249,104,1,.2)", color: "#F96801", textDecoration: "none"
                        }}>📞 Call</a>
                      )}
                      <button onClick={() => getDirections(h)} style={{
                        fontSize: 11, padding: "4px 10px", borderRadius: 999,
                        background: "rgba(37,194,195,.2)", color: "#25C2C3", border: "none", cursor: "pointer"
                      }}>🗺️ Google Maps</button>
                    </div>
                  </div>
                </Popup>
              )}
            </Marker>
          ))}
        </MapContainer>

        {/* ETA Bar */}
        {routeDist && (
          <div className="absolute bottom-4 left-4 right-4 z-[999]">
            <Card className="bg-[#0a0d16]/90 backdrop-blur-xl border border-[#25C2C3]/30">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm">
                  <Navigation className="w-4 h-4 text-[#25C2C3]" />
                  <span className="text-[#EFF2F2]">{routeDist} · ETA: {eta}</span>
                </div>
                <Button size="sm" onClick={() => selected && getDirections(selected)}
                  className="gradient-primary text-[#160500] text-xs h-8">
                  Google Maps এ খুলুন
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

function calcDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
