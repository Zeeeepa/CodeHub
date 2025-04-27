#!/usr/bin/env python3
"""
Setup script for the Codegen UI application.
"""

from setuptools import setup, find_packages

setup(
    name="codegen_ui",
    version="0.1.0",
    description="A tkinter UI for interacting with the Codegen API",
    author="Codegen",
    author_email="info@codegen.sh",
    packages=find_packages(),
    install_requires=[
        "codegen>=0.22.1",
    ],
    entry_points={
        "console_scripts": [
            "codegen-ui=codegen_ui.run:main",
        ],
    },
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
    ],
    python_requires=">=3.8",
)
