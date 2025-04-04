import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@/hooks/use-theme';

interface CodeBlockProps {
  language: string;
  code: string;
  fileName?: string;
}

export default function CodeBlock({ language, code, fileName }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { isDarkMode } = useTheme();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg overflow-hidden mb-3">
      {fileName && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-200 dark:bg-neutral-700 text-xs">
          <span className="font-medium">{fileName}</span>
          <button 
            className="hover:text-primary"
            onClick={handleCopy}
          >
            <span className="material-icons text-base">
              {copied ? 'check' : 'content_copy'}
            </span>
          </button>
        </div>
      )}
      <div className="relative">
        {!fileName && (
          <button 
            className="absolute right-2 top-2 p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 z-10"
            onClick={handleCopy}
          >
            <span className="material-icons text-base">
              {copied ? 'check' : 'content_copy'}
            </span>
          </button>
        )}
        <SyntaxHighlighter
          language={language || 'text'}
          style={isDarkMode ? oneDark : oneLight}
          customStyle={{
            margin: 0,
            borderRadius: fileName ? '0 0 0.5rem 0.5rem' : '0.5rem',
            fontSize: '0.8rem',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
