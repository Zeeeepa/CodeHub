#!/usr/bin/env python3
"""
Run script for the Codegen UI application.
"""

import sys
import os

# Add the parent directory to the path so we can import the app module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from codegen_ui.app import CodegenUI
from codegen_ui.check_dependencies import check_codegen_installed


def main():
    """Main entry point for the application."""
    # Check if the Codegen SDK is installed
    if not check_codegen_installed():
        sys.exit(1)
        
    # Start the application
    app = CodegenUI()
    app.mainloop()


if __name__ == "__main__":
    main()
