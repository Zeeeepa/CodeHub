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
from .services.filesystem_service import FileSystemService

app = FastAPI(title="CodeHub Backend", description="Backend API for CodeHub")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

class PathRequest(BaseModel):
    path: str

class DirectoryStructureRequest(BaseModel):
    path: str
    max_depth: Optional[int] = 3

class ListFilesRequest(BaseModel):
    path: str
    extensions: Optional[List[str]] = None

def get_codegen_service(api_key: str) -> CodegenSDKService:
    return CodegenSDKService(api_key)

def get_filesystem_service() -> FileSystemService:
    return FileSystemService()

@app.post("/filesystem/list-directories")
async def list_directories(request: PathRequest, fs_service: FileSystemService = Depends(get_filesystem_service)):
    try:
        result = fs_service.list_directories(request.path)
        return {"directories": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/filesystem/list-files")
async def list_files(request: ListFilesRequest, fs_service: FileSystemService = Depends(get_filesystem_service)):
    try:
        result = fs_service.list_files(request.path, request.extensions)
        return {"files": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/filesystem/validate-codebase")
async def validate_codebase(request: PathRequest, fs_service: FileSystemService = Depends(get_filesystem_service)):
    try:
        result = fs_service.validate_codebase_path(request.path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/filesystem/directory-structure")
async def get_directory_structure(request: DirectoryStructureRequest, fs_service: FileSystemService = Depends(get_filesystem_service)):
    try:
        result = fs_service.get_directory_structure(request.path, request.max_depth)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze")
async def analyze_codebase(request: CodebaseRequest):
    service = get_codegen_service(request.api_key)
    try:
        result = service.analyze_codebase(request.codebase_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/find-dead-code")
async def find_dead_code(request: CodebaseRequest):
    service = get_codegen_service(request.api_key)
    try:
        result = service.find_dead_code(request.codebase_path)
        return {"dead_code": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
