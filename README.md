# CodeHub

CodeHub is a comprehensive codebase exploration and analysis tool that integrates with the Codegen API to provide powerful code understanding capabilities.

## Features

- **Deep Research**: Chat with your codebase using AI-powered analysis
- **GitHub Integration**: Connect to GitHub repositories for analysis
- **Local Codebase Support**: Analyze local codebases on your machine
- **Codegen Chat Interface**: Interact with the Codegen API through a chat-like interface
- **Repository Analytics**: Visualize and understand your codebase structure
- **Knowledge Transfer**: Generate documentation and explanations from your code

## Codegen Integration

The application integrates with the Codegen API to provide advanced code analysis capabilities:

- **Codebase Understanding**: Ask questions about your codebase and get detailed answers
- **Code Navigation**: Find relevant files and functions based on natural language queries
- **Symbol Analysis**: Understand relationships between different parts of your code
- **Semantic Search**: Find code based on functionality rather than just text matching

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- A Codegen API key (get one at [codegen.sh/token](https://codegen.sh/token))

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/codehub.git
   cd codehub
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Navigate to the "Codegen Chat" section from the main navigation
2. Select a codebase source (GitHub repository or local folder)
3. Enter your Codegen API key
4. Start asking questions about your codebase

## Development

### Project Structure

- `codebaseQA/frontend/app`: Next.js app router pages
- `codebaseQA/frontend/components`: Reusable UI components
- `codebaseQA/frontend/app/api`: API routes for backend functionality
- `codebaseQA/backend`: Backend services for codebase analysis

### Key Components

- `LocalCodebaseSelector`: Component for selecting local folders
- `ChatInterface`: Chat UI for interacting with the Codegen API
- `ApiKeyInput`: Component for securely entering and storing API keys

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Codegen](https://codegen.sh) for providing the API
- [Next.js](https://nextjs.org) for the frontend framework
- [shadcn/ui](https://ui.shadcn.com) for the UI components
