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
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "PATIENT", adminCode: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const payload: any = { name: form.name, email: form.email, phone: form.phone, password: form.password, role: form.role }
      if (form.role === "ADMIN") payload.adminCode = form.adminCode
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("অ্যাকাউন্ট তৈরি হয়েছে!")
        router.push("/auth/login")
      } else {
        toast.error(data.error || "রেজিস্টার করতে সমস্যা হয়েছে")
      }
    } catch {
      toast.error("সার্ভার ত্রুটি")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: "url('/bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-md px-4 relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#F96801] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> হোম পেজে ফিরুন
        </Link>

        <Card className="glass bg-transparent border border-white/[.12] shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-[#F96801]/30">
                <Heart className="w-7 h-7" fill="currentColor" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">নতুন অ্যাকাউন্ট</CardTitle>
            <CardDescription className="text-muted-foreground">Medify-তে রেজিস্টার করুন</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">আপনি কী হিসেবে যোগ দিতে চান?</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: "PATIENT", label: "রোগী", icon: "🩺" },
                    { value: "GUARDIAN", label: "অভিভাবক", icon: "👨‍👩‍👧‍👦" },
                    { value: "DOCTOR", label: "ডাক্তার", icon: "👨‍⚕️" },
                    { value: "ADMIN", label: "এডমিন", icon: "⚙️" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, role: opt.value })}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        form.role === opt.value
                          ? "border-[#F96801] glass text-[#F96801]"
                          : "border-white/[.08] glass text-muted-foreground hover:border-white/[.15]"
                      }`}
                    >
                      <span className="text-lg block mb-1">{opt.icon}</span>
                      <span className="text-xs font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {form.role === "ADMIN" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2">
                  <Label className="text-muted-foreground">অ্যাডমিন সিক্রেট কোড</Label>
                  <Input placeholder="এডমিন কোড লিখুন"
                    value={form.adminCode}
                    onChange={e => setForm({ ...form, adminCode: e.target.value })}
                    className="py-6 text-base rounded-xl glass border-white/[.08] text-foreground placeholder:text-muted-foreground focus:border-[#F96801]/50"
                  />
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-muted-foreground">নাম</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input id="name" placeholder="আপনার নাম"
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="pl-11 py-6 text-base rounded-xl glass border-white/[.08] text-foreground placeholder:text-muted-foreground focus:border-[#F96801]/50"
                    required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground">ইমেইল</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="your@email.com"
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="pl-11 py-6 text-base rounded-xl glass border-white/[.08] text-foreground placeholder:text-muted-foreground focus:border-[#F96801]/50"
                    required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-muted-foreground">ফোন (ঐচ্ছিক)</Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A5ABB0]" />
                  <Input id="phone" type="tel" placeholder="+8801XXXXXXXXX"
                    value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="pl-11 py-6 text-base rounded-xl glass border-white/[.08] text-[#EFF2F2] placeholder:text-[#A5ABB0] focus:border-[#F96801]/50" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-muted-foreground">পাসওয়ার্ড</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="কমপক্ষে ৬ অক্ষর"
                    value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="pl-11 pr-11 py-6 text-base rounded-xl glass border-white/[.08] text-foreground placeholder:text-muted-foreground focus:border-[#F96801]/50"
                    required minLength={6} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A5ABB0] hover:text-[#EFF2F2]">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button type="submit" disabled={isLoading}
                className="w-full py-6 text-base rounded-xl gradient-primary text-[#160500] shadow-lg shadow-[#F96801]/20 btn-shine">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                রেজিস্টার করুন
              </Button>

              <p className="text-sm text-[#A5ABB0] text-center">
                ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
                <Link href="/auth/login" className="text-[#F96801] font-medium hover:underline">
                  লগইন করুন
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
