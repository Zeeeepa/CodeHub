"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
interface Repository {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    description: string | null;
    owner: {
        login: string;
        avatar_url: string;
    };
    stargazers_count: number;
    forks_count: number;
    language: string | null;
    topics: string[];
    updated_at: string;
    created_at: string;
}
interface CodeMetrics {
    lines_of_code: number;
    logical_lines: number;
    source_lines: number;
    comments: number;
    comment_density: number;
    avg_cyclomatic_complexity: number;
    avg_maintainability_index: number;
    avg_depth_of_inheritance: number;
    total_halstead_volume: number;
    avg_halstead_volume: number;
    files_count: number;
    functions_count: number;
    classes_count: number;
    language_breakdown: Record<string, number>;
    complexity_distribution: Record<string, number>;
    maintainability_distribution: Record<string, number>;
}
interface ImportCycle {
    files: string[];
    mixed_imports: Record<string, {
        dynamic: number;
        static: number;
    }>;
}
interface CodeAnalysis {
    metrics: CodeMetrics;
    problematic_cycles: ImportCycle[];
    unused_functions: string[];
    complex_functions: Array<{
        name: string;
        filepath: string;
        complexity: number;
    }>;
    low_maintainability_files: Array<{
        filepath: string;
        maintainability: number;
    }>;
}
const RepoAnalytics = () => {
    // Repository state
    const [repoInput, setRepoInput] = useState("");
    const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
    const [savedRepos, setSavedRepos] = useState<Repository[]>([]);

    // Analysis state
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResults, setAnalysisResults] = useState<CodeAnalysis | null>(null);
    const [activeTab, setActiveTab] = useState("overview");

    // Load saved repositories on initial load
    useEffect(() => {
        fetchSavedRepositories();
    }, []);

    const fetchSavedRepositories = async () => {
        try {
            const response = await fetch("/api/user/repositories");
            if (!response.ok) throw new Error("Failed to fetch saved repositories");

            const data = await response.json();
            setSavedRepos(data.repositories);
        } catch (error) {
            console.error("Error fetching saved repositories:", error);
            toast({
                title: "Error",
                description: "Failed to load saved repositories",
                variant: "destructive",
            });
        }
    };
    const handleAnalyzeRepo = async () => {
        if (!repoInput.trim()) {
            toast({
                title: "Error",
                description: "Please enter a repository name",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsAnalyzing(true);

            // First, try to get repository info
            const repoResponse = await fetch(`/api/github/repo-info?repo=${encodeURIComponent(repoInput)}`);
            if (!repoResponse.ok) throw new Error("Failed to fetch repository information");

            const repoData = await repoResponse.json();
            setSelectedRepo(repoData.repository);

            // Then, analyze the repository
            const analysisResponse = await fetch(`/api/github/analyze?repo=${encodeURIComponent(repoInput)}`);
            if (!analysisResponse.ok) throw new Error("Failed to analyze repository");

            const analysisData = await analysisResponse.json();
            setAnalysisResults(analysisData);

            toast({
                title: "Success",
                description: "Repository analysis complete",
            });
        } catch (error) {
            console.error("Analysis error:", error);
            toast({
                title: "Analysis Error",
                description: "Failed to analyze repository. Please check the repository name and try again.",
                variant: "destructive",
            });
        } finally {
            setIsAnalyzing(false);
        }
    };
    const handleSelectSavedRepo = async (repo: Repository) => {
        setSelectedRepo(repo);
        setRepoInput(repo.full_name);

        try {
            setIsAnalyzing(true);

            // Analyze the repository
            const analysisResponse = await fetch(`/api/github/analyze?repo=${encodeURIComponent(repo.full_name)}`);
            if (!analysisResponse.ok) throw new Error("Failed to analyze repository");

            const analysisData = await analysisResponse.json();
            setAnalysisResults(analysisData);

            toast({
                title: "Success",
                description: "Repository analysis complete",
            });
        } catch (error) {
            console.error("Analysis error:", error);
            toast({
                title: "Analysis Error",
                description: "Failed to analyze repository",
                variant: "destructive",
            });
        } finally {
            setIsAnalyzing(false);
        }
    };
    const renderMaintainabilityBadge = (score: number) => {
        if (score >= 80) {
            return <Badge className="bg-green-500">High ({score})</Badge>;
        } else if (score >= 60) {
            return <Badge className="bg-yellow-500">Medium ({score})</Badge>;
        } else {
            return <Badge className="bg-red-500">Low ({score})</Badge>;
        }
    };
    const renderComplexityBadge = (complexity: number) => {
        if (complexity <= 5) {
            return <Badge className="bg-green-500">Low ({complexity})</Badge>;
        } else if (complexity <= 10) {
            return <Badge className="bg-yellow-500">Medium ({complexity})</Badge>;
        } else {
            return <Badge className="bg-red-500">High ({complexity})</Badge>;
        }
    };
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">Repository Analytics</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Repository Selection */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Analyze Repository</CardTitle>
                        <CardDescription>
                            Enter a GitHub repository name (e.g., "owner/repo") to analyze its code quality and structure
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Enter repository name (e.g., facebook/react)"
                                value={repoInput}
                                onChange={(e) => setRepoInput(e.target.value)}
                                className="flex-1"
                            />
                            <Button onClick={handleAnalyzeRepo} disabled={isAnalyzing}>
                                {isAnalyzing ? "Analyzing..." : "Analyze"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Saved Repositories */}
                <Card>
                    <CardHeader>
                        <CardTitle>Saved Repositories</CardTitle>
                        <CardDescription>
                            Analyze your saved repositories
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {savedRepos.length > 0 ? (
                            <div className="space-y-2">
                                {savedRepos.map(repo => (
                                    <Button
                                        key={repo.id}
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => handleSelectSavedRepo(repo)}
                                    >
                                        {repo.full_name}
                                    </Button>
                                ))}
                            </div>
                        ) : (
                            <Alert>
                                <AlertDescription>
                                    No saved repositories yet. Save repositories from the GitHub Projects page.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </div>

            {isAnalyzing && (
                <Card className="mb-8">
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Analyzing repository...</span>
                                <span>Please wait</span>
                            </div>
                            <Progress value={45} className="h-2" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {selectedRepo && analysisResults && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Repository Info</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div>
                                        <span className="font-medium">Name:</span>{" "}
                                        <a href={selectedRepo.html_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                            {selectedRepo.full_name}
                                        </a>
                                    </div>
                                    <div>
                                        <span className="font-medium">Description:</span>{" "}
                                        {selectedRepo.description || "No description"}
                                    </div>
                                    <div>
                                        <span className="font-medium">Stars:</span>{" "}
                                        {selectedRepo.stargazers_count}
                                    </div>
                                    <div>
                                        <span className="font-medium">Forks:</span>{" "}
                                        {selectedRepo.forks_count}
                                    </div>
                                    <div>
                                        <span className="font-medium">Primary Language:</span>{" "}
                                        {selectedRepo.language || "Not specified"}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Code Metrics</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <span className="text-sm text-muted-foreground">Files</span>
                                        <p className="text-2xl font-bold">{analysisResults.metrics.files_count}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground">Functions</span>
                                        <p className="text-2xl font-bold">{analysisResults.metrics.functions_count}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground">Classes</span>
                                        <p className="text-2xl font-bold">{analysisResults.metrics.classes_count}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground">Lines of Code</span>
                                        <p className="text-2xl font-bold">{analysisResults.metrics.lines_of_code.toLocaleString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Quality Indicators</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm">Maintainability</span>
                                            {renderMaintainabilityBadge(analysisResults.metrics.avg_maintainability_index)}
                                        </div>
                                        <Progress value={analysisResults.metrics.avg_maintainability_index} className="h-2" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm">Complexity</span>
                                            {renderComplexityBadge(analysisResults.metrics.avg_cyclomatic_complexity)}
                                        </div>
                                        <Progress
                                            value={Math.min(100, (analysisResults.metrics.avg_cyclomatic_complexity / 15) * 100)}
                                            className="h-2"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm">Comment Density</span>
                                            <span>{analysisResults.metrics.comment_density.toFixed(1)}%</span>
                                        </div>
                                        <Progress value={analysisResults.metrics.comment_density} className="h-2" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="complexity">Complexity</TabsTrigger>
                            <TabsTrigger value="issues">Issues</TabsTrigger>
                            <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="mt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Language Distribution</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {Object.entries(analysisResults.metrics.language_breakdown).map(([language, percentage]) => (
                                                <div key={language}>
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-sm">{language}</span>
                                                        <span className="text-sm">{percentage.toFixed(1)}%</span>
                                                    </div>
                                                    <Progress value={percentage} className="h-2" />
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Code Quality Metrics</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-sm font-medium mb-1">Lines of Code</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <span className="text-sm text-muted-foreground">Total Lines</span>
                                                        <p className="text-xl font-bold">{analysisResults.metrics.lines_of_code.toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-muted-foreground">Source Lines</span>
                                                        <p className="text-xl font-bold">{analysisResults.metrics.source_lines.toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-muted-foreground">Logical Lines</span>
                                                        <p className="text-xl font-bold">{analysisResults.metrics.logical_lines.toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-muted-foreground">Comments</span>
                                                        <p className="text-xl font-bold">{analysisResults.metrics.comments.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <Separator />

                                            <div>
                                                <h3 className="text-sm font-medium mb-1">Complexity Metrics</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <span className="text-sm text-muted-foreground">Avg. Cyclomatic Complexity</span>
                                                        <p className="text-xl font-bold">{analysisResults.metrics.avg_cyclomatic_complexity.toFixed(1)}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-muted-foreground">Avg. Maintainability</span>
                                                        <p className="text-xl font-bold">{analysisResults.metrics.avg_maintainability_index.toFixed(1)}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-muted-foreground">Avg. Inheritance Depth</span>
                                                        <p className="text-xl font-bold">{analysisResults.metrics.avg_depth_of_inheritance.toFixed(1)}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-muted-foreground">Avg. Halstead Volume</span>
                                                        <p className="text-xl font-bold">{analysisResults.metrics.avg_halstead_volume.toFixed(1)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Complexity Tab */}
                        <TabsContent value="complexity" className="mt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Complexity Distribution</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {Object.entries(analysisResults.metrics.complexity_distribution).map(([range, count]) => (
                                                <div key={range}>
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-sm">Complexity {range}</span>
                                                        <span className="text-sm">{count} functions</span>
                                                    </div>
                                                    <Progress
                                                        value={(count / analysisResults.metrics.functions_count) * 100}
                                                        className="h-2"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Maintainability Distribution</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {Object.entries(analysisResults.metrics.maintainability_distribution).map(([range, count]) => (
                                                <div key={range}>
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-sm">Maintainability {range}</span>
                                                        <span className="text-sm">{count} files</span>
                                                    </div>
                                                    <Progress
                                                        value={(count / analysisResults.metrics.files_count) * 100}
                                                        className="h-2"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="md:col-span-2">
                                    <CardHeader>
                                        <CardTitle>Most Complex Functions</CardTitle>
                                        <CardDescription>
                                            Functions with high cyclomatic complexity may be difficult to maintain and test
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {analysisResults.complex_functions.length > 0 ? (
                                            <div className="space-y-2">
                                                {analysisResults.complex_functions.map((func, index) => (
                                                    <div key={index} className="flex justify-between items-center p-2 border rounded">
                                                        <div>
                                                            <p className="font-medium">{func.name}</p>
                                                            <p className="text-sm text-muted-foreground">{func.filepath}</p>
                                                        </div>
                                                        {renderComplexityBadge(func.complexity)}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <Alert>
                                                <AlertDescription>
                                                    No complex functions found in this repository.
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Issues Tab */}
                        <TabsContent value="issues" className="mt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Low Maintainability Files</CardTitle>
                                        <CardDescription>
                                            Files with low maintainability scores may need refactoring
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {analysisResults.low_maintainability_files.length > 0 ? (
                                            <div className="space-y-2">
                                                {analysisResults.low_maintainability_files.map((file, index) => (
                                                    <div key={index} className="flex justify-between items-center p-2 border rounded">
                                                        <p className="font-medium truncate">{file.filepath}</p>
                                                        {renderMaintainabilityBadge(file.maintainability)}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <Alert>
                                                <AlertDescription>
                                                    No low maintainability files found in this repository.
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Unused Functions</CardTitle>
                                        <CardDescription>
                                            Functions that appear to be unused in the codebase
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {analysisResults.unused_functions.length > 0 ? (
                                            <div className="space-y-2">
                                                {analysisResults.unused_functions.map((func, index) => (
                                                    <div key={index} className="p-2 border rounded">
                                                        <p className="font-medium">{func}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <Alert>
                                                <AlertDescription>
                                                    No unused functions detected in this repository.
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Dependencies Tab */}
                        <TabsContent value="dependencies" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Problematic Import Cycles</CardTitle>
                                    <CardDescription>
                                        Circular dependencies with mixed static and dynamic imports that may cause issues
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {analysisResults.problematic_cycles.length > 0 ? (
                                        <div className="space-y-4">
                                            {analysisResults.problematic_cycles.map((cycle, index) => (
                                                <div key={index} className="border rounded p-4">
                                                    <h3 className="font-medium mb-2">Cycle {index + 1}</h3>
                                                    <div className="mb-2">
                                                        <span className="text-sm font-medium">Files involved:</span>
                                                        <ul className="list-disc pl-5 mt-1">
                                                            {cycle.files.map((file, fileIndex) => (
                                                                <li key={fileIndex} className="text-sm">{file}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium">Mixed imports:</span>
                                                        <div className="mt-1 space-y-2">
                                                            {Object.entries(cycle.mixed_imports).map(([key, value], importIndex) => (
                                                                <div key={importIndex} className="text-sm">
                                                                    <p><span className="font-medium">From:</span> {key.split(',')[0]}</p>
                                                                    <p><span className="font-medium">To:</span> {key.split(',')[1]}</p>
                                                                    <div className="flex gap-2 mt-1">
                                                                        <Badge variant="outline">Static: {value.static}</Badge>
                                                                        <Badge variant="outline">Dynamic: {value.dynamic}</Badge>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <Alert>
                                            <AlertDescription>
                                                No problematic import cycles found in this repository.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </>
            )}

            {!selectedRepo && !isAnalyzing && (
                <Card>
                    <CardContent className="pt-6">
                        <Alert>
                            <AlertDescription>
                                Enter a repository name above or select a saved repository to begin analysis.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
export default RepoAnalytics;