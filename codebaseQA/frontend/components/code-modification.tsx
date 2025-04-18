"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, FileEdit, FilePlus, FileX, Search } from "lucide-react"
import { CodegenSDKService } from "../services/codegen-sdk-service"

interface CodeModificationProps {
  codebasePath: string | null
  apiKey?: string
}

export default function CodeModification({ codebasePath, apiKey }: CodeModificationProps) {
  const [filePath, setFilePath] = useState("")
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleOperation = async (operation: string) => {
    if (!codebasePath) {
      setError("Please select a codebase first")
      return
    }

    if (!apiKey) {
      setError("API key is required")
      return
    }

    if (!filePath) {
      setError("File path is required")
      return
    }

    if ((operation === "editFile" || operation === "createFile") && !content) {
      setError("Content is required for edit and create operations")
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const service = new CodegenSDKService({
        codebasePath,
        apiKey
      })

      let operationResult

      switch (operation) {
        case "editFile":
          operationResult = await service.editFile(filePath, content)
          break
        case "createFile":
          operationResult = await service.createFile(filePath, content)
          break
        case "deleteFile":
          operationResult = await service.deleteFile(filePath)
          break
        case "getFileContent":
          operationResult = await service.getFileContent(filePath)
          if (operationResult.content) {
            setContent(operationResult.content)
          }
          break
        case "analyze":
          operationResult = await service.analyzeCodbase()
          break
        default:
          throw new Error(`Unsupported operation: ${operation}`)
      }

      setResult(operationResult)
    } catch (error) {
      console.error("Error performing operation:", error)
      setError(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">Code Modification</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <Tabs defaultValue="edit" className="flex-1 flex flex-col">
          <TabsList>
            <TabsTrigger value="edit">Edit File</TabsTrigger>
            <TabsTrigger value="create">Create File</TabsTrigger>
            <TabsTrigger value="delete">Delete File</TabsTrigger>
            <TabsTrigger value="view">View File</TabsTrigger>
            <TabsTrigger value="analyze">Analyze Codebase</TabsTrigger>
          </TabsList>

          <div className="mt-4 mb-4">
            <Input
              placeholder="File path (e.g., src/main.js)"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              disabled={isLoading}
              className="mb-2"
            />
          </div>

          <TabsContent value="edit" className="flex-1 flex flex-col">
            <Textarea
              placeholder="File content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isLoading}
              className="flex-1 min-h-[200px] mb-4 font-mono"
            />
            <Button
              onClick={() => handleOperation("editFile")}
              disabled={isLoading || !filePath || !content || !codebasePath || !apiKey}
              className="w-full"
            >
              <FileEdit className="mr-2 h-4 w-4" />
              Edit File
            </Button>
          </TabsContent>

          <TabsContent value="create" className="flex-1 flex flex-col">
            <Textarea
              placeholder="File content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isLoading}
              className="flex-1 min-h-[200px] mb-4 font-mono"
            />
            <Button
              onClick={() => handleOperation("createFile")}
              disabled={isLoading || !filePath || !content || !codebasePath || !apiKey}
              className="w-full"
            >
              <FilePlus className="mr-2 h-4 w-4" />
              Create File
            </Button>
          </TabsContent>

          <TabsContent value="delete" className="flex-1 flex flex-col">
            <div className="flex-1 mb-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  This will permanently delete the file. This action cannot be undone.
                </AlertDescription>
              </Alert>
            </div>
            <Button
              onClick={() => handleOperation("deleteFile")}
              disabled={isLoading || !filePath || !codebasePath || !apiKey}
              variant="destructive"
              className="w-full"
            >
              <FileX className="mr-2 h-4 w-4" />
              Delete File
            </Button>
          </TabsContent>

          <TabsContent value="view" className="flex-1 flex flex-col">
            <Textarea
              placeholder="File content will appear here"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isLoading}
              className="flex-1 min-h-[200px] mb-4 font-mono"
              readOnly
            />
            <Button
              onClick={() => handleOperation("getFileContent")}
              disabled={isLoading || !filePath || !codebasePath || !apiKey}
              className="w-full"
            >
              <Search className="mr-2 h-4 w-4" />
              View File
            </Button>
          </TabsContent>

          <TabsContent value="analyze" className="flex-1 flex flex-col">
            <div className="flex-1 mb-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Info</AlertTitle>
                <AlertDescription>
                  This will analyze the entire codebase and return information about files, functions, and classes.
                </AlertDescription>
              </Alert>
            </div>
            <Button
              onClick={() => handleOperation("analyze")}
              disabled={isLoading || !codebasePath || !apiKey}
              className="w-full"
            >
              <Search className="mr-2 h-4 w-4" />
              Analyze Codebase
            </Button>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert className="mt-4" variant={result.success === false ? "destructive" : "default"}>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Result</AlertTitle>
            <AlertDescription>
              <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
