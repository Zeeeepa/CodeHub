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

    // Prepare the request to the backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    let endpoint = ''

    // Map frontend operation to backend endpoint
    switch (operation) {
      case 'listDirectories':
        endpoint = '/filesystem/list-directories'
        break
      case 'listFiles':
        endpoint = '/filesystem/list-files'
        break
      case 'validateCodebase':
        endpoint = '/filesystem/validate-codebase'
        break
      case 'getDirectoryStructure':
        endpoint = '/filesystem/directory-structure'
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
    if (params.path) backendParams.path = params.path
    if (params.extensions) backendParams.extensions = params.extensions
    if (params.maxDepth) backendParams.max_depth = params.maxDepth

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
