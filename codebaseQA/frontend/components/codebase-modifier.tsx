"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "../hooks/use-toast"
import { Loader2, Search, Code, FileCode, Trash2 } from "lucide-react"

interface CodebaseModifierProps {
  codebasePath: string | null
  apiKey?: string
}

export default function CodebaseModifier({ codebasePath, apiKey }: CodebaseModifierProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [deadCodeResults, setDeadCodeResults] = useState<any[]>([])
  const [functionName, setFunctionName] = useState("")
  const [filePath, setFilePath] = useState("")
  const [sanitizeResults, setSanitizeResults] = useState<any>(null)
  const [pattern, setPattern] = useState("")
  const [patternResults, setPatternResults] = useState<any>(null)
  const { toast } = useToast()

  const findDeadCode = async () => {
    if (!codebasePath) {
      toast({
        title: "Error",
        description: "Please select a codebase first",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      // In a real implementation, this would call the backend API
      // For now, we'll simulate a response
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulated response
      const simulatedResponse = [
        {
          name: "unused_function",
          file_path: "src/utils.js",
          line_number: 42,
          parameters: ["param1", "param2"],
          return_type: "void",
          is_method: false,
          source_code: "function unused_function(param1, param2) {\n  // This function is never called\n  console.log('This is dead code');\n  return;\n}"
        },
        {
          name: "anotherUnusedFunction",
          file_path: "src/helpers.js",
          line_number: 123,
          parameters: ["data"],
          return_type: "string",
          is_method: false,
          source_code: "function anotherUnusedFunction(data) {\n  // This function is also never called\n  return data.toString();\n}"
        }
      ]
      
      setDeadCodeResults(simulatedResponse)
      
      toast({
        title: "Success",
        description: `Found ${simulatedResponse.length} unused functions`,
      })
    } catch (error) {
      console.error("Error finding dead code:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to find dead code",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const sanitizeFunction = async () => {
    if (!codebasePath || !functionName) {
      toast({
        title: "Error",
        description: "Please select a codebase and enter a function name",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      // In a real implementation, this would call the backend API
      // For now, we'll simulate a response
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulated response
      const simulatedResponse = {
        status: "success",
        function_name: functionName,
        file_path: filePath || "src/main.js",
        original_source: `function ${functionName}(a, b, c) {\n  const unused = 'This is unused';\n  const result = a + b;\n  return result;\n}`,
        unused_variables: ["unused"],
        message: `Found 1 unused variables in function '${functionName}'`
      }
      
      setSanitizeResults(simulatedResponse)
      
      toast({
        title: "Success",
        description: simulatedResponse.message,
      })
    } catch (error) {
      console.error("Error sanitizing function:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sanitize function",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const removeExceptPattern = async () => {
    if (!codebasePath || !pattern) {
      toast({
        title: "Error",
        description: "Please select a codebase and enter a pattern",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      // In a real implementation, this would call the backend API
      // For now, we'll simulate a response
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulated response
      const simulatedResponse = {
        status: "success",
        pattern: pattern,
        matching_files: ["src/rag/index.js", "src/rag/utils.js"],
        matching_symbols: [
          {
            type: "function",
            name: "processRAGResults",
            file_path: "src/rag/index.js"
          },
          {
            type: "class",
            name: "RAGProcessor",
            file_path: "src/rag/utils.js"
          }
        ],
        docstring_matches: [
          {
            file_path: "src/main.js",
            line_number: 10,
            line_content: "# This is a RAG implementation"
          }
        ],
        message: `Found 2 files, 2 symbols, and 1 docstrings/comments matching pattern '${pattern}'`
      }
      
      setPatternResults(simulatedResponse)
      
      toast({
        title: "Success",
        description: simulatedResponse.message,
      })
    } catch (error) {
      console.error("Error processing pattern:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process pattern",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">Codebase Modification</CardTitle>
        <CardDescription>
          Analyze and modify your codebase using Codegen SDK
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <Tabs defaultValue="dead-code" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dead-code">
              <Trash2 className="mr-2 h-4 w-4" />
              Find Dead Code
            </TabsTrigger>
            <TabsTrigger value="sanitize">
              <FileCode className="mr-2 h-4 w-4" />
              Sanitize Function
            </TabsTrigger>
            <TabsTrigger value="pattern">
              <Search className="mr-2 h-4 w-4" />
              Remove Except Pattern
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dead-code" className="mt-4 space-y-4">
            <div className="flex items-center gap-2">
              <Button 
                onClick={findDeadCode}
                disabled={isLoading || !codebasePath}
                className="flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Find Dead Code
              </Button>
              <div className="text-sm text-muted-foreground flex-1">
                {codebasePath ? `Using codebase: ${codebasePath}` : "Please select a codebase first"}
              </div>
            </div>
            
            {deadCodeResults.length > 0 && (
              <div className="space-y-4 mt-4">
                <h3 className="text-lg font-medium">Found {deadCodeResults.length} unused functions:</h3>
                {deadCodeResults.map((func, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader className="bg-muted py-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-md font-medium">{func.name}</CardTitle>
                        <span className="text-sm text-muted-foreground">{func.file_path}:{func.line_number}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="bg-muted rounded p-2 overflow-x-auto">
                        <pre className="text-sm">{func.source_code}</pre>
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Parameters:</span> {func.parameters.join(", ")}
                      </div>
                      {func.return_type && (
                        <div className="mt-1 text-sm">
                          <span className="font-medium">Return type:</span> {func.return_type}
                        </div>
                      )}
                      <div className="mt-3">
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Function
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="sanitize" className="mt-4 space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Function Name</label>
                  <Input
                    placeholder="Enter function name"
                    value={functionName}
                    onChange={(e) => setFunctionName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">File Path (optional)</label>
                  <Input
                    placeholder="Path to file containing the function"
                    value={filePath}
                    onChange={(e) => setFilePath(e.target.value)}
                  />
                </div>
              </div>
              
              <Button 
                onClick={sanitizeFunction}
                disabled={isLoading || !codebasePath || !functionName}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <FileCode className="h-4 w-4 mr-2" />
                )}
                Sanitize Function
              </Button>
            </div>
            
            {sanitizeResults && (
              <div className="space-y-4 mt-4">
                <h3 className="text-lg font-medium">Sanitization Results:</h3>
                <Card>
                  <CardHeader className="bg-muted py-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-md font-medium">{sanitizeResults.function_name}</CardTitle>
                      <span className="text-sm text-muted-foreground">{sanitizeResults.file_path}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Original Source:</h4>
                        <div className="bg-muted rounded p-2 overflow-x-auto">
                          <pre className="text-sm">{sanitizeResults.original_source}</pre>
                        </div>
                      </div>
                      
                      {sanitizeResults.unused_variables.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Unused Variables:</h4>
                          <ul className="list-disc pl-5">
                            {sanitizeResults.unused_variables.map((variable: string, index: number) => (
                              <li key={index} className="text-sm">{variable}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="pt-2">
                        <Button>
                          Apply Sanitization
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="pattern" className="mt-4 space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pattern to Keep</label>
                <Input
                  placeholder="Enter pattern (e.g., 'RAG' for RAG-related code)"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  All code except parts matching this pattern will be removed
                </p>
              </div>
              
              <Button 
                onClick={removeExceptPattern}
                disabled={isLoading || !codebasePath || !pattern}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Find Matching Code
              </Button>
            </div>
            
            {patternResults && (
              <div className="space-y-4 mt-4">
                <h3 className="text-lg font-medium">Pattern Results:</h3>
                
                {patternResults.matching_files.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Matching Files:</h4>
                    <ul className="list-disc pl-5">
                      {patternResults.matching_files.map((file: string, index: number) => (
                        <li key={index} className="text-sm">{file}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {patternResults.matching_symbols.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Matching Symbols:</h4>
                    <ul className="list-disc pl-5">
                      {patternResults.matching_symbols.map((symbol: any, index: number) => (
                        <li key={index} className="text-sm">
                          {symbol.type}: <span className="font-medium">{symbol.name}</span> in {symbol.file_path}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {patternResults.docstring_matches.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Matching Docstrings/Comments:</h4>
                    <ul className="list-disc pl-5">
                      {patternResults.docstring_matches.map((match: any, index: number) => (
                        <li key={index} className="text-sm">
                          {match.file_path}:{match.line_number} - "{match.line_content}"
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="pt-2">
                  <Button variant="destructive">
                    Remove Non-Matching Code
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
