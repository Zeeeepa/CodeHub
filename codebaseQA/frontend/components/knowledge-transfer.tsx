"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Import visualization libraries
import dynamic from 'next/dynamic';
const ForceGraph = dynamic(() => import('react-force-graph-2d'), { ssr: false });
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });
const HeatMap = dynamic(() => import('react-heatmap-grid'), { ssr: false });

interface Author {
  id: string;
  name: string;
  email: string;
  isAI: boolean;
}

interface Contribution {
  id: string;
  authorId: string;
  filename: string;
  date: string;
  linesAdded: number;
  linesRemoved: number;
  commitMessage: string;
  commitHash: string;
}

interface PatternTransfer {
  id: string;
  sourceAuthorId: string;
  targetAuthorId: string;
  pattern: string;
  firstSeenDate: string;
  adoptionDate: string;
  frequency: number;
  files: string[];
}

interface VisualizationData {
  authors: Author[];
  contributions: Contribution[];
  patternTransfers: PatternTransfer[];
}

interface GraphData {
  nodes: any[];
  links: any[];
}

const KnowledgeTransferVisualization = () => {
  // State for repository and visualization settings
  const [repoUrl, setRepoUrl] = useState("");
  const [timeRange, setTimeRange] = useState("last-6-months");
  const [visualizationType, setVisualizationType] = useState("knowledge-network");
  const [dimension, setDimension] = useState("2d");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [highlightAIContributions, setHighlightAIContributions] = useState(true);
  
  // State for visualization data
  const [data, setData] = useState<VisualizationData | null>(null);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  
  // Fetch data when repository URL or time range changes
  useEffect(() => {
    if (repoUrl) {
      fetchVisualizationData();
    }
  }, [repoUrl, timeRange]);
  
  // Transform data for selected visualization type
  useEffect(() => {
    if (data) {
      transformDataForVisualization();
    }
  }, [data, visualizationType, selectedAuthors, highlightAIContributions]);
  
  const fetchVisualizationData = async () => {
    if (!repoUrl) return;
    
    setIsLoading(true);
    try {
      // In a real implementation, this would call your API
      const response = await fetch(`/api/knowledge-transfer?repo=${encodeURIComponent(repoUrl)}&timeRange=${timeRange}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch visualization data");
      }
      
      const responseData = await response.json();
      setData(responseData);
    } catch (error) {
      console.error("Error fetching visualization data:", error);
      toast({
        title: "Error",
        description: "Failed to load visualization data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const transformDataForVisualization = () => {
    if (!data) return;
    
    let nodes: any[] = [];
    let links: any[] = [];
    
    // Filter authors based on selection (if any)
    const filteredAuthors = selectedAuthors.length > 0
      ? data.authors.filter(author => selectedAuthors.includes(author.id))
      : data.authors;
    
    // Create different visualizations based on the selected type
    switch (visualizationType) {
      case "knowledge-network":
        // Create nodes for each author
        nodes = filteredAuthors.map(author => ({
          id: author.id,
          name: author.name,
          val: data.contributions.filter(c => c.authorId === author.id).length,
          color: author.isAI && highlightAIContributions ? "#ff6b6b" : "#6baaff",
          isAI: author.isAI
        }));
        
        // Create links for pattern transfers between authors
        links = data.patternTransfers
          .filter(transfer => 
            filteredAuthors.some(a => a.id === transfer.sourceAuthorId) && 
            filteredAuthors.some(a => a.id === transfer.targetAuthorId)
          )
          .map(transfer => ({
            source: transfer.sourceAuthorId,
            target: transfer.targetAuthorId,
            value: transfer.frequency,
            label: transfer.pattern
          }));
        break;
        
      case "adoption-timeline":
        // Different visualization for adoption timeline
        // This would be implemented differently in a real application
        break;
        
      case "pattern-heatmap":
        // Different visualization for pattern heatmap
        // This would be implemented differently in a real application
        break;
    }
    
    setGraphData({ nodes, links });
  };
  
  const renderVisualization = () => {
    if (!data || graphData.nodes.length === 0) {
      return (
        <div className="flex items-center justify-center h-96 bg-muted rounded-md">
          <p className="text-muted-foreground">No visualization data available</p>
        </div>
      );
    }
    
    switch (visualizationType) {
      case "knowledge-network":
        return dimension === "2d" ? (
          <div className="h-[600px] w-full border rounded-md">
            <ForceGraph
              graphData={graphData}
              nodeLabel={node => `${node.name}${node.isAI ? ' (AI)' : ''}`}
              linkLabel={link => link.label}
              nodeAutoColorBy="isAI"
              linkDirectionalParticles={2}
              linkDirectionalParticleSpeed={d => d.value * 0.001}
              nodeRelSize={6}
            />
          </div>
        ) : (
          <div className="h-[600px] w-full border rounded-md">
            <ForceGraph3D
              graphData={graphData}
              nodeLabel={node => `${node.name}${node.isAI ? ' (AI)' : ''}`}
              linkLabel={link => link.label}
              nodeAutoColorBy="isAI"
              linkDirectionalParticles={2}
              linkDirectionalParticleSpeed={d => d.value * 0.001}
              nodeRelSize={6}
            />
          </div>
        );
        
      case "adoption-timeline":
        // Render adoption timeline visualization
        return (
          <div className="h-[600px] w-full border rounded-md flex items-center justify-center">
            <p>Adoption Timeline Visualization (To be implemented)</p>
          </div>
        );
        
      case "pattern-heatmap":
        // Render pattern heatmap visualization
        return (
          <div className="h-[600px] w-full border rounded-md flex items-center justify-center">
            <p>Pattern Heatmap Visualization (To be implemented)</p>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Knowledge Transfer Visualization</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Repository Settings</CardTitle>
          <CardDescription>Configure the repository and visualization parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input
                placeholder="Repository URL (e.g., https://github.com/username/repo)"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="flex-1"
              />
              <Button onClick={fetchVisualizationData} disabled={isLoading || !repoUrl}>
                {isLoading ? "Loading..." : "Analyze"}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Time Range</label>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                    <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                    <SelectItem value="last-year">Last Year</SelectItem>
                    <SelectItem value="all-time">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Visualization Type</label>
                <Select value={visualizationType} onValueChange={setVisualizationType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visualization type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="knowledge-network">Knowledge Network</SelectItem>
                    <SelectItem value="adoption-timeline">Adoption Timeline</SelectItem>
                    <SelectItem value="pattern-heatmap">Pattern Heatmap</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Dimension</label>
                <Select value={dimension} onValueChange={setDimension}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select dimension" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2d">2D</SelectItem>
                    <SelectItem value="3d">3D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="highlight-ai"
                checked={highlightAIContributions}
                onChange={(e) => setHighlightAIContributions(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="highlight-ai" className="text-sm font-medium">
                Highlight AI Contributions
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Authors</CardTitle>
                <CardDescription>Select authors to include</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedAuthors(data.authors.map(a => a.id))}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedAuthors([])}
                  >
                    Clear Selection
                  </Button>
                  
                  <Separator className="my-2" />
                  
                  <div className="max-h-96 overflow-y-auto space-y-1">
                    {data.authors.map(author => (
                      <div key={author.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`author-${author.id}`}
                          checked={selectedAuthors.includes(author.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAuthors([...selectedAuthors, author.id]);
                            } else {
                              setSelectedAuthors(selectedAuthors.filter(id => id !== author.id));
                            }
                          }}
                          className="mr-2"
                        />
                        <label htmlFor={`author-${author.id}`} className="text-sm flex items-center">
                          {author.name}
                          {author.isAI && (
                            <Badge variant="outline" className="ml-2 text-xs">AI</Badge>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Authors:</span>
                    <span className="font-medium">{data.authors.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">AI Authors:</span>
                    <span className="font-medium">{data.authors.filter(a => a.isAI).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Contributions:</span>
                    <span className="font-medium">{data.contributions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Pattern Transfers:</span>
                    <span className="font-medium">{data.patternTransfers.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>{visualizationType === "knowledge-network" 
                  ? "Knowledge Network" 
                  : visualizationType === "adoption-timeline" 
                    ? "Adoption Timeline" 
                    : "Pattern Heatmap"}
                </CardTitle>
                <CardDescription>
                  {visualizationType === "knowledge-network" 
                    ? "Visualize how knowledge and patterns transfer between developers" 
                    : visualizationType === "adoption-timeline" 
                      ? "See how patterns are adopted over time" 
                      : "Identify common patterns and their distribution"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderVisualization()}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeTransferVisualization;
