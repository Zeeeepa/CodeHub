"""
Service for interacting with the Codegen SDK.
This service provides functions to analyze and modify codebases using the Codegen SDK.
"""

import os
import json
from typing import Dict, List, Optional, Any, Union

# Import the Codegen SDK
from codegen import Codebase
from codegen.semantic_edit import SemanticEditTool
from codegen.analysis import find_dead_code
from codegen.file_operations import create_file, delete_file
from codegen.symbol_operations import rename_symbol, move_symbol
from codegen.analysis.dependencies import get_dependencies, get_usages
from codegen.analysis.structure import get_codebase_structure
from codegen.language import Python, TypeScript, JavaScript

class CodegenSDKService:
    """Service for interacting with the Codegen SDK."""
    
    def __init__(self, api_key: str):
        """Initialize the Codegen SDK service.
        
        Args:
            api_key: The Codegen API key
        """
        self.api_key = api_key
        self.active_codebases = {}  # Map of codebase paths to Codebase objects
    
    def get_or_create_codebase(self, codebase_path: str) -> Codebase:
        """Get or create a Codebase object for the given path.
        
        Args:
            codebase_path: Path to the codebase
            
        Returns:
            A Codebase object
        """
        if codebase_path not in self.active_codebases:
            # Create a new Codebase object
            self.active_codebases[codebase_path] = Codebase(codebase_path)
        
        return self.active_codebases[codebase_path]
    
    def analyze_codebase(self, codebase_path: str) -> Dict[str, Any]:
        """Analyze a codebase.
        
        Args:
            codebase_path: Path to the codebase
            
        Returns:
            Analysis results
        """
        codebase = self.get_or_create_codebase(codebase_path)
        
        # Get all files in the codebase
        files = []
        for file in codebase.files:
            file_info = {
                "path": file.path,
                "type": "file",
                "size": os.path.getsize(file.path) if os.path.exists(file.path) else 0
            }
            files.append(file_info)
        
        # Get all functions in the codebase
        functions = []
        for function in codebase.functions:
            function_info = {
                "name": function.name,
                "file": function.file.path,
                "line_count": len(function.source.splitlines()) if function.source else 0,
                "parameters": [param.name for param in function.parameters] if hasattr(function, "parameters") else []
            }
            functions.append(function_info)
        
        # Get all classes in the codebase
        classes = []
        for symbol in codebase.symbols:
            if symbol.type == "class":
                class_info = {
                    "name": symbol.name,
                    "file": symbol.file.path,
                    "method_count": len([m for m in symbol.methods]) if hasattr(symbol, "methods") else 0
                }
                classes.append(class_info)
        
        # Get codebase structure
        structure = get_codebase_structure(codebase)
        
        return {
            "files": files,
            "functions": functions,
            "classes": classes,
            "structure": structure
        }
    
    def find_dead_code(self, codebase_path: str) -> List[Dict[str, Any]]:
        """Find dead code in a codebase.
        
        Args:
            codebase_path: Path to the codebase
            
        Returns:
            List of dead code functions
        """
        codebase = self.get_or_create_codebase(codebase_path)
        
        # Find dead code using the Codegen SDK
        dead_functions = find_dead_code(codebase)
        
        # Format the results
        results = []
        for function in dead_functions:
            result = {
                "name": function.name,
                "file": function.file.path,
                "line": function.start_line,
                "source": function.source
            }
            results.append(result)
        
        return results
    
    def edit_file(self, codebase_path: str, file_path: str, content: str) -> Dict[str, Any]:
        """Edit a file in the codebase.
        
        Args:
            codebase_path: Path to the codebase
            file_path: Path to the file to edit
            content: New content for the file
            
        Returns:
            Result of the operation
        """
        codebase = self.get_or_create_codebase(codebase_path)
        
        # Get the file from the codebase
        file = codebase.get_file(file_path)
        
        # Edit the file
        file.edit(content)
        
        return {
            "success": True,
            "message": f"Successfully edited file: {file_path}",
            "operation": "edit",
            "file_path": file_path
        }
    
    def create_file(self, codebase_path: str, file_path: str, content: str) -> Dict[str, Any]:
        """Create a file in the codebase.
        
        Args:
            codebase_path: Path to the codebase
            file_path: Path to the file to create
            content: Content for the new file
            
        Returns:
            Result of the operation
        """
        codebase = self.get_or_create_codebase(codebase_path)
        
        # Create the file
        create_file(codebase, file_path, content)
        
        return {
            "success": True,
            "message": f"Successfully created file: {file_path}",
            "operation": "create",
            "file_path": file_path
        }
    
    def delete_file(self, codebase_path: str, file_path: str) -> Dict[str, Any]:
        """Delete a file from the codebase.
        
        Args:
            codebase_path: Path to the codebase
            file_path: Path to the file to delete
            
        Returns:
            Result of the operation
        """
        codebase = self.get_or_create_codebase(codebase_path)
        
        # Delete the file
        delete_file(codebase, file_path)
        
        return {
            "success": True,
            "message": f"Successfully deleted file: {file_path}",
            "operation": "delete",
            "file_path": file_path
        }
    
    def get_symbol(self, codebase_path: str, symbol_name: str) -> Dict[str, Any]:
        """Get a symbol from the codebase.
        
        Args:
            codebase_path: Path to the codebase
            symbol_name: Name of the symbol to get
            
        Returns:
            Symbol information
        """
        codebase = self.get_or_create_codebase(codebase_path)
        
        # Get the symbol
        symbol = codebase.get_symbol(symbol_name)
        
        # Get usages of the symbol
        usages = get_usages(symbol)
        
        # Format usages
        formatted_usages = []
        for usage in usages:
            formatted_usage = {
                "file": usage.file.path,
                "line": usage.line
            }
            formatted_usages.append(formatted_usage)
        
        return {
            "name": symbol.name,
            "type": symbol.type,
            "file": symbol.file.path,
            "line": symbol.start_line,
            "source": symbol.source,
            "usages": formatted_usages
        }
    
    def rename_symbol(self, codebase_path: str, symbol_name: str, new_name: str) -> Dict[str, Any]:
        """Rename a symbol in the codebase.
        
        Args:
            codebase_path: Path to the codebase
            symbol_name: Name of the symbol to rename
            new_name: New name for the symbol
            
        Returns:
            Result of the operation
        """
        codebase = self.get_or_create_codebase(codebase_path)
        
        # Get the symbol
        symbol = codebase.get_symbol(symbol_name)
        
        # Rename the symbol
        rename_symbol(symbol, new_name)
        
        return {
            "success": True,
            "message": f"Successfully renamed symbol: {symbol_name} to {new_name}",
            "operation": "rename",
            "symbol_name": symbol_name,
            "new_name": new_name
        }
    
    def move_symbol(self, codebase_path: str, symbol_name: str, target_file: str) -> Dict[str, Any]:
        """Move a symbol to another file.
        
        Args:
            codebase_path: Path to the codebase
            symbol_name: Name of the symbol to move
            target_file: Path to the target file
            
        Returns:
            Result of the operation
        """
        codebase = self.get_or_create_codebase(codebase_path)
        
        # Get the symbol
        symbol = codebase.get_symbol(symbol_name)
        
        # Get the target file
        target = codebase.get_file(target_file)
        
        # Move the symbol
        move_symbol(symbol, target)
        
        return {
            "success": True,
            "message": f"Successfully moved symbol: {symbol_name} to {target_file}",
            "operation": "move",
            "symbol_name": symbol_name,
            "target_file": target_file
        }
    
    def semantic_edit(self, codebase_path: str, file_path: str, edit_description: str) -> Dict[str, Any]:
        """Perform a semantic edit on a file.
        
        Args:
            codebase_path: Path to the codebase
            file_path: Path to the file to edit
            edit_description: Description of the edit to perform
            
        Returns:
            Result of the operation
        """
        codebase = self.get_or_create_codebase(codebase_path)
        
        # Get the file
        file = codebase.get_file(file_path)
        
        # Create a semantic edit tool
        edit_tool = SemanticEditTool()
        
        # Perform the edit
        result = edit_tool.edit(file, edit_description)
        
        return {
            "success": result.success,
            "message": result.message,
            "operation": "semantic_edit",
            "file_path": file_path,
            "edit_description": edit_description
        }
    
    def get_dependencies(self, codebase_path: str, symbol_name: str) -> Dict[str, Any]:
        """Get dependencies of a symbol.
        
        Args:
            codebase_path: Path to the codebase
            symbol_name: Name of the symbol
            
        Returns:
            Dependencies information
        """
        codebase = self.get_or_create_codebase(codebase_path)
        
        # Get the symbol
        symbol = codebase.get_symbol(symbol_name)
        
        # Get dependencies
        dependencies = get_dependencies(symbol)
        
        # Format dependencies
        formatted_deps = []
        for dep in dependencies:
            formatted_dep = {
                "name": dep.name,
                "type": dep.type,
                "file": dep.file.path
            }
            formatted_deps.append(formatted_dep)
        
        return {
            "symbol": symbol_name,
            "dependencies": formatted_deps
        }
    
    def analyze_imports(self, codebase_path: str, file_path: str) -> Dict[str, Any]:
        """Analyze imports in a file.
        
        Args:
            codebase_path: Path to the codebase
            file_path: Path to the file
            
        Returns:
            Import analysis
        """
        codebase = self.get_or_create_codebase(codebase_path)
        
        # Get the file
        file = codebase.get_file(file_path)
        
        # Get imports
        imports = file.imports
        
        # Format imports
        formatted_imports = []
        for imp in imports:
            formatted_import = {
                "source": imp.source,
                "symbols": imp.symbols if hasattr(imp, "symbols") else [],
                "is_default": imp.is_default if hasattr(imp, "is_default") else False
            }
            formatted_imports.append(formatted_import)
        
        return {
            "file": file_path,
            "imports": formatted_imports
        }
    
    def add_import(self, codebase_path: str, file_path: str, import_source: str, symbols: List[str] = None) -> Dict[str, Any]:
        """Add an import to a file.
        
        Args:
            codebase_path: Path to the codebase
            file_path: Path to the file
            import_source: Source module to import from
            symbols: List of symbols to import
            
        Returns:
            Result of the operation
        """
        codebase = self.get_or_create_codebase(codebase_path)
        
        # Get the file
        file = codebase.get_file(file_path)
        
        # Add the import
        file.add_import(import_source, symbols)
        
        return {
            "success": True,
            "message": f"Successfully added import from {import_source} to {file_path}",
            "operation": "add_import",
            "file_path": file_path,
            "import_source": import_source,
            "symbols": symbols
        }
    
    def analyze_jsx_component(self, codebase_path: str, component_name: str) -> Dict[str, Any]:
        """Analyze a JSX component.
        
        Args:
            codebase_path: Path to the codebase
            component_name: Name of the component
            
        Returns:
            Component analysis
        """
        codebase = self.get_or_create_codebase(codebase_path)
        
        # Get the component symbol
        component = codebase.get_symbol(component_name)
        
        # Check if it's a React component
        if not hasattr(component, "is_react_component") or not component.is_react_component:
            return {
                "success": False,
                "message": f"{component_name} is not a React component",
                "component_name": component_name
            }
        
        # Get props
        props = component.props if hasattr(component, "props") else []
        
        # Format props
        formatted_props = []
        for prop in props:
            formatted_prop = {
                "name": prop.name,
                "type": prop.type if hasattr(prop, "type") else "any",
                "required": prop.required if hasattr(prop, "required") else False,
                "default_value": prop.default_value if hasattr(prop, "default_value") else None
            }
            formatted_props.append(formatted_prop)
        
        # Get state
        state = component.state if hasattr(component, "state") else []
        
        # Format state
        formatted_state = []
        for s in state:
            formatted_s = {
                "name": s.name,
                "type": s.type if hasattr(s, "type") else "any",
                "initial_value": s.initial_value if hasattr(s, "initial_value") else None
            }
            formatted_state.append(formatted_s)
        
        return {
            "success": True,
            "component_name": component_name,
            "file": component.file.path,
            "props": formatted_props,
            "state": formatted_state,
            "is_functional": component.is_functional if hasattr(component, "is_functional") else True
        }
    
    def get_call_graph(self, codebase_path: str, function_name: str) -> Dict[str, Any]:
        """Get the call graph for a function.
        
        Args:
            codebase_path: Path to the codebase
            function_name: Name of the function
            
        Returns:
            Call graph information
        """
        codebase = self.get_or_create_codebase(codebase_path)
        
        # Get the function
        function = codebase.get_symbol(function_name)
        
        # Get called functions
        called_functions = function.calls if hasattr(function, "calls") else []
        
        # Format called functions
        formatted_calls = []
        for call in called_functions:
            formatted_call = {
                "name": call.name,
                "file": call.file.path if hasattr(call, "file") else None,
                "line": call.line if hasattr(call, "line") else None
            }
            formatted_calls.append(formatted_call)
        
        # Get functions that call this function
        callers = function.callers if hasattr(function, "callers") else []
        
        # Format callers
        formatted_callers = []
        for caller in callers:
            formatted_caller = {
                "name": caller.name,
                "file": caller.file.path if hasattr(caller, "file") else None,
                "line": caller.line if hasattr(caller, "line") else None
            }
            formatted_callers.append(formatted_caller)
        
        return {
            "function": function_name,
            "calls": formatted_calls,
            "callers": formatted_callers
        }
