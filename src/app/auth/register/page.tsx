"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Heart, Mail, Lock, User, Phone, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (form.password !== form.confirmPassword) {
      toast.error("পাসওয়ার্ড মিলছে না")
      return
    }

    if (form.password.length < 6) {
      toast.error("পাসওয়ার্ড কমপক্ষে ৬ ক্যারেক্টার হতে হবে")
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "রেজিস্টার করতে সমস্যা হয়েছে")
        return
      }

      toast.success("অ্যাকাউন্ট তৈরি হয়েছে! অনুগ্রহ করে লগইন করুন")
      router.push("/auth/login")
    } catch {
      toast.error("রেজিস্টার করতে সমস্যা হয়েছে")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
      <div className="absolute inset-0 bg-grid-gray-900/[0.02] dark:bg-grid-white/[0.02]" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md px-4 relative z-10"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          হোম পেজে ফিরুন
        </Link>

        <Card className="border-0 shadow-2xl shadow-black/5 dark:shadow-black/20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Heart className="w-7 h-7 text-white" fill="white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">নতুন অ্যাকাউন্ট</CardTitle>
            <CardDescription className="text-base">
              Medify তে রেজিস্টার করুন
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base font-medium">পূর্ণ নাম</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="name" placeholder="আপনার নাম" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="pl-11 py-6 text-base rounded-xl" required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-medium">ইমেইল</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email" type="email" placeholder="your@email.com" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="pl-11 py-6 text-base rounded-xl" required autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-base font-medium">ফোন নাম্বার</Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="phone" type="tel" placeholder="+880 1XXX-XXXXXX" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="pl-11 py-6 text-base rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-medium">পাসওয়ার্ড</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password" type={showPassword ? "text" : "password"} placeholder="কমপক্ষে ৬ ক্যারেক্টার"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="pl-11 pr-11 py-6 text-base rounded-xl" required
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-base font-medium">পাসওয়ার্ড নিশ্চিত করুন</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="confirmPassword" type="password" placeholder="আবার পাসওয়ার্ড দিন"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="pl-11 py-6 text-base rounded-xl" required
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button type="submit" disabled={isLoading}
                className="w-full py-6 text-base rounded-xl gradient-primary text-white shadow-lg shadow-primary/20"
              >
                {isLoading && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                রেজিস্টার করুন
              </Button>

              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
                <Link href="/auth/login" className="text-primary font-medium hover:underline">
                  লগইন করুন
                </Link>
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-2">
                রেজিস্টার করার মাধ্যমে আপনি আমাদের{" "}
                <Link href="#" className="underline">শর্তাবলী</Link> ও{" "}
                <Link href="#" className="underline">প্রাইভেসি পলিসি</Link> গ্রহণ করছেন।
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
