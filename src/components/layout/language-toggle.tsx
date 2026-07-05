"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Languages } from "lucide-react"

export function LanguageToggle() {
  const [lang, setLang] = useState<"bn" | "en">("bn")

  const toggle = () => {
    setLang(lang === "bn" ? "en" : "bn")
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="rounded-full w-10 h-10 text-base font-bold"
      title={lang === "bn" ? "Switch to English" : "বাংলায় পরিবর্তন করুন"}
    >
      <Languages className="w-4 h-4 mr-1" />
      <span className="text-xs">{lang.toUpperCase()}</span>
    </Button>
  )
}
