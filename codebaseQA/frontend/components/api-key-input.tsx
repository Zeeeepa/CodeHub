"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Key, Eye, EyeOff } from "lucide-react"
import { useToast } from "../hooks/use-toast"

interface ApiKeyInputProps {
  onApiKeySet: (apiKey: string) => void
}

export default function ApiKeyInput({ onApiKeySet }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const { toast } = useToast()

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive"
      })
      return
    }

    // Save API key
    onApiKeySet(apiKey)
    
    toast({
      title: "Success",
      description: "API key saved successfully",
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Codegen API Key</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                type={showApiKey ? "text" : "password"}
                placeholder="Enter your Codegen API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button 
              onClick={handleSaveApiKey}
              disabled={!apiKey.trim()}
              className="whitespace-nowrap"
            >
              <Key className="mr-2 h-4 w-4" />
              Save Key
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Enter your Codegen API key to interact with the Codegen API.</p>
            <p className="mt-1">You can get your API key from <a href="https://codegen.sh/token" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">codegen.sh/token</a></p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
