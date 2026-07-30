import type { Metadata } from "next"
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/sonner"

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
})

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
})

export const metadata: Metadata = {
  title: "Medify - AI Healthcare Assistant",
  description:
    "Medify is an AI-powered healthcare assistant for elderly people, chronic disease patients, and families. Manage medicines, scan prescriptions, set reminders, and communicate with doctors.",
  keywords: [
    "healthcare",
    "medicine reminder",
    "prescription scanner",
    "AI medical assistant",
    "Bangla healthcare",
    "elderly care",
    "chronic disease management",
  ],
  authors: [{ name: "Medify" }],
  manifest: "/manifest.json",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "Medify - AI Healthcare Assistant",
    description:
      "Your intelligent healthcare companion for medicine management, prescription scanning, and AI-powered medical assistance.",
    type: "website",
    locale: "bn_BD",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="bn"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} dark`}
    >
      <body>
        <div className="fixed-bg" />
        <div className="noise-overlay" />
        <Providers>
          {children}
          <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{
              style: { fontSize: "16px", padding: "16px" },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}