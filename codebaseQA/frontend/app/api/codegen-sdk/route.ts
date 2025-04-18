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

    // Validate API key
    if (!params.api_key) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    // Prepare the request to the backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    let endpoint = ''

    // Map frontend operation to backend endpoint
    switch (operation) {
      case 'analyze':
        endpoint = '/analyze'
        break
      case 'findDeadCode':
        endpoint = '/find-dead-code'
        break
      case 'editFile':
        endpoint = '/edit-file'
        break
      case 'createFile':
        endpoint = '/create-file'
        break
      case 'deleteFile':
        endpoint = '/delete-file'
        break
      case 'getSymbol':
        endpoint = '/get-symbol'
        break
      case 'renameSymbol':
        endpoint = '/rename-symbol'
        break
      case 'moveSymbol':
        endpoint = '/move-symbol'
        break
      case 'semanticEdit':
        endpoint = '/semantic-edit'
        break
      case 'getDependencies':
        endpoint = '/get-dependencies'
        break
      case 'analyzeImports':
        endpoint = '/analyze-imports'
        break
      case 'addImport':
        endpoint = '/add-import'
        break
      case 'analyzeJsxComponent':
        endpoint = '/analyze-jsx-component'
        break
      case 'getCallGraph':
        endpoint = '/get-call-graph'
        break
      case 'searchCode':
        endpoint = '/search-code'
        break
      case 'semanticSearch':
        endpoint = '/semantic-search'
        break
      case 'getAllFiles':
        endpoint = '/get-all-files'
        break
      case 'getAllFunctions':
        endpoint = '/get-all-functions'
        break
      case 'getAllClasses':
        endpoint = '/get-all-classes'
        break
      case 'getFileContent':
        endpoint = '/get-file-content'
        break
      case 'extractFunction':
        endpoint = '/extract-function'
        break
      case 'refactorCode':
        endpoint = '/refactor-code'
        break
      case 'generateDocumentation':
        endpoint = '/generate-documentation'
        break
      case 'addParameter':
        endpoint = '/add-parameter'
        break
      case 'removeParameter':
        endpoint = '/remove-parameter'
        break
      case 'changeReturnType':
        endpoint = '/change-return-type'
        break
      case 'findUnusedImports':
        endpoint = '/find-unused-imports'
        break
      case 'removeUnusedImports':
        endpoint = '/remove-unused-imports'
        break
      case 'formatCode':
        endpoint = '/format-code'
        break
      default:
        return NextResponse.json(
          { error: `Unsupported operation: ${operation}` },
          { status: 400 }
        )
    }

    // Convert frontend parameter names to backend format
    const backendParams: any = {}
    
    // Map common parameters
    if (params.codebasePath) backendParams.codebase_path = params.codebasePath
    if (params.apiKey) backendParams.api_key = params.apiKey
    if (params.filePath) backendParams.file_path = params.filePath
    if (params.content) backendParams.content = params.content
    if (params.symbolName) backendParams.symbol_name = params.symbolName
    if (params.newName) backendParams.new_name = params.newName
    if (params.targetFile) backendParams.target_file = params.targetFile
    if (params.editDescription) backendParams.edit_description = params.editDescription
    if (params.importSource) backendParams.import_source = params.importSource
    if (params.symbols) backendParams.symbols = params.symbols
    if (params.query) backendParams.query = params.query
    if (params.componentName) backendParams.component_name = params.componentName
    if (params.functionName) backendParams.function_name = params.functionName
    if (params.parameterName) backendParams.parameter_name = params.parameterName
    if (params.parameterType) backendParams.parameter_type = params.parameterType
    if (params.returnType) backendParams.return_type = params.returnType

    // Make the request to the backend
    const response = await fetch(`${backendUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendParams),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.detail || 'Backend API error' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
