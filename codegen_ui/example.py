#!/usr/bin/env python3
"""
Example script showing how to use the Codegen API programmatically.
"""

import os
import sys

# Check if codegen is installed
try:
    from codegen import Codebase
except ImportError:
    print("Codegen SDK is not installed. Please install it with 'pip install codegen'.")
    sys.exit(1)


def analyze_codebase(path):
    """Analyze a codebase and print some basic information."""
    print(f"Analyzing codebase at: {path}")
    
    # Initialize the codebase
    codebase = Codebase(path)
    
    # Get basic stats
    files = list(codebase.files)
    print(f"Files: {len(files)}")
    
    try:
        functions = list(codebase.functions)
        classes = list(codebase.classes)
        print(f"Functions: {len(functions)}")
        print(f"Classes: {len(classes)}")
    except Exception as e:
        print(f"Could not get detailed stats: {str(e)}")
    
    # Print some file paths
    print("\nSample files:")
    for i, file in enumerate(files[:5], 1):
        print(f"{i}. {file.path}")
    
    # Print some function names
    try:
        print("\nSample functions:")
        for i, func in enumerate(functions[:5], 1):
            print(f"{i}. {func.name} (in {func.file.path})")
    except Exception as e:
        print(f"Could not list functions: {str(e)}")
    
    # Print some class names
    try:
        print("\nSample classes:")
        for i, cls in enumerate(classes[:5], 1):
            print(f"{i}. {cls.name} (in {cls.file.path})")
    except Exception as e:
        print(f"Could not list classes: {str(e)}")
    
    # Search for a specific term
    search_term = "main"
    print(f"\nSearching for '{search_term}':")
    
    # Search in file paths
    matching_files = [file for file in files if search_term.lower() in file.path.lower()]
    print(f"Files matching '{search_term}': {len(matching_files)}")
    
    # Search in function names
    try:
        matching_functions = [func for func in functions if search_term.lower() in func.name.lower()]
        print(f"Functions matching '{search_term}': {len(matching_functions)}")
    except Exception as e:
        print(f"Could not search functions: {str(e)}")
    
    # Search in class names
    try:
        matching_classes = [cls for cls in classes if search_term.lower() in cls.name.lower()]
        print(f"Classes matching '{search_term}': {len(matching_classes)}")
    except Exception as e:
        print(f"Could not search classes: {str(e)}")


if __name__ == "__main__":
    # Check if a path was provided
    if len(sys.argv) > 1:
        path = sys.argv[1]
    else:
        # Use the current directory as a fallback
        path = os.getcwd()
    
    # Analyze the codebase
    analyze_codebase(path)
