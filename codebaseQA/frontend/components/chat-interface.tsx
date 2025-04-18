"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Send, Bot, User, Loader2, Code } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import { useToast } from "../hooks/use-toast"
import { CodegenSDKService } from "@/services/codegen-sdk-service"

interface Message {
  role: "user" | "assistant"
  content: string
  metadata?: {
    codeModification?: {
      operation: string
      filePath?: string
      success?: boolean
    }
  }
}

interface ChatInterfaceProps {
  codebasePath: string | null
  apiKey?: string
}

export default function ChatInterface({ codebasePath, apiKey }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  
  const sdkService = useMemo(() => {
    if (!codebasePath || !apiKey) return null
    return new CodegenSDKService({ codebasePath, apiKey })
  }, [codebasePath, apiKey])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim()) return
    if (!codebasePath) {
      toast({
        title: "Error",
        description: "Please select a codebase first",
        variant: "destructive"
      })
      return
    }

    const userMessage: Message = {
      role: "user",
      content: input
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const isModificationRequest = /\b(modify|edit|create|delete|update|change|add|remove)\b.*\b(file|code|function|class|method)\b/i.test(input)
      
      let response
      if (isModificationRequest) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        let operation = "edit"
        if (/\b(create|add|new)\b/i.test(input)) operation = "create"
        if (/\b(delete|remove)\b/i.test(input)) operation = "delete"
        
        const filePathMatch = input.match(/\b(in|to|from|the file)\s+['"](.+?)['"]/i) || 
                             input.match(/\b(in|to|from|the file)\s+([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)/i)
        const filePath = filePathMatch ? filePathMatch[2] : "example/path.js"
        
        response = {
          content: `I'll help you ${operation} the file \`${filePath}\`. Here's what I'll do:

${operation === "create" ? `Create a new file at \`${filePath}\` with the following content:

\`\`\`javascript
// Example content for the new file
function example() {
  return "This is a sample function";
}

export default example;
\`\`\`` : 
operation === "delete" ? `Delete the file at \`${filePath}\`. This operation cannot be undone.` :
`Modify the file at \`${filePath}\` as follows:

\`\`\`diff
- // Old code
- function oldFunction() {
-   return "This is the old implementation";
- }
+ // New code
+ function newFunction() {
+   return "This is the new implementation";
+ }
\`\`\``}

Would you like me to proceed with this operation?`,
          metadata: {
            codeModification: {
              operation,
              filePath,
              success: true
            }
          }
        }
      } else {
        response = await fetch('/api/codegen-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            codebasePath,
            message: input,
            apiKey
          }),
        }).then(res => {
          if (!res.ok) {
            throw new Error('Failed to get a response')
          }
          return res.json()
        })
      }
      
      const assistantMessage: Message = {
        role: "assistant",
        content: response.content,
        metadata: response.metadata
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get a response from the API",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmModification = async (message: Message) => {
    if (!message.metadata?.codeModification) return
    if (!sdkService) return
    
    const { operation, filePath } = message.metadata.codeModification
    
    setIsLoading(true)
    
    try {
      let result
      
      switch (operation) {
        case 'edit':
          result = await sdkService.editFile(filePath!, "// New content for the file\n\nfunction newFunction() {\n  return \"This is the new implementation\";\n}")
          break
        case 'create':
          result = await sdkService.createFile(filePath!, "// New file content\n\nfunction example() {\n  return \"This is a sample function\";\n}\n\nexport default example;")
          break
        case 'delete':
          result = await sdkService.deleteFile(filePath!)
          break
        default:
          throw new Error(`Unsupported operation: ${operation}`)
      }
      
      const confirmationMessage: Message = {
        role: "assistant",
        content: `✅ Successfully ${operation === 'create' ? 'created' : operation === 'delete' ? 'deleted' : 'modified'} the file \`${filePath}\`.`,
        metadata: {
          codeModification: {
            operation,
            filePath,
            success: true
          }
        }
      }
      
      setMessages(prev => [...prev, confirmationMessage])
      
      toast({
        title: "Success",
        description: `Operation completed: ${operation} ${filePath}`,
      })
    } catch (error) {
      console.error("Error performing modification:", error)
      
      const errorMessage: Message = {
        role: "assistant",
        content: `❌ Failed to ${operation} the file \`${filePath}\`. ${error instanceof Error ? error.message : "An unknown error occurred."}`,
        metadata: {
          codeModification: {
            operation,
            filePath,
            success: false
          }
        }
      }
      
      setMessages(prev => [...prev, errorMessage])
      
      toast({
        title: "Error",
        description: `Failed to ${operation} ${filePath}`,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">Chat with Codegen</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Ask anything about your codebase</p>
              <p className="text-sm mt-2">
                {codebasePath 
                  ? `Using codebase: ${codebasePath}` 
                  : "Please select a codebase first"}
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div 
                  className={`flex max-w-[80%] ${
                    message.role === "user" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  } rounded-lg p-3`}
                >
                  <div className="mr-2 mt-0.5">
                    {message.role === "user" ? (
                      <User className="h-5 w-5" />
                    ) : (
                      <Bot className="h-5 w-5" />
                    )}
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                    
                    {message.role === "assistant" && 
                     message.metadata?.codeModification && 
                     !message.content.includes("Successfully") && 
                     !message.content.includes("Failed to") && (
                      <div className="mt-4 flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleConfirmModification(message)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Code className="mr-2 h-4 w-4" />
                          )}
                          Confirm Modification
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setMessages(prev => [...prev, {
                              role: "assistant",
                              content: "Operation cancelled. Let me know if you'd like to make a different change."
                            }])
                          }}
                          disabled={isLoading}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex bg-muted rounded-lg p-3">
                <div className="mr-2 mt-0.5">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Ask about your codebase..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading || !codebasePath}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim() || !codebasePath}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
