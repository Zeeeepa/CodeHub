import type { Metadata } from "next"
import GitHubExplorer from "@/components/github-explorer"

export const metadata: Metadata = {
  title: "GitHub Projects Explorer",
  description: "Search, store, and view GitHub projects"
}

export default function GitHubProjectsPage() {
  return <GitHubExplorer />
}
