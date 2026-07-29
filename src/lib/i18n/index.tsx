"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import bn from "./bn"
import en from "./en"

type Lang = "bn" | "en"
const translations: Record<Lang, Record<string, string>> = { bn, en }

function getStoredLang(): Lang {
  if (typeof window === "undefined") return "bn"
  return (localStorage.getItem("medify_lang") as Lang) || "bn"
}

interface I18nContextType {
  lang: Lang
  t: (key: string) => string
  setLang: (l: Lang) => void
}

const I18nContext = createContext<I18nContextType>({
  lang: "bn",
  t: (k: string) => k,
  setLang: () => {},
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getStoredLang)

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    localStorage.setItem("medify_lang", l)
  }, [])

  const t = useCallback(
    (key: string) => translations[lang][key] || key,
    [lang],
  )

  return <I18nContext.Provider value={{ lang, t, setLang }}>{children}</I18nContext.Provider>
}

export const useI18n = () => useContext(I18nContext)
