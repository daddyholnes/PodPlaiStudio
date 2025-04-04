import { useState, useRef } from 'react';
import { useGemini } from '@/hooks/use-gemini';
import FileUpload from './file-upload';

interface MessageInputProps {
  onSubmit: (text: string, files: File[]) => void;
}

export default function MessageInput({ onSubmit }: MessageInputProps) {
  const [promptText, setPromptText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Approximate token count (rough estimation)
  const tokenCount = Math.ceil(promptText.length / 4);
  
  const handleSubmit = () => {
    if (!promptText.trim() && files.length === 0) return;
    
    onSubmit(promptText, files);
    setPromptText('');
    setFiles([]);
    setShowFileUpload(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
  };
  
  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t border-neutral-300 dark:border-neutral-700 p-4">
      <div className="relative">
        {/* File Upload Preview */}
        {files.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div 
                key={index} 
                className="flex items-center gap-1.5 bg-neutral-200 dark:bg-neutral-700 px-2 py-1 rounded text-xs"
              >
                <span className="material-icons text-xs">
                  {file.type.startsWith('image/') ? 'image' : 'insert_drive_file'}
                </span>
                <span className="max-w-[150px] truncate">{file.name}</span>
                <button 
                  className="text-neutral-500 hover:text-error"
                  onClick={() => removeFile(index)}
                >
                  <span className="material-icons text-xs">close</span>
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* File Upload Panel */}
        {showFileUpload && (
          <div className="mb-3 p-3 border border-neutral-300 dark:border-neutral-700 rounded-lg">
            <FileUpload onFilesSelected={handleFilesSelected} />
          </div>
        )}
        
        <div className="flex items-center space-x-2 mb-2">
          <button 
            className={`p-1 ${showFileUpload ? 'text-primary' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'}`}
            onClick={() => setShowFileUpload(!showFileUpload)}
          >
            <span className="material-icons text-base">attachment</span>
          </button>
          <button className="p-1 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">
            <span className="material-icons text-base">code</span>
          </button>
          <button className="p-1 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">
            <span className="material-icons text-base">construction</span>
          </button>
          <span className="text-xs text-neutral-500 ml-auto">
            {tokenCount}/{30000}
          </span>
        </div>
        
        <textarea 
          ref={textareaRef}
          placeholder="Ask PodPlay Assistant..." 
          className="w-full border border-neutral-300 dark:border-neutral-700 rounded-lg p-3 pr-10 bg-white dark:bg-neutral-800 resize-none focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary focus:border-transparent"
          rows={4}
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        
        <button 
          className="absolute right-3 bottom-3 bg-primary text-white rounded-full p-1.5 hover:bg-blue-600 disabled:bg-neutral-300 disabled:text-neutral-500"
          onClick={handleSubmit}
          disabled={!promptText.trim() && files.length === 0}
        >
          <span className="material-icons">send</span>
        </button>
      </div>
      
      <div className="text-xs text-neutral-500 mt-2">
        PodPlay Assistant may display inaccurate info, including about people, places, or facts.
      </div>
    </div>
  );
}
