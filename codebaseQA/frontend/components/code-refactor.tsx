"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2, RefreshCw, ArrowRight, Check, AlertCircle } from "lucide-react"
import { useToast } from "../hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface RefactorChange {
  type: string
  old_name?: string
  new_name?: string
  symbol_name?: string
  filepath?: string | null
  old_filepath?: string | null
  new_filepath?: string | null
}

interface RefactorResult {
  success: boolean
  message: string
  changes: RefactorChange[]
  preview?: string | null
}

interface CodeRefactorProps {
  codebasePath: string | null
  apiKey?: string
}

export default function CodeRefactor({ codebasePath, apiKey }: CodeRefactorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [symbolName, setSymbolName] = useState("")
  const [filePath, setFilePath] = useState("")
  const [refactorType, setRefactorType] = useState("rename")
  const [newName, setNewName] = useState("")
  const [newFilePath, setNewFilePath] = useState("")
  const [result, setResult] = useState<RefactorResult | null>(null)
  const { toast } = useToast()

  const handleRefactor = async () => {
    if (!codebasePath) {
      toast({
        title: "Error",
        description: "Please select a codebase first",
        variant: "destructive"
      })
      return
    }

    if (!apiKey) {
      toast({
        title: "Error",
        description: "API key is required",
        variant: "destructive"
      })
      return
    }

    if (!symbolName) {
      toast({
        title: "Error",
        description: "Symbol name is required",
        variant: "destructive"
      })
      return
    }

    if (refactorType === "rename" && !newName) {
      toast({
        title: "Error",
        description: "New name is required for rename operations",
        variant: "destructive"
      })
      return
    }

    if (refactorType === "move" && !newFilePath) {
      toast({
        title: "Error",
        description: "New file path is required for move operations",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/refactor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codebasePath,
          symbolName,
          filePath: filePath || null,
          refactorType,
          newName: refactorType === "rename" ? newName : null,
          newFilePath: refactorType === "move" ? newFilePath : null,
          apiKey
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to refactor code')
      }

      const data = await response.json()
      setResult(data)
      
      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
          variant: "default"
        })
      } else {
        toast({
          title: "Refactoring Failed",
          description: data.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error refactoring code:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to refactor code",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">Code Refactoring</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Symbol Name</label>
            <Input
              placeholder="Function or class name to refactor"
              value={symbolName}
              onChange={(e) => setSymbolName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">File Path (Optional)</label>
            <Input
              placeholder="Path to file containing the symbol"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Refactor Type</label>
            <Select
              value={refactorType}
              onValueChange={setRefactorType}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select refactor type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rename">Rename Symbol</SelectItem>
                <SelectItem value="move">Move to Different File</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {refactorType === "rename" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">New Name</label>
              <Input
                placeholder="New name for the symbol"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={isLoading}
              />
            </div>
          )}
          
          {refactorType === "move" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">New File Path</label>
              <Input
                placeholder="Path to destination file"
                value={newFilePath}
                onChange={(e) => setNewFilePath(e.target.value)}
                disabled={isLoading}
              />
            </div>
          )}
        </div>
        
        <Button 
          onClick={handleRefactor}
          disabled={isLoading || !codebasePath || !apiKey || !symbolName || 
            (refactorType === "rename" && !newName) || 
            (refactorType === "move" && !newFilePath)}
          className="mb-6"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {isLoading ? "Refactoring..." : "Refactor Code"}
        </Button>

        {!result && !isLoading && (
          <div className="text-center text-muted-foreground py-8">
            <RefreshCw className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Refactor code by renaming symbols or moving them between files</p>
            <p className="text-sm mt-2">
              {codebasePath 
                ? `Using codebase: ${codebasePath}` 
                : "Please select a codebase first"}
            </p>
          </div>
        )}

        {result && (
          <div className="flex-1 overflow-y-auto">
            <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
              <div className="flex items-center gap-2">
                {result.success ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
              </div>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>

            {result.preview && (
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Preview:</h3>
                <pre className="p-3 bg-muted/20 rounded text-xs overflow-x-auto">
                  {result.preview}
                </pre>
              </div>
            )}

            {result.changes && result.changes.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Changes Made:</h3>
                <div className="space-y-2">
                  {result.changes.map((change, index) => (
                    <Card key={index} className="bg-muted/25 border-none">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <ArrowRight className="h-4 w-4 flex-shrink-0" />
                          <div>
                            {change.type === "rename" && (
                              <p className="text-sm">
                                Renamed <span className="font-mono">{change.old_name}</span> to <span className="font-mono">{change.new_name}</span>
                                {change.filepath && <span className="text-xs text-muted-foreground ml-1">in {change.filepath}</span>}
                              </p>
                            )}
                            {change.type === "move" && (
                              <p className="text-sm">
                                Moved <span className="font-mono">{change.symbol_name}</span> from <span className="font-mono">{change.old_filepath}</span> to <span className="font-mono">{change.new_filepath}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
