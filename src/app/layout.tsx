import type { Metadata } from "next"
import { Work_Sans, DM_Sans } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/sonner"

const workSans = Work_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
})

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
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
      suppressHydrationWarning
      className={`${workSans.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
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
