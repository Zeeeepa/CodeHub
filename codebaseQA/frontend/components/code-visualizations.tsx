"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { GitBranch, Loader2, Network, GitFork, GitMerge, GitPullRequest } from "lucide-react";
interface VisualizationData {
    nodes: Array<{
        id: string;
        label: string;
        color?: string;
        size?: number;
    }>;
    edges: Array<{
        from: string;
        to: string;
        label?: string;
    }>;
}
interface KnowledgeTransferData {
    timeline: Array<{
        date: string;
        count: number;
    }>;
    contributors: Array<[string, number]>;
    highImpactSymbols: Array<{
        name: string;
        filepath: string;
        usage_count: number;
        last_editor: string;
    }>;
    stats: {
        total_commits: number;
        ai_commits: number;
        ai_percentage: number;
        top_ai_files: Array<[string, number]>;
        ai_file_count: number;
        total_file_count: number;
    };
}
const CodeVisualizations = () => {
    const [repoUrl, setRepoUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [visualizationType, setVisualizationType] = useState("dependency");
    const [visualizationData, setVisualizationData] = useState<VisualizationData | null>(null);
    const [knowledgeTransferData, setKnowledgeTransferData] = useState<KnowledgeTransferData | null>(null);
    const [symbolName, setSymbolName] = useState("");
    const [symbolType, setSymbolType] = useState("function");
    const [activeTab, setActiveTab] = useState("code-structure");
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!repoUrl.trim()) return;

        setLoading(true);

        try {
            const match = repoUrl.match(/(?:github\.com\/)?([^/\s]+\/[^/\s]+)/);
            const repoFullName = match ? match[1] : repoUrl;

            let endpoint = "";
            let requestData = {};

            if (activeTab === "code-structure") {
                endpoint = `/api/visualize/${visualizationType}`;
                requestData = {
                    repo_name: repoFullName,
                    symbol_name: symbolName,
                    symbol_type: symbolType
                };
            } else {
                endpoint = `/api/knowledge-transfer`;
                requestData = {
                    repo_name: repoFullName
                };
            }

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data = await response.json();

            if (activeTab === "code-structure") {
                setVisualizationData(data);
                setKnowledgeTransferData(null);
            } else {
                setKnowledgeTransferData(data);
                setVisualizationData(null);
            }

            toast({
                title: "Visualization generated",
                description: "Your code visualization is ready to view",
            });
        } catch (error) {
            console.error("Error generating visualization:", error);
            toast({
                title: "Error",
                description: "Failed to generate visualization. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (visualizationData && activeTab === "code-structure") {
            console.log("Visualization data:", visualizationData);

            // Here you would initialize your visualization library
            // Example: renderNetworkGraph(visualizationData, "visualization-container");
        }
    }, [visualizationData, activeTab]);
    useEffect(() => {
        if (knowledgeTransferData && activeTab === "knowledge-transfer") {
            console.log("Knowledge transfer data:", knowledgeTransferData);

            // Here you would initialize charts for knowledge transfer data
            // Example: renderTimelineChart(knowledgeTransferData.timeline, "timeline-container");
        }
    }, [knowledgeTransferData, activeTab]);
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">Code Visualizations</h1>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="code-structure">Code Structure</TabsTrigger>
                    <TabsTrigger value="knowledge-transfer">Knowledge Transfer</TabsTrigger>
                </TabsList>

                <TabsContent value="code-structure" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Code Structure Visualization</CardTitle>
                            <CardDescription>
                                Visualize code dependencies, call traces, and impact analysis
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="flex flex-col space-y-2">
                                    <label htmlFor="repo-url" className="text-sm font-medium">
                                        Repository URL or Name
                                    </label>
                                    <div className="flex space-x-2">
                                        <div className="relative flex-1">
                                            <GitBranch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="repo-url"
                                                placeholder="username/repo"
                                                className="pl-10"
                                                value={repoUrl}
                                                onChange={(e) => setRepoUrl(e.target.value)}
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col space-y-2">
                                    <label className="text-sm font-medium">
                                        Visualization Type
                                    </label>
                                    <Select
                                        value={visualizationType}
                                        onValueChange={setVisualizationType}
                                        disabled={loading}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select visualization type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="dependency">Dependency Graph</SelectItem>
                                            <SelectItem value="call-trace">Call Trace</SelectItem>
                                            <SelectItem value="blast-radius">Blast Radius</SelectItem>
                                            <SelectItem value="method-relationships">Method Relationships</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {(visualizationType === "blast-radius" || visualizationType === "call-trace") && (
                                    <div className="space-y-4">
                                        <div className="flex flex-col space-y-2">
                                            <label htmlFor="symbol-name" className="text-sm font-medium">
                                                Symbol Name
                                            </label>
                                            <Input
                                                id="symbol-name"
                                                placeholder="e.g., process_data"
                                                value={symbolName}
                                                onChange={(e) => setSymbolName(e.target.value)}
                                                disabled={loading}
                                            />
                                        </div>

                                        <div className="flex flex-col space-y-2">
                                            <label className="text-sm font-medium">
                                                Symbol Type
                                            </label>
                                            <Select
                                                value={symbolType}
                                                onValueChange={setSymbolType}
                                                disabled={loading}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select symbol type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="function">Function</SelectItem>
                                                    <SelectItem value="class">Class</SelectItem>
                                                    <SelectItem value="method">Method</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}

                                <Button type="submit" disabled={loading || !repoUrl.trim()} className="w-full">
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating Visualization...
                                        </>
                                    ) : (
                                        "Generate Visualization"
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {visualizationData && (
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle>
                                    {visualizationType === "dependency" && "Dependency Graph"}
                                    {visualizationType === "call-trace" && "Call Trace"}
                                    {visualizationType === "blast-radius" && "Blast Radius"}
                                    {visualizationType === "method-relationships" && "Method Relationships"}
                                </CardTitle>
                                <CardDescription>
                                    {visualizationType === "dependency" && "Shows how different parts of the code depend on each other"}
                                    {visualizationType === "call-trace" && "Traces function calls through the codebase"}
                                    {visualizationType === "blast-radius" && "Shows the impact of changing a specific function"}
                                    {visualizationType === "method-relationships" && "Shows relationships between methods in a class"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div
                                    id="visualization-container"
                                    className="w-full h-[600px] border rounded-md bg-muted/20"
                                >
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-muted-foreground">
                                            Visualization would be rendered here using a graph library
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <div className="text-sm text-muted-foreground">
                                    {visualizationData.nodes.length} nodes and {visualizationData.edges.length} connections
                                </div>
                            </CardFooter>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="knowledge-transfer" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Knowledge Transfer Visualization</CardTitle>
                            <CardDescription>
                                Analyze how code patterns and knowledge spread through your codebase
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="flex flex-col space-y-2">
                                    <label htmlFor="kt-repo-url" className="text-sm font-medium">
                                        Repository URL or Name
                                    </label>
                                    <div className="flex space-x-2">
                                        <div className="relative flex-1">
                                            <GitBranch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="kt-repo-url"
                                                placeholder="username/repo"
                                                className="pl-10"
                                                value={repoUrl}
                                                onChange={(e) => setRepoUrl(e.target.value)}
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button type="submit" disabled={loading || !repoUrl.trim()} className="w-full">
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Analyzing Knowledge Transfer...
                                        </>
                                    ) : (
                                        "Analyze Knowledge Transfer"
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {knowledgeTransferData && (
                        <div className="mt-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Total Commits</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{knowledgeTransferData.stats.total_commits}</div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">AI Contribution</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{knowledgeTransferData.stats.ai_percentage.toFixed(1)}%</div>
                                        <p className="text-xs text-muted-foreground">
                                            {knowledgeTransferData.stats.ai_commits} commits by AI
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Files Affected</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{knowledgeTransferData.stats.ai_file_count}</div>
                                        <p className="text-xs text-muted-foreground">
                                            out of {knowledgeTransferData.stats.total_file_count} total files
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Contribution Timeline</CardTitle>
                                        <CardDescription>
                                            AI contributions over time
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div
                                            id="timeline-container"
                                            className="w-full h-[300px] border rounded-md bg-muted/20"
                                        >
                                            <div className="flex items-center justify-center h-full">
                                                <p className="text-muted-foreground">
                                                    Timeline chart would be rendered here
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Contributors Breakdown</CardTitle>
                                        <CardDescription>
                                            Distribution of contributions by author
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div
                                            id="contributors-container"
                                            className="w-full h-[300px] border rounded-md bg-muted/20"
                                        >
                                            <div className="flex items-center justify-center h-full">
                                                <p className="text-muted-foreground">
                                                    Contributors chart would be rendered here
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>High Impact Symbols</CardTitle>
                                        <CardDescription>
                                            Symbols with significant influence across the codebase
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {knowledgeTransferData.highImpactSymbols.slice(0, 5).map((symbol, index) => (
                                                <div key={index} className="flex justify-between items-center">
                                                    <div>
                                                        <div className="font-medium">{symbol.name}</div>
                                                        <div className="text-sm text-muted-foreground">{symbol.filepath}</div>
                                                    </div>
                                                    <div className="text-sm">{symbol.usage_count} usages</div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Top AI-Influenced Files</CardTitle>
                                        <CardDescription>
                                            Files with the most AI contributions
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {knowledgeTransferData.stats.top_ai_files.slice(0, 5).map(([file, count], index) => (
                                                <div key={index} className="flex justify-between items-center">
                                                    <div className="font-medium truncate max-w-[250px]">{file}</div>
                                                    <div className="text-sm">{count} changes</div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};
export default CodeVisualizations;