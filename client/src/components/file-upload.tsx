import { useState, useRef } from 'react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
}

export default function FileUpload({ onFilesSelected }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      onFilesSelected(droppedFiles);
    }
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      onFilesSelected(selectedFiles);
      
      // Reset the file input value so the same file can be uploaded again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="file-upload-container">
      <div 
        className={`border-2 ${isDragging ? 'border-primary bg-blue-50 dark:bg-blue-900/10' : 'border-dashed border-neutral-300 dark:border-neutral-700'} 
        rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <span className="material-icons text-3xl text-neutral-400 dark:text-neutral-500 mb-2">cloud_upload</span>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Drag files here or click to browse
        </p>
        <p className="text-xs text-neutral-500 mt-1">
          Supports images, PDFs, and documents
        </p>
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          multiple
        />
      </div>
    </div>
  );
}
