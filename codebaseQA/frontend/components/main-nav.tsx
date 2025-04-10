"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Github, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function MainNav() {
  const pathname = usePathname()

  return (
    <div className="mr-4 flex">
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <img src="/cg.png" alt="CG Logo" className="h-6 w-6" />
        <span className="hidden font-bold sm:inline-block">
          CodeHub
        </span>
      </Link>
      <nav className="flex items-center space-x-4 lg:space-x-6">
        <Link
          href="/"
          className={cn(
            "flex items-center text-sm font-medium transition-colors hover:text-primary",
            pathname === "/"
              ? "text-foreground"
              : "text-muted-foreground"
          )}
        >
          <Search className="mr-2 h-4 w-4" />
          Deep Research
        </Link>
        <Link
          href="/github-projects"
          className={cn(
            "flex items-center text-sm font-medium transition-colors hover:text-primary",
            pathname === "/github-projects"
              ? "text-foreground"
              : "text-muted-foreground"
          )}
        >
          <Github className="mr-2 h-4 w-4" />
          GitHub Projects
        </Link>
      </nav>
    </div>
  )
}
