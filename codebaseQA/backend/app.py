"""
FastAPI app for the CodeHub backend.
This app provides API endpoints for interacting with the Codegen SDK.
"""

import os
from typing import Dict, List, Optional, Any, Union
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from .services.codegen_sdk_service import CodegenSDKService

app = FastAPI(title="CodeHub Backend", description="Backend API for CodeHub")

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
    import_source: Optional[str] = None
    symbols: Optional[List[str]] = None
    api_key: str

class JsxComponentRequest(BaseModel):
    codebase_path: str
    component_name: str
    api_key: str

class CallGraphRequest(BaseModel):
    codebase_path: str
    function_name: str
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
async def get_dependencies(request: SymbolOperationRequest):
    """Get dependencies of a symbol."""
    service = get_codegen_service(request.api_key)
    try:
        result = service.get_dependencies(request.codebase_path, request.symbol_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-imports")
async def analyze_imports(request: ImportOperationRequest):
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
    if not request.import_source:
        raise HTTPException(status_code=400, detail="Import source is required for add import operations")
    
    service = get_codegen_service(request.api_key)
    try:
        result = service.add_import(request.codebase_path, request.file_path, request.import_source, request.symbols)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-jsx-component")
async def analyze_jsx_component(request: JsxComponentRequest):
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
