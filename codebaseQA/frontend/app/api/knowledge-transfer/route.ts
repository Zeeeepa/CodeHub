import { NextRequest, NextResponse } from "next/server";

// Mock data generator for demonstration purposes
// In a real implementation, this would connect to the backend API
function generateMockData(repo: string, timeRange: string) {
  // Generate random authors
  const authorCount = 8;
  const aiAuthorCount = 2;
  
  const authors = Array.from({ length: authorCount }, (_, i) => ({
    id: `author-${i + 1}`,
    name: i < aiAuthorCount ? `AI Assistant ${i + 1}` : `Developer ${i + 1}`,
    email: i < aiAuthorCount ? `ai-assistant-${i + 1}@example.com` : `dev-${i + 1}@example.com`,
    isAI: i < aiAuthorCount
  }));
  
  // Generate random contributions
  const contributionCount = 50;
  const contributions = Array.from({ length: contributionCount }, (_, i) => {
    const authorId = `author-${Math.floor(Math.random() * authorCount) + 1}`;
    return {
      id: `contribution-${i + 1}`,
      authorId,
      filename: `src/${['components', 'utils', 'hooks', 'pages'][Math.floor(Math.random() * 4)]}/${['index', 'main', 'helper', 'utils'][Math.floor(Math.random() * 4)]}.${['js', 'ts', 'tsx', 'jsx'][Math.floor(Math.random() * 4)]}`,
      date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
      linesAdded: Math.floor(Math.random() * 100) + 1,
      linesRemoved: Math.floor(Math.random() * 20),
      commitMessage: `${['Add', 'Update', 'Fix', 'Refactor'][Math.floor(Math.random() * 4)]} ${['feature', 'bug', 'component', 'function'][Math.floor(Math.random() * 4)]}`,
      commitHash: Math.random().toString(36).substring(2, 10)
    };
  });
  
  // Generate pattern transfers (knowledge transfer between authors)
  const patternCount = 15;
  const patterns = [
    "React hooks pattern",
    "Error boundary implementation",
    "State management approach",
    "API request pattern",
    "Component composition",
    "Utility function structure",
    "Testing methodology",
    "Type definition pattern",
    "CSS-in-JS approach",
    "Form validation technique"
  ];
  
  const patternTransfers = Array.from({ length: patternCount }, (_, i) => {
    // Ensure AI authors are more often the source of patterns
    const sourceAuthorId = Math.random() < 0.7 && i % 3 === 0
      ? `author-${Math.floor(Math.random() * aiAuthorCount) + 1}`
      : `author-${Math.floor(Math.random() * authorCount) + 1}`;
    
    // Target is always a non-AI author if source is AI
    let targetAuthorId;
    if (sourceAuthorId.includes("author-1") || sourceAuthorId.includes("author-2")) {
      targetAuthorId = `author-${Math.floor(Math.random() * (authorCount - aiAuthorCount)) + aiAuthorCount + 1}`;
    } else {
      targetAuthorId = `author-${Math.floor(Math.random() * authorCount) + 1}`;
      // Ensure source and target are different
      while (targetAuthorId === sourceAuthorId) {
        targetAuthorId = `author-${Math.floor(Math.random() * authorCount) + 1}`;
      }
    }
    
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    const firstSeenDate = new Date(Date.now() - Math.floor(Math.random() * 20000000000)).toISOString();
    const adoptionDate = new Date(Date.parse(firstSeenDate) + Math.floor(Math.random() * 10000000000)).toISOString();
    
    return {
      id: `pattern-${i + 1}`,
      sourceAuthorId,
      targetAuthorId,
      pattern,
      firstSeenDate,
      adoptionDate,
      frequency: Math.floor(Math.random() * 10) + 1,
      files: Array.from(
        { length: Math.floor(Math.random() * 5) + 1 },
        () => contributions[Math.floor(Math.random() * contributionCount)].filename
      )
    };
  });
  
  return {
    authors,
    contributions,
    patternTransfers
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const repo = searchParams.get("repo") || "";
  const timeRange = searchParams.get("timeRange") || "last-6-months";
  
  // In a real implementation, this would call your backend API
  // For demonstration, we'll generate mock data
  const data = generateMockData(repo, timeRange);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return NextResponse.json(data);
}
