import React from 'react';
import { 
  File, Folder, FolderOpen, Code, FileText, FileJson, 
  Image, Film, Music, FileArchive, FileSpreadsheet,
  Database, FileBadge, FileSearch, FileX
} from 'lucide-react';

interface FileNodeIconProps {
  fileName: string;
  isDirectory: boolean;
  isExpanded?: boolean;
  className?: string;
}

export const FileNodeIcon: React.FC<FileNodeIconProps> = ({ 
  fileName, 
  isDirectory, 
  isExpanded = false,
  className = "h-4 w-4"
}) => {
  if (isDirectory) {
    return isExpanded ? 
      <FolderOpen className={`${className} text-yellow-500`} /> : 
      <Folder className={`${className} text-yellow-500`} />;
  }
  
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  switch (extension) {
    case 'js':
    case 'jsx':
      return <Code className={`${className} text-yellow-400`} />;
    case 'ts':
    case 'tsx':
      return <Code className={`${className} text-blue-500`} />;
    case 'json':
      return <FileJson className={`${className} text-yellow-600`} />;
    case 'html':
      return <Code className={`${className} text-red-500`} />;
    case 'css':
      return <Code className={`${className} text-blue-400`} />;
    case 'scss':
    case 'sass':
      return <Code className={`${className} text-pink-500`} />;
    case 'md':
      return <FileText className={`${className} text-gray-500`} />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
    case 'webp':
      return <Image className={`${className} text-green-500`} />;
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'webm':
      return <Film className={`${className} text-pink-500`} />;
    case 'mp3':
    case 'wav':
    case 'ogg':
      return <Music className={`${className} text-indigo-500`} />;
    case 'zip':
    case 'rar':
    case 'tar':
    case 'gz':
      return <FileArchive className={`${className} text-amber-500`} />;
    case 'csv':
    case 'xls':
    case 'xlsx':
      return <FileSpreadsheet className={`${className} text-green-700`} />;
    case 'sql':
    case 'db':
      return <Database className={`${className} text-blue-700`} />;
    case 'pdf':
      return <FileBadge className={`${className} text-red-600`} />;
    case 'sh':
    case 'bash':
    case 'zsh':
    case 'bat':
    case 'cmd':
      return <FileSearch className={`${className} text-green-600`} />;
    case 'lock':
    case 'env':
    case 'gitignore':
      return <FileX className={`${className} text-gray-600`} />;
    default:
      return <File className={`${className} text-gray-500`} />;
  }
};

export default FileNodeIcon;
