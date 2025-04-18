#!/usr/bin/env python3
"""
Check if the required dependencies are installed.
"""

import importlib.util
import subprocess
import sys


def check_codegen_installed():
    """Check if the Codegen SDK is installed."""
    spec = importlib.util.find_spec("codegen")
    if spec is None:
        print("Codegen SDK is not installed.")
        install = input("Do you want to install it now? (y/n): ")
        if install.lower() == "y":
            try:
                subprocess.check_call([sys.executable, "-m", "pip", "install", "codegen"])
                print("Codegen SDK installed successfully.")
                return True
            except subprocess.CalledProcessError:
                print("Failed to install Codegen SDK. Please install it manually.")
                return False
        else:
            print("Please install Codegen SDK manually.")
            return False
    return True


if __name__ == "__main__":
    if check_codegen_installed():
        print("All dependencies are installed.")
    else:
        print("Missing dependencies. Please install them before running the application.")
        sys.exit(1)
