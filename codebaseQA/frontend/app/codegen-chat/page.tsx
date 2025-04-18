"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import LocalCodebaseSelector from "@/components/local-codebase-selector"
import ApiKeyInput from "@/components/api-key-input"
import ChatInterface from "@/components/chat-interface"
import CodeModification from "@/components/code-modification"
import { Github, Code, Key, MessageSquare, Edit } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "../../hooks/use-toast"

export default function CodegenChatPage() {
  const [codebasePath, setCodebasePath] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [repoUrl, setRepoUrl] = useState("")
  const [activeTab, setActiveTab] = useState("chat")
  const { toast } = useToast()

  const handleRepoSubmit = () => {
    if (!repoUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid repository URL",
        variant: "destructive"
      })
      return
    }

    // Parse GitHub URL to get owner/repo format
    try {
      let parsedRepo = repoUrl
      
      if (repoUrl.includes('github.com')) {
        const url = new URL(repoUrl)
        const pathParts = url.pathname.split('/').filter(Boolean)
        if (pathParts.length >= 2) {
          parsedRepo = `${pathParts[0]}/${pathParts[1]}`
        }
      }
      
      setCodebasePath(parsedRepo)
      
      toast({
        title: "Success",
        description: `Repository selected: ${parsedRepo}`,
      })
    } catch (error) {
      console.error("Error parsing repo URL:", error)
      toast({
        title: "Error",
        description: "Failed to parse repository URL",
        variant: "destructive"
      })
    }
  }

  const handleOperationComplete = (result: any) => {
    // You could update the chat with a message about the operation
    console.log("Operation completed:", result)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Codegen Interface</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-1">
          <Tabs defaultValue="github" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="github">
                <Github className="mr-2 h-4 w-4" />
                GitHub Repo
              </TabsTrigger>
              <TabsTrigger value="local">
                <Code className="mr-2 h-4 w-4" />
                Local Folder
              </TabsTrigger>
            </TabsList>
            <TabsContent value="github" className="mt-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="GitHub repo (owner/repo or URL)"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleRepoSubmit}
                    disabled={!repoUrl.trim()}
                  >
                    Select
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Enter a GitHub repository URL or owner/repo format.</p>
                  <p className="mt-1">Example: facebook/react or https://github.com/facebook/react</p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="local" className="mt-4">
              <LocalCodebaseSelector onCodebaseSelected={setCodebasePath} />
            </TabsContent>
          </Tabs>
          
          <div className="mt-6">
            <ApiKeyInput onApiKeySet={setApiKey} />
          </div>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="text-lg font-medium mb-2 flex items-center">
              <Key className="mr-2 h-4 w-4" />
              Connection Status
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Codebase:</span>
                <span className={codebasePath ? "text-green-500" : "text-red-500"}>
                  {codebasePath ? "Connected" : "Not Connected"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>API Key:</span>
                <span className={apiKey ? "text-green-500" : "text-red-500"}>
                  {apiKey ? "Set" : "Not Set"}
                </span>
              </div>
              {codebasePath && (
                <div className="pt-2 text-xs text-muted-foreground break-all">
                  Using: {codebasePath}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="chat">
                <MessageSquare className="mr-2 h-4 w-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="modify">
                <Edit className="mr-2 h-4 w-4" />
                Modify Codebase
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="mt-0 h-[600px]">
              <ChatInterface 
                codebasePath={codebasePath} 
                apiKey={apiKey || undefined} 
              />
            </TabsContent>
            
            <TabsContent value="modify" className="mt-0">
              <CodeModification 
                codebasePath={codebasePath}
                apiKey={apiKey || undefined}
                onOperationComplete={handleOperationComplete}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
