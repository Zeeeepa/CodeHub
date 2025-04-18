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
  private async callApi(operation: string, params: any = {}): Promise<any> {
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
  async analyzeCodbase(): Promise<any> {
    return this.callApi('analyze');
  }

  /**
   * Find dead code in a codebase.
   */
  async findDeadCode(): Promise<any> {
    return this.callApi('findDeadCode');
  }

  /**
   * Edit a file in the codebase.
   */
  async editFile(filePath: string, content: string): Promise<any> {
    return this.callApi('editFile', { filePath, content });
  }

  /**
   * Create a file in the codebase.
   */
  async createFile(filePath: string, content: string): Promise<any> {
    return this.callApi('createFile', { filePath, content });
  }

  /**
   * Delete a file from the codebase.
   */
  async deleteFile(filePath: string): Promise<any> {
    return this.callApi('deleteFile', { filePath });
  }

  /**
   * Get a symbol from the codebase.
   */
  async getSymbol(symbolName: string): Promise<any> {
    return this.callApi('getSymbol', { symbolName });
  }

  /**
   * Rename a symbol in the codebase.
   */
  async renameSymbol(symbolName: string, newName: string): Promise<any> {
    return this.callApi('renameSymbol', { symbolName, newName });
  }

  /**
   * Move a symbol to another file.
   */
  async moveSymbol(symbolName: string, targetFile: string): Promise<any> {
    return this.callApi('moveSymbol', { symbolName, targetFile });
  }

  /**
   * Perform a semantic edit on a file.
   */
  async semanticEdit(filePath: string, editDescription: string): Promise<any> {
    return this.callApi('semanticEdit', { filePath, editDescription });
  }

  /**
   * Get dependencies of a symbol.
   */
  async getDependencies(symbolName: string): Promise<any> {
    return this.callApi('getDependencies', { symbolName });
  }

  /**
   * Analyze imports in a file.
   */
  async analyzeImports(filePath: string): Promise<any> {
    return this.callApi('analyzeImports', { filePath });
  }

  /**
   * Add an import to a file.
   */
  async addImport(filePath: string, importSource: string, symbols?: string[]): Promise<any> {
    return this.callApi('addImport', { filePath, importSource, symbols });
  }

  /**
   * Analyze a JSX component.
   */
  async analyzeJsxComponent(componentName: string): Promise<any> {
    return this.callApi('analyzeJsxComponent', { componentName });
  }

  /**
   * Get the call graph for a function.
   */
  async getCallGraph(functionName: string): Promise<any> {
    return this.callApi('getCallGraph', { functionName });
  }

  /**
   * Search for code in the codebase.
   */
  async searchCode(query: string): Promise<any> {
    return this.callApi('searchCode', { query });
  }

  /**
   * Perform a semantic search in the codebase.
   */
  async semanticSearch(query: string): Promise<any> {
    return this.callApi('semanticSearch', { query });
  }

  /**
   * Get all files in the codebase.
   */
  async getAllFiles(): Promise<any> {
    return this.callApi('getAllFiles');
  }

  /**
   * Get all functions in the codebase.
   */
  async getAllFunctions(): Promise<any> {
    return this.callApi('getAllFunctions');
  }

  /**
   * Get all classes in the codebase.
   */
  async getAllClasses(): Promise<any> {
    return this.callApi('getAllClasses');
  }

  /**
   * Get the content of a file.
   */
  async getFileContent(filePath: string): Promise<any> {
    return this.callApi('getFileContent', { filePath });
  }

  /**
   * Extract a function from a file.
   */
  async extractFunction(filePath: string, editDescription: string): Promise<any> {
    return this.callApi('extractFunction', { filePath, editDescription });
  }

  /**
   * Refactor code in a file.
   */
  async refactorCode(filePath: string, editDescription: string): Promise<any> {
    return this.callApi('refactorCode', { filePath, editDescription });
  }

  /**
   * Generate documentation for a symbol.
   */
  async generateDocumentation(symbolName: string): Promise<any> {
    return this.callApi('generateDocumentation', { symbolName });
  }

  /**
   * Add a parameter to a function.
   */
  async addParameter(functionName: string, parameterName: string, parameterType?: string): Promise<any> {
    return this.callApi('addParameter', { functionName, parameterName, parameterType });
  }

  /**
   * Remove a parameter from a function.
   */
  async removeParameter(functionName: string, parameterName: string): Promise<any> {
    return this.callApi('removeParameter', { functionName, parameterName });
  }

  /**
   * Change the return type of a function.
   */
  async changeReturnType(functionName: string, returnType: string): Promise<any> {
    return this.callApi('changeReturnType', { functionName, returnType });
  }

  /**
   * Find unused imports in the codebase.
   */
  async findUnusedImports(): Promise<any> {
    return this.callApi('findUnusedImports');
  }

  /**
   * Remove unused imports from the codebase.
   */
  async removeUnusedImports(): Promise<any> {
    return this.callApi('removeUnusedImports');
  }

  /**
   * Format code in a file.
   */
  async formatCode(filePath: string): Promise<any> {
    return this.callApi('formatCode', { filePath });
  }
}
