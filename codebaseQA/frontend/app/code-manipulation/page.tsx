"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import LocalCodebaseSelector from "@/components/local-codebase-selector"
import ApiKeyInput from "@/components/api-key-input"
import DeadCodeDetector from "@/components/dead-code-detector"
import CodeRefactor from "@/components/code-refactor"
import ChatInterface from "@/components/chat-interface"

export default function CodeManipulationPage() {
  const [codebasePath, setCodebasePath] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState<string>("")

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="w-full md:w-1/3">
          <Card>
            <CardContent className="pt-6">
              <LocalCodebaseSelector
                onSelect={setCodebasePath}
                selectedPath={codebasePath}
              />
              <div className="mt-4">
                <ApiKeyInput
                  apiKey={apiKey}
                  onChange={setApiKey}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="w-full md:w-2/3">
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="chat">Codegen Chat</TabsTrigger>
              <TabsTrigger value="dead-code">Dead Code Detector</TabsTrigger>
              <TabsTrigger value="refactor">Code Refactoring</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="h-[70vh]">
              <ChatInterface codebasePath={codebasePath} apiKey={apiKey} />
            </TabsContent>
            
            <TabsContent value="dead-code" className="h-[70vh]">
              <DeadCodeDetector codebasePath={codebasePath} apiKey={apiKey} />
            </TabsContent>
            
            <TabsContent value="refactor" className="h-[70vh]">
              <CodeRefactor codebasePath={codebasePath} apiKey={apiKey} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
