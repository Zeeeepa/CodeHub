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
from codegen.search import search_code, semantic_search
from codegen.refactoring import extract_function, refactor_code
from codegen.documentation import generate_documentation
from codegen.imports import find_unused_imports, remove_unused_imports
from codegen.formatting import format_code
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, List, Tuple, Any
from codegen import Codebase
from codegen.sdk.core.statements.for_loop_statement import ForLoopStatement
from codegen.sdk.core.statements.if_block_statement import IfBlockStatement
from codegen.sdk.core.statements.try_catch_statement import TryCatchStatement
from codegen.sdk.core.statements.while_statement import WhileStatement
from codegen.sdk.core.expressions.binary_expression import BinaryExpression
from codegen.sdk.core.expressions.unary_expression import UnaryExpression
from codegen.sdk.core.expressions.comparison_expression import ComparisonExpression
import math
import re
import requests
from datetime import datetime, timedelta
import subprocess
import os
import tempfile
from fastapi.middleware.cors import CORSMiddleware
import modal

image = (
    modal.Image.debian_slim()
    .apt_install("git")
    .pip_install(
        "codegen", "fastapi", "uvicorn", "gitpython", "requests", "pydantic", "datetime"
    )
)

app = modal.App(name="analytics-app", image=image)

fastapi_app = FastAPI()

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_monthly_commits(repo_path: str) -> Dict[str, int]:
    """
    Get the number of commits per month for the last 12 months.

    Args:
        repo_path: Path to the git repository

    Returns:
        Dictionary with month-year as key and number of commits as value
    """
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)

    date_format = "%Y-%m-%d"
    since_date = start_date.strftime(date_format)
    until_date = end_date.strftime(date_format)
    repo_path = "https://github.com/" + repo_path

    try:
        original_dir = os.getcwd()

        with tempfile.TemporaryDirectory() as temp_dir:
            subprocess.run(["git", "clone", repo_path, temp_dir], check=True)
            os.chdir(temp_dir)

            cmd = [
                "git",
                "log",
                f"--since={since_date}",
                f"--until={until_date}",
                "--format=%aI",
            ]

            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            commit_dates = result.stdout.strip().split("\n")

            monthly_counts = {}
            current_date = start_date
            while current_date <= end_date:
                month_key = current_date.strftime("%Y-%m")
                monthly_counts[month_key] = 0
                current_date = (
                    current_date.replace(day=1) + timedelta(days=32)
                ).replace(day=1)

            for date_str in commit_dates:
                if date_str:  # Skip empty lines
                    commit_date = datetime.fromisoformat(date_str.strip())
                    month_key = commit_date.strftime("%Y-%m")
                    if month_key in monthly_counts:
                        monthly_counts[month_key] += 1

            os.chdir(original_dir)
            return dict(sorted(monthly_counts.items()))

    except subprocess.CalledProcessError as e:
        print(f"Error executing git command: {e}")
        return {}
    except Exception as e:
        print(f"Error processing git commits: {e}")
        return {}
    finally:
        try:
            os.chdir(original_dir)
        except:
            pass


def calculate_cyclomatic_complexity(function):
    def analyze_statement(statement):
        complexity = 0

        if isinstance(statement, IfBlockStatement):
            complexity += 1
            if hasattr(statement, "elif_statements"):
                complexity += len(statement.elif_statements)

        elif isinstance(statement, (ForLoopStatement, WhileStatement)):
            complexity += 1

        elif isinstance(statement, TryCatchStatement):
            complexity += len(getattr(statement, "except_blocks", []))

        if hasattr(statement, "condition") and isinstance(statement.condition, str):
            complexity += statement.condition.count(
                " and "
            ) + statement.condition.count(" or ")

        if hasattr(statement, "nested_code_blocks"):
            for block in statement.nested_code_blocks:
                complexity += analyze_block(block)

        return complexity

    def analyze_block(block):
        if not block or not hasattr(block, "statements"):
            return 0
        return sum(analyze_statement(stmt) for stmt in block.statements)

    return (
        1 + analyze_block(function.code_block) if hasattr(function, "code_block") else 1
    )


def cc_rank(complexity):
    if complexity < 0:
        raise ValueError("Complexity must be a non-negative value")

    ranks = [
        (1, 5, "A"),
        (6, 10, "B"),
        (11, 20, "C"),
        (21, 30, "D"),
        (31, 40, "E"),
        (41, float("inf"), "F"),
    ]
    for low, high, rank in ranks:
        if low <= complexity <= high:
            return rank
    return "F"


def calculate_doi(cls):
    """Calculate the depth of inheritance for a given class."""
    return len(cls.superclasses)


def get_operators_and_operands(function):
    operators = []
    operands = []

    for statement in function.code_block.statements:
        for call in statement.function_calls:
            operators.append(call.name)
            for arg in call.args:
                operands.append(arg.source)

        if hasattr(statement, "expressions"):
            for expr in statement.expressions:
                if isinstance(expr, BinaryExpression):
                    operators.extend([op.source for op in expr.operators])
                    operands.extend([elem.source for elem in expr.elements])
                elif isinstance(expr, UnaryExpression):
                    operators.append(expr.ts_node.type)
                    operands.append(expr.argument.source)
                elif isinstance(expr, ComparisonExpression):
                    operators.extend([op.source for op in expr.operators])
                    operands.extend([elem.source for elem in expr.elements])

        if hasattr(statement, "expression"):
            expr = statement.expression
            if isinstance(expr, BinaryExpression):
                operators.extend([op.source for op in expr.operators])
                operands.extend([elem.source for elem in expr.elements])
            elif isinstance(expr, UnaryExpression):
                operators.append(expr.ts_node.type)
                operands.append(expr.argument.source)
            elif isinstance(expr, ComparisonExpression):
                operators.extend([op.source for op in expr.operators])
                operands.extend([elem.source for elem in expr.elements])

    return operators, operands


def calculate_halstead_volume(operators, operands):
    n1 = len(set(operators))
    n2 = len(set(operands))

    N1 = len(operators)
    N2 = len(operands)

    N = N1 + N2
    n = n1 + n2

    if n > 0:
        volume = N * math.log2(n)
        return volume, N1, N2, n1, n2
    return 0, N1, N2, n1, n2


def count_lines(source: str):
    """Count different types of lines in source code."""
    if not source.strip():
        return 0, 0, 0, 0

    lines = [line.strip() for line in source.splitlines()]
    loc = len(lines)
    sloc = len([line for line in lines if line])

    in_multiline = False
    comments = 0
    code_lines = []

    i = 0
    while i < len(lines):
        line = lines[i]
        code_part = line
        if not in_multiline and "#" in line:
            comment_start = line.find("#")
            if not re.search(r'["\'].*#.*["\']', line[:comment_start]):
                code_part = line[:comment_start].strip()
                if line[comment_start:].strip():
                    comments += 1

        if ('"""' in line or "'''" in line) and not (
            line.count('"""') % 2 == 0 or line.count("'''") % 2 == 0
        ):
            if in_multiline:
                in_multiline = False
                comments += 1
            else:
                in_multiline = True
                comments += 1
                if line.strip().startswith('"""') or line.strip().startswith("'''"):
                    code_part = ""
        elif in_multiline:
            comments += 1
            code_part = ""
        elif line.strip().startswith("#"):
            comments += 1
            code_part = ""

        if code_part.strip():
            code_lines.append(code_part)

        i += 1

    lloc = 0
    continued_line = False
    for line in code_lines:
        if continued_line:
            if not any(line.rstrip().endswith(c) for c in ("\\", ",", "{", "[", "(")):
                continued_line = False
            continue

        lloc += len([stmt for stmt in line.split(";") if stmt.strip()])

        if any(line.rstrip().endswith(c) for c in ("\\", ",", "{", "[", "(")):
            continued_line = True

    return loc, lloc, sloc, comments


def calculate_maintainability_index(
    halstead_volume: float, cyclomatic_complexity: float, loc: int
) -> int:
    """Calculate the normalized maintainability index for a given function."""
    if loc <= 0:
        return 100

    try:
        raw_mi = (
            171
            - 5.2 * math.log(max(1, halstead_volume))
            - 0.23 * cyclomatic_complexity
            - 16.2 * math.log(max(1, loc))
        )
        normalized_mi = max(0, min(100, raw_mi * 100 / 171))
        return int(normalized_mi)
    except (ValueError, TypeError):
        return 0


def get_maintainability_rank(mi_score: float) -> str:
    """Convert maintainability index score to a letter grade."""
    if mi_score >= 85:
        return "A"
    elif mi_score >= 65:
        return "B"
    elif mi_score >= 45:
        return "C"
    elif mi_score >= 25:
        return "D"
    else:
        return "F"


def get_github_repo_description(repo_url):
    api_url = f"https://api.github.com/repos/{repo_url}"

    response = requests.get(api_url)

    if response.status_code == 200:
        repo_data = response.json()
        return repo_data.get("description", "No description available")
    else:
        return ""


class RepoRequest(BaseModel):
    repo_url: str


@fastapi_app.post("/analyze_repo")
async def analyze_repo(request: RepoRequest) -> Dict[str, Any]:
    """Analyze a repository and return comprehensive metrics."""
    repo_url = request.repo_url
    codebase = Codebase.from_repo(repo_url)

    num_files = len(codebase.files(extensions="*"))
    num_functions = len(codebase.functions)
    num_classes = len(codebase.classes)

    total_loc = total_lloc = total_sloc = total_comments = 0
    total_complexity = 0
    total_volume = 0
    total_mi = 0
    total_doi = 0

    monthly_commits = get_monthly_commits(repo_url)
    print(monthly_commits)

    for file in codebase.files:
        loc, lloc, sloc, comments = count_lines(file.source)
        total_loc += loc
        total_lloc += lloc
        total_sloc += sloc
        total_comments += comments

    callables = codebase.functions + [m for c in codebase.classes for m in c.methods]

    num_callables = 0
    for func in callables:
        if not hasattr(func, "code_block"):
            continue

        complexity = calculate_cyclomatic_complexity(func)
        operators, operands = get_operators_and_operands(func)
        volume, _, _, _, _ = calculate_halstead_volume(operators, operands)
        loc = len(func.code_block.source.splitlines())
        mi_score = calculate_maintainability_index(volume, complexity, loc)

        total_complexity += complexity
        total_volume += volume
        total_mi += mi_score
        num_callables += 1

    for cls in codebase.classes:
        doi = calculate_doi(cls)
        total_doi += doi

    desc = get_github_repo_description(repo_url)

    results = {
        "repo_url": repo_url,
        "line_metrics": {
            "total": {
                "loc": total_loc,
                "lloc": total_lloc,
                "sloc": total_sloc,
                "comments": total_comments,
                "comment_density": (total_comments / total_loc * 100)
                if total_loc > 0
                else 0,
            },
        },
        "cyclomatic_complexity": {
            "average": total_complexity if num_callables > 0 else 0,
        },
        "depth_of_inheritance": {
            "average": total_doi / len(codebase.classes) if codebase.classes else 0,
        },
        "halstead_metrics": {
            "total_volume": int(total_volume),
            "average_volume": int(total_volume / num_callables)
            if num_callables > 0
            else 0,
        },
        "maintainability_index": {
            "average": int(total_mi / num_callables) if num_callables > 0 else 0,
        },
        "description": desc,
        "num_files": num_files,
        "num_functions": num_functions,
        "num_classes": num_classes,
        "monthly_commits": monthly_commits,
    }

    return results



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
        for cls in codebase.classes:
            class_info = {
                "name": cls.name,
                "file": cls.file.path,
                "method_count": len([m for m in cls.methods]) if hasattr(cls, "methods") else 0
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
        new_file = create_file(codebase, file_path, content)
        
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
    
    def search_code(self, codebase_path: str, query: str) -> Dict[str, Any]:
        """Search for code in the codebase.
        
        Args:
            codebase_path: Path to the codebase
            query: Search query
            
        Returns:
            Search results
        """
        codebase = self.get_or_create_codebase(codebase_path)
        
        # Search for code
        results = search_code(codebase, query)
        
        # Format results
        formatted_results = []
        for result in results:
            formatted_result = {
                "file": result.file.path,
                "line": result.line,
                "content": result.content,
                "score": result.score
            }
            formatted_results.append(formatted_result)
        
        return {
            "query": query,
            "results": formatted_results
        }
    
    def semantic_search(self, codebase_path: str, query: str) -> Dict[str, Any]:
        """Perform a semantic search in the codebase.
        
        Args:
            codebase_path: Path to the codebase
            query: Search query
            
        Returns:
            Search results
        """
        codebase = self.get_or_create_codebase(codebase_path)
        
        # Perform semantic search
        results = semantic_search(codebase, query)
        
        # Format results
        formatted_results = []
        for result in results:
            formatted_result = {
                "file": result.file.path,
                "line": result.line,
                "content": result.content,
                "score": result.score
            }
            formatted_results.append(formatted_result)
        
        return {
            "query": query,
            "results": formatted_results
        }
    
    def get_all_files(self, codebase_path: str) -> Dict[str, Any]:
        """Get all files in the codebase.
        
        Args:
            codebase_path: Path to the codebase
            
        Returns:
            List of files
        """
        codebase = self.get_or_create_codebase(codebase_path)
        
        # Get all files
        files = []
        for file in codebase.files:
            file_info = {
                "path": file.path,
                "size": os.path.getsize(file.path) if os.path.exists(file.path) else 0,
                "language": file.language.name if hasattr(file, "language") else None
            }
            files.append(file_info)
        
        return {
            "files": files,
            "count": len(files)
        }
    
    def get_all_functions(self, codebase_path: str) -> Dict[str, Any]:
        """Get all functions in the codebase.
        
        Args:
            codebase_path: Path to the codebase
            
        Returns:
            List of functions
        """
        codebase = self.get_or_create_codebase(codebase_path)
        
        # Get all functions
        functions = []
        for function in codebase.functions:
            function_info = {
                "name": function.name,
                "file": function.file.path,
                "line": function.start_line,
                "parameters": [param.name for param in function.parameters] if hasattr(function, "parameters") else []
            }
            functions.append(function_info)
        
        return {
            "functions": functions,
            "count": len(functions)
        }
    
    def get_all_classes(self, codebase_path: str) -> Dict[str, Any]:
        """Get all classes in the codebase.
        
        Args:
            codebase_path: Path to the codebase
            
        Returns:
            List of classes
        """
        codebase = self.get_or_create_codebase(codebase_path)
        
        # Get all classes
        classes = []
        for cls in codebase.classes:
            class_info = {
                "name": cls.name,
                "file": cls.file.path,
                "line": cls.start_line,
                "methods": [method.name for method in cls.methods] if hasattr(cls, "methods") else []
            }
            classes.append(class_info)
        
        return {
            "classes": classes,
            "count": len(classes)
        }
    
    def get_file_content(self, codebase_path: str, file_path: str) -> Dict[str, Any]:
        """Get the content of a file.
        
        Args:
            codebase_path: Path to the codebase
            file_path: Path to the file
            
        Returns:
            File content
        """
        codebase = self.get_or_create_codebase(codebase_path)
        
        # Get the file
        file = codebase.get_file(file_path)
        
        # Get the content
        content = file.content
        
        return {
            "file": file_path,
            "content": content,
            "language": file.language.name if hasattr(file, "language") else None
        }
    
    def extract_function(self, codebase_path: str, file_path: str, edit_description: str) -> Dict[str, Any]:
        """Extract a function from a file.
        
        Args:
            codebase_path: Path to the codebase
            file_path: Path to the file
            edit_description: Description of the extraction
            
        Returns:
            Result of the operation
        """
        codebase = self.get_or_create_codebase(codebase_path)
        
        # Get the file
        file = codebase.get_file(file_path)
        
        # Extract the function
        result = extract_function(file, edit_description)
        
        return {
            "success": result.success,
            "message": result.message,
            "operation": "extract_function",
            "file_path": file_path,
            "edit_description": edit_description
        }
    
    def refactor_code(self, codebase_path: str, file_path: str, edit_description: str) -> Dict[str, Any]:
        """Refactor code in a file.
        
        Args:
            codebase_path: Path to the codebase
            file_path: Path to the file
            edit_description: Description of the refactoring
            
        Returns:
            Result of the operation
        """
        codebase = self.get_or_create_codebase(codebase_path)
        
        # Get the file
        file = codebase.get_file(file_path)
        
        # Refactor the code
        result = refactor_code(file, edit_description)
        
        return {
            "success": result.success,
            "message": result.message,
            "operation": "refactor_code",
            "file_path": file_path,
            "edit_description": edit_description
        }
    
    def generate_documentation(self, codebase_path: str, symbol_name: str) -> Dict[str, Any]:
        """Generate documentation for a symbol.
        
        Args:
            codebase_path: Path to the codebase
            symbol_name: Name of the symbol
            
        Returns:
            Generated documentation
        """
        codebase = self.get_or_create_codebase(codebase_path)
        
        # Get the symbol
        symbol = codebase.get_symbol(symbol_name)
        
        # Generate documentation
        documentation = generate_documentation(symbol)
        
        return {
            "symbol": symbol_name,
            "documentation": documentation,
            "operation": "generate_documentation"
        }
    
    def add_parameter(self, codebase_path: str, function_name: str, parameter_name: str, parameter_type: str = None) -> Dict[str, Any]:
        """Add a parameter to a function.
        
        Args:
            codebase_path: Path to the codebase
            function_name: Name of the function
            parameter_name: Name of the parameter to add
            parameter_type: Type of the parameter
            
        Returns:
            Result of the operation
        """
        codebase = self.get_or_create_codebase(codebase_path)
        
        # Get the function
        function = codebase.get_symbol(function_name)
        
        # Add the parameter
        function.add_parameter(parameter_name, parameter_type)
        
        return {
            "success": True,
            "message": f"Successfully added parameter {parameter_name} to {function_name}",
            "operation": "add_parameter",
            "function_name": function_name,
            "parameter_name": parameter_name,
            "parameter_type": parameter_type
        }
    
    def remove_parameter(self, codebase_path: str, function_name: str, parameter_name: str) -> Dict[str, Any]:
        """Remove a parameter from a function.
        
        Args:
            codebase_path: Path to the codebase
            function_name: Name of the function
            parameter_name: Name of the parameter to remove
            
        Returns:
            Result of the operation
        """
        codebase = self.get_or_create_codebase(codebase_path)
        
        # Get the function
        function = codebase.get_symbol(function_name)
        
        # Remove the parameter
        function.remove_parameter(parameter_name)
        
        return {
            "success": True,
            "message": f"Successfully removed parameter {parameter_name} from {function_name}",
            "operation": "remove_parameter",
            "function_name": function_name,
            "parameter_name": parameter_name
        }
    
    def change_return_type(self, codebase_path: str, function_name: str, return_type: str) -> Dict[str, Any]:
        """Change the return type of a function.
        
        Args:
            codebase_path: Path to the codebase
            function_name: Name of the function
            return_type: New return type
            
        Returns:
            Result of the operation
        """
        codebase = self.get_or_create_codebase(codebase_path)
        
        # Get the function
        function = codebase.get_symbol(function_name)
        
        # Change the return type
        function.set_return_type(return_type)
        
        return {
            "success": True,
            "message": f"Successfully changed return type of {function_name} to {return_type}",
            "operation": "change_return_type",
            "function_name": function_name,
            "return_type": return_type
        }
    
    def find_unused_imports(self, codebase_path: str) -> Dict[str, Any]:
        """Find unused imports in the codebase.
        
        Args:
            codebase_path: Path to the codebase
            
        Returns:
            List of unused imports
        """
        codebase = self.get_or_create_codebase(codebase_path)
        
        # Find unused imports
        unused_imports = find_unused_imports(codebase)
        
        # Format results
        formatted_results = []
        for unused_import in unused_imports:
            formatted_result = {
                "file": unused_import.file.path,
                "import": unused_import.source,
                "symbols": unused_import.symbols if hasattr(unused_import, "symbols") else []
            }
            formatted_results.append(formatted_result)
        
        return {
            "unused_imports": formatted_results,
            "count": len(formatted_results)
        }
    
    def remove_unused_imports(self, codebase_path: str) -> Dict[str, Any]:
        """Remove unused imports from the codebase.
        
        Args:
            codebase_path: Path to the codebase
            
        Returns:
            Result of the operation
        """
        codebase = self.get_or_create_codebase(codebase_path)
        
        # Remove unused imports
        result = remove_unused_imports(codebase)
        
        return {
            "success": True,
            "message": f"Successfully removed {result.count} unused imports",
            "operation": "remove_unused_imports",
            "count": result.count,
            "files_affected": result.files_affected
        }
    
    def format_code(self, codebase_path: str, file_path: str) -> Dict[str, Any]:
        """Format code in a file.
        
        Args:
            codebase_path: Path to the codebase
            file_path: Path to the file
            
        Returns:
            Result of the operation
        """
        codebase = self.get_or_create_codebase(codebase_path)
        
        # Get the file
        file = codebase.get_file(file_path)
        
        # Format the code
        result = format_code(file)
        
        return {
            "success": result.success,
            "message": result.message,
            "operation": "format_code",
            "file_path": file_path
        }



@app.function(image=image)
@modal.asgi_app()
def fastapi_modal_app():
    return fastapi_app


if __name__ == "__main__":
    app.deploy("analytics-app")
