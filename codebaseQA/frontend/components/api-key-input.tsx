"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Key } from "lucide-react"

interface ApiKeyInputProps {
  value: string
  onChange: (value: string) => void
}

export default function ApiKeyInput({ value, onChange }: ApiKeyInputProps) {
  const [showKey, setShowKey] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Key className="mr-2 h-5 w-5" />
          Codegen API Key
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Input
              type={showKey ? "text" : "password"}
              placeholder="Enter your Codegen API key"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Your API key is required to use the Codegen SDK. You can get one from the{" "}
          <a
            href="https://codegen.sh/settings"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Codegen dashboard
          </a>
          .
        </p>
      </CardContent>
    </Card>
  )
}
