"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Folder, ArrowRight, FolderOpen, ChevronRight, ChevronDown, File } from "lucide-react"
import { useToast } from "../hooks/use-toast"
import { FilesystemService, DirectoryStructureNode } from "../services/filesystem-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ScrollArea } from "@/components/ui/scroll-area"

interface LocalCodebaseSelectorProps {
  onCodebaseSelected: (path: string) => void
}

export default function LocalCodebaseSelector({ onCodebaseSelected }: LocalCodebaseSelectorProps) {
  const [folderPath, setFolderPath] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [directoryStructure, setDirectoryStructure] = useState<DirectoryStructureNode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const filesystemService = new FilesystemService()

  const handleSelectFolder = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      if (!folderPath.trim()) {
        setError("Please enter a valid folder path")
        return
      }
      
      // Validate the codebase path
      const validationResult = await filesystemService.validateCodebasePath(folderPath)
      
      if (!validationResult.valid) {
        setError(validationResult.message)
        return
      }
      
      // Get the directory structure
      const structure = await filesystemService.getDirectoryStructure(folderPath)
      setDirectoryStructure(structure)
      
      // Notify parent component about the selected folder
      onCodebaseSelected(folderPath)
      
      toast({
        title: "Success",
        description: `Codebase selected: ${folderPath}`,
      })
    } catch (error) {
      console.error("Error selecting folder:", error)
      setError(error instanceof Error ? error.message : "Failed to select folder")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to select folder",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNodeClick = (node: DirectoryStructureNode) => {
    if (node.type === 'directory') {
      setFolderPath(node.path)
    }
  }

  const renderDirectoryStructure = (node: DirectoryStructureNode) => {
    if (node.type === 'file') {
      return (
        <div key={node.path} className="flex items-center py-1 pl-2 text-sm">
          <File className="h-4 w-4 mr-2 text-muted-foreground" />
          <span>{node.name}</span>
        </div>
      )
    }
    
    if (node.type === 'more') {
      return (
        <div key={node.path} className="flex items-center py-1 pl-2 text-sm text-muted-foreground">
          <span>{node.name}</span>
        </div>
      )
    }
    
    if (node.type === 'error') {
      return (
        <div key={node.path} className="flex items-center py-1 pl-2 text-sm text-destructive">
          <span>{node.name}</span>
        </div>
      )
    }
    
    return (
      <AccordionItem key={node.path} value={node.path}>
        <AccordionTrigger className="py-1 hover:no-underline">
          <div className="flex items-center text-sm">
            <FolderOpen className="h-4 w-4 mr-2" />
            <span>{node.name}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="pl-4">
            {node.children?.map(child => renderDirectoryStructure(child))}
          </div>
        </AccordionContent>
      </AccordionItem>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Local Codebase</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Enter local folder path"
              value={folderPath}
              onChange={(e) => setFolderPath(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleSelectFolder}
              disabled={isLoading}
              className="whitespace-nowrap"
            >
              <Folder className="mr-2 h-4 w-4" />
              {isLoading ? "Loading..." : "Select Folder"}
            </Button>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {directoryStructure && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Directory Structure</h3>
              <Card>
                <ScrollArea className="h-[300px] rounded-md border">
                  <Accordion type="multiple" className="w-full">
                    {renderDirectoryStructure(directoryStructure)}
                  </Accordion>
                </ScrollArea>
              </Card>
            </div>
          )}
          
          <div className="text-sm text-muted-foreground">
            <p>Enter the path to your local codebase folder.</p>
            <p className="mt-1">Example: /home/user/projects/my-project</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
