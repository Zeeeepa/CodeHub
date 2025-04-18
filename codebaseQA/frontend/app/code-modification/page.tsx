"use client"

import { useState } from "react"
import CodeModification from "@/components/code-modification"
import LocalCodebaseSelector from "@/components/local-codebase-selector"
import ApiKeyInput from "@/components/api-key-input"

export default function CodeModificationPage() {
  const [codebasePath, setCodebasePath] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState<string>("")

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Code Modification</h1>
      <p className="text-muted-foreground">
        Modify your codebase using the Codegen SDK. You can edit, create, and delete files, as well as analyze your codebase.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LocalCodebaseSelector onSelect={setCodebasePath} />
        <ApiKeyInput value={apiKey} onChange={setApiKey} />
      </div>

      <div className="h-[600px]">
        <CodeModification codebasePath={codebasePath} apiKey={apiKey} />
      </div>
    </div>
  )
}
