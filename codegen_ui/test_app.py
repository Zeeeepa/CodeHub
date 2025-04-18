#!/usr/bin/env python3
"""
Unit tests for the Codegen UI application.
"""

import unittest
import os
import sys
import tkinter as tk
from unittest.mock import MagicMock, patch

# Add the parent directory to the path so we can import the app module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the application
from codegen_ui.app import CodegenUI


class TestCodegenUI(unittest.TestCase):
    """Test cases for the CodegenUI class."""
    
    def setUp(self):
        """Set up the test environment."""
        # Create a mock for the Codebase class
        self.codebase_patcher = patch('codegen_ui.app.Codebase')
        self.mock_codebase = self.codebase_patcher.start()
        
        # Create a mock instance for the Codebase class
        self.mock_codebase_instance = MagicMock()
        self.mock_codebase.return_value = self.mock_codebase_instance
        
        # Create mock files, functions, and classes
        self.mock_file = MagicMock()
        self.mock_file.path = "test/file.py"
        self.mock_file.line_count = 100
        
        self.mock_function = MagicMock()
        self.mock_function.name = "test_function"
        self.mock_function.file = self.mock_file
        
        self.mock_class = MagicMock()
        self.mock_class.name = "TestClass"
        self.mock_class.file = self.mock_file
        
        # Set up the mock codebase instance
        self.mock_codebase_instance.files = [self.mock_file]
        self.mock_codebase_instance.functions = [self.mock_function]
        self.mock_codebase_instance.classes = [self.mock_class]
        self.mock_codebase_instance.get_file.return_value = self.mock_file
        
        # Create the application
        self.app = CodegenUI()
        
    def tearDown(self):
        """Clean up after the test."""
        self.codebase_patcher.stop()
        self.app.destroy()
    
    def test_browse_folder(self):
        """Test the browse folder functionality."""
        # Mock the filedialog.askdirectory function
        with patch('tkinter.filedialog.askdirectory', return_value="/test/path"):
            self.app._browse_folder()
            self.assertEqual(self.app.path_var.get(), "/test/path")
    
    def test_load_codebase(self):
        """Test loading a codebase."""
        # Set a path
        self.app.path_var.set("/test/path")
        
        # Mock os.path.isdir to return True
        with patch('os.path.isdir', return_value=True):
            # Mock threading.Thread to execute the target function immediately
            with patch('threading.Thread', side_effect=lambda target, args, daemon: target(*args)):
                self.app._load_codebase()
                
                # Check if the codebase was loaded
                self.mock_codebase.assert_called_once_with("/test/path")
                self.assertEqual(self.app.codebase, self.mock_codebase_instance)
                self.assertEqual(self.app.codebase_path, "/test/path")
    
    def test_analyze_and_execute_request_list_files(self):
        """Test analyzing and executing a request to list files."""
        # Set up the codebase
        self.app.codebase = self.mock_codebase_instance
        
        # Test the request
        result = self.app._analyze_and_execute_request("list files")
        
        # Check the result
        self.assertIn("Files in the codebase", result)
        self.assertIn("test/file.py", result)
    
    def test_analyze_and_execute_request_list_functions(self):
        """Test analyzing and executing a request to list functions."""
        # Set up the codebase
        self.app.codebase = self.mock_codebase_instance
        
        # Test the request
        result = self.app._analyze_and_execute_request("list functions")
        
        # Check the result
        self.assertIn("Functions in the codebase", result)
        self.assertIn("test_function", result)
    
    def test_analyze_and_execute_request_list_classes(self):
        """Test analyzing and executing a request to list classes."""
        # Set up the codebase
        self.app.codebase = self.mock_codebase_instance
        
        # Test the request
        result = self.app._analyze_and_execute_request("list classes")
        
        # Check the result
        self.assertIn("Classes in the codebase", result)
        self.assertIn("TestClass", result)
    
    def test_analyze_and_execute_request_search(self):
        """Test analyzing and executing a request to search for a term."""
        # Set up the codebase
        self.app.codebase = self.mock_codebase_instance
        
        # Test the request
        result = self.app._analyze_and_execute_request("search for test")
        
        # Check the result
        self.assertIn("Searching for 'test'", result)
        self.assertIn("test/file.py", result)
        self.assertIn("test_function", result)
        self.assertIn("TestClass", result)
    
    def test_analyze_and_execute_request_file_info(self):
        """Test analyzing and executing a request to get file info."""
        # Set up the codebase
        self.app.codebase = self.mock_codebase_instance
        
        # Test the request
        result = self.app._analyze_and_execute_request("file info for test/file.py")
        
        # Check the result
        self.assertIn("File: test/file.py", result)
        self.assertIn("Line count: 100", result)


if __name__ == "__main__":
    unittest.main()
