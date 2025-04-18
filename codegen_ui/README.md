# Codegen UI

A simple tkinter-based UI for interacting with the Codegen API.

## Features

- Select a local folder to use as a codebase
- Input natural language requests
- Execute operations on the codebase using the Codegen API
- View the results in a simple UI

## Installation

### Prerequisites

- Python 3.8 or higher
- Codegen SDK (`pip install codegen`)

### Install from source

```bash
# Clone the repository
git clone https://github.com/Zeeeepa/CodeHub.git
cd CodeHub/codegen_ui

# Install the package
pip install -e .
```

### Install from PyPI

```bash
pip install codegen-ui
```

## Usage

### Running the UI

```bash
# Run the UI
python -m codegen_ui.run
```

Or if you installed the package:

```bash
codegen-ui
```

### Using the UI

1. Click the "Browse" button to select a folder to use as a codebase
2. Click the "Load Codebase" button to load the codebase
3. Enter a request in the text area
4. Click the "Process Request" button to execute the request
5. View the results in the output area

### Example Requests

- "List files in the codebase"
- "List functions in the codebase"
- "List classes in the codebase"
- "Search for [term]"
- "Get file info for [file_path]"
- "Find unused functions"

## Programmatic Usage

You can also use the Codegen API programmatically:

```python
from codegen import Codebase

# Initialize the codebase
codebase = Codebase("/path/to/codebase")

# Get all files in the codebase
files = list(codebase.files)
print(f"Files: {len(files)}")

# Get all functions in the codebase
functions = list(codebase.functions)
print(f"Functions: {len(functions)}")

# Get all classes in the codebase
classes = list(codebase.classes)
print(f"Classes: {len(classes)}")

# Search for a specific term
search_term = "main"
matching_files = [file for file in files if search_term.lower() in file.path.lower()]
print(f"Files matching '{search_term}': {len(matching_files)}")
```

See the `example.py` file for a more complete example.

## Development

### Running Tests

```bash
# Run the tests
python -m unittest discover -s codegen_ui
```

### Building the Package

```bash
# Build the package
python setup.py sdist bdist_wheel
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
