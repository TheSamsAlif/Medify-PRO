"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Activity,
  Brain,
  Scan,
  Bell,
  Shield,
  Heart,
  MapPin,
  PhoneCall,
  Menu,
  X,
  ChevronRight,
  Star,
  Users,
  Clock,
  Pill,
  Microscope,
  ArrowRight,
  Sun,
  Moon,
  Languages,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { LanguageToggle } from "@/components/layout/language-toggle"

export default function LandingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (session) {
    router.push("/dashboard")
    return null
  }

  const features = [
    {
      icon: Brain,
      title: "AI মেডিকেল অ্যাসিস্ট্যান্ট",
      titleEn: "AI Medical Assistant",
      description: "বাংলা ও ইংরেজিতে আপনার স্বাস্থ্য সম্পর্কিত যেকোনো প্রশ্নের উত্তর দিন",
      gradient: "from-blue-400 to-indigo-500",
    },
    {
      icon: Scan,
      title: "প্রেসক্রিপশন স্ক্যানার",
      titleEn: "Prescription Scanner",
      description: "ছবি বা PDF আপলোড করে স্বয়ংক্রিয়ভাবে ওষুধের তালিকা তৈরি করুন",
      gradient: "from-emerald-400 to-teal-500",
    },
    {
      icon: Bell,
      title: "ওষুধ রিমাইন্ডার",
      titleEn: "Medicine Reminder",
      description: "সময়মতো ওষুধ খাওয়ার জন্য পুশ নোটিফিকেশন ও অ্যালার্ম",
      gradient: "from-amber-400 to-orange-500",
    },
    {
      icon: Heart,
      title: "স্বাস্থ্য মনিটরিং",
      titleEn: "Health Monitoring",
      description: "ব্লাড প্রেসার, সুগার, BMI সহ সকল স্বাস্থ্য ডেটা ট্র্যাক করুন",
      gradient: "from-rose-400 to-red-500",
    },
    {
      icon: Users,
      title: "পরিবারের সদস্য মনিটরিং",
      titleEn: "Guardian Dashboard",
      description: "পরিবারের বয়স্ক সদস্যদের ওষুধ ও স্বাস্থ্য পর্যবেক্ষণ করুন",
      gradient: "from-purple-400 to-violet-500",
    },
    {
      icon: MapPin,
      title: "হাসপাতাল ফাইন্ডার",
      titleEn: "Hospital Finder",
      description: "নিকটস্থ হাসপাতাল, ডায়াগনস্টিক সেন্টার ও ফার্মেসী খুঁজুন",
      gradient: "from-cyan-400 to-blue-500",
    },
  ]

  const stats = [
    { icon: Users, value: "৫০,০০০+", label: "ব্যবহারকারী", labelEn: "Users" },
    { icon: Pill, value: "২ লক্ষ+", label: "ওষুধ ট্র্যাক করা", labelEn: "Medicines Tracked" },
    { icon: Clock, value: "৯৮%", label: "আদারেন্স রেট", labelEn: "Adherence Rate" },
    { icon: Star, value: "৪.৮", label: "রেটিং", labelEn: "Rating" },
  ]

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-white dark:from-gray-950 dark:via-blue-950/10 dark:to-gray-950">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" fill="white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Medify
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                Features
              </Link>
              <Link href="#stats" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                Statistics
              </Link>
              <Link href="#about" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                About
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              {mounted && <LanguageToggle />}
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="rounded-full w-10 h-10"
                >
                  {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </Button>
              )}
              <Link href="/auth/login">
                <Button variant="outline" className="hidden sm:inline-flex rounded-full px-6">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="hidden sm:inline-flex rounded-full px-6 gradient-primary text-white shadow-md shadow-primary/20">
                  Get Started
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
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
              className="md:hidden border-t border-gray-200/50 dark:border-gray-800/50 bg-white dark:bg-gray-950"
            >
              <div className="px-4 py-6 space-y-4">
                <Link href="#features" className="block text-lg font-medium text-gray-600 dark:text-gray-400" onClick={() => setMobileMenuOpen(false)}>
                  Features
                </Link>
                <Link href="#stats" className="block text-lg font-medium text-gray-600 dark:text-gray-400" onClick={() => setMobileMenuOpen(false)}>
                  Statistics
                </Link>
                <Link href="#about" className="block text-lg font-medium text-gray-600 dark:text-gray-400" onClick={() => setMobileMenuOpen(false)}>
                  About
                </Link>
                <div className="flex gap-3 pt-4">
                  <Link href="/auth/login" className="flex-1">
                    <Button variant="outline" className="w-full rounded-full py-6 text-lg">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/register" className="flex-1">
                    <Button className="w-full rounded-full py-6 text-lg gradient-primary text-white">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-950/20 pointer-events-none" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-4xl mx-auto"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-sm font-medium mb-6"
              >
                <Heart className="w-4 h-4" fill="currentColor" />
                AI-Powered Healthcare Assistant
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance"
              >
                <span className="text-gradient">বুদ্ধিমান</span> স্বাস্থ্যসেবা সহায়ক
                <br />
                <span className="text-foreground">সবার জন্য</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-balance"
              >
                Medify আপনার ব্যক্তিগত AI স্বাস্থ্যসেবা সহায়ক। ওষুধ ব্যবস্থাপনা, প্রেসক্রিপশন স্ক্যান, 
                রিমাইন্ডার ও ডাক্তার যোগাযোগ — সবকিছুই এক জায়গায়, সম্পূর্ণ বাংলায়।
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link href="/auth/register">
                  <Button size="lg" className="rounded-full px-8 py-7 text-lg gradient-primary text-white shadow-xl shadow-primary/25 hover:shadow-primary/30 transition-all duration-300">
                    শুরু করুন
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="outline" className="rounded-full px-8 py-7 text-lg">
                    আরও জানুন
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section id="features" className="py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                সবকিছুই <span className="text-gradient">এক জায়গায়</span>
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                আপনার স্বাস্থ্যসেবার জন্য প্রয়োজনীয় সকল ফিচার
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group relative p-8 rounded-2xl border border-gray-200/50 dark:border-gray-800/50 bg-white/50 dark:bg-white/5 backdrop-blur-sm hover:shadow-xl hover:shadow-black/5 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} p-3.5 mb-5 shadow-lg`}>
                    <feature.icon className="w-full h-full text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.titleEn}</h3>
                  <p className="text-base text-gray-600 dark:text-gray-400 text-balance leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="stats" className="py-20 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 gradient-primary opacity-5" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center p-8 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-gradient">{stat.value}</div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-2 gap-12 items-center"
            >
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-sm font-medium mb-4">
                  <Activity className="w-4 h-4" />
                  কেন Medify?
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                  বয়স্ক ও দীর্ঘমেয়াদী রোগীদের জন্য{' '}
                  <span className="text-gradient">ডিজাইন করা</span>
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
                  Medify এমনভাবে তৈরি করা হয়েছে যাতে বয়স্ক ব্যক্তি ও দীর্ঘমেয়াদী রোগীরা 
                  খুব সহজেই তাদের ওষুধ ও স্বাস্থ্য ব্যবস্থাপনা করতে পারেন। বড় বাটন, 
                  বড় টেক্সট, ভয়েস নেভিগেশন এবং সম্পূর্ণ বাংলা সাপোর্ট — সবকিছুই 
                  আপনার সুবিধার জন্য।
                </p>
                <div className="space-y-4">
                  {[
                    { icon: Shield, text: "সুরক্ষিত ও প্রাইভেট" },
                    { icon: PhoneCall, text: "২৪/৭ ইমারজেন্সি সাপোর্ট" },
                    { icon: Microscope, text: "AI-চালিত প্রেসক্রিপশন বিশ্লেষণ" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-base font-medium">{item.text}</span>
                    </div>
                  ))}
                </div>
                <Link href="/auth/register">
                  <Button className="mt-8 rounded-full px-8 py-6 text-base gradient-primary text-white shadow-lg shadow-primary/25">
                    বিনামূল্যে শুরু করুন
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <div className="aspect-[4/3] gradient-primary flex items-center justify-center p-12">
                    <div className="text-center text-white">
                      <Heart className="w-24 h-24 mx-auto mb-6" fill="white" stroke="none" />
                      <h3 className="text-2xl font-bold">Medify</h3>
                      <p className="text-white/80">AI Healthcare Assistant</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="py-20 md:py-32">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                আজই <span className="text-gradient">Medify</span> ব্যবহার শুরু করুন
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                বিনামূল্যে আপনার স্বাস্থ্যসেবা ডিজিটালাইজ করুন। ওষুধ ম্যানেজমেন্ট, 
                প্রেসক্রিপশন স্ক্যান ও AI সহায়তা — সবকিছুই এক ক্লিকে।
              </p>
              <Link href="/auth/register">
                <Button size="lg" className="rounded-full px-10 py-7 text-lg gradient-primary text-white shadow-xl shadow-primary/25">
                  বিনামূল্যে রেজিস্টার করুন
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200/50 dark:border-gray-800/50 bg-white/50 dark:bg-gray-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" fill="white" />
                </div>
                <span className="text-lg font-bold">Medify</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI-Powered Healthcare Assistant for everyone.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="#features" className="hover:text-primary transition-colors">Features</Link></li>
                <li><Link href="#stats" className="hover:text-primary transition-colors">Statistics</Link></li>
                <li><Link href="#about" className="hover:text-primary transition-colors">About</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Emergency</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-red-500 font-semibold">
                  <PhoneCall className="w-4 h-4" />
                  999
                </li>
                <li className="text-gray-600 dark:text-gray-400">National Emergency</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200/50 dark:border-gray-800/50">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <p className="text-sm text-gray-400 dark:text-gray-600 mb-2">
                &copy; {new Date().getFullYear()} Medify. All rights reserved.
              </p>
              <motion.p
                className="text-lg font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse"
                whileHover={{ scale: 1.05 }}
              >
                Developed by Sams Alif
              </motion.p>
            </motion.div>
          </div>
        </div>
      </footer>
    </div>
  )
}
