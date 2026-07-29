"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeLoader } from "@/components/theme/theme-loader"
import { I18nProvider } from "@/lib/i18n"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
        storageKey="medify-theme"
      >
        <ThemeLoader />
        <TooltipProvider>
          <I18nProvider>
            {children}
          </I18nProvider>
        </TooltipProvider>
      </NextThemesProvider>
    </SessionProvider>
  )
}
