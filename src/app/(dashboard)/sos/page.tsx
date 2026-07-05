"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { AlertTriangle, Phone, MapPin, Send, Loader2, CheckCircle2, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

export default function SOSPage() {
  const router = useRouter()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)

  const getLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"))
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => reject(new Error("Location permission denied")),
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  }

  const handleSOS = async () => {
    setSending(true)
    try {
      let coords = null
      try {
        coords = await getLocation()
        setLocation(coords)
      } catch {
        // Location not available, send without location
      }

      const res = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: coords?.lat,
          longitude: coords?.lng,
          message: "SOS Emergency! I need immediate help!",
        }),
      })

      if (res.ok) {
        setSent(true)
        toast.success("SOS অ্যালার্ট পাঠানো হয়েছে! সাহায্য আসছে।", {
          duration: 5000,
        })
      } else {
        toast.error("SOS পাঠাতে সমস্যা হয়েছে")
      }
    } catch {
      toast.error("SOS পাঠাতে সমস্যা হয়েছে")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md px-4"
      >
        {!sent ? (
          <Card className="border-0 shadow-2xl shadow-red-500/10 bg-white dark:bg-gray-950 text-center">
            <CardContent className="p-8">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
                className="w-28 h-28 rounded-full gradient-danger flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-500/30"
              >
                <AlertTriangle className="w-14 h-14 text-white" />
              </motion.div>

              <h1 className="text-3xl font-bold mb-2">SOS ইমারজেন্সি</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                জরুরি অবস্থায় নিচের বাটনে ক্লিক করুন
              </p>
              <p className="text-sm text-red-500 font-medium mb-8">
                আপনার অবস্থান ও তথ্য গার্ডিয়ান ও জরুরি কন্টাক্টে পাঠানো হবে
              </p>

              {location && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
                  <MapPin className="w-4 h-4 text-red-500" />
                  অবস্থান সনাক্ত করা হয়েছে
                </div>
              )}

              <button
                onClick={handleSOS}
                disabled={sending}
                className="w-48 h-48 rounded-full gradient-danger text-white shadow-2xl shadow-red-500/40 hover:shadow-red-500/60 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mx-auto flex flex-col items-center justify-center gap-3"
              >
                {sending ? (
                  <Loader2 className="w-12 h-12 animate-spin" />
                ) : (
                  <>
                    <AlertTriangle className="w-12 h-12" />
                    <span className="text-2xl font-bold">SOS</span>
                    <span className="text-sm">এখানে ক্লিক করুন</span>
                  </>
                )}
              </button>

              <div className="mt-8 space-y-3">
                <p className="text-sm text-gray-500">অথবা সরাসরি কল করুন</p>
                <div className="grid grid-cols-2 gap-3">
                  <a href="tel:999">
                    <Button variant="outline" className="w-full rounded-xl py-6">
                      <Phone className="w-5 h-5 mr-2 text-red-500" />
                      999
                    </Button>
                  </a>
                  <a href="tel:16263">
                    <Button variant="outline" className="w-full rounded-xl py-6">
                      <Phone className="w-5 h-5 mr-2 text-blue-500" />
                      16263
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-2xl shadow-emerald-500/10 bg-white dark:bg-gray-950 text-center">
            <CardContent className="p-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-28 h-28 rounded-full gradient-success flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-14 h-14 text-white" />
              </motion.div>

              <h1 className="text-3xl font-bold mb-2">SOS পাঠানো হয়েছে!</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                আপনার জরুরি কন্টাক্ট ও গার্ডিয়ানকে নোটিফিকেশন পাঠানো হয়েছে। সাহায্য আসছে।
              </p>

              <div className="flex items-center justify-center gap-2 text-emerald-500 mb-8">
                <Heart className="w-5 h-5" fill="currentColor" />
                <span className="font-medium">আমরা আপনার সাথে আছি</span>
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => router.push("/emergency")}
                  className="rounded-full"
                >
                  জরুরি কন্টাক্ট
                </Button>
                <Button
                  onClick={() => {
                    setSent(false)
                    setLocation(null)
                  }}
                  className="rounded-full gradient-primary text-white"
                >
                  আবার পাঠান
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  )
}
