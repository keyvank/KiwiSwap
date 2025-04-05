import type React from "react"
import type { Metadata } from "next"
import { Vazirmatn } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
// Import the Header component
import { Header } from "@/components/header"
// Import the Footer component
import { Footer } from "@/components/footer"

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
})

export const metadata: Metadata = {
  title: "🥝 کیوی‌سواپ",
  description: "صرافی غیرمتمرکز مبتنی بر فرمول CPMM",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      {/* Update the body section to include the Header component */}
      <body className={`${vazirmatn.variable} font-vazirmatn bg-background min-h-screen flex flex-col`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}

import "./globals.css"



import './globals.css'