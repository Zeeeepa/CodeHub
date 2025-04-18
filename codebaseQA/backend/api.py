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

# Advanced code manipulation prompt
CODE_MANIPULATION_PROMPT = """You are a code manipulation expert. Your goal is to help users modify and improve codebases by:
1. Refactoring code to improve readability and maintainability
2. Moving symbols between files while maintaining correct imports
3. Detecting and removing dead code
4. Suggesting advanced configurations and optimizations

Always explain your changes in detail and provide context about why they improve the codebase.
When manipulating code, consider:
- The impact on existing functionality
- Maintaining backward compatibility
- Following best practices and design patterns
- Optimizing for performance and readability

Preview changes before applying them and explain the benefits of each modification."""

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


# New models for code manipulation
class DeadCodeRequest(BaseModel):
    repo_name: str
    file_path: Optional[str] = None  # If None, scan entire codebase


class DeadCodeResponse(BaseModel):
    dead_functions: List[Dict[str, Any]]
    dead_classes: List[Dict[str, Any]]
    dead_imports: List[Dict[str, Any]]


class RefactorRequest(BaseModel):
    repo_name: str
    symbol_name: str
    filepath: Optional[str] = None
    refactor_type: str  # "rename", "extract_function", "move", etc.
    new_name: Optional[str] = None
    new_filepath: Optional[str] = None
    additional_params: Optional[Dict[str, Any]] = None


class RefactorResponse(BaseModel):
    success: bool
    message: str
    changes: List[Dict[str, Any]]
    preview: Optional[str] = None


class CodegenChatRequest(BaseModel):
    repo_name: str
    message: str
    api_key: str
    history: Optional[List[Dict[str, str]]] = None


class CodegenChatResponse(BaseModel):
    content: str


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


# New endpoints for code manipulation

@fastapi_app.post("/dead-code", response_model=DeadCodeResponse)
async def find_dead_code(request: DeadCodeRequest) -> DeadCodeResponse:
    """
    Endpoint to find dead code in a codebase.
    """
    try:
        codebase = Codebase.from_repo(request.repo_name)
        
        dead_functions = []
        dead_classes = []
        dead_imports = []
        
        # Find dead functions
        for function in codebase.functions:
            if not function.usages:
                dead_functions.append({
                    "name": function.name,
                    "filepath": function.file.path if function.file else None,
                    "line_number": function.line_number if hasattr(function, "line_number") else None,
                    "source_code": function.source_code if hasattr(function, "source_code") else None
                })
        
        # Find dead classes
        for cls in codebase.classes:
            if not cls.usages:
                dead_classes.append({
                    "name": cls.name,
                    "filepath": cls.file.path if cls.file else None,
                    "line_number": cls.line_number if hasattr(cls, "line_number") else None,
                    "source_code": cls.source_code if hasattr(cls, "source_code") else None
                })
        
        # Find dead imports
        for imp in codebase.imports:
            if not imp.usages:
                dead_imports.append({
                    "source": imp.source,
                    "filepath": imp.file.path if imp.file else None,
                    "line_number": imp.line_number if hasattr(imp, "line_number") else None
                })
        
        return DeadCodeResponse(
            dead_functions=dead_functions,
            dead_classes=dead_classes,
            dead_imports=dead_imports
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error finding dead code: {str(e)}")


@fastapi_app.post("/refactor", response_model=RefactorResponse)
async def refactor_code(request: RefactorRequest) -> RefactorResponse:
    """
    Endpoint to refactor code in a codebase.
    """
    try:
        codebase = Codebase.from_repo(request.repo_name)
        
        # Find the symbol to refactor
        symbol = None
        if request.filepath:
            file = codebase.get_file(request.filepath)
            symbol = file.get_symbol(request.symbol_name)
        else:
            symbol = codebase.get_symbol(request.symbol_name)
        
        if not symbol:
            return RefactorResponse(
                success=False,
                message=f"Symbol '{request.symbol_name}' not found",
                changes=[]
            )
        
        changes = []
        preview = None
        
        # Perform the requested refactoring
        if request.refactor_type == "rename" and request.new_name:
            # Generate preview before actual change
            preview = f"Will rename {symbol.name} to {request.new_name}"
            
            # Perform the rename
            symbol.rename(request.new_name)
            
            changes.append({
                "type": "rename",
                "old_name": request.symbol_name,
                "new_name": request.new_name,
                "filepath": symbol.file.path if hasattr(symbol, "file") else None
            })
            
        elif request.refactor_type == "move" and request.new_filepath:
            # Get or create the target file
            target_file = codebase.get_file(request.new_filepath)
            if not target_file:
                target_file = codebase.create_file(request.new_filepath)
            
            # Generate preview before actual change
            preview = f"Will move {symbol.name} from {symbol.file.path if hasattr(symbol, 'file') else 'unknown'} to {request.new_filepath}"
            
            # Perform the move
            symbol.move_to_file(target_file)
            
            changes.append({
                "type": "move",
                "symbol_name": request.symbol_name,
                "old_filepath": symbol.file.path if hasattr(symbol, "file") else None,
                "new_filepath": request.new_filepath
            })
            
        else:
            return RefactorResponse(
                success=False,
                message=f"Unsupported refactor type: {request.refactor_type}",
                changes=[]
            )
        
        # Commit changes to the codebase
        codebase.commit()
        
        return RefactorResponse(
            success=True,
            message=f"Successfully refactored {request.symbol_name}",
            changes=changes,
            preview=preview
        )
    except Exception as e:
        return RefactorResponse(
            success=False,
            message=f"Error during refactoring: {str(e)}",
            changes=[]
        )


@fastapi_app.post("/codegen-chat", response_model=CodegenChatResponse)
async def codegen_chat(request: CodegenChatRequest) -> CodegenChatResponse:
    """
    Endpoint for chat with Codegen about a codebase.
    """
    try:
        codebase = Codebase.from_repo(request.repo_name)
        
        # Set up the code agent with manipulation capabilities
        code_agent = CodeAgent(
            codebase=codebase,
            api_key=request.api_key,
            analyze_codebase=True
        )
        
        # Process the message
        if request.message.lower().startswith("find dead code"):
            # Special handling for dead code detection
            dead_code = []
            for function in codebase.functions:
                if not function.usages:
                    dead_code.append(f"- Function `{function.name}` in {function.file.path if function.file else 'unknown file'}")
            
            for cls in codebase.classes:
                if not cls.usages:
                    dead_code.append(f"- Class `{cls.name}` in {cls.file.path if cls.file else 'unknown file'}")
            
            for imp in codebase.imports:
                if not imp.usages:
                    dead_code.append(f"- Import `{imp.source}` in {imp.file.path if imp.file else 'unknown file'}")
            
            if dead_code:
                response = "I found the following unused code:\n\n" + "\n".join(dead_code)
            else:
                response = "I didn't find any dead code in the codebase."
                
        elif request.message.lower().startswith("refactor"):
            # For refactoring requests, we'll return guidance
            response = "To refactor code, please specify:\n\n" + \
                      "1. The symbol name to refactor\n" + \
                      "2. The type of refactoring (rename, move, etc.)\n" + \
                      "3. Any additional parameters (new name, new location, etc.)\n\n" + \
                      "For example: 'Refactor function calculate_total to rename it to compute_sum'"
                      
        else:
            # For general queries, use the code agent
            response = code_agent.chat(request.message)
        
        return CodegenChatResponse(content=response)
    except Exception as e:
        return CodegenChatResponse(content=f"Error processing request: {str(e)}")

# ... [rest of the existing code remains unchanged]
