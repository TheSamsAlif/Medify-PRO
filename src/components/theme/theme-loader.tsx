"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useTheme } from "next-themes"

export function ThemeLoader() {
  const { data: session } = useSession()
  const { setTheme, theme } = useTheme()

  useEffect(() => {
    if (!session?.user?.id) return

    const loadTheme = async () => {
      try {
        const res = await fetch("/api/profile/theme")
        if (res.ok) {
          const data = await res.json()
          if (data.theme && data.theme !== theme) {
            setTheme(data.theme)
          }
        }
      } catch {
        // silent — use local preference
      }
    }

    loadTheme()
  }, [session?.user?.id, setTheme])

  return null
}
