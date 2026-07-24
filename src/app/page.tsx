"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Activity, Brain, Scan, Bell, Shield, Heart, MapPin, PhoneCall,
  Menu, X, ChevronRight, Star, Users, Clock, Pill, ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => { document.documentElement.classList.add("dark") }, [])

  if (session) { router.push("/dashboard"); return null }

  const features = [
    { icon: Brain, title: "AI মেডিকেল অ্যাসিস্ট্যান্ট", description: "বাংলা ও ইংরেজিতে আপনার স্বাস্থ্য সম্পর্কিত যেকোনো প্রশ্নের উত্তর দিন" },
    { icon: Scan, title: "প্রেসক্রিপশন স্ক্যানার", description: "হাতে লেখা প্রেসক্রিপশন AI দিয়ে পড়ে ওষুধের তালিকা ও রিমাইন্ডার তৈরি করুন" },
    { icon: Bell, title: "ওষুধ রিমাইন্ডার", description: "সময়মতো ওষুধ খাওয়ার জন্য পুশ নোটিফিকেশন ও অ্যালার্ম" },
    { icon: Heart, title: "স্বাস্থ্য মনিটরিং", description: "ব্লাড প্রেসার, সুগার, BMI সহ সকল স্বাস্থ্য ডেটা ট্র্যাক করুন" },
    { icon: Users, title: "পরিবারের সদস্য মনিটরিং", description: "পরিবারের বয়স্ক সদস্যদের ওষুধ ও স্বাস্থ্য পর্যবেক্ষণ করুন" },
    { icon: MapPin, title: "হাসপাতাল ফাইন্ডার", description: "Google Maps-এ নিকটস্থ হাসপাতাল, ETA ও GPS ট্র্যাকিং সহ খুঁজুন" },
  ]

  const stats = [
    { icon: Users, value: "৫০,০০০+", label: "ব্যবহারকারী" },
    { icon: Pill, value: "২ লক্ষ+", label: "ওষুধ ট্র্যাক করা" },
    { icon: Clock, value: "৯৮%", label: "আদারেন্স রেট" },
    { icon: Star, value: "৪.৮", label: "রেটিং" },
  ]

  return (
    <div className="min-h-screen bg-[#040406]">
      <header className="fixed top-0 left-0 right-0 z-50 nav-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-[#F96801]/30">
                <Heart className="w-5 h-5" fill="currentColor" />
              </div>
              <span className="text-xl font-bold gradient-text">Medify</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm font-medium text-[#A5ABB0] hover:text-[#EFF2F2] transition-colors">Features</Link>
              <Link href="#stats" className="text-sm font-medium text-[#A5ABB0] hover:text-[#EFF2F2] transition-colors">Statistics</Link>
              <Link href="#about" className="text-sm font-medium text-[#A5ABB0] hover:text-[#EFF2F2] transition-colors">About</Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/auth/login">
                <Button variant="ghost" className="hidden sm:inline-flex rounded-full px-5 text-[#A5ABB0] hover:text-[#EFF2F2]">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="hidden sm:inline-flex rounded-full px-6 gradient-primary text-[#160500] shadow-lg shadow-[#F96801]/30 btn-shine">
                  শুরু করুন
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="md:hidden text-[#A5ABB0]"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/[.06] bg-[#0a0d16]/95 backdrop-blur-xl"
            >
              <div className="px-4 py-6 space-y-4">
                {["Features", "Statistics", "About"].map(item => (
                  <Link key={item} href={`#${item.toLowerCase()}`}
                    className="block text-lg font-medium text-[#A5ABB0] hover:text-[#EFF2F2]"
                    onClick={() => setMobileMenuOpen(false)}>
                    {item}
                  </Link>
                ))}
                <div className="flex gap-3 pt-4">
                  <Link href="/auth/login" className="flex-1">
                    <Button variant="ghost" className="w-full rounded-full py-6 text-lg text-[#A5ABB0]">Sign In</Button>
                  </Link>
                  <Link href="/auth/register" className="flex-1">
                    <Button className="w-full rounded-full py-6 text-lg gradient-primary text-[#160500]">শুরু করুন</Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
              className="text-center max-w-4xl mx-auto">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F96801]/12 text-[#F96801] text-sm font-medium mb-6">
                <Heart className="w-4 h-4" fill="currentColor" />
                AI-Powered Healthcare Assistant
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance">
                <span className="gradient-text">বুদ্ধিমান</span> স্বাস্থ্যসেবা সহায়ক
                <br />
                <span className="text-[#EFF2F2]">সবার জন্য</span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-6 text-lg sm:text-xl text-[#A5ABB0] max-w-2xl mx-auto text-balance">
                Medify আপনার ব্যক্তিগত AI স্বাস্থ্যসেবা সহায়ক। ওষুধ ব্যবস্থাপনা, প্রেসক্রিপশন স্ক্যান,
                Google Maps হাসপাতাল ট্র্যাকিং, রিমাইন্ডার ও ডাক্তার যোগাযোগ — সবকিছুই এক জায়গায়, সম্পূর্ণ বাংলায়।
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/auth/register">
                  <Button className="rounded-full px-8 py-7 text-lg gradient-primary text-[#160500] shadow-xl shadow-[#F96801]/30 hover:shadow-[#F96801]/40 transition-all btn-shine">
                    শুরু করুন <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button variant="ghost" className="rounded-full px-8 py-7 text-lg text-[#A5ABB0] hover:text-[#EFF2F2]">
                    আরও জানুন
                  </Button>
                </a>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section id="features" className="py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-center mb-16">
              <p className="text-xs font-mono uppercase tracking-[.25em] text-[#F96801] mb-4">✦ Features</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#EFF2F2]">
                সবকিছুই <span className="gradient-text">এক জায়গায়</span>
              </h2>
              <p className="mt-4 text-lg text-[#A5ABB0] max-w-2xl mx-auto">
                আপনার স্বাস্থ্যসেবার জন্য প্রয়োজনীয় সকল ফিচার
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {features.map((feature, index) => (
                <motion.div key={index}
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="glass-card rounded-2xl p-8">
                  <div className="w-14 h-14 rounded-2xl gradient-primary p-3.5 mb-5 shadow-lg shadow-[#F96801]/20">
                    <feature.icon className="w-full h-full" />
                  </div>
                  <h3 className="text-xl font-bold text-[#EFF2F2] mb-2">{feature.title}</h3>
                  <p className="text-base text-[#A5ABB0] leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="stats" className="py-20 md:py-32 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {stats.map((stat, index) => (
                <motion.div key={index}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="glass rounded-2xl p-8 text-center">
                  <div className="w-12 h-12 rounded-xl bg-[#F96801]/12 flex items-center justify-center mx-auto mb-4">
                    <stat.icon className="w-6 h-6 text-[#F96801]" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold gradient-text">{stat.value}</div>
                  <div className="mt-1 text-sm text-[#A5ABB0]">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-xs font-mono uppercase tracking-[.25em] text-[#F96801] mb-4">✦ About</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-[#EFF2F2] mb-6">
                  বয়স্ক ও দীর্ঘমেয়াদী রোগীদের জন্য{' '}
                  <span className="gradient-text">ডিজাইন করা</span>
                </h2>
                <p className="text-lg text-[#A5ABB0] leading-relaxed mb-8">
                  Medify এমনভাবে তৈরি করা হয়েছে যাতে বয়স্ক ব্যক্তি ও দীর্ঘমেয়াদী রোগীরা
                  খুব সহজেই তাদের ওষুধ ও স্বাস্থ্য ব্যবস্থাপনা করতে পারেন। বড় বাটন,
                  বড় টেক্সট, ভয়েস নেভিগেশন এবং সম্পূর্ণ বাংলা সাপোর্ট — সবকিছুই
                  আপনার সুবিধার জন্য।
                </p>
                <div className="space-y-4">
                  {[
                    { icon: Shield, text: "সুরক্ষিত ও প্রাইভেট" },
                    { icon: PhoneCall, text: "২৪/৭ ইমারজেন্সি সাপোর্ট" },
                    { icon: Scan, text: "AI-চালিত প্রেসক্রিপশন বিশ্লেষণ ও হাতের লেখা পড়া" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#F96801]/12 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-[#F96801]" />
                      </div>
                      <span className="text-base font-medium text-[#EFF2F2]">{item.text}</span>
                    </div>
                  ))}
                </div>
                <Link href="/auth/register">
                  <Button className="mt-8 rounded-full px-8 py-6 text-base gradient-primary text-[#160500] shadow-lg shadow-[#F96801]/30 btn-shine">
                    বিনামূল্যে শুরু করুন <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
              <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                className="relative">
                <div className="glass-border-gradient overflow-hidden">
                  <div className="aspect-[4/3] flex items-center justify-center p-12 bg-gradient-to-br from-[#F96801]/20 via-[#DE1B2D]/10 to-[#25C2C3]/10">
                    <div className="text-center">
                      <Heart className="w-24 h-24 mx-auto mb-6 gradient-text" fill="currentColor" />
                      <h3 className="text-2xl font-bold text-[#EFF2F2]">Medify</h3>
                      <p className="text-[#A5ABB0]">AI Healthcare Assistant</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="py-20 md:py-32">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#EFF2F2] mb-4">
                আজই <span className="gradient-text">Medify</span> ব্যবহার শুরু করুন
              </h2>
              <p className="text-lg text-[#A5ABB0] mb-8 max-w-2xl mx-auto">
                বিনামূল্যে আপনার স্বাস্থ্যসেবা ডিজিটালাইজ করুন। ওষুধ ম্যানেজমেন্ট,
                প্রেসক্রিপশন স্ক্যান ও AI সহায়তা — সবকিছুই এক ক্লিকে।
              </p>
              <Link href="/auth/register">
                <Button className="rounded-full px-10 py-7 text-lg gradient-primary text-[#160500] shadow-xl shadow-[#F96801]/30 btn-shine">
                  বিনামূল্যে রেজিস্টার করুন <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[.06] glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <Heart className="w-4 h-4" fill="currentColor" />
                </div>
                <span className="text-lg font-bold gradient-text">Medify</span>
              </div>
              <p className="text-sm text-[#A5ABB0]">AI-Powered Healthcare Assistant for everyone.</p>
            </div>
            <div>
              <h4 className="font-semibold text-[#EFF2F2] mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-[#A5ABB0]">
                <li><a href="#features" className="hover:text-[#F96801] transition-colors">Features</a></li>
                <li><a href="#stats" className="hover:text-[#F96801] transition-colors">Statistics</a></li>
                <li><a href="#about" className="hover:text-[#F96801] transition-colors">About</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[#EFF2F2] mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-[#A5ABB0]">
                <li><a href="#" className="hover:text-[#F96801] transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-[#F96801] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#F96801] transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[#EFF2F2] mb-4">Emergency</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-[#f87171] font-semibold">
                  <PhoneCall className="w-4 h-4" /> 999
                </li>
                <li className="text-[#A5ABB0]">National Emergency</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/[.06]">
            <div className="text-center">
              <p className="text-sm text-[#A5ABB0] mb-2">&copy; {new Date().getFullYear()} Medify. All rights reserved.</p>
              <p className="text-lg font-bold gradient-text">Developed by Sams Alif</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
