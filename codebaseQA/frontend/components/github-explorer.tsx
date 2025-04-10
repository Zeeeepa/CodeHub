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
import { Pagination } from "@/components/ui/pagination";

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

interface Category {
  id: string;
  name: string;
  color: string | null;
}

const GitHubExplorer = () => {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [language, setLanguage] = useState<string | null>(null);
  const [minStars, setMinStars] = useState<number | null>(null);
  const [sort, setSort] = useState<string | null>("stars");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Results state
  const [searchResults, setSearchResults] = useState<Repository[]>([]);
  const [trendingRepos, setTrendingRepos] = useState<Repository[]>([]);
  const [savedRepos, setSavedRepos] = useState<Repository[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [trendingPeriod, setTrendingPeriod] = useState("daily");
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("search");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3b82f6");
  
  // Load saved repositories and categories on initial load
  useEffect(() => {
    fetchSavedRepositories();
    fetchCategories();
    fetchTrendingRepositories();
  }, []);
  
  // Fetch trending repositories when period changes
  useEffect(() => {
    fetchTrendingRepositories();
  }, [trendingPeriod]);
  
  // Fetch saved repositories when selected category changes
  useEffect(() => {
    fetchSavedRepositories();
  }, [selectedCategory]);
  
  const fetchSavedRepositories = async () => {
    try {
      const url = selectedCategory
        ? `/api/user/repositories?category=${selectedCategory}`
        : "/api/user/repositories";
      
      const response = await fetch(url);
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

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/user/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      
      const data = await response.json();
      setCategories(data.categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchTrendingRepositories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/github/trending?since=${trendingPeriod}`);
      if (!response.ok) throw new Error("Failed to fetch trending repositories");
      
      const data = await response.json();
      setTrendingRepos(data.items);
    } catch (error) {
      console.error("Error fetching trending repositories:", error);
      toast({
        title: "Error",
        description: "Failed to load trending repositories",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setIsLoading(true);
      
      let url = `/api/github/search?query=${encodeURIComponent(searchQuery)}&page=${page}&per_page=${perPage}`;
      
      if (language) url += `&language=${encodeURIComponent(language)}`;
      if (minStars) url += `&min_stars=${minStars}`;
      if (sort) url += `&sort=${sort}&order=desc`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Search failed");
      
      const data = await response.json();
      setSearchResults(data.items);
      setTotalCount(data.total_count);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Error",
        description: "Failed to search GitHub repositories",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRepository = async (repo: Repository, categoryIds: string[] = []) => {
    try {
      const response = await fetch("/api/user/repositories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repository: repo,
          categories: categoryIds,
        }),
      });

      if (!response.ok) throw new Error("Failed to save repository");

      toast({
        title: "Success",
        description: "Repository saved to your dashboard",
      });

      // Refresh saved repositories
      fetchSavedRepositories();
    } catch (error) {
      console.error("Error saving repository:", error);
      toast({
        title: "Error",
        description: "Failed to save repository",
        variant: "destructive",
      });
    }
  };

  const handleRemoveRepository = async (repoId: number) => {
    try {
      const response = await fetch(`/api/user/repositories/${repoId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error("Failed to remove repository");
      
      toast({
        title: "Success",
        description: "Repository removed from your dashboard",
      });

      // Refresh saved repositories
      fetchSavedRepositories();
    } catch (error) {
      console.error("Error removing repository:", error);
      toast({
        title: "Error",
        description: "Failed to remove repository",
        variant: "destructive",
      });
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const response = await fetch("/api/user/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCategoryName,
          color: newCategoryColor,
        }),
      });

      if (!response.ok) throw new Error("Failed to create category");

      toast({
        title: "Success",
        description: "Category created",
      });

      // Reset form and refresh categories
      setNewCategoryName("");
      fetchCategories();
    } catch (error) {
      console.error("Error creating category:", error);
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/user/categories/${categoryId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error("Failed to delete category");
      
      toast({
        title: "Success",
        description: "Category deleted",
      });

      // Refresh categories and repositories
      fetchCategories();
      fetchSavedRepositories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  const renderRepositoryCard = (repo: Repository, isSaved: boolean = false) => {
    const isAlreadySaved = savedRepos.some(savedRepo => savedRepo.id === repo.id);
    
    return (
      <Card key={repo.id} className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">
                <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {repo.full_name}
                </a>
              </CardTitle>
              <CardDescription className="mt-1">
                {repo.description || "No description available"}
              </CardDescription>
            </div>
            {!isSaved && !isAlreadySaved && (
              <Button variant="outline" onClick={() => handleSaveRepository(repo)}>
                Save
              </Button>
            )}
            {isSaved && (
              <Button variant="destructive" onClick={() => handleRemoveRepository(repo.id)}>
                Remove
              </Button>
            )}
            {!isSaved && isAlreadySaved && (
              <Badge variant="outline">Saved</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-3">
            {repo.language && (
              <Badge variant="secondary">{repo.language}</Badge>
            )}
            <Badge variant="outline">⭐ {repo.stargazers_count}</Badge>
            <Badge variant="outline">🍴 {repo.forks_count}</Badge>
            {repo.topics.slice(0, 3).map(topic => (
              <Badge key={topic} variant="secondary">{topic}</Badge>
            ))}
          </div>
          {isSaved && (
            <div className="mt-3">
              <p className="text-sm font-medium mb-1">Categories:</p>
              <div className="flex flex-wrap gap-2">
                {(repo as any).categories?.length > 0 ? (
                  (repo as any).categories.map((catId: string) => {
                    const category = categories.find(c => c.id === catId);
                    return category ? (
                      <Badge 
                        key={catId}
                        style={{ backgroundColor: category.color || undefined }}
                      >
                        {category.name}
                      </Badge>
                    ) : null;
                  })
                ) : (
                  <span className="text-sm text-muted-foreground">No categories</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
        {isSaved && (
          <CardFooter className="flex justify-between">
            <div className="flex flex-wrap gap-2">
              <Select onValueChange={(value) => handleSaveRepository(repo, [...((repo as any).categories || []), value])}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Add to category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">View on GitHub</Button>
            </a>
          </CardFooter>
        )}
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">GitHub Project Explorer</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="saved">My Repositories</TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="mt-4">
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? "Searching..." : "Search"}
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="w-full md:w-auto">
                <Select onValueChange={(value) => setLanguage(value || null)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="go">Go</SelectItem>
                    <SelectItem value="rust">Rust</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-auto">
                <Select onValueChange={(value) => setMinStars(value ? parseInt(value) : null)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Minimum Stars" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    <SelectItem value="10">10+ stars</SelectItem>
                    <SelectItem value="100">100+ stars</SelectItem>
                    <SelectItem value="1000">1,000+ stars</SelectItem>
                    <SelectItem value="10000">10,000+ stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-auto">
                <Select onValueChange={(value) => setSort(value || null)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stars">Stars</SelectItem>
                    <SelectItem value="forks">Forks</SelectItem>
                    <SelectItem value="updated">Recently Updated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            {searchResults.length > 0 ? (
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Found {totalCount} repositories. Showing page {page}.
                </p>
                
                <div className="space-y-4">
                  {searchResults.map(repo => renderRepositoryCard(repo))}
                </div>
                
                <div className="mt-6 flex justify-center">
                  <Pagination>
                    <Button 
                      variant="outline"
                      onClick={() => { setPage(p => Math.max(1, p - 1)); handleSearch(); }}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <div className="mx-4 flex items-center">
                      Page {page}
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => { setPage(p => p + 1); handleSearch(); }}
                      disabled={searchResults.length < perPage}
                    >
                      Next
                    </Button>
                  </Pagination>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                {isLoading ? (
                  <p>Searching repositories...</p>
                ) : (
                  <p>Search for GitHub repositories to get started</p>
                )}
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Trending Tab */}
        <TabsContent value="trending" className="mt-4">
          <div className="mb-6">
            <div className="flex gap-4 mb-4">
              <Select value={trendingPeriod} onValueChange={setTrendingPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Time Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Today</SelectItem>
                  <SelectItem value="weekly">This Week</SelectItem>
                  <SelectItem value="monthly">This Month</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={fetchTrendingRepositories} disabled={isLoading}>
                Refresh
              </Button>
            </div>
            
            {isLoading ? (
              <div className="text-center py-8">
                <p>Loading trending repositories...</p>
              </div>
            ) : trendingRepos.length > 0 ? (
              <div className="space-y-4">
                {trendingRepos.map(repo => renderRepositoryCard(repo))}
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  No trending repositories found. Try a different time period.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>
        
        {/* Saved Repositories Tab */}
        <TabsContent value="saved" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Categories Panel */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant={selectedCategory === null ? "default" : "outline"}
                        onClick={() => setSelectedCategory(null)}
                        className="justify-start"
                      >
                        All Repositories
                      </Button>
                      
                      {categories.map(category => (
                        <div key={category.id} className="flex items-center justify-between">
                          <Button 
                            variant={selectedCategory === category.id ? "default" : "outline"}
                            onClick={() => setSelectedCategory(category.id)}
                            className="justify-start flex-1"
                            style={{ 
                              borderLeftColor: category.color || undefined,
                              borderLeftWidth: "4px"
                            }}
                          >
                            {category.name}
                          </Button>
                          <Button 
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCategory(category.id)}
                            className="ml-2"
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Create New Category</h3>
                      <div className="flex flex-col gap-2">
                        <Input
                          placeholder="Category name"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={newCategoryColor}
                            onChange={(e) => setNewCategoryColor(e.target.value)}
                            className="w-12"
                          />
                          <Button 
                            onClick={handleCreateCategory}
                            disabled={!newCategoryName.trim()}
                            className="flex-1"
                          >
                            Create
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Repositories Panel */}
            <div className="md:col-span-2">
              <h2 className="text-2xl font-bold mb-4">
                {selectedCategory
                  ? `${categories.find(c => c.id === selectedCategory)?.name || ""} Repositories`
                  : "All Saved Repositories"
                }
              </h2>
              
              {savedRepos.length > 0 ? (
                <div className="space-y-4">
                  {savedRepos.map(repo => renderRepositoryCard(repo, true))}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    {selectedCategory
                      ? "No repositories in this category. Add some from the Search or Trending tabs."
                      : "No saved repositories yet. Add some from the Search or Trending tabs."
                    }
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GitHubExplorer;
