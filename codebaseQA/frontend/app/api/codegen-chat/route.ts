import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { codebasePath, message, apiKey } = await req.json()

    // Validate required fields
    if (!codebasePath || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: codebasePath and message are required' },
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

    // Prepare the request to the backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    
    // Call the backend API to process the chat message
    const response = await fetch(`${backendUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        codebase_path: codebasePath,
        message: message,
        api_key: apiKey
      }),
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
