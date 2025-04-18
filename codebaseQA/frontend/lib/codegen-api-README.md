# Codegen API Integration

This module provides a comprehensive set of functions for interacting with the Codegen API to perform advanced code manipulation operations.

## Features

### Codebase Operations
- **Initialization**: Create and configure a Codebase instance
- **File Operations**: List, get, create, check, and rename files
- **Directory Operations**: List, create, check, and get directories
- **Symbol Operations**: Get, check, list, rename, move, and remove symbols
- **Function Operations**: Analyze and modify function signatures, parameters, return types, and more
- **Class Operations**: Analyze and modify class methods, properties, attributes, and inheritance
- **Import Operations**: Get, update, remove, and rename imports
- **AI Operations**: Use AI to generate and modify code
- **Git Operations**: Commit, push, branch, and manage repository state

### Editing Tools
- **Semantic Editing**: Make high-level semantic changes to code
- **Pattern Replacement**: Apply regex-based replacements across multiple files
- **Relace Editing**: Apply precise edits with context-aware merging

### Analysis Tools
- **Code Analysis**: Find function calls, create call graphs, detect dead code
- **Codebase Analysis**: Get summaries of codebase, files, classes, and functions

### Search Tools
- **Ripgrep Search**: Search code using ripgrep or regex patterns
- **File Name Search**: Find files by name patterns
- **Semantic Search**: Search code semantically using embeddings

### File Tools
- **View File**: Get file content
- **Edit File**: Make changes to files
- **Create File**: Create new files
- **Delete File**: Remove files
- **Rename File**: Rename files and update references

## Usage

### Basic Initialization

```typescript
import { CodegenAPI } from './codegen-api';

// Initialize the Codegen API
const codebase = new CodegenAPI('your-api-key', 'path/to/repo');
```

### File Operations

```typescript
// List all TypeScript files
const tsFiles = await codebase.files({ extensions: ['.ts'] });

// Get a specific file
const file = await codebase.getFile('src/main.ts');

// Create a new file
await codebase.createFile('src/new-file.ts', 'export const greeting = "Hello, World!";');
```

### Symbol Operations

```typescript
// Get all functions
const functions = await codebase.functions();

// Rename a symbol
await codebase.renameSymbol('oldFunctionName', 'newFunctionName');

// Move a symbol to a different file
await codebase.moveSymbolToFile(
  'MyComponent', 
  'src/components/MyComponent.tsx', 
  { include_dependencies: true }
);
```

### Function Operations

```typescript
// Get function return type
const returnType = await codebase.getFunctionReturnType('fetchData');

// Add a parameter to a function
await codebase.addFunctionParameter('processData', 'options', 'ProcessOptions');

// Generate function docstring
const docstring = await codebase.generateFunctionDocstring('processData');
```

### Class Operations

```typescript
// Get class methods
const methods = await codebase.getClassMethods('UserService');

// Add a method to a class
await codebase.addClassMethod(
  'UserService', 
  'async deleteUser(id: string): Promise<boolean> { /* implementation */ }'
);
```

### AI Operations

```typescript
// Use AI to generate code
const result = await codebase.ai(
  'Create a function that calculates the factorial of a number',
  { target: 'src/utils/math.ts' }
);
```

### Editing Tools

```typescript
import { semanticEdit, globalReplacementEdit, relaceEdit } from './codegen-api';

// Semantic edit
await semanticEdit(
  codebase,
  'src/components/Button.tsx',
  'Add a disabled prop to the Button component',
  { component_type: 'React.FC' }
);

// Global replacement edit
await globalReplacementEdit(
  codebase,
  'console.log\\(([^)]*)\\)',
  'logger.debug($1)',
  '.ts'
);
```

### Analysis Tools

```typescript
import { findDeadCode, createCallGraph } from './codegen-api';

// Find dead code
const deadCode = await findDeadCode(codebase);

// Create call graph
const callGraph = await createCallGraph(
  codebase,
  'main',
  'processData',
  5
);
```

### Search Tools

```typescript
import { ripgrepSearch, searchFilesByName, semanticSearch } from './codegen-api';

// Ripgrep search
const ripgrepResults = await ripgrepSearch(
  apiKey,
  {
    query: 'function process',
    fileExtensions: ['.ts', '.tsx']
  }
);
```

## Complete Example

See the `codegen-api-usage.ts` file for comprehensive examples of all available functions.

## API Reference

For detailed API documentation, see the TypeScript interfaces and function signatures in the `codegen-api.ts` file.
