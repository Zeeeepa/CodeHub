from fastapi import FastAPI, HTTPException, Depends, Query
from pydantic import BaseModel
import modal
from codegen import Codebase
from langchain_core.messages import SystemMessage
from fastapi.middleware.cors import CORSMiddleware
import os
import uvicorn
from typing import List, Dict, Any, Optional
from fastapi.responses import StreamingResponse
import json
import httpx
import asyncio
from datetime import datetime, timedelta

# Import agentgen components
from agentgen.agents.code_agent import CodeAgent
from agentgen.extensions.tools.semantic_search import semantic_search
from agentgen.extensions.tools.view_file import view_file
from agentgen.extensions.tools.reveal_symbol import reveal_symbol
from agentgen.extensions.langchain.agent import create_agent_with_tools
from agentgen.extensions.langchain.tools import (
    ListDirectoryTool,
    RevealSymbolTool,
    SearchTool,
    SemanticSearchTool,
    ViewFileTool,
)

# Modal configuration for cloud deployment
image = (
    modal.Image.debian_slim()
    .apt_install("git")
    .pip_install(
        "codegen==0.22.1",
        "fastapi",
        "uvicorn",
        "langchain",
        "langchain-core",
        "pydantic",
        "httpx",
    )
)

app = modal.App(
    name="code-research-app",
    image=image,
    secrets=[modal.Secret.from_name("agent-secret")],
)

# Create FastAPI app
fastapi_app = FastAPI()

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Research agent prompt
RESEARCH_AGENT_PROMPT = """You are a code research expert. Your goal is to help users understand codebases by:
1. Finding relevant code through semantic and text search
2. Analyzing symbol relationships and dependencies
3. Exploring directory structures
4. Reading and explaining code

Always explain your findings in detail and provide context about how different parts of the code relate to each other.
When analyzing code, consider:
- The purpose and functionality of each component
- How different parts interact
- Key patterns and design decisions
- Potential areas for improvement

Break down complex concepts into understandable pieces and use examples when helpful."""

current_status = "Intializing process..."


def update_status(new_status: str):
    global current_status
    current_status = new_status
    return {"type": "status", "content": new_status}


class ResearchRequest(BaseModel):
    repo_name: str
    query: str


class ResearchResponse(BaseModel):
    response: str


class FilesResponse(BaseModel):
    files: List[str]


class StatusResponse(BaseModel):
    status: str


class CodebaseStatsResponse(BaseModel):
    stats: Dict[str, Any]


class SymbolRequest(BaseModel):
    repo_name: str
    symbol_name: str
    filepath: Optional[str] = None


class SymbolResponse(BaseModel):
    symbol_info: Dict[str, Any]


# GitHub API Models
class GitHubSearchRequest(BaseModel):
    query: str
    language: Optional[str] = None
    min_stars: Optional[int] = None
    sort: Optional[str] = None
    order: Optional[str] = "desc"
    page: int = 1
    per_page: int = 10


class GitHubRepository(BaseModel):
    id: int
    name: str
    full_name: str
    html_url: str
    description: Optional[str] = None
    owner: Dict[str, Any]
    stargazers_count: int
    forks_count: int
    language: Optional[str] = None
    topics: List[str] = []
    updated_at: str
    created_at: str


class GitHubSearchResponse(BaseModel):
    total_count: int
    items: List[GitHubRepository]


class SavedRepository(BaseModel):
    id: int
    name: str
    full_name: str
    html_url: str
    description: Optional[str] = None
    owner: Dict[str, Any]
    stargazers_count: int
    forks_count: int
    language: Optional[str] = None
    topics: List[str] = []
    updated_at: str
    created_at: str
    categories: List[str] = []


class SaveRepositoryRequest(BaseModel):
    repository: GitHubRepository
    categories: List[str] = []


class Category(BaseModel):
    id: str
    name: str
    color: Optional[str] = None


class CreateCategoryRequest(BaseModel):
    name: str
    color: Optional[str] = None


# In-memory storage for MVP phase
# In a production environment, this would be replaced with a database
saved_repositories: Dict[int, SavedRepository] = {}
categories: Dict[str, Category] = {}


@fastapi_app.post("/research", response_model=ResearchResponse)
async def research(request: ResearchRequest) -> ResearchResponse:
    """
    Endpoint to perform code research on a GitHub repository.
    """
    try:
        update_status("Initializing codebase...")
        codebase = Codebase.from_repo(request.repo_name)

        update_status("Creating research tools...")
        tools = [
            ViewFileTool(codebase),
            ListDirectoryTool(codebase),
            SearchTool(codebase),
            SemanticSearchTool(codebase),
            RevealSymbolTool(codebase),
        ]

        update_status("Initializing research agent...")
        agent = create_agent_with_tools(
            codebase=codebase,
            tools=tools,
            chat_history=[SystemMessage(content=RESEARCH_AGENT_PROMPT)],
            verbose=True,
        )

        update_status("Running analysis...")
        result = agent.invoke(
            {"input": request.query},
            config={"configurable": {"session_id": "research"}},
        )

        update_status("Complete")
        return ResearchResponse(response=result["output"])

    except Exception as e:
        update_status("Error occurred")
        return ResearchResponse(response=f"Error during research: {str(e)}")


@fastapi_app.post("/similar-files", response_model=FilesResponse)
async def similar_files(request: ResearchRequest) -> FilesResponse:
    """
    Endpoint to find similar files in a GitHub repository based on a query.
    """
    try:
        codebase = Codebase.from_repo(request.repo_name)
        search_result = semantic_search(codebase, request.query, k=5, index_type="file")
        similar_file_names = [result.filepath for result in search_result.results]
        return FilesResponse(files=similar_file_names)

    except Exception as e:
        update_status("Error occurred")
        return FilesResponse(files=[f"Error finding similar files: {str(e)}"])


@fastapi_app.post("/codebase-stats", response_model=CodebaseStatsResponse)
async def codebase_stats(request: ResearchRequest) -> CodebaseStatsResponse:
    """
    Endpoint to get statistics about a codebase.
    """
    try:
        codebase = Codebase.from_repo(request.repo_name)
        code_agent = CodeAgent(codebase, analyze_codebase=True)
        stats = code_agent.get_codebase_stats()
        return CodebaseStatsResponse(stats=stats)
    except Exception as e:
        update_status("Error occurred")
        return CodebaseStatsResponse(stats={"error": str(e)})


@fastapi_app.post("/symbol-info", response_model=SymbolResponse)
async def symbol_info(request: SymbolRequest) -> SymbolResponse:
    """
    Endpoint to get information about a symbol in the codebase.
    """
    try:
        codebase = Codebase.from_repo(request.repo_name)
        symbol_result = reveal_symbol(
            codebase, 
            request.symbol_name, 
            filepath=request.filepath,
            include_source=True,
            include_references=True
        )
        
        # Convert to dictionary for response
        symbol_info = {
            "name": symbol_result.symbol_name,
            "type": symbol_result.symbol_type,
            "definition": symbol_result.definition.__dict__ if symbol_result.definition else None,
            "source_code": symbol_result.source_code,
            "docstring": symbol_result.docstring,
            "references": [ref.__dict__ for ref in symbol_result.references],
            "metadata": symbol_result.metadata,
            "status": symbol_result.status,
            "error": symbol_result.error
        }
        
        return SymbolResponse(symbol_info=symbol_info)
    except Exception as e:
        return SymbolResponse(symbol_info={"status": "error", "error": str(e)})


# GitHub API integration
async def get_github_token():
    """Get GitHub API token from environment variable"""
    token = os.environ.get("GITHUB_API_KEY")
    if not token:
        raise HTTPException(status_code=500, detail="GitHub API token not configured")
    return token


@fastapi_app.get("/github/search", response_model=GitHubSearchResponse)
async def search_github_repositories(
    query: str,
    language: Optional[str] = None,
    min_stars: Optional[int] = None,
    sort: Optional[str] = None,
    order: str = "desc",
    page: int = 1,
    per_page: int = 10,
    token: str = Depends(get_github_token)
):
    """
    Search for GitHub repositories with various filters
    """
    try:
        # Build the GitHub search query
        search_query = query
        
        if language:
            search_query += f" language:{language}"
        
        if min_stars:
            search_query += f" stars:>={min_stars}"
        
        # Set up the GitHub API request
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "Authorization": f"token {token}"
        }
        
        params = {
            "q": search_query,
            "page": page,
            "per_page": per_page
        }
        
        if sort:
            params["sort"] = sort
            params["order"] = order
        
        # Make the request to GitHub API
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.github.com/search/repositories",
                headers=headers,
                params=params
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"GitHub API error: {response.text}"
                )
            
            data = response.json()
            
            # Transform the response to match our model
            items = []
            for repo in data.get("items", []):
                items.append(GitHubRepository(
                    id=repo["id"],
                    name=repo["name"],
                    full_name=repo["full_name"],
                    html_url=repo["html_url"],
                    description=repo.get("description"),
                    owner=repo["owner"],
                    stargazers_count=repo["stargazers_count"],
                    forks_count=repo["forks_count"],
                    language=repo.get("language"),
                    topics=repo.get("topics", []),
                    updated_at=repo["updated_at"],
                    created_at=repo["created_at"]
                ))
            
            return GitHubSearchResponse(
                total_count=data.get("total_count", 0),
                items=items
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching repositories: {str(e)}")


@fastapi_app.get("/github/trending")
async def get_trending_repositories(
    language: Optional[str] = None,
    since: str = "daily",
    token: str = Depends(get_github_token)
):
    """
    Get trending GitHub repositories
    """
    try:
        # Calculate date range based on 'since' parameter
        now = datetime.now()
        if since == "daily":
            date_range = now - timedelta(days=1)
        elif since == "weekly":
            date_range = now - timedelta(weeks=1)
        elif since == "monthly":
            date_range = now - timedelta(days=30)
        else:
            date_range = now - timedelta(days=1)  # Default to daily
        
        date_str = date_range.strftime("%Y-%m-%d")
        
        # Build query for trending repositories
        query = f"created:>{date_str}"
        
        if language:
            query += f" language:{language}"
        
        # Set up the GitHub API request
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "Authorization": f"token {token}"
        }
        
        params = {
            "q": query,
            "sort": "stars",
            "order": "desc",
            "per_page": 10
        }
        
        # Make the request to GitHub API
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.github.com/search/repositories",
                headers=headers,
                params=params
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"GitHub API error: {response.text}"
                )
            
            data = response.json()
            
            # Transform the response to match our model
            items = []
            for repo in data.get("items", []):
                items.append(GitHubRepository(
                    id=repo["id"],
                    name=repo["name"],
                    full_name=repo["full_name"],
                    html_url=repo["html_url"],
                    description=repo.get("description"),
                    owner=repo["owner"],
                    stargazers_count=repo["stargazers_count"],
                    forks_count=repo["forks_count"],
                    language=repo.get("language"),
                    topics=repo.get("topics", []),
                    updated_at=repo["updated_at"],
                    created_at=repo["created_at"]
                ))
            
            return GitHubSearchResponse(
                total_count=data.get("total_count", 0),
                items=items
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching trending repositories: {str(e)}")


# User repository management endpoints
@fastapi_app.post("/user/repositories")
async def save_repository(request: SaveRepositoryRequest):
    """
    Save a repository to the user's dashboard
    """
    try:
        repo_id = request.repository.id
        
        # Check if repository already exists
        if repo_id in saved_repositories:
            # Update categories if provided
            if request.categories:
                saved_repositories[repo_id].categories = request.categories
            return {"message": "Repository updated", "repository_id": repo_id}
        
        # Create new saved repository
        saved_repo = SavedRepository(
            id=request.repository.id,
            name=request.repository.name,
            full_name=request.repository.full_name,
            html_url=request.repository.html_url,
            description=request.repository.description,
            owner=request.repository.owner,
            stargazers_count=request.repository.stargazers_count,
            forks_count=request.repository.forks_count,
            language=request.repository.language,
            topics=request.repository.topics,
            updated_at=request.repository.updated_at,
            created_at=request.repository.created_at,
            categories=request.categories
        )
        
        saved_repositories[repo_id] = saved_repo
        
        return {"message": "Repository saved", "repository_id": repo_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving repository: {str(e)}")


@fastapi_app.get("/user/repositories")
async def get_saved_repositories(category: Optional[str] = None):
    """
    Get user's saved repositories with optional category filter
    """
    try:
        if category:
            # Filter repositories by category
            filtered_repos = [
                repo for repo in saved_repositories.values()
                if category in repo.categories
            ]
            return {"repositories": filtered_repos, "count": len(filtered_repos)}
        else:
            # Return all repositories
            return {"repositories": list(saved_repositories.values()), "count": len(saved_repositories)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving repositories: {str(e)}")


@fastapi_app.delete("/user/repositories/{repo_id}")
async def delete_repository(repo_id: int):
    """
    Remove a repository from user's dashboard
    """
    try:
        if repo_id not in saved_repositories:
            raise HTTPException(status_code=404, detail="Repository not found")
        
        # Remove the repository
        deleted_repo = saved_repositories.pop(repo_id)
        
        return {"message": "Repository removed", "repository": deleted_repo}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error removing repository: {str(e)}")


# Category management endpoints
@fastapi_app.post("/user/categories")
async def create_category(request: CreateCategoryRequest):
    """
    Create a new repository category
    """
    try:
        # Generate a simple ID for the category
        category_id = request.name.lower().replace(" ", "-")
        
        # Check if category already exists
        if category_id in categories:
            raise HTTPException(status_code=400, detail="Category already exists")
        
        # Create new category
        new_category = Category(
            id=category_id,
            name=request.name,
            color=request.color
        )
        
        categories[category_id] = new_category
        
        return {"message": "Category created", "category": new_category}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating category: {str(e)}")


@fastapi_app.get("/user/categories")
async def get_categories():
    """
    Get all repository categories
    """
    try:
        return {"categories": list(categories.values()), "count": len(categories)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving categories: {str(e)}")


@fastapi_app.delete("/user/categories/{category_id}")
async def delete_category(category_id: str):
    """
    Delete a repository category
    """
    try:
        if category_id not in categories:
            raise HTTPException(status_code=404, detail="Category not found")
        
        # Remove the category
        deleted_category = categories.pop(category_id)
        
        # Remove this category from all repositories
        for repo in saved_repositories.values():
            if category_id in repo.categories:
                repo.categories.remove(category_id)
        
        return {"message": "Category deleted", "category": deleted_category}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting category: {str(e)}")


# Function to get similar files - used in both Modal and local environments
async def get_similar_files_func(repo_name: str, query: str) -> List[str]:
    """
    Function to find similar files
    """
    codebase = Codebase.from_repo(repo_name)
    search_result = semantic_search(codebase, query, k=6, index_type="file")
    return [result.filepath for result in search_result.results if result.score > 0.2]


# Modal function for cloud deployment
@app.function()
async def get_similar_files(repo_name: str, query: str) -> List[str]:
    """
    Separate Modal function to find similar files
    """
    return await get_similar_files_func(repo_name, query)


@fastapi_app.post("/research/stream")
async def research_stream(request: ResearchRequest):
    """
    Streaming endpoint to perform code research on a GitHub repository.
    """
    try:
        async def event_generator():
            final_response = ""

            # Handle similar files differently based on environment
            if os.environ.get("RUNNING_LOCALLY") == "true":
                similar_files = await get_similar_files_func(request.repo_name, request.query)
            else:
                similar_files_future = get_similar_files.remote.aio(
                    request.repo_name, request.query
                )
                similar_files = await similar_files_future

            codebase = Codebase.from_repo(request.repo_name)
            tools = [
                ViewFileTool(codebase),
                ListDirectoryTool(codebase),
                SearchTool(codebase),
                SemanticSearchTool(codebase),
                RevealSymbolTool(codebase),
            ]

            agent = create_agent_with_tools(
                codebase=codebase,
                tools=tools,
                chat_history=[SystemMessage(content=RESEARCH_AGENT_PROMPT)],
                verbose=True,
            )

            research_task = agent.astream_events(
                {"input": request.query},
                version="v1",
                config={"configurable": {"session_id": "research"}},
            )

            yield f"data: {json.dumps({'type': 'similar_files', 'content': similar_files})}\n\n"

            async for event in research_task:
                kind = event["event"]
                if kind == "on_chat_model_stream":
                    content = event["data"]["chunk"].content
                    if content:
                        final_response += content
                        yield f"data: {json.dumps({'type': 'content', 'content': content})}\n\n"
                elif kind in ["on_tool_start", "on_tool_end"]:
                    yield f"data: {json.dumps({'type': kind, 'data': event['data']})}\n\n"

            yield f"data: {json.dumps({'type': 'complete', 'content': final_response})}\n\n"

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
        )

    except Exception as e:
        error_status = update_status("Error occurred")
        return StreamingResponse(
            iter(
                [
                    f"data: {json.dumps(error_status)}\n\n",
                    f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n",
                ]
            ),
            media_type="text/event-stream",
        )


# Modal app deployment
@app.function(image=image, secrets=[modal.Secret.from_name("agent-secret")])
@modal.asgi_app()
def fastapi_modal_app():
    return fastapi_app


# Run locally if executed directly
if __name__ == "__main__":
    # Check if we're running locally or deploying to Modal
    if os.environ.get("DEPLOY_TO_MODAL") == "true":
        app.deploy("code-research-app")
    else:
        # Set environment variable to indicate we're running locally
        os.environ["RUNNING_LOCALLY"] = "true"
        # Run the FastAPI app locally with uvicorn
        print("Starting local API server at http://localhost:8000")
        uvicorn.run(fastapi_app, host="0.0.0.0", port=8000)
