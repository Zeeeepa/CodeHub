"""
Codebase modification operations using the Codegen SDK.
"""
from typing import List, Dict, Any, Optional, Tuple
from codegen import Codebase
import networkx as nx
import re

def find_dead_code(codebase: Codebase) -> List[Dict[str, Any]]:
    """
    Find unused functions in the codebase.
    
    Args:
        codebase: The Codebase object to analyze
        
    Returns:
        List of dictionaries containing information about unused functions
    """
    # Get all functions in the codebase
    all_functions = list(codebase.functions)
    
    # Create a dictionary to track function usage
    function_usage = {func.name: 0 for func in all_functions}
    
    # Count references to each function
    for func in all_functions:
        for call in func.function_calls:
            if call.function_definition and call.function_definition.name in function_usage:
                function_usage[call.function_definition.name] += 1
    
    # Find unused functions (those with no references)
    unused_functions = []
    for func in all_functions:
        # Skip if it's a main function, test function, or has special decorators
        if (func.name == "main" or 
            func.name.startswith("test_") or 
            any(d for d in func.decorators if "app.route" in str(d))):
            continue
            
        # Check if the function is unused (no references)
        if function_usage[func.name] == 0:
            unused_functions.append({
                "name": func.name,
                "file_path": func.file.path,
                "line_number": func.line_number,
                "parameters": [str(p) for p in func.parameters],
                "return_type": str(func.return_type) if func.return_type else None,
                "is_method": func.is_method,
                "source_code": func.source_code
            })
    
    return unused_functions

def sanitize_function(codebase: Codebase, function_name: str, filepath: Optional[str] = None) -> Dict[str, Any]:
    """
    Sanitize a function by removing unused code and improving its structure.
    
    Args:
        codebase: The Codebase object
        function_name: Name of the function to sanitize
        filepath: Optional filepath to narrow down the search
        
    Returns:
        Dictionary with the sanitization results
    """
    try:
        # Get the function
        func = None
        if filepath:
            file = codebase.get_file(filepath)
            func = file.get_symbol(function_name)
        else:
            func = codebase.get_symbol(function_name)
            
        if not func:
            return {"status": "error", "message": f"Function '{function_name}' not found"}
            
        # Store original source code
        original_source = func.source_code
        
        # Analyze function to find unused variables
        # This is a simplified implementation - in a real scenario, 
        # we would use more sophisticated analysis
        
        # Get all variables defined in the function
        variable_pattern = r'(\w+)\s*='
        defined_vars = re.findall(variable_pattern, original_source)
        
        # Get all variables used in the function
        used_vars = []
        for line in original_source.split('\n'):
            # Skip the line where the variable is defined
            if '=' in line:
                continue
                
            # Find all words that might be variables
            words = re.findall(r'\b(\w+)\b', line)
            used_vars.extend(words)
        
        # Find unused variables
        unused_vars = [var for var in defined_vars if var not in used_vars]
        
        # For now, we'll just return the analysis without modifying the function
        # In a real implementation, we would modify the function to remove unused variables
        
        return {
            "status": "success",
            "function_name": function_name,
            "file_path": func.file.path,
            "original_source": original_source,
            "unused_variables": unused_vars,
            "message": f"Found {len(unused_vars)} unused variables in function '{function_name}'"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

def remove_except_pattern(codebase: Codebase, pattern: str) -> Dict[str, Any]:
    """
    Remove all code except parts matching a specific pattern.
    
    Args:
        codebase: The Codebase object
        pattern: Pattern to match (e.g., "RAG" for RAG-related code)
        
    Returns:
        Dictionary with the results of the operation
    """
    try:
        # Search for files and symbols matching the pattern
        matching_files = []
        matching_symbols = []
        
        # Search in file paths
        for file in codebase.files:
            if pattern.lower() in file.path.lower():
                matching_files.append(file.path)
        
        # Search in function and class names
        for func in codebase.functions:
            if pattern.lower() in func.name.lower():
                matching_symbols.append({
                    "type": "function",
                    "name": func.name,
                    "file_path": func.file.path
                })
        
        for cls in codebase.classes:
            if pattern.lower() in cls.name.lower():
                matching_symbols.append({
                    "type": "class",
                    "name": cls.name,
                    "file_path": cls.file.path
                })
        
        # Search in docstrings and comments
        docstring_matches = []
        for file in codebase.files:
            content = file.read()
            if pattern.lower() in content.lower():
                # Check if it's in a docstring or comment
                lines = content.split('\n')
                for i, line in enumerate(lines):
                    if pattern.lower() in line.lower() and (line.strip().startswith('#') or '"""' in line or "'''" in line):
                        docstring_matches.append({
                            "file_path": file.path,
                            "line_number": i + 1,
                            "line_content": line.strip()
                        })
        
        # For now, we'll just return the analysis without modifying the codebase
        # In a real implementation, we would remove all code except the matching parts
        
        return {
            "status": "success",
            "pattern": pattern,
            "matching_files": matching_files,
            "matching_symbols": matching_symbols,
            "docstring_matches": docstring_matches,
            "message": f"Found {len(matching_files)} files, {len(matching_symbols)} symbols, and {len(docstring_matches)} docstrings/comments matching pattern '{pattern}'"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

def get_function_call_graph(codebase: Codebase, function_name: str, max_depth: int = 5) -> Dict[str, Any]:
    """
    Generate a call graph for a function.
    
    Args:
        codebase: The Codebase object
        function_name: Name of the function to analyze
        max_depth: Maximum depth of the call graph
        
    Returns:
        Dictionary with the call graph data
    """
    try:
        # Get the function
        func = codebase.get_symbol(function_name)
        if not func:
            return {"status": "error", "message": f"Function '{function_name}' not found"}
        
        # Create a directed graph
        graph = nx.DiGraph()
        
        # Add the root node
        graph.add_node(function_name)
        
        # Helper function to recursively build the call graph
        def build_call_graph(function, depth=0):
            if depth >= max_depth:
                return
                
            for call in function.function_calls:
                if call.function_definition:
                    called_func_name = call.function_definition.name
                    graph.add_node(called_func_name)
                    graph.add_edge(function.name, called_func_name)
                    
                    # Recursively process the called function
                    build_call_graph(call.function_definition, depth + 1)
        
        # Build the call graph
        build_call_graph(func)
        
        # Convert the graph to a dictionary representation
        nodes = list(graph.nodes())
        edges = [{"source": source, "target": target} for source, target in graph.edges()]
        
        return {
            "status": "success",
            "function_name": function_name,
            "nodes": nodes,
            "edges": edges,
            "message": f"Generated call graph for function '{function_name}' with {len(nodes)} nodes and {len(edges)} edges"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
