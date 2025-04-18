import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { operation, ...params } = await req.json()

    // Validate required fields
    if (!operation) {
      return NextResponse.json(
        { error: 'Missing required field: operation' },
        { status: 400 }
      )
    }

    // Extract API key and codebase path from params
    const { apiKey, codebasePath } = params

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing required field: apiKey' },
        { status: 400 }
      )
    }

    if (!codebasePath) {
      return NextResponse.json(
        { error: 'Missing required field: codebasePath' },
        { status: 400 }
      )
    }

    // Call the backend API
    let endpoint = '';
    let requestBody = {};

    switch (operation) {
      case 'analyze':
        endpoint = '/analyze';
        requestBody = {
          codebase_path: codebasePath,
          api_key: apiKey
        };
        break;
      case 'findDeadCode':
        endpoint = '/find-dead-code';
        requestBody = {
          codebase_path: codebasePath,
          api_key: apiKey
        };
        break;
      case 'editFile':
        endpoint = '/edit-file';
        requestBody = {
          codebase_path: codebasePath,
          file_path: params.filePath,
          content: params.content,
          api_key: apiKey
        };
        break;
      case 'createFile':
        endpoint = '/create-file';
        requestBody = {
          codebase_path: codebasePath,
          file_path: params.filePath,
          content: params.content,
          api_key: apiKey
        };
        break;
      case 'deleteFile':
        endpoint = '/delete-file';
        requestBody = {
          codebase_path: codebasePath,
          file_path: params.filePath,
          api_key: apiKey
        };
        break;
      case 'getSymbol':
        endpoint = '/get-symbol';
        requestBody = {
          codebase_path: codebasePath,
          symbol_name: params.symbolName,
          api_key: apiKey
        };
        break;
      case 'renameSymbol':
        endpoint = '/rename-symbol';
        requestBody = {
          codebase_path: codebasePath,
          symbol_name: params.symbolName,
          new_name: params.newName,
          api_key: apiKey
        };
        break;
      case 'moveSymbol':
        endpoint = '/move-symbol';
        requestBody = {
          codebase_path: codebasePath,
          symbol_name: params.symbolName,
          target_file: params.targetFile,
          api_key: apiKey
        };
        break;
      case 'semanticEdit':
        endpoint = '/semantic-edit';
        requestBody = {
          codebase_path: codebasePath,
          file_path: params.filePath,
          edit_description: params.editDescription,
          api_key: apiKey
        };
        break;
      case 'getDependencies':
        endpoint = '/get-dependencies';
        requestBody = {
          codebase_path: codebasePath,
          symbol_name: params.symbolName,
          api_key: apiKey
        };
        break;
      case 'analyzeImports':
        endpoint = '/analyze-imports';
        requestBody = {
          codebase_path: codebasePath,
          file_path: params.filePath,
          api_key: apiKey
        };
        break;
      case 'addImport':
        endpoint = '/add-import';
        requestBody = {
          codebase_path: codebasePath,
          file_path: params.filePath,
          import_source: params.importSource,
          symbols: params.symbols,
          api_key: apiKey
        };
        break;
      case 'analyzeJsxComponent':
        endpoint = '/analyze-jsx-component';
        requestBody = {
          codebase_path: codebasePath,
          component_name: params.componentName,
          api_key: apiKey
        };
        break;
      case 'getCallGraph':
        endpoint = '/get-call-graph';
        requestBody = {
          codebase_path: codebasePath,
          function_name: params.functionName,
          api_key: apiKey
        };
        break;
      default:
        return NextResponse.json(
          { error: `Unsupported operation: ${operation}` },
          { status: 400 }
        )
    }

    // Make the API call to the backend
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || 'Error calling backend API' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
