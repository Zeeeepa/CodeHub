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

# Import codemod operations
from codemod.operations import (
    find_dead_code,
    sanitize_function,
    remove_except_pattern,
    get_function_call_graph
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
