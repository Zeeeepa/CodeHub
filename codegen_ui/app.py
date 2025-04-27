#!/usr/bin/env python3
"""
Tkinter UI for interacting with the Codegen API.
"""

import os
import sys
import tkinter as tk
from tkinter import filedialog, scrolledtext, ttk, messagebox
import threading
import traceback

# Check if codegen is installed
try:
    from codegen import Codebase
except ImportError:
    from check_dependencies import check_codegen_installed
    if not check_codegen_installed():
        sys.exit(1)
    from codegen import Codebase


class CodegenUI(tk.Tk):
    """Main application window for Codegen UI."""

    def __init__(self):
        super().__init__()
        self.title("Codegen UI")
        self.geometry("1000x700")
        self.minsize(800, 600)
        
        self.codebase = None
        self.codebase_path = None
        
        self._create_widgets()
        self._create_layout()
        
    def _create_widgets(self):
        """Create all the widgets for the UI."""
        # Frame for codebase selection
        self.codebase_frame = ttk.LabelFrame(self, text="Codebase Selection")
        
        # Codebase path entry and browse button
        self.path_var = tk.StringVar()
        self.path_entry = ttk.Entry(self.codebase_frame, textvariable=self.path_var, width=50)
        self.browse_button = ttk.Button(self.codebase_frame, text="Browse", command=self._browse_folder)
        self.load_button = ttk.Button(self.codebase_frame, text="Load Codebase", command=self._load_codebase)
        
        # Frame for request input
        self.request_frame = ttk.LabelFrame(self, text="Request")
        
        # Request text area
        self.request_text = scrolledtext.ScrolledText(self.request_frame, wrap=tk.WORD, height=5)
        self.request_text.insert(tk.END, "Enter your request here...")
        self.request_text.bind("<FocusIn>", lambda event: self._clear_default_text())
        
        # Process button
        self.process_button = ttk.Button(self.request_frame, text="Process Request", command=self._process_request)
        
        # Frame for output
        self.output_frame = ttk.LabelFrame(self, text="Output")
        
        # Output text area
        self.output_text = scrolledtext.ScrolledText(self.output_frame, wrap=tk.WORD, height=20)
        self.output_text.config(state=tk.DISABLED)
        
        # Status bar
        self.status_var = tk.StringVar()
        self.status_var.set("Ready")
        self.status_bar = ttk.Label(self, textvariable=self.status_var, relief=tk.SUNKEN, anchor=tk.W)
        
    def _create_layout(self):
        """Create the layout for the UI."""
        # Codebase frame layout
        self.path_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=5, pady=5)
        self.browse_button.pack(side=tk.LEFT, padx=5, pady=5)
        self.load_button.pack(side=tk.LEFT, padx=5, pady=5)
        self.codebase_frame.pack(fill=tk.X, padx=10, pady=5)
        
        # Request frame layout
        self.request_text.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        self.process_button.pack(side=tk.RIGHT, padx=5, pady=5)
        self.request_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        # Output frame layout
        self.output_text.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        self.output_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        # Status bar layout
        self.status_bar.pack(side=tk.BOTTOM, fill=tk.X)
        
    def _browse_folder(self):
        """Open a file dialog to select a folder."""
        folder_path = filedialog.askdirectory(title="Select Codebase Folder")
        if folder_path:
            self.path_var.set(folder_path)
            
    def _load_codebase(self):
        """Load the codebase from the selected folder."""
        path = self.path_var.get()
        if not path:
            messagebox.showerror("Error", "Please select a folder first.")
            return
            
        if not os.path.isdir(path):
            messagebox.showerror("Error", "Selected path is not a directory.")
            return
            
        self.status_var.set("Loading codebase...")
        self.update_idletasks()
        
        # Run in a separate thread to avoid freezing the UI
        threading.Thread(target=self._load_codebase_thread, args=(path,), daemon=True).start()
        
    def _load_codebase_thread(self, path):
        """Thread function to load the codebase."""
        try:
            self.codebase = Codebase(path)
            self.codebase_path = path
            
            # Update UI in the main thread
            self.after(0, lambda: self._update_status(f"Codebase loaded: {path}"))
            self.after(0, lambda: self._append_output(f"Codebase loaded successfully.\n"))
            self.after(0, lambda: self._append_output(f"Files: {len(list(self.codebase.files))}\n"))
            
            # Get some basic stats about the codebase
            try:
                functions_count = len(list(self.codebase.functions))
                classes_count = len(list(self.codebase.classes))
                self.after(0, lambda: self._append_output(f"Functions: {functions_count}\n"))
                self.after(0, lambda: self._append_output(f"Classes: {classes_count}\n"))
            except Exception as e:
                self.after(0, lambda: self._append_output(f"Could not get detailed stats: {str(e)}\n"))
                
        except Exception as e:
            error_msg = f"Error loading codebase: {str(e)}\n{traceback.format_exc()}"
            self.after(0, lambda: self._update_status("Error loading codebase"))
            self.after(0, lambda: messagebox.showerror("Error", error_msg))
            
    def _clear_default_text(self):
        """Clear the default text in the request text area."""
        if self.request_text.get("1.0", tk.END).strip() == "Enter your request here...":
            self.request_text.delete("1.0", tk.END)
            
    def _process_request(self):
        """Process the user's request."""
        if not self.codebase:
            messagebox.showerror("Error", "Please load a codebase first.")
            return
            
        request = self.request_text.get("1.0", tk.END).strip()
        if not request or request == "Enter your request here...":
            messagebox.showerror("Error", "Please enter a request.")
            return
            
        self.status_var.set("Processing request...")
        self.update_idletasks()
        
        # Clear the output area
        self.output_text.config(state=tk.NORMAL)
        self.output_text.delete("1.0", tk.END)
        self.output_text.config(state=tk.DISABLED)
        
        # Run in a separate thread to avoid freezing the UI
        threading.Thread(target=self._process_request_thread, args=(request,), daemon=True).start()
        
    def _process_request_thread(self, request):
        """Thread function to process the request."""
        try:
            # Analyze the request and execute the appropriate actions
            result = self._analyze_and_execute_request(request)
            
            # Update UI in the main thread
            self.after(0, lambda: self._update_status("Request processed"))
            self.after(0, lambda: self._append_output(result))
            
        except Exception as e:
            error_msg = f"Error processing request: {str(e)}\n{traceback.format_exc()}"
            self.after(0, lambda: self._update_status("Error processing request"))
            self.after(0, lambda: self._append_output(f"ERROR: {error_msg}"))
            
    def _analyze_and_execute_request(self, request):
        """
        Analyze the request and execute the appropriate actions.
        
        This is where the main logic for interpreting natural language requests
        and mapping them to Codegen API operations happens.
        """
        request_lower = request.lower()
        result = ""
        
        # List files in the codebase
        if "list files" in request_lower or "show files" in request_lower:
            result += "Files in the codebase:\n\n"
            for i, file in enumerate(self.codebase.files, 1):
                result += f"{i}. {file.path}\n"
                
        # List functions in the codebase
        elif "list functions" in request_lower or "show functions" in request_lower:
            result += "Functions in the codebase:\n\n"
            for i, func in enumerate(self.codebase.functions, 1):
                result += f"{i}. {func.name} (in {func.file.path})\n"
                
        # List classes in the codebase
        elif "list classes" in request_lower or "show classes" in request_lower:
            result += "Classes in the codebase:\n\n"
            for i, cls in enumerate(self.codebase.classes, 1):
                result += f"{i}. {cls.name} (in {cls.file.path})\n"
                
        # Search for a specific term
        elif "search" in request_lower or "find" in request_lower:
            search_term = request.split("for ")[-1].split(" in")[0].strip()
            if not search_term:
                return "Please specify a search term."
                
            result += f"Searching for '{search_term}':\n\n"
            
            # Search in file paths
            result += "Files matching the search term:\n"
            matching_files = [file for file in self.codebase.files if search_term.lower() in file.path.lower()]
            for i, file in enumerate(matching_files, 1):
                result += f"{i}. {file.path}\n"
                
            # Search in function names
            result += "\nFunctions matching the search term:\n"
            matching_functions = [func for func in self.codebase.functions if search_term.lower() in func.name.lower()]
            for i, func in enumerate(matching_functions, 1):
                result += f"{i}. {func.name} (in {func.file.path})\n"
                
            # Search in class names
            result += "\nClasses matching the search term:\n"
            matching_classes = [cls for cls in self.codebase.classes if search_term.lower() in cls.name.lower()]
            for i, cls in enumerate(matching_classes, 1):
                result += f"{i}. {cls.name} (in {cls.file.path})\n"
                
        # Get information about a specific file
        elif "file info" in request_lower or "file details" in request_lower:
            file_path = request.split("for ")[-1].split(" in")[0].strip()
            if not file_path:
                return "Please specify a file path."
                
            try:
                file = self.codebase.get_file(file_path)
                result += f"File: {file.path}\n"
                result += f"Line count: {file.line_count}\n"
                result += f"Functions: {len(list(file.functions))}\n"
                result += f"Classes: {len(list(file.classes))}\n"
            except Exception as e:
                result += f"Error getting file info: {str(e)}"
                
        # Find unused functions (dead code)
        elif "unused functions" in request_lower or "dead code" in request_lower:
            result += "Searching for unused functions...\n\n"
            
            # This is a simplified approach - in a real implementation, you would
            # use more sophisticated analysis to find truly unused functions
            all_functions = list(self.codebase.functions)
            function_calls = []
            
            for func in all_functions:
                try:
                    for call in func.function_calls:
                        function_calls.append(call.function_definition.name if call.function_definition else call.name)
                except:
                    pass
                    
            unused_functions = [func for func in all_functions if func.name not in function_calls]
            
            for i, func in enumerate(unused_functions, 1):
                result += f"{i}. {func.name} (in {func.file.path})\n"
                
            if not unused_functions:
                result += "No unused functions found.\n"
                
        # Default response for unrecognized requests
        else:
            result += "I'm not sure how to process that request. Here are some examples of what you can ask:\n\n"
            result += "- List files in the codebase\n"
            result += "- List functions in the codebase\n"
            result += "- List classes in the codebase\n"
            result += "- Search for [term]\n"
            result += "- Get file info for [file_path]\n"
            result += "- Find unused functions\n"
            
        return result
        
    def _update_status(self, status):
        """Update the status bar."""
        self.status_var.set(status)
        
    def _append_output(self, text):
        """Append text to the output area."""
        self.output_text.config(state=tk.NORMAL)
        self.output_text.insert(tk.END, text)
        self.output_text.see(tk.END)
        self.output_text.config(state=tk.DISABLED)


if __name__ == "__main__":
    app = CodegenUI()
    app.mainloop()
