/**
 * Codegen API Usage Examples
 * 
 * This file provides examples of how to use the Codegen API functions
 * for various code manipulation operations.
 */

import { 
  CodegenAPI, 
  semanticEdit, 
  globalReplacementEdit, 
  relaceEdit,
  findDeadCode,
  createCallGraph,
  ripgrepSearch,
  searchFilesByName,
  semanticSearch,
  viewFile,
  editFile,
  createFile,
  deleteFile,
  renameFile
} from './codegen-api';

// Example: Initialize the Codegen API
export async function initializeCodegenAPI(apiKey: string, repoPath: string) {
  const codebase = new CodegenAPI(apiKey, repoPath);
  return codebase;
}

// Example: File Operations
export async function fileOperationsExample(codebase: CodegenAPI) {
  // List all files with .ts extension
  const tsFiles = await codebase.files({ extensions: ['.ts'] });
  console.log('TypeScript files:', tsFiles);

  // Get a specific file
  const file = await codebase.getFile('src/main.ts');
  console.log('File content:', file);

  // Check if a file exists
  const fileExists = await codebase.hasFile('src/utils.ts');
  console.log('File exists:', fileExists);

  // Create a new file
  await codebase.createFile('src/new-file.ts', 'export const greeting = "Hello, World!";');

  // Rename a file
  await codebase.renameFile('src/old-name.ts', 'src/new-name.ts');
}

// Example: Directory Operations
export async function directoryOperationsExample(codebase: CodegenAPI) {
  // List all directories
  const dirs = await codebase.directories();
  console.log('Directories:', dirs);

  // Create a new directory
  await codebase.createDirectory('src/new-directory', { parents: true });

  // Check if a directory exists
  const dirExists = await codebase.hasDirectory('src/components');
  console.log('Directory exists:', dirExists);

  // Get a directory
  const dir = await codebase.getDirectory('src/utils');
  console.log('Directory:', dir);
}

// Example: Symbol Operations
export async function symbolOperationsExample(codebase: CodegenAPI) {
  // Get all symbols
  const allSymbols = await codebase.symbols();
  console.log('All symbols:', allSymbols);

  // Get all functions
  const functions = await codebase.functions();
  console.log('Functions:', functions);

  // Get all classes
  const classes = await codebase.classes();
  console.log('Classes:', classes);

  // Get a specific symbol
  const symbol = await codebase.getSymbol('MyComponent');
  console.log('Symbol:', symbol);

  // Check if a symbol exists
  const symbolExists = await codebase.hasSymbol('fetchData');
  console.log('Symbol exists:', symbolExists);

  // Rename a symbol
  await codebase.renameSymbol('oldFunctionName', 'newFunctionName');

  // Move a symbol to a different file
  await codebase.moveSymbolToFile(
    'MyComponent', 
    'src/components/MyComponent.tsx', 
    { include_dependencies: true }
  );

  // Remove a symbol
  await codebase.removeSymbol('unusedFunction');
}

// Example: Function Operations
export async function functionOperationsExample(codebase: CodegenAPI) {
  // Get function return type
  const returnType = await codebase.getFunctionReturnType('fetchData');
  console.log('Return type:', returnType);

  // Get function parameters
  const params = await codebase.getFunctionParameters('processData');
  console.log('Parameters:', params);

  // Check if a function is async
  const isAsync = await codebase.isFunctionAsync('fetchData');
  console.log('Is async:', isAsync);

  // Get function decorators
  const decorators = await codebase.getFunctionDecorators('Controller');
  console.log('Decorators:', decorators);

  // Set function return type
  await codebase.setFunctionReturnType('processData', 'Promise<ProcessedData>');

  // Add a parameter to a function
  await codebase.addFunctionParameter('processData', 'options', 'ProcessOptions');

  // Remove a parameter from a function
  await codebase.removeFunctionParameter('processData', 'unused');

  // Add a decorator to a function
  await codebase.addFunctionDecorator('processData', '@Deprecated');

  // Set function docstring
  await codebase.setFunctionDocstring(
    'processData', 
    '/**\n * Processes the input data and returns processed results\n * @param data - The input data to process\n * @returns Processed data object\n */'
  );

  // Generate function docstring
  const docstring = await codebase.generateFunctionDocstring('processData');
  console.log('Generated docstring:', docstring);

  // Rename a local variable in a function
  await codebase.renameFunctionLocalVariable('processData', 'temp', 'tempResult');

  // Get function call sites
  const callSites = await codebase.getFunctionCallSites('processData');
  console.log('Call sites:', callSites);

  // Get function dependencies
  const dependencies = await codebase.getFunctionDependencies('processData');
  console.log('Dependencies:', dependencies);
}

// Example: Class Operations
export async function classOperationsExample(codebase: CodegenAPI) {
  // Get class methods
  const methods = await codebase.getClassMethods('UserService');
  console.log('Methods:', methods);

  // Get class properties
  const properties = await codebase.getClassProperties('UserService');
  console.log('Properties:', properties);

  // Get class attributes
  const attributes = await codebase.getClassAttributes('UserService');
  console.log('Attributes:', attributes);

  // Check if a class is abstract
  const isAbstract = await codebase.isClassAbstract('BaseService');
  console.log('Is abstract:', isAbstract);

  // Get parent class names
  const parents = await codebase.getClassParentClassNames('UserService');
  console.log('Parent classes:', parents);

  // Check if a class is a subclass of another
  const isSubclass = await codebase.isClassSubclassOf('UserService', 'BaseService');
  console.log('Is subclass:', isSubclass);

  // Add a method to a class
  await codebase.addClassMethod(
    'UserService', 
    'async deleteUser(id: string): Promise<boolean> { /* implementation */ }'
  );

  // Remove a method from a class
  await codebase.removeClassMethod('UserService', 'unusedMethod');

  // Add an attribute to a class
  await codebase.addClassAttribute(
    'UserService', 
    'maxUsers', 
    'number', 
    100
  );

  // Remove an attribute from a class
  await codebase.removeClassAttribute('UserService', 'unusedAttribute');

  // Convert a class to a protocol
  await codebase.convertClassToProtocol('UserService');

  // Get class decorators
  const decorators = await codebase.getClassDecorators('UserService');
  console.log('Decorators:', decorators);
}

// Example: Import Operations
export async function importOperationsExample(codebase: CodegenAPI) {
  // Get import source
  const source = await codebase.getImportSource('React');
  console.log('Import source:', source);

  // Update import source
  await codebase.updateImportSource('React', 'react');

  // Remove an import
  await codebase.removeImport('unusedImport');

  // Rename an import
  await codebase.renameImport('oldImportName', 'newImportName');
}

// Example: AI Operations
export async function aiOperationsExample(codebase: CodegenAPI) {
  // Set AI key
  await codebase.setAIKey('your-ai-api-key');

  // Set session options
  await codebase.setSessionOptions(10);

  // Use AI to generate code
  const result = await codebase.ai(
    'Create a function that calculates the factorial of a number',
    { target: 'src/utils/math.ts' }
  );
  console.log('AI result:', result);

  // Get AI client
  const aiClient = await codebase.aiClient();
  console.log('AI client:', aiClient);
}

// Example: Git Operations
export async function gitOperationsExample(codebase: CodegenAPI) {
  // Commit changes
  await codebase.gitCommit('Add new features');

  // Push changes
  await codebase.gitPush();

  // Get default branch
  const defaultBranch = await codebase.defaultBranch();
  console.log('Default branch:', defaultBranch);

  // Get current commit
  const currentCommit = await codebase.currentCommit();
  console.log('Current commit:', currentCommit);

  // Reset changes
  await codebase.reset();

  // Checkout a branch
  await codebase.checkout('feature/new-feature', { create: true });

  // Sync to a specific commit
  await codebase.syncToCommit('abc123');

  // Get diffs
  const diffs = await codebase.getDiffs();
  console.log('Diffs:', diffs);

  // Get diff
  const diff = await codebase.getDiff();
  console.log('Diff:', diff);

  // Clean repo
  await codebase.cleanRepo();

  // Stash changes
  await codebase.stashChanges();

  // Restore stashed changes
  await codebase.restoreStashedChanges();

  // Create a PR
  await codebase.createPR(
    'Add new features', 
    'This PR adds several new features to the application.'
  );
}

// Example: Editing Tools
export async function editingToolsExample(apiKey: string, codebase: CodegenAPI) {
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

  // Relace edit
  await relaceEdit(
    apiKey,
    'src/utils/helpers.ts',
    `// ... existing imports ...

// Add new utility function
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

// ... rest of the file ...`
  );
}

// Example: Analysis Tools
export async function analysisToolsExample(codebase: CodegenAPI) {
  // Find calls
  const calls = await findCalls(
    codebase,
    'fetch',
    { url: 'api/users' }
  );
  console.log('Calls:', calls);

  // Create call graph
  const callGraph = await createCallGraph(
    codebase,
    'main',
    'processData',
    5
  );
  console.log('Call graph:', callGraph);

  // Find dead code
  const deadCode = await findDeadCode(codebase);
  console.log('Dead code:', deadCode);

  // Get codebase summary
  const codebaseSummary = await getCodebaseSummary(codebase);
  console.log('Codebase summary:', codebaseSummary);

  // Get file summary
  const fileSummary = await getFileSummary(codebase, 'src/main.ts');
  console.log('File summary:', fileSummary);

  // Get class summary
  const classSummary = await getClassSummary(codebase, 'UserService');
  console.log('Class summary:', classSummary);

  // Get function summary
  const functionSummary = await getFunctionSummary(codebase, 'processData');
  console.log('Function summary:', functionSummary);
}

// Example: Search Tools
export async function searchToolsExample(apiKey: string) {
  // Ripgrep search
  const ripgrepResults = await ripgrepSearch(
    apiKey,
    {
      query: 'function process',
      fileExtensions: ['.ts', '.tsx'],
      filesPerPage: 10,
      page: 1,
      useRegex: false
    }
  );
  console.log('Ripgrep results:', ripgrepResults);

  // Search files by name
  const files = await searchFilesByName(
    apiKey,
    {
      pattern: '*.component.ts',
      directory: 'src',
      recursive: true
    }
  );
  console.log('Files:', files);

  // Semantic search
  const semanticResults = await semanticSearch(
    apiKey,
    {
      query: 'functions that handle user authentication',
      limit: 5,
      threshold: 0.7
    }
  );
  console.log('Semantic search results:', semanticResults);
}

// Example: File Tools
export async function fileToolsExample(apiKey: string) {
  // View file
  const fileContent = await viewFile(
    apiKey,
    'src/main.ts'
  );
  console.log('File content:', fileContent);

  // Edit file
  await editFile(
    apiKey,
    'src/utils/helpers.ts',
    `// ... existing imports ...

// Add new utility function
export function formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
  // Implementation
  return format
    .replace('YYYY', date.getFullYear().toString())
    .replace('MM', (date.getMonth() + 1).toString().padStart(2, '0'))
    .replace('DD', date.getDate().toString().padStart(2, '0'));
}

// ... rest of the file ...`
  );

  // Create file
  await createFile(
    apiKey,
    'src/utils/date-utils.ts',
    `/**
 * Date utility functions
 */

export function formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
  return format
    .replace('YYYY', date.getFullYear().toString())
    .replace('MM', (date.getMonth() + 1).toString().padStart(2, '0'))
    .replace('DD', date.getDate().toString().padStart(2, '0'));
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
`
  );

  // Delete file
  await deleteFile(
    apiKey,
    'src/utils/deprecated.ts'
  );

  // Rename file
  await renameFile(
    apiKey,
    'src/utils/old-name.ts',
    'src/utils/new-name.ts'
  );
}

// Main example function that demonstrates all capabilities
export async function demonstrateCodegenAPI(apiKey: string, repoPath: string) {
  // Initialize the Codegen API
  const codebase = await initializeCodegenAPI(apiKey, repoPath);
  
  // File operations
  await fileOperationsExample(codebase);
  
  // Directory operations
  await directoryOperationsExample(codebase);
  
  // Symbol operations
  await symbolOperationsExample(codebase);
  
  // Function operations
  await functionOperationsExample(codebase);
  
  // Class operations
  await classOperationsExample(codebase);
  
  // Import operations
  await importOperationsExample(codebase);
  
  // AI operations
  await aiOperationsExample(codebase);
  
  // Git operations
  await gitOperationsExample(codebase);
  
  // Editing tools
  await editingToolsExample(apiKey, codebase);
  
  // Analysis tools
  await analysisToolsExample(codebase);
  
  // Search tools
  await searchToolsExample(apiKey);
  
  // File tools
  await fileToolsExample(apiKey);
  
  return 'All Codegen API examples completed successfully!';
}
