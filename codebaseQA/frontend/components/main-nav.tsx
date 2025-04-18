"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"

export function MainNav() {
  const pathname = usePathname()

  return (
    <div className="mr-4 hidden md:flex">
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <img src="/cg.png" alt="CG Logo" className="h-6 w-6" />
        <span className="hidden font-bold sm:inline-block">
          CodeHub
        </span>
      </Link>
      <nav className="flex items-center space-x-6 text-sm font-medium">
        <Link
          href="/"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname === "/" ? "text-foreground" : "text-foreground/60"
          )}
        >
          Home
        </Link>
        <Link
          href="/repo-analytics"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname?.startsWith("/repo-analytics")
              ? "text-foreground"
              : "text-foreground/60"
          )}
        >
          Repo Analytics
        </Link>
        <Link
          href="/code-visualizations"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname?.startsWith("/code-visualizations")
              ? "text-foreground"
              : "text-foreground/60"
          )}
        >
          Code Visualizations
        </Link>
        <Link
          href="/knowledge-transfer"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname?.startsWith("/knowledge-transfer")
              ? "text-foreground"
              : "text-foreground/60"
          )}
        >
          Knowledge Transfer
        </Link>
        <Link
          href="/github-projects"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname?.startsWith("/github-projects")
              ? "text-foreground"
              : "text-foreground/60"
          )}
        >
          GitHub Projects
        </Link>
        <Link
          href="/codegen-chat"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname?.startsWith("/codegen-chat")
              ? "text-foreground"
              : "text-foreground/60"
          )}
        >
          Codegen Chat
        </Link>
        <Link
          href="/codebase-modifier"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname?.startsWith("/codebase-modifier")
              ? "text-foreground"
              : "text-foreground/60"
          )}
        >
          Codebase Modifier
        </Link>
      </nav>
    </div>
  )
}
