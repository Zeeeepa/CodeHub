/**
 * Service for interacting with the filesystem API.
 */

export interface DirectoryInfo {
  name: string;
  path: string;
  size: number;
  modified: number;
  created: number;
}

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  modified: number;
  created: number;
  extension: string;
}

export interface DirectoryStructureNode {
  name: string;
  path: string;
  type: 'directory' | 'file' | 'more' | 'error';
  extension?: string;
  children?: DirectoryStructureNode[];
}

export interface CodebaseValidationResult {
  valid: boolean;
  path?: string;
  file_count?: number;
  directory_count?: number;
  message: string;
}

export class FilesystemService {
  /**
   * List directories at the given path.
   */
  async listDirectories(path: string): Promise<DirectoryInfo[]> {
    try {
      const response = await fetch('/api/filesystem/list-directories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to list directories');
      }

      const data = await response.json();
      return data.directories;
    } catch (error) {
      console.error('Error listing directories:', error);
      throw error;
    }
  }

  /**
   * List files at the given path.
   */
  async listFiles(path: string, extensions?: string[]): Promise<FileInfo[]> {
    try {
      const response = await fetch('/api/filesystem/list-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path, extensions }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to list files');
      }

      const data = await response.json();
      return data.files;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  /**
   * Validate that a path is a valid codebase.
   */
  async validateCodebasePath(path: string): Promise<CodebaseValidationResult> {
    try {
      const response = await fetch('/api/filesystem/validate-codebase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to validate codebase path');
      }

      return await response.json();
    } catch (error) {
      console.error('Error validating codebase path:', error);
      throw error;
    }
  }

  /**
   * Get the directory structure of a codebase.
   */
  async getDirectoryStructure(path: string, maxDepth: number = 3): Promise<DirectoryStructureNode> {
    try {
      const response = await fetch('/api/filesystem/directory-structure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path, max_depth: maxDepth }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get directory structure');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting directory structure:', error);
      throw error;
    }
  }
}
