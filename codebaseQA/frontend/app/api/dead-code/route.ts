import { NextRequest, NextResponse } from 'next/server'

// API URL based on environment
const API_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:8000' 
  : 'https://codegen-sh--code-research-app-fastapi-modal-app.modal.run';

export async function POST(req: NextRequest) {
  try {
    const { codebasePath, filePath, apiKey } = await req.json()

    // Validate required fields
    if (!codebasePath) {
      return NextResponse.json(
        { error: 'Missing required field: codebasePath is required' },
        { status: 400 }
      )
    }

    // Validate API key if provided
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    // Parse the repository path from codebasePath
    // Format could be a full GitHub URL or owner/repo format
    let repoName = codebasePath
    if (codebasePath.includes('github.com')) {
      const url = new URL(codebasePath)
      const pathParts = url.pathname.split('/').filter(Boolean)
      if (pathParts.length >= 2) {
        repoName = `${pathParts[0]}/${pathParts[1]}`
      }
    }

    // Call the Codegen API
    const response = await fetch(`${API_URL}/dead-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        repo_name: repoName,
        file_path: filePath || null
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to get a response from the Codegen API')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
