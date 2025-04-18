"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2, Trash2, FileCode, Package } from "lucide-react"
import { useToast } from "../hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface DeadCodeItem {
  name: string
  filepath: string | null
  line_number: number | null
  source_code?: string | null
}

interface DeadCodeResult {
  dead_functions: DeadCodeItem[]
  dead_classes: DeadCodeItem[]
  dead_imports: DeadCodeItem[]
}

interface DeadCodeDetectorProps {
  codebasePath: string | null
  apiKey?: string
}

export default function DeadCodeDetector({ codebasePath, apiKey }: DeadCodeDetectorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [filePath, setFilePath] = useState("")
  const [result, setResult] = useState<DeadCodeResult | null>(null)
  const { toast } = useToast()

  const handleDetectDeadCode = async () => {
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

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/dead-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codebasePath,
          filePath: filePath || null,
          apiKey
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to detect dead code')
      }

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error("Error detecting dead code:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to detect dead code",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getTotalDeadCode = () => {
    if (!result) return 0
    return result.dead_functions.length + result.dead_classes.length + result.dead_imports.length
  }

  const renderDeadCodeItem = (item: DeadCodeItem, type: string) => (
    <Card key={`${type}-${item.name}-${item.filepath}`} className="mb-2 bg-muted/25 border-none hover:bg-muted/40 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {type === 'function' && <FileCode className="h-5 w-5 mt-1 text-yellow-500" />}
          {type === 'class' && <Package className="h-5 w-5 mt-1 text-blue-500" />}
          {type === 'import' && <Trash2 className="h-5 w-5 mt-1 text-red-500" />}
          <div className="flex-1">
            <div className="font-medium">{item.name}</div>
            {item.filepath && (
              <div className="text-sm text-muted-foreground mt-1">
                {item.filepath}{item.line_number ? `:${item.line_number}` : ''}
              </div>
            )}
            {item.source_code && (
              <pre className="mt-2 p-2 bg-black/20 rounded text-xs overflow-x-auto">
                {item.source_code}
              </pre>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">Dead Code Detector</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Input
            placeholder="Optional: Specific file path to analyze"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={handleDetectDeadCode}
            disabled={isLoading || !codebasePath || !apiKey}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            {isLoading ? "Analyzing..." : "Find Dead Code"}
          </Button>
        </div>

        {!result && !isLoading && (
          <div className="text-center text-muted-foreground py-8">
            <Trash2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Detect unused functions, classes, and imports in your codebase</p>
            <p className="text-sm mt-2">
              {codebasePath 
                ? `Using codebase: ${codebasePath}` 
                : "Please select a codebase first"}
            </p>
          </div>
        )}

        {result && (
          <div className="flex-1 overflow-y-auto">
            <div className="mb-4 p-3 bg-muted/20 rounded-md">
              <p className="text-sm">
                Found <span className="font-bold">{getTotalDeadCode()}</span> unused code items:
                <span className="ml-2 px-2 py-0.5 bg-yellow-500/20 rounded-full text-xs">
                  {result.dead_functions.length} functions
                </span>
                <span className="ml-2 px-2 py-0.5 bg-blue-500/20 rounded-full text-xs">
                  {result.dead_classes.length} classes
                </span>
                <span className="ml-2 px-2 py-0.5 bg-red-500/20 rounded-full text-xs">
                  {result.dead_imports.length} imports
                </span>
              </p>
            </div>

            <Tabs defaultValue="functions">
              <TabsList className="mb-4">
                <TabsTrigger value="functions">Functions ({result.dead_functions.length})</TabsTrigger>
                <TabsTrigger value="classes">Classes ({result.dead_classes.length})</TabsTrigger>
                <TabsTrigger value="imports">Imports ({result.dead_imports.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="functions" className="space-y-2">
                {result.dead_functions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No unused functions found</p>
                ) : (
                  result.dead_functions.map(func => renderDeadCodeItem(func, 'function'))
                )}
              </TabsContent>
              
              <TabsContent value="classes" className="space-y-2">
                {result.dead_classes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No unused classes found</p>
                ) : (
                  result.dead_classes.map(cls => renderDeadCodeItem(cls, 'class'))
                )}
              </TabsContent>
              
              <TabsContent value="imports" className="space-y-2">
                {result.dead_imports.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No unused imports found</p>
                ) : (
                  result.dead_imports.map(imp => renderDeadCodeItem(imp, 'import'))
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
