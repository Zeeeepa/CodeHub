/**
 * Codegen API Integration
 * 
 * This file provides a comprehensive set of functions for interacting with the Codegen API
 * to perform advanced code manipulation operations.
 */

// API URL based on environment
const API_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:8000' 
  : 'https://codegen-sh--code-research-app-fastapi-modal-app.modal.run';

// Types for Codebase operations
export interface CodebaseOptions {
  language?: string;
  projects?: string[];
  config?: Record<string, any>;
  secrets?: Record<string, string>;
  io?: any;
  progress?: any;
}

export interface FileOptions {
  extensions?: string[];
  optional?: boolean;
  ignore_case?: boolean;
}

export interface DirectoryOptions {
  exist_ok?: boolean;
  parents?: boolean;
  optional?: boolean;
  ignore_case?: boolean;
}

export interface SymbolOptions {
  optional?: boolean;
  include_dependencies?: boolean;
  strategy?: 'update_all_imports' | 'minimal_updates';
  priority?: number;
}

export interface FunctionOptions {
  fuzzy_match?: boolean;
}

export interface GitOptions {
  verify?: boolean;
  exclude_paths?: string[];
  create?: boolean;
  force?: boolean;
  setup_option?: string;
  stage_files?: boolean;
}

export interface AIOptions {
  max_ai_requests?: number;
  target?: any;
  context?: any;
}

export interface EditOptions {
  file_pattern?: string;
}

// Main Codegen API class
export class CodegenAPI {
  private apiKey: string;
  private repoPath: string;
  private language?: string;
  private projects?: string[];
  private config?: Record<string, any>;
  private secrets?: Record<string, string>;

  constructor(apiKey: string, repoPath: string, options?: CodebaseOptions) {
    this.apiKey = apiKey;
    this.repoPath = repoPath;
    this.language = options?.language;
    this.projects = options?.projects;
    this.config = options?.config;
    this.secrets = options?.secrets;
  }

  // Helper method for API calls
  private async callAPI(endpoint: string, data: any): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          ...data,
          repo_path: this.repoPath
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to call ${endpoint} API`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error calling ${endpoint} API:`, error);
      throw error;
    }
  }

  // Codebase Operations
  // Initialization
  static async initialize(repoPath: string, options?: CodebaseOptions): Promise<CodegenAPI> {
    return new CodegenAPI(options?.secrets?.api_key || '', repoPath, options);
  }

  // File Operations
  async files(options?: FileOptions): Promise<string[]> {
    return this.callAPI('files', { extensions: options?.extensions });
  }

  async getFile(filepath: string, options?: FileOptions): Promise<any> {
    return this.callAPI('get_file', { 
      filepath, 
      optional: options?.optional, 
      ignore_case: options?.ignore_case 
    });
  }

  async createFile(filepath: string, content: string = '', sync: boolean = true): Promise<any> {
    return this.callAPI('create_file', { filepath, content, sync });
  }

  async hasFile(filepath: string, ignoreCase: boolean = false): Promise<boolean> {
    return this.callAPI('has_file', { filepath, ignore_case: ignoreCase });
  }

  async renameFile(filepath: string, newFilepath: string): Promise<any> {
    return this.callAPI('rename_file', { filepath, new_filepath: newFilepath });
  }

  // Directory Operations
  async directories(): Promise<string[]> {
    return this.callAPI('directories', {});
  }

  async createDirectory(dirPath: string, options?: DirectoryOptions): Promise<any> {
    return this.callAPI('create_directory', { 
      dir_path: dirPath, 
      exist_ok: options?.exist_ok, 
      parents: options?.parents 
    });
  }

  async hasDirectory(dirPath: string, ignoreCase: boolean = false): Promise<boolean> {
    return this.callAPI('has_directory', { dir_path: dirPath, ignore_case: ignoreCase });
  }

  async getDirectory(dirPath: string, options?: DirectoryOptions): Promise<any> {
    return this.callAPI('get_directory', { 
      dir_path: dirPath, 
      optional: options?.optional, 
      ignore_case: options?.ignore_case 
    });
  }

  // Symbol Operations
  async getSymbol(name: string, optional: boolean = false): Promise<any> {
    return this.callAPI('get_symbol', { name, optional });
  }

  async getSymbols(name: string): Promise<any[]> {
    return this.callAPI('get_symbols', { name });
  }

  async hasSymbol(symbolName: string): Promise<boolean> {
    return this.callAPI('has_symbol', { symbol_name: symbolName });
  }

  async symbols(): Promise<any[]> {
    return this.callAPI('symbols', {});
  }

  async functions(): Promise<any[]> {
    return this.callAPI('functions', {});
  }

  async classes(): Promise<any[]> {
    return this.callAPI('classes', {});
  }

  async imports(): Promise<any[]> {
    return this.callAPI('imports', {});
  }

  async exports(): Promise<any[]> {
    return this.callAPI('exports', {});
  }

  async interfaces(): Promise<any[]> {
    return this.callAPI('interfaces', {});
  }

  async types(): Promise<any[]> {
    return this.callAPI('types', {});
  }

  async globalVars(): Promise<any[]> {
    return this.callAPI('global_vars', {});
  }

  // Symbol manipulation
  async moveSymbolToFile(symbolName: string, targetFile: string, options?: SymbolOptions): Promise<any> {
    return this.callAPI('move_symbol_to_file', { 
      symbol_name: symbolName, 
      target_file: targetFile, 
      include_dependencies: options?.include_dependencies, 
      strategy: options?.strategy 
    });
  }

  async renameSymbol(symbolName: string, newName: string, priority: number = 0): Promise<any> {
    return this.callAPI('rename_symbol', { 
      symbol_name: symbolName, 
      new_name: newName, 
      priority 
    });
  }

  async removeSymbol(symbolName: string): Promise<any> {
    return this.callAPI('remove_symbol', { symbol_name: symbolName });
  }

  // Function Operations
  async getFunctionReturnType(functionName: string): Promise<string> {
    return this.callAPI('function_return_type', { function_name: functionName });
  }

  async getFunctionParameters(functionName: string): Promise<any[]> {
    return this.callAPI('function_parameters', { function_name: functionName });
  }

  async isFunctionAsync(functionName: string): Promise<boolean> {
    return this.callAPI('is_function_async', { function_name: functionName });
  }

  async getFunctionDecorators(functionName: string): Promise<string[]> {
    return this.callAPI('function_decorators', { function_name: functionName });
  }

  async getFunctionCalls(functionName: string): Promise<any[]> {
    return this.callAPI('function_calls', { function_name: functionName });
  }

  async setFunctionReturnType(functionName: string, type: string): Promise<any> {
    return this.callAPI('set_function_return_type', { function_name: functionName, type });
  }

  async addFunctionParameter(functionName: string, name: string, type: string): Promise<any> {
    return this.callAPI('add_function_parameter', { function_name: functionName, name, type });
  }

  async removeFunctionParameter(functionName: string, name: string): Promise<any> {
    return this.callAPI('remove_function_parameter', { function_name: functionName, name });
  }

  async addFunctionDecorator(functionName: string, decorator: string): Promise<any> {
    return this.callAPI('add_function_decorator', { function_name: functionName, decorator });
  }

  async setFunctionDocstring(functionName: string, docstring: string): Promise<any> {
    return this.callAPI('set_function_docstring', { function_name: functionName, docstring });
  }

  async generateFunctionDocstring(functionName: string): Promise<string> {
    return this.callAPI('generate_function_docstring', { function_name: functionName });
  }

  async renameFunctionLocalVariable(functionName: string, oldVarName: string, newVarName: string, options?: FunctionOptions): Promise<any> {
    return this.callAPI('rename_function_local_variable', { 
      function_name: functionName, 
      old_var_name: oldVarName, 
      new_var_name: newVarName, 
      fuzzy_match: options?.fuzzy_match 
    });
  }

  async getFunctionCallSites(functionName: string): Promise<any[]> {
    return this.callAPI('function_call_sites', { function_name: functionName });
  }

  async getFunctionDependencies(functionName: string): Promise<any[]> {
    return this.callAPI('function_dependencies', { function_name: functionName });
  }

  // Class Operations
  async getClassMethods(className: string): Promise<any[]> {
    return this.callAPI('class_methods', { class_name: className });
  }

  async getClassProperties(className: string): Promise<any[]> {
    return this.callAPI('class_properties', { class_name: className });
  }

  async getClassAttributes(className: string): Promise<any[]> {
    return this.callAPI('class_attributes', { class_name: className });
  }

  async isClassAbstract(className: string): Promise<boolean> {
    return this.callAPI('is_class_abstract', { class_name: className });
  }

  async getClassParentClassNames(className: string): Promise<string[]> {
    return this.callAPI('class_parent_class_names', { class_name: className });
  }

  async isClassSubclassOf(className: string, parent: string): Promise<boolean> {
    return this.callAPI('is_class_subclass_of', { class_name: className, parent });
  }

  async addClassMethod(className: string, method: string): Promise<any> {
    return this.callAPI('add_class_method', { class_name: className, method });
  }

  async removeClassMethod(className: string, method: string): Promise<any> {
    return this.callAPI('remove_class_method', { class_name: className, method });
  }

  async addClassAttribute(className: string, name: string, type: string, value: any): Promise<any> {
    return this.callAPI('add_class_attribute', { class_name: className, name, type, value });
  }

  async removeClassAttribute(className: string, name: string): Promise<any> {
    return this.callAPI('remove_class_attribute', { class_name: className, name });
  }

  async convertClassToProtocol(className: string): Promise<any> {
    return this.callAPI('convert_class_to_protocol', { class_name: className });
  }

  async getClassDecorators(className: string): Promise<string[]> {
    return this.callAPI('class_decorators', { class_name: className });
  }

  // Import Operations
  async getImportSource(importName: string): Promise<string> {
    return this.callAPI('import_source', { import_name: importName });
  }

  async updateImportSource(importName: string, newSource: string): Promise<any> {
    return this.callAPI('update_import_source', { import_name: importName, new_source: newSource });
  }

  async removeImport(importName: string): Promise<any> {
    return this.callAPI('remove_import', { import_name: importName });
  }

  async renameImport(importName: string, newName: string, priority: number = 0): Promise<any> {
    return this.callAPI('rename_import', { import_name: importName, new_name: newName, priority });
  }

  // AI Operations
  async setAIKey(apiKey: string): Promise<void> {
    this.apiKey = apiKey;
  }

  async setSessionOptions(maxAIRequests: number): Promise<any> {
    return this.callAPI('set_session_options', { max_ai_requests: maxAIRequests });
  }

  async ai(prompt: string, options?: AIOptions): Promise<any> {
    return this.callAPI('ai', { 
      prompt, 
      target: options?.target, 
      context: options?.context 
    });
  }

  async aiClient(): Promise<any> {
    return this.callAPI('ai_client', {});
  }

  // Git Operations
  async gitCommit(message: string, options?: GitOptions): Promise<any> {
    return this.callAPI('git_commit', { 
      message, 
      verify: options?.verify, 
      exclude_paths: options?.exclude_paths 
    });
  }

  async commit(syncGraph: boolean = true): Promise<any> {
    return this.callAPI('commit', { sync_graph: syncGraph });
  }

  async gitPush(...args: any[]): Promise<any> {
    return this.callAPI('git_push', { args });
  }

  async defaultBranch(): Promise<string> {
    return this.callAPI('default_branch', {});
  }

  async currentCommit(): Promise<string> {
    return this.callAPI('current_commit', {});
  }

  async reset(gitReset: boolean = false): Promise<any> {
    return this.callAPI('reset', { git_reset: gitReset });
  }

  async checkout(branchName: string, options?: GitOptions): Promise<any> {
    return this.callAPI('checkout', { 
      branch_name: branchName, 
      create: options?.create, 
      force: options?.force, 
      setup_option: options?.setup_option 
    });
  }

  async syncToCommit(targetCommit: string): Promise<any> {
    return this.callAPI('sync_to_commit', { target_commit: targetCommit });
  }

  async getDiffs(base: string | null = null): Promise<any[]> {
    return this.callAPI('get_diffs', { base });
  }

  async getDiff(base: string | null = null, stageFiles: boolean = false): Promise<string> {
    return this.callAPI('get_diff', { base, stage_files: stageFiles });
  }

  async cleanRepo(): Promise<any> {
    return this.callAPI('clean_repo', {});
  }

  async stashChanges(): Promise<any> {
    return this.callAPI('stash_changes', {});
  }

  async restoreStashedChanges(): Promise<any> {
    return this.callAPI('restore_stashed_changes', {});
  }

  async createPR(title: string, body: string): Promise<any> {
    return this.callAPI('create_pr', { title, body });
  }
}

// Editing Tools
export class SemanticEditTool {
  private apiKey: string;
  private file: string;

  constructor(apiKey: string, file: string) {
    this.apiKey = apiKey;
    this.file = file;
  }

  async apply(editDescription: string, context: any = null): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/semantic_edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          filepath: this.file,
          edit_description: editDescription,
          context
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to apply semantic edit');
      }

      return await response.json();
    } catch (error) {
      console.error('Error applying semantic edit:', error);
      throw error;
    }
  }
}

export async function semanticEdit(
  codebase: CodegenAPI, 
  filepath: string, 
  editDescription: string, 
  context: any = null
): Promise<any> {
  const tool = new SemanticEditTool(codebase['apiKey'], filepath);
  return tool.apply(editDescription, context);
}

export class ReplacementEditTool {
  static async applyPattern(
    apiKey: string,
    pattern: string, 
    replacement: string, 
    files: string[]
  ): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/pattern_replacement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          pattern,
          replacement,
          files
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to apply pattern replacement');
      }

      return await response.json();
    } catch (error) {
      console.error('Error applying pattern replacement:', error);
      throw error;
    }
  }
}

export async function globalReplacementEdit(
  codebase: CodegenAPI, 
  pattern: string, 
  replacement: string, 
  filePattern: string | null = null
): Promise<any> {
  let files: string[] = [];
  
  if (filePattern) {
    files = await codebase.files({ extensions: [filePattern] });
  } else {
    files = await codebase.files();
  }
  
  return ReplacementEditTool.applyPattern(codebase['apiKey'], pattern, replacement, files);
}

export async function relaceEdit(
  apiKey: string,
  filepath: string, 
  editSnippet: string
): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/relace_edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        filepath,
        edit_snippet: editSnippet
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to apply relace edit');
    }

    return await response.json();
  } catch (error) {
    console.error('Error applying relace edit:', error);
    throw error;
  }
}

// Analysis Tools
export async function findCalls(
  codebase: CodegenAPI,
  funcName: string, 
  argPatterns: Record<string, string>
): Promise<any[]> {
  return codebase['callAPI']('find_calls', { func_name: funcName, arg_patterns: argPatterns });
}

export async function createCallGraph(
  codebase: CodegenAPI,
  startFunc: string, 
  endFunc: string, 
  maxDepth: number
): Promise<any> {
  return codebase['callAPI']('create_call_graph', { 
    start_func: startFunc, 
    end_func: endFunc, 
    max_depth: maxDepth 
  });
}

export async function findDeadCode(codebase: CodegenAPI): Promise<any> {
  return codebase['callAPI']('find_dead_code', {});
}

export async function getMaxCallChain(codebase: CodegenAPI, functionName: string): Promise<any[]> {
  return codebase['callAPI']('get_max_call_chain', { function: functionName });
}

export async function getCodebaseSummary(codebase: CodegenAPI): Promise<string> {
  return codebase['callAPI']('get_codebase_summary', {});
}

export async function getFileSummary(codebase: CodegenAPI, file: string): Promise<string> {
  return codebase['callAPI']('get_file_summary', { file });
}

export async function getClassSummary(codebase: CodegenAPI, cls: string): Promise<string> {
  return codebase['callAPI']('get_class_summary', { cls });
}

export async function getFunctionSummary(codebase: CodegenAPI, functionName: string): Promise<string> {
  return codebase['callAPI']('get_function_summary', { function: functionName });
}

// Search Tools
export interface SearchOptions {
  query: string;
  fileExtensions?: string[];
  filesPerPage?: number;
  page?: number;
  useRegex?: boolean;
}

export async function ripgrepSearch(
  apiKey: string,
  options: SearchOptions
): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/ripgrep_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        query: options.query,
        file_extensions: options.fileExtensions,
        files_per_page: options.filesPerPage,
        page: options.page,
        use_regex: options.useRegex
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to perform ripgrep search');
    }

    return await response.json();
  } catch (error) {
    console.error('Error performing ripgrep search:', error);
    throw error;
  }
}

export interface FileSearchOptions {
  pattern: string;
  directory?: string;
  recursive?: boolean;
}

export async function searchFilesByName(
  apiKey: string,
  options: FileSearchOptions
): Promise<string[]> {
  try {
    const response = await fetch(`${API_URL}/search_files_by_name`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        pattern: options.pattern,
        directory: options.directory,
        recursive: options.recursive
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to search files by name');
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching files by name:', error);
    throw error;
  }
}

export interface SemanticSearchOptions {
  query: string;
  limit?: number;
  threshold?: number;
}

export async function semanticSearch(
  apiKey: string,
  options: SemanticSearchOptions
): Promise<any[]> {
  try {
    const response = await fetch(`${API_URL}/semantic_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        query: options.query,
        limit: options.limit,
        threshold: options.threshold
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to perform semantic search');
    }

    return await response.json();
  } catch (error) {
    console.error('Error performing semantic search:', error);
    throw error;
  }
}

// File Tools
export async function viewFile(
  apiKey: string,
  filepath: string
): Promise<string> {
  try {
    const response = await fetch(`${API_URL}/view_file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        filepath
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to view file');
    }

    return await response.json();
  } catch (error) {
    console.error('Error viewing file:', error);
    throw error;
  }
}

export async function editFile(
  apiKey: string,
  filepath: string,
  editSnippet: string
): Promise<any> {
  return relaceEdit(apiKey, filepath, editSnippet);
}

export async function createFile(
  apiKey: string,
  filepath: string,
  content: string
): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/create_file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        filepath,
        content
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create file');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating file:', error);
    throw error;
  }
}

export async function deleteFile(
  apiKey: string,
  filepath: string
): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/delete_file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        filepath
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete file');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

export async function renameFile(
  apiKey: string,
  filepath: string,
  newFilepath: string
): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/rename_file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        filepath,
        new_filepath: newFilepath
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to rename file');
    }

    return await response.json();
  } catch (error) {
    console.error('Error renaming file:', error);
    throw error;
  }
}

// Export all functions and classes for easy access
export default {
  CodegenAPI,
  SemanticEditTool,
  ReplacementEditTool,
  semanticEdit,
  globalReplacementEdit,
  relaceEdit,
  findCalls,
  createCallGraph,
  findDeadCode,
  getMaxCallChain,
  getCodebaseSummary,
  getFileSummary,
  getClassSummary,
  getFunctionSummary,
  ripgrepSearch,
  searchFilesByName,
  semanticSearch,
  viewFile,
  editFile,
  createFile,
  deleteFile,
  renameFile
};
