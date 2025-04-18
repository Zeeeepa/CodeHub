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
}
