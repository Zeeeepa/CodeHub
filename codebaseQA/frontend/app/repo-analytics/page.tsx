import type { Metadata } from "next"
import RepoAnalytics from "@/components/repo-analytics"
export const metadata: Metadata = {
    title: "Repository Analytics",
    description: "Analyze GitHub repositories for code quality, complexity, and more"
}
export default function RepoAnalyticsPage() {
    return <RepoAnalytics />
}