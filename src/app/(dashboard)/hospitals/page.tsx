"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { GoogleMap, MarkerF, InfoWindowF, LoadScript, DirectionsService, DirectionsRenderer, Autocomplete } from "@react-google-maps/api"
import { MapPin, Phone, Navigation, Star, Building, Search, FlaskRoundIcon as Flask, Droplets, Clock, Ambulance, Crosshair, GripVertical } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import type { Hospital } from "@/types"

const containerStyle = { width: "100%", height: "100%" }
const defaultCenter = { lat: 23.8103, lng: 90.4125 }
const libraries: ("places" | "geometry")[] = ["places", "geometry"]

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  styles: [
    { elementType: "geometry", stylers: [{ color: "#0a0d16" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#0a0d16" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#A5ABB0" }] },
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a1f2e" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#EFF2F2" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#040406" }] },
    { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#2B3856" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
  ],
}

const typeColors: Record<string, string> = {
  hospital: "#F96801",
  diagnostic: "#25C2C3",
  pharmacy: "#DE1B2D",
  blood_bank: "#f87171",
}

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [selected, setSelected] = useState<Hospital | null>(null)
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null)
  const [eta, setEta] = useState<string | null>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [tracking, setTracking] = useState(false)
  const watchId = useRef<number | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

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
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setUserLocation(loc)
          fetchHospitals(loc.lat, loc.lng)
        },
        () => fetchHospitals(),
        { enableHighAccuracy: true, timeout: 10000 }
      )
    } else {
      fetchHospitals()
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
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setUserLocation(loc)
          fetchHospitals(loc.lat, loc.lng)
          map?.panTo(loc)
        },
        () => toast.error("GPS অবস্থান পাওয়া যায়নি"),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      )
      setTracking(true)
      toast.success("GPS ট্র্যাকিং চালু হয়েছে")
    }
  }

  const fetchHospitals = async (lat?: number, lng?: number) => {
    try {
      const params = new URLSearchParams()
      if (lat && lng) { params.set("lat", lat.toString()); params.set("lng", lng.toString()) }
      if (filter !== "all") params.set("type", filter)
      params.set("limit", "50")
      const res = await fetch(`/api/hospitals?${params}`)
      if (res.ok) {
        const data = await res.json()
        setHospitals(data)
      }
    } catch {
      toast.error("হাসপাতালের ডাটা লোড করতে সমস্যা")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHospitals(userLocation?.lat, userLocation?.lng)
  }, [filter])

  const onSelect = useCallback((hospital: Hospital) => {
    setSelected(hospital)
    setDirections(null)
    setEta(null)
    if (userLocation) {
      const service = new google.maps.DistanceMatrixService()
      service.getDistanceMatrix(
        {
          origins: [new google.maps.LatLng(userLocation.lat, userLocation.lng)],
          destinations: [new google.maps.LatLng(hospital.latitude, hospital.longitude)],
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
        },
        (result, status) => {
          if (status === "OK" && result?.rows[0]?.elements[0]?.status === "OK") {
            setEta(result.rows[0].elements[0].duration.text)
          }
        }
      )
    }
  }, [userLocation])

  const getDirections = () => {
    if (!userLocation || !selected) return
    setDirections(null)
    const request: google.maps.DirectionsRequest = {
      origin: new google.maps.LatLng(userLocation.lat, userLocation.lng),
      destination: new google.maps.LatLng(selected.latitude, selected.longitude),
      travelMode: google.maps.TravelMode.DRIVING,
    }
    const ds = new google.maps.DirectionsService()
    ds.route(request, (result, status) => {
      if (status === "OK") setDirections(result)
      else toast.error("রুট পাওয়া যায়নি")
    })
  }

  const onPlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace()
    if (place?.geometry?.location) {
      const loc = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
      setUserLocation(loc)
      map?.panTo(loc)
      map?.setZoom(14)
      fetchHospitals(loc.lat, loc.lng)
    }
  }

  const filtered = hospitals.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.address.toLowerCase().includes(search.toLowerCase()) ||
    h.specialties?.some(s => s.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
      libraries={libraries}
    >
      <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-4">
        <div className="lg:w-[420px] xl:w-[480px] flex flex-col gap-4 overflow-hidden">
          <div>
            <h2 className="text-xl font-bold text-[#EFF2F2]">নিকটস্থ হাসপাতাল</h2>
            <p className="text-sm text-[#A5ABB0] mt-0.5">Google Maps-এ রিয়েল-টাইম লোকেশন ও ETA</p>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A5ABB0] z-10" />
              <Autocomplete
                onLoad={(ref) => { autocompleteRef.current = ref }}
                onPlaceChanged={onPlaceChanged}
              >
                <Input
                  placeholder="ঠিকানা সার্চ করুন..."
                  className="pl-9 h-10 text-sm bg-white/[.04] border border-white/[.08] text-[#EFF2F2] placeholder:text-[#A5ABB0] rounded-xl"
                />
              </Autocomplete>
            </div>
            <Button
              onClick={toggleTracking}
              className={`h-10 w-10 p-0 rounded-xl ${tracking ? "bg-[#F96801] text-[#160500]" : "glass text-[#A5ABB0]"}`}
            >
              <Crosshair className={`w-4 h-4 ${tracking ? "animate-pulse" : ""}`} />
            </Button>
          </div>

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
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${typeColors[h.type]}20`, color: typeColors[h.type] }}
                    >
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
                      <p className="text-xs text-[#A5ABB0] mt-0.5 line-clamp-1">{h.address}</p>
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
                            {eta}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {h.emergency && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#DE1B2D]/20 text-[#f87171]">জরুরি</span>}
                        {h.ambulance && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#25C2C3]/20 text-[#25C2C3]">আম্বুলেন্স</span>}
                        {h.bloodBank && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#DE1B2D]/20 text-[#f87171]">ব্লাড ব্যাংক</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex-1 rounded-2xl overflow-hidden glass-border-gradient min-h-[400px] relative">
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={userLocation || defaultCenter}
            zoom={13}
            options={mapOptions}
            onLoad={(m) => setMap(m)}
          >
            {userLocation && (
              <MarkerF
                position={userLocation}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: "#25C2C3",
                  fillOpacity: 1,
                  strokeColor: "#FFFFFF",
                  strokeWeight: 3,
                }}
                title="আপনার অবস্থান"
              />
            )}

            {filtered.map((h) => (
              <MarkerF
                key={h.id}
                position={{ lat: h.latitude, lng: h.longitude }}
                onClick={() => onSelect(h)}
                icon={{
                  url: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="14" fill="${typeColors[h.type]}" stroke="#FFFFFF" stroke-width="3"/></svg>`)}`,
                  scaledSize: new google.maps.Size(36, 36),
                  anchor: new google.maps.Point(18, 18),
                }}
              />
            ))}

            {selected && (
              <InfoWindowF
                position={{ lat: selected.latitude, lng: selected.longitude }}
                onCloseClick={() => { setSelected(null); setDirections(null); setEta(null) }}
              >
                <div style={{
                  background: "#0a0d16",
                  color: "#EFF2F2",
                  padding: "12px",
                  borderRadius: "12px",
                  maxWidth: "240px",
                  fontFamily: "system-ui, sans-serif"
                }}>
                  <h3 style={{ fontWeight: 600, fontSize: "14px", margin: "0 0 4px" }}>{selected.name}</h3>
                  <p style={{ fontSize: "12px", color: "#A5ABB0", margin: "0 0 8px" }}>{selected.address}</p>
                  {eta && (
                    <p style={{ fontSize: "12px", color: "#25C2C3", margin: "0 0 8px" }}>
                      🚗 ETA: {eta}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: "6px" }}>
                    {selected.phone && (
                      <a href={`tel:${selected.phone}`} style={{
                        fontSize: "11px", padding: "4px 10px", borderRadius: "999px",
                        background: "rgba(249,104,1,.2)", color: "#F96801", textDecoration: "none"
                      }}>
                        📞 Call
                      </a>
                    )}
                    <button onClick={getDirections} style={{
                      fontSize: "11px", padding: "4px 10px", borderRadius: "999px",
                      background: "rgba(37,194,195,.2)", color: "#25C2C3", border: "none", cursor: "pointer"
                    }}>
                      🗺️ Route
                    </button>
                  </div>
                </div>
              </InfoWindowF>
            )}

            {directions && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  polylineOptions: {
                    strokeColor: "#F96801",
                    strokeWeight: 4,
                    strokeOpacity: 0.8,
                  },
                  suppressMarkers: true,
                }}
              />
            )}
          </GoogleMap>
        </div>
      </div>
    </LoadScript>
  )
}
