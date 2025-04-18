"""
FastAPI app for the CodeHub backend.
This app provides API endpoints for interacting with the Codegen SDK.
"""

import os
from typing import Dict, List, Optional, Any, Union
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from .services.codegen_sdk_service import CodegenSDKService

app = FastAPI(title="CodeHub Backend", description="Backend API for CodeHub")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class CodebaseRequest(BaseModel):
    codebase_path: str
    api_key: str

class FileOperationRequest(BaseModel):
    codebase_path: str
    file_path: str
    content: Optional[str] = None
    api_key: str

class SymbolOperationRequest(BaseModel):
    codebase_path: str
    symbol_name: str
    new_name: Optional[str] = None
    target_file: Optional[str] = None
    api_key: str

class SemanticEditRequest(BaseModel):
    codebase_path: str
    file_path: str
    edit_description: str
    api_key: str

class ImportOperationRequest(BaseModel):
    codebase_path: str
    file_path: str
    import_source: str
    symbols: Optional[List[str]] = None
    api_key: str

class DependencyRequest(BaseModel):
    codebase_path: str
    symbol_name: str
    api_key: str

class SearchRequest(BaseModel):
    codebase_path: str
    query: str
    api_key: str

class JSXComponentRequest(BaseModel):
    codebase_path: str
    component_name: str
    api_key: str

class CallGraphRequest(BaseModel):
    codebase_path: str
    function_name: str
    api_key: str

class ParameterOperationRequest(BaseModel):
    codebase_path: str
    function_name: str
    parameter_name: str
    parameter_type: Optional[str] = None
    api_key: str

class ReturnTypeRequest(BaseModel):
    codebase_path: str
    function_name: str
    return_type: str
    api_key: str

class DocGenerationRequest(BaseModel):
    codebase_path: str
    symbol_name: str
    api_key: str

class FormatCodeRequest(BaseModel):
    codebase_path: str
    file_path: str
    api_key: str

# Dependency
def get_codegen_service(api_key: str) -> CodegenSDKService:
    return CodegenSDKService(api_key)

# Routes
@app.post("/analyze")
async def analyze_codebase(request: CodebaseRequest):
    """Analyze a codebase."""
    service = get_codegen_service(request.api_key)
    try:
        result = service.analyze_codebase(request.codebase_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/find-dead-code")
async def find_dead_code(request: CodebaseRequest):
    """Find dead code in a codebase."""
    service = get_codegen_service(request.api_key)
    try:
        result = service.find_dead_code(request.codebase_path)
        return {"dead_code": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/edit-file")
async def edit_file(request: FileOperationRequest):
    """Edit a file in the codebase."""
    if not request.content:
        raise HTTPException(status_code=400, detail="Content is required for edit operations")
    
    service = get_codegen_service(request.api_key)
    try:
        result = service.edit_file(request.codebase_path, request.file_path, request.content)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/create-file")
async def create_file(request: FileOperationRequest):
    """Create a file in the codebase."""
    if not request.content:
        raise HTTPException(status_code=400, detail="Content is required for create operations")
    
    service = get_codegen_service(request.api_key)
    try:
        result = service.create_file(request.codebase_path, request.file_path, request.content)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/delete-file")
async def delete_file(request: FileOperationRequest):
    """Delete a file from the codebase."""
    service = get_codegen_service(request.api_key)
    try:
        result = service.delete_file(request.codebase_path, request.file_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/get-symbol")
async def get_symbol(request: SymbolOperationRequest):
    """Get a symbol from the codebase."""
    service = get_codegen_service(request.api_key)
    try:
        result = service.get_symbol(request.codebase_path, request.symbol_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rename-symbol")
async def rename_symbol(request: SymbolOperationRequest):
    """Rename a symbol in the codebase."""
    if not request.new_name:
        raise HTTPException(status_code=400, detail="New name is required for rename operations")
    
    service = get_codegen_service(request.api_key)
    try:
        result = service.rename_symbol(request.codebase_path, request.symbol_name, request.new_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/move-symbol")
async def move_symbol(request: SymbolOperationRequest):
    """Move a symbol to another file."""
    if not request.target_file:
        raise HTTPException(status_code=400, detail="Target file is required for move operations")
    
    service = get_codegen_service(request.api_key)
    try:
        result = service.move_symbol(request.codebase_path, request.symbol_name, request.target_file)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/semantic-edit")
async def semantic_edit(request: SemanticEditRequest):
    """Perform a semantic edit on a file."""
    service = get_codegen_service(request.api_key)
    try:
        result = service.semantic_edit(request.codebase_path, request.file_path, request.edit_description)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/get-dependencies")
async def get_dependencies(request: DependencyRequest):
    """Get dependencies of a symbol."""
    service = get_codegen_service(request.api_key)
    try:
        result = service.get_dependencies(request.codebase_path, request.symbol_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-imports")
async def analyze_imports(request: FileOperationRequest):
    """Analyze imports in a file."""
    service = get_codegen_service(request.api_key)
    try:
        result = service.analyze_imports(request.codebase_path, request.file_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/add-import")
async def add_import(request: ImportOperationRequest):
    """Add an import to a file."""
    service = get_codegen_service(request.api_key)
    try:
        result = service.add_import(request.codebase_path, request.file_path, request.import_source, request.symbols)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-jsx-component")
async def analyze_jsx_component(request: JSXComponentRequest):
    """Analyze a JSX component."""
    service = get_codegen_service(request.api_key)
    try:
        result = service.analyze_jsx_component(request.codebase_path, request.component_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/get-call-graph")
async def get_call_graph(request: CallGraphRequest):
    """Get the call graph for a function."""
    service = get_codegen_service(request.api_key)
    try:
        result = service.get_call_graph(request.codebase_path, request.function_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search-code")
async def search_code(request: SearchRequest):
    """Search for code in the codebase."""
    service = get_codegen_service(request.api_key)
    try:
        result = service.search_code(request.codebase_path, request.query)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/semantic-search")
async def semantic_search(request: SearchRequest):
    """Perform a semantic search in the codebase."""
    service = get_codegen_service(request.api_key)
    try:
        result = service.semantic_search(request.codebase_path, request.query)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/get-all-files")
async def get_all_files(request: CodebaseRequest):
    """Get all files in the codebase."""
    service = get_codegen_service(request.api_key)
    try:
        result = service.get_all_files(request.codebase_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/get-all-functions")
async def get_all_functions(request: CodebaseRequest):
    """Get all functions in the codebase."""
    service = get_codegen_service(request.api_key)
    try:
        result = service.get_all_functions(request.codebase_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/get-all-classes")
async def get_all_classes(request: CodebaseRequest):
    """Get all classes in the codebase."""
    service = get_codegen_service(request.api_key)
    try:
        result = service.get_all_classes(request.codebase_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/get-file-content")
async def get_file_content(request: FileOperationRequest):
    """Get the content of a file."""
    service = get_codegen_service(request.api_key)
    try:
        result = service.get_file_content(request.codebase_path, request.file_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract-function")
async def extract_function(request: SemanticEditRequest):
    """Extract a function from a file."""
    service = get_codegen_service(request.api_key)
    try:
        result = service.extract_function(request.codebase_path, request.file_path, request.edit_description)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/refactor-code")
async def refactor_code(request: SemanticEditRequest):
    """Refactor code in a file."""
    service = get_codegen_service(request.api_key)
    try:
        result = service.refactor_code(request.codebase_path, request.file_path, request.edit_description)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-documentation")
async def generate_documentation(request: DocGenerationRequest):
    """Generate documentation for a symbol."""
    service = get_codegen_service(request.api_key)
    try:
        result = service.generate_documentation(request.codebase_path, request.symbol_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/add-parameter")
async def add_parameter(request: ParameterOperationRequest):
    """Add a parameter to a function."""
    service = get_codegen_service(request.api_key)
    try:
        result = service.add_parameter(request.codebase_path, request.function_name, request.parameter_name, request.parameter_type)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/remove-parameter")
async def remove_parameter(request: ParameterOperationRequest):
    """Remove a parameter from a function."""
    service = get_codegen_service(request.api_key)
    try:
        result = service.remove_parameter(request.codebase_path, request.function_name, request.parameter_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/change-return-type")
async def change_return_type(request: ReturnTypeRequest):
    """Change the return type of a function."""
    service = get_codegen_service(request.api_key)
    try:
        result = service.change_return_type(request.codebase_path, request.function_name, request.return_type)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/find-unused-imports")
async def find_unused_imports(request: CodebaseRequest):
    """Find unused imports in the codebase."""
    service = get_codegen_service(request.api_key)
    try:
        result = service.find_unused_imports(request.codebase_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/remove-unused-imports")
async def remove_unused_imports(request: CodebaseRequest):
    """Remove unused imports from the codebase."""
    service = get_codegen_service(request.api_key)
    try:
        result = service.remove_unused_imports(request.codebase_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/format-code")
async def format_code(request: FormatCodeRequest):
    """Format code in a file."""
    service = get_codegen_service(request.api_key)
    try:
        result = service.format_code(request.codebase_path, request.file_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Chat models
class ChatRequest(BaseModel):
    codebase_path: str
    message: str
    api_key: str

class ChatResponse(BaseModel):
    content: str

@app.post("/chat")
async def chat(request: ChatRequest):
    """Process a chat message using the Codegen SDK."""
    try:
        codebase = Codebase(request.codebase_path)
        
        # Create a chat agent with the codebase
        from codegen.chat import ChatAgent
        agent = ChatAgent(codebase, api_key=request.api_key)
        
        # Process the message
        response = agent.process_message(request.message)
        
        return ChatResponse(content=response.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
