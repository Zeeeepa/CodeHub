"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit, FileUp, Trash2, Search, Loader2 } from "lucide-react"
import { useToast } from "../hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface CodeModificationProps {
  codebasePath: string | null
  apiKey?: string
  onOperationComplete?: (result: any) => void
}

export default function CodeModification({ codebasePath, apiKey, onOperationComplete }: CodeModificationProps) {
  const [filePath, setFilePath] = useState("")
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("edit")
  const [result, setResult] = useState<any>(null)
  const { toast } = useToast()

  const handleOperation = async (operation: string) => {
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

    // Validate operation-specific fields
    if ((operation === 'edit' || operation === 'create') && (!filePath || !content)) {
      toast({
        title: "Error",
        description: `For ${operation} operations, file path and content are required`,
        variant: "destructive"
      })
      return
    }

    if (operation === 'delete' && !filePath) {
      toast({
        title: "Error",
        description: "For delete operations, file path is required",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/codegen-modify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codebasePath,
          operation,
          filePath: operation !== 'analyze' ? filePath : undefined,
          content: ['edit', 'create'].includes(operation) ? content : undefined,
          apiKey
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to perform operation')
      }

      const data = await response.json()
      setResult(data)
      
      if (onOperationComplete) {
        onOperationComplete(data)
      }
      
      toast({
        title: "Success",
        description: data.message || `Operation ${operation} completed successfully`,
      })
    } catch (error) {
      console.error(`Error performing ${operation} operation:`, error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to perform ${operation} operation`,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Modify Codebase</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="edit">
              <Edit className="mr-2 h-4 w-4" />
              Edit File
            </TabsTrigger>
            <TabsTrigger value="create">
              <FileUp className="mr-2 h-4 w-4" />
              Create File
            </TabsTrigger>
            <TabsTrigger value="delete">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete File
            </TabsTrigger>
            <TabsTrigger value="analyze">
              <Search className="mr-2 h-4 w-4" />
              Analyze
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4">
            <div>
              <label className="text-sm font-medium">File Path</label>
              <Input
                placeholder="Path to file (e.g., src/utils.js)"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">File Content</label>
              <Textarea
                placeholder="Enter new file content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mt-1 min-h-[200px] font-mono"
              />
            </div>
            <Button 
              onClick={() => handleOperation('edit')}
              disabled={isLoading || !filePath || !content || !codebasePath || !apiKey}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit File
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <div>
              <label className="text-sm font-medium">File Path</label>
              <Input
                placeholder="Path to new file (e.g., src/newfile.js)"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">File Content</label>
              <Textarea
                placeholder="Enter file content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mt-1 min-h-[200px] font-mono"
              />
            </div>
            <Button 
              onClick={() => handleOperation('create')}
              disabled={isLoading || !filePath || !content || !codebasePath || !apiKey}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileUp className="mr-2 h-4 w-4" />
                  Create File
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="delete" className="space-y-4">
            <div>
              <label className="text-sm font-medium">File Path</label>
              <Input
                placeholder="Path to file to delete (e.g., src/oldfile.js)"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                className="mt-1"
              />
            </div>
            <Alert className="bg-destructive/10 border-destructive/20 text-destructive">
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                This action will permanently delete the file. This cannot be undone.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => handleOperation('delete')}
              disabled={isLoading || !filePath || !codebasePath || !apiKey}
              variant="destructive"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete File
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="analyze" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              <p>Analyze the codebase structure to get a list of files and directories.</p>
            </div>
            <Button 
              onClick={() => handleOperation('analyze')}
              disabled={isLoading || !codebasePath || !apiKey}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Analyze Codebase
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {result && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="text-lg font-medium mb-2">Operation Result</h3>
            <div className="text-sm">
              <p className="font-medium">Status: <span className={result.success ? "text-green-500" : "text-red-500"}>
                {result.success ? "Success" : "Failed"}
              </span></p>
              <p className="mt-1">{result.message}</p>
              
              {result.operation === 'analyze' && result.files && (
                <div className="mt-4">
                  <p className="font-medium mb-2">Files:</p>
                  <ul className="space-y-1 max-h-[200px] overflow-y-auto">
                    {result.files.map((file: any, index: number) => (
                      <li key={index} className="flex items-center">
                        {file.type === 'directory' ? (
                          <span className="text-blue-500">📁 {file.path}</span>
                        ) : (
                          <span>📄 {file.path} ({(file.size / 1024).toFixed(1)} KB)</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
