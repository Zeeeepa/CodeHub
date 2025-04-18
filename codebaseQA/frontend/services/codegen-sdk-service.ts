/**
 * Service for interacting with the Codegen SDK API.
 */

export interface CodegenSDKServiceOptions {
  codebasePath: string;
  apiKey: string;
}

export class CodegenSDKService {
  private codebasePath: string;
  private apiKey: string;

  constructor(options: CodegenSDKServiceOptions) {
    this.codebasePath = options.codebasePath;
    this.apiKey = options.apiKey;
  }

  /**
   * Call the Codegen SDK API.
   */
  private async callApi(operation: string, params: any = {}) {
    const response = await fetch('/api/codegen-sdk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation,
        codebasePath: this.codebasePath,
        apiKey: this.apiKey,
        ...params,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to call Codegen SDK API');
    }

    return response.json();
  }

  /**
   * Analyze a codebase.
   */
  async analyzeCodbase() {
    return this.callApi('analyze');
  }

  /**
   * Find dead code in a codebase.
   */
  async findDeadCode() {
    return this.callApi('findDeadCode');
  }

  /**
   * Edit a file in the codebase.
   */
  async editFile(filePath: string, content: string) {
    return this.callApi('editFile', { filePath, content });
  }

  /**
   * Create a file in the codebase.
   */
  async createFile(filePath: string, content: string) {
    return this.callApi('createFile', { filePath, content });
  }

  /**
   * Delete a file from the codebase.
   */
  async deleteFile(filePath: string) {
    return this.callApi('deleteFile', { filePath });
  }

  /**
   * Get a symbol from the codebase.
   */
  async getSymbol(symbolName: string) {
    return this.callApi('getSymbol', { symbolName });
  }

  /**
   * Rename a symbol in the codebase.
   */
  async renameSymbol(symbolName: string, newName: string) {
    return this.callApi('renameSymbol', { symbolName, newName });
  }

  /**
   * Move a symbol to another file.
   */
  async moveSymbol(symbolName: string, targetFile: string) {
    return this.callApi('moveSymbol', { symbolName, targetFile });
  }

  /**
   * Perform a semantic edit on a file.
   */
  async semanticEdit(filePath: string, editDescription: string) {
    return this.callApi('semanticEdit', { filePath, editDescription });
  }

  /**
   * Get dependencies of a symbol.
   */
  async getDependencies(symbolName: string) {
    return this.callApi('getDependencies', { symbolName });
  }

  /**
   * Analyze imports in a file.
   */
  async analyzeImports(filePath: string) {
    return this.callApi('analyzeImports', { filePath });
  }

  /**
   * Add an import to a file.
   */
  async addImport(filePath: string, importSource: string, symbols?: string[]) {
    return this.callApi('addImport', { filePath, importSource, symbols });
  }

  /**
   * Analyze a JSX component.
   */
  async analyzeJsxComponent(componentName: string) {
    return this.callApi('analyzeJsxComponent', { componentName });
  }

  /**
   * Get the call graph for a function.
   */
  async getCallGraph(functionName: string) {
    return this.callApi('getCallGraph', { functionName });
  }

  /**
   * Get codebase structure.
   */
  async getCodebaseStructure() {
    return this.callApi('getCodebaseStructure');
  }

  /**
   * Find functions by name pattern.
   */
  async findFunctionsByPattern(pattern: string) {
    return this.callApi('findFunctionsByPattern', { pattern });
  }

  /**
   * Find classes by name pattern.
   */
  async findClassesByPattern(pattern: string) {
    return this.callApi('findClassesByPattern', { pattern });
  }

  /**
   * Search for code by text pattern.
   */
  async searchCode(query: string) {
    return this.callApi('searchCode', { query });
  }

  /**
   * Perform semantic search on the codebase.
   */
  async semanticSearch(query: string, limit: number = 10) {
    return this.callApi('semanticSearch', { query, limit });
  }

  /**
   * Get all files in the codebase.
   */
  async getAllFiles() {
    return this.callApi('getAllFiles');
  }

  /**
   * Get all functions in the codebase.
   */
  async getAllFunctions() {
    return this.callApi('getAllFunctions');
  }

  /**
   * Get all classes in the codebase.
   */
  async getAllClasses() {
    return this.callApi('getAllClasses');
  }

  /**
   * Get file content.
   */
  async getFileContent(filePath: string) {
    return this.callApi('getFileContent', { filePath });
  }

  /**
   * Extract function to a new file.
   */
  async extractFunction(functionName: string, targetFile: string) {
    return this.callApi('extractFunction', { functionName, targetFile });
  }

  /**
   * Refactor code based on a description.
   */
  async refactorCode(filePath: string, description: string) {
    return this.callApi('refactorCode', { filePath, description });
  }

  /**
   * Generate documentation for a symbol.
   */
  async generateDocumentation(symbolName: string) {
    return this.callApi('generateDocumentation', { symbolName });
  }

  /**
   * Add parameter to a function.
   */
  async addParameter(functionName: string, paramName: string, paramType: string, defaultValue?: string) {
    return this.callApi('addParameter', { functionName, paramName, paramType, defaultValue });
  }

  /**
   * Remove parameter from a function.
   */
  async removeParameter(functionName: string, paramName: string) {
    return this.callApi('removeParameter', { functionName, paramName });
  }

  /**
   * Change function return type.
   */
  async changeReturnType(functionName: string, newReturnType: string) {
    return this.callApi('changeReturnType', { functionName, newReturnType });
  }

  /**
   * Find unused imports in a file.
   */
  async findUnusedImports(filePath: string) {
    return this.callApi('findUnusedImports', { filePath });
  }

  /**
   * Remove unused imports from a file.
   */
  async removeUnusedImports(filePath: string) {
    return this.callApi('removeUnusedImports', { filePath });
  }

  /**
   * Format code in a file.
   */
  async formatCode(filePath: string) {
    return this.callApi('formatCode', { filePath });
  }

  /**
   * Execute a custom Codegen SDK operation.
   */
  async executeCustomOperation(operationName: string, params: any = {}) {
    return this.callApi(operationName, params);
  }
}
