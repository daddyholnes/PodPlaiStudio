interface MessagePart {
  type: 'text' | 'image' | 'code';
  text?: string;
  language?: string;
  mimeType?: string;
  fileName?: string;
  fileData?: string;
}

// Parse text from Gemini API responses into structured message parts
export function parseMessageContent(text: string): MessagePart[] {
  const parts: MessagePart[] = [];
  
  // Try to identify code blocks with language specifiers
  // Format: ```language\ncode\n```
  const codeBlockRegex = /```([a-zA-Z0-9_]+)?\n([\s\S]*?)\n```/g;
  let lastIndex = 0;
  let match;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Add any text before the code block
    if (match.index > lastIndex) {
      const textBefore = text.substring(lastIndex, match.index).trim();
      if (textBefore) {
        parts.push({ type: 'text', text: textBefore });
      }
    }
    
    // Add the code block
    parts.push({
      type: 'code',
      text: match[2],
      language: match[1] || 'text'
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text after the last code block
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex).trim();
    if (remainingText) {
      parts.push({ type: 'text', text: remainingText });
    }
  }
  
  // If no code blocks were found, just return the whole text
  if (parts.length === 0 && text.trim()) {
    parts.push({ type: 'text', text });
  }
  
  return parts;
}

// Extract a file name from a code block (if present)
export function extractFileName(text: string): string | null {
  // Look for patterns like "filename: example.js" or "File: example.js"
  const filenameRegex = /^(?:filename|file):\s*([^\n]+)/i;
  const match = text.match(filenameRegex);
  return match ? match[1].trim() : null;
}
