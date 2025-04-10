import "@/styles/globals.css"
import type { Metadata } from "next"
import type React from "react" // Import React

import { ThemeProvider } from "@/components/theme-provider"
import { MainNav } from "@/components/main-nav"

export const metadata: Metadata = {
  title: "Codebase Analytics Dashboard",
  description: "Analytics dashboard for public GitHub repositories",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-40 border-b bg-background">
              <div className="container flex h-16 items-center">
                <MainNav />
              </div>
            </header>
            <main className="flex-1">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}

import './globals.css'
