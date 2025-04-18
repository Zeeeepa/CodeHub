"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Folder, ArrowRight } from "lucide-react"
import { useToast } from "../hooks/use-toast"

interface LocalCodebaseSelectorProps {
  onCodebaseSelected: (path: string) => void
}

export default function LocalCodebaseSelector({ onCodebaseSelected }: LocalCodebaseSelectorProps) {
  const [folderPath, setFolderPath] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSelectFolder = async () => {
    try {
      // In a real implementation, this would use the file system API
      // Since browser security restricts direct folder access, we'd need:
      // 1. An electron app for desktop
      // 2. A backend service that can access the file system
      // 3. Or use the File System Access API (supported in Chrome)
      
      // For now, we'll just simulate folder selection
      setIsLoading(true)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (!folderPath.trim()) {
        toast({
          title: "Error",
          description: "Please enter a valid folder path",
          variant: "destructive"
        })
        setIsLoading(false)
        return
      }
      
      // Notify parent component about the selected folder
      onCodebaseSelected(folderPath)
      
      toast({
        title: "Success",
        description: `Codebase selected: ${folderPath}`,
      })
    } catch (error) {
      console.error("Error selecting folder:", error)
      toast({
        title: "Error",
        description: "Failed to select folder",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
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
          <div className="text-sm text-muted-foreground">
            <p>Enter the path to your local codebase folder.</p>
            <p className="mt-1">Example: /home/user/projects/my-project</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
