"""
Service for interacting with the file system.
This service provides functions to browse and select local folders for codebases.
"""

import os
import pathlib
from typing import Dict, List, Optional, Any, Union

class FileSystemService:
    """Service for interacting with the file system."""
    
    def __init__(self):
        """Initialize the file system service."""
        pass
    
    def list_directories(self, path: str) -> List[Dict[str, Any]]:
        """List directories at the given path.
        
        Args:
            path: Path to list directories from
            
        Returns:
            List of directory information
        """
        try:
            # Normalize the path
            normalized_path = os.path.normpath(path)
            
            # Check if the path exists
            if not os.path.exists(normalized_path):
                raise FileNotFoundError(f"Path does not exist: {normalized_path}")
            
            # Check if the path is a directory
            if not os.path.isdir(normalized_path):
                raise NotADirectoryError(f"Path is not a directory: {normalized_path}")
            
            # List directories
            directories = []
            for item in os.listdir(normalized_path):
                item_path = os.path.join(normalized_path, item)
                if os.path.isdir(item_path):
                    try:
                        # Get directory stats
                        stats = os.stat(item_path)
                        directories.append({
                            "name": item,
                            "path": item_path,
                            "size": sum(os.path.getsize(os.path.join(dirpath, filename)) 
                                    for dirpath, _, filenames in os.walk(item_path) 
                                    for filename in filenames if os.path.exists(os.path.join(dirpath, filename))),
                            "modified": stats.st_mtime,
                            "created": stats.st_ctime
                        })
                    except (PermissionError, OSError):
                        # Skip directories we can't access
                        continue
            
            return directories
        except Exception as e:
            raise e
    
    def list_files(self, path: str, extensions: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """List files at the given path.
        
        Args:
            path: Path to list files from
            extensions: Optional list of file extensions to filter by
            
        Returns:
            List of file information
        """
        try:
            # Normalize the path
            normalized_path = os.path.normpath(path)
            
            # Check if the path exists
            if not os.path.exists(normalized_path):
                raise FileNotFoundError(f"Path does not exist: {normalized_path}")
            
            # Check if the path is a directory
            if not os.path.isdir(normalized_path):
                raise NotADirectoryError(f"Path is not a directory: {normalized_path}")
            
            # List files
            files = []
            for item in os.listdir(normalized_path):
                item_path = os.path.join(normalized_path, item)
                if os.path.isfile(item_path):
                    # Check if the file has one of the specified extensions
                    if extensions and not any(item.lower().endswith(ext.lower()) for ext in extensions):
                        continue
                    
                    try:
                        # Get file stats
                        stats = os.stat(item_path)
                        files.append({
                            "name": item,
                            "path": item_path,
                            "size": stats.st_size,
                            "modified": stats.st_mtime,
                            "created": stats.st_ctime,
                            "extension": os.path.splitext(item)[1]
                        })
                    except (PermissionError, OSError):
                        # Skip files we can't access
                        continue
            
            return files
        except Exception as e:
            raise e
    
    def validate_codebase_path(self, path: str) -> Dict[str, Any]:
        """Validate that a path is a valid codebase.
        
        Args:
            path: Path to validate
            
        Returns:
            Validation result
        """
        try:
            # Normalize the path
            normalized_path = os.path.normpath(path)
            
            # Check if the path exists
            if not os.path.exists(normalized_path):
                return {
                    "valid": False,
                    "message": f"Path does not exist: {normalized_path}"
                }
            
            # Check if the path is a directory
            if not os.path.isdir(normalized_path):
                return {
                    "valid": False,
                    "message": f"Path is not a directory: {normalized_path}"
                }
            
            # Check if the directory is readable
            if not os.access(normalized_path, os.R_OK):
                return {
                    "valid": False,
                    "message": f"Directory is not readable: {normalized_path}"
                }
            
            # Count files and directories
            file_count = 0
            dir_count = 0
            for root, dirs, files in os.walk(normalized_path):
                file_count += len(files)
                dir_count += len(dirs)
            
            return {
                "valid": True,
                "path": normalized_path,
                "file_count": file_count,
                "directory_count": dir_count,
                "message": f"Valid codebase with {file_count} files and {dir_count} directories"
            }
        except Exception as e:
            return {
                "valid": False,
                "message": str(e)
            }
    
    def get_directory_structure(self, path: str, max_depth: int = 3) -> Dict[str, Any]:
        """Get the directory structure of a codebase.
        
        Args:
            path: Path to the codebase
            max_depth: Maximum depth to traverse
            
        Returns:
            Directory structure
        """
        try:
            # Normalize the path
            normalized_path = os.path.normpath(path)
            
            # Check if the path exists
            if not os.path.exists(normalized_path):
                raise FileNotFoundError(f"Path does not exist: {normalized_path}")
            
            # Check if the path is a directory
            if not os.path.isdir(normalized_path):
                raise NotADirectoryError(f"Path is not a directory: {normalized_path}")
            
            # Build the directory structure recursively
            def build_structure(current_path, current_depth):
                if current_depth > max_depth:
                    return {"name": os.path.basename(current_path), "type": "directory", "children": [{"name": "...", "type": "more"}]}
                
                result = {
                    "name": os.path.basename(current_path) or current_path,
                    "path": current_path,
                    "type": "directory",
                    "children": []
                }
                
                try:
                    for item in sorted(os.listdir(current_path)):
                        item_path = os.path.join(current_path, item)
                        
                        # Skip hidden files and directories
                        if item.startswith('.'):
                            continue
                        
                        if os.path.isdir(item_path):
                            result["children"].append(build_structure(item_path, current_depth + 1))
                        else:
                            result["children"].append({
                                "name": item,
                                "path": item_path,
                                "type": "file",
                                "extension": os.path.splitext(item)[1]
                            })
                except (PermissionError, OSError):
                    # Skip directories we can't access
                    result["children"].append({"name": "Permission denied", "type": "error"})
                
                return result
            
            return build_structure(normalized_path, 1)
        except Exception as e:
            raise e
