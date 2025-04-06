import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronRight, ChevronDown, File, Folder, FolderOpen,
  RefreshCw, Plus, PlusCircle, MoreVertical, Upload, FileText,
  Code, FileJson, Image, Film, Music, Archive, FileSpreadsheet,
  FileArchive
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TooltipProvider, 
  Tooltip, 
  TooltipTrigger, 
  TooltipContent 
} from '@/components/ui/tooltip';
import { format } from 'date-fns';

interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
  extension?: string;
  children?: FileNode[];
}

interface FileExplorerProps {
  onFileSelect?: (file: FileNode) => void;
  onFileOpen?: (file: FileNode) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  onFileSelect,
  onFileOpen,
  onError,
  className,
}) => {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [contextMenuFile, setContextMenuFile] = useState<FileNode | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{x: number, y: number} | null>(null);
  
  // Dialog states
  const [newFileDialog, setNewFileDialog] = useState(false);
  const [newFolderDialog, setNewFolderDialog] = useState(false);
  const [renameDialog, setRenameDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [parentPath, setParentPath] = useState('');
  
  // File upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Drag and drop state
  const [draggedFile, setDraggedFile] = useState<FileNode | null>(null);
  const [dropTarget, setDropTarget] = useState<FileNode | null>(null);

  useEffect(() => {
    loadFileTree();
  }, []);

  const loadFileTree = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would call your API
      const response = await fetch('/api/files/tree');
      const data = await response.json();
      setFileTree(data);
      
      // Expand root directories by default
      const rootFolders = new Set<string>();
      data.forEach((node: FileNode) => {
        if (node.type === 'directory') {
          rootFolders.add(node.path);
        }
      });
      setExpandedFolders(rootFolders);
    } catch (error) {
      console.error('Failed to load file tree:', error);
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFolder = (path: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const handleFileClick = (file: FileNode) => {
    setSelectedFile(file);
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleFileDblClick = (file: FileNode) => {
    if (file.type === 'directory') {
      toggleFolder(file.path);
    } else if (onFileOpen) {
      onFileOpen(file);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, file: FileNode) => {
    e.preventDefault();
    setContextMenuFile(file);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => {
    setContextMenuFile(null);
    setContextMenuPosition(null);
  };

  const openNewFileDialog = (path: string) => {
    setParentPath(path);
    setNewName('');
    setNewFileDialog(true);
  };

  const openNewFolderDialog = (path: string) => {
    setParentPath(path);
    setNewName('');
    setNewFolderDialog(true);
  };

  const openRenameDialog = (file: FileNode) => {
    setContextMenuFile(file);
    setNewName(file.name);
    setRenameDialog(true);
  };

  const openDeleteDialog = (file: FileNode) => {
    setContextMenuFile(file);
    setDeleteDialog(true);
  };

  const handleCreateFile = async () => {
    if (!newName) return;
    
    try {
      const path = `${parentPath}/${newName}`;
      await fetch('/api/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path, content: '' }),
      });
      
      // Refresh file tree
      await loadFileTree();
      
      // Make sure parent folder is expanded
      setExpandedFolders(prev => {
        const newSet = new Set(prev);
        newSet.add(parentPath);
        return newSet;
      });
    } catch (error) {
      console.error('Failed to create file:', error);
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setNewFileDialog(false);
      setNewName('');
    }
  };

  const handleCreateFolder = async () => {
    if (!newName) return;
    
    try {
      const path = `${parentPath}/${newName}`;
      await fetch('/api/files/directories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path }),
      });
      
      // Refresh file tree
      await loadFileTree();
      
      // Make sure parent folder is expanded
      setExpandedFolders(prev => {
        const newSet = new Set(prev);
        newSet.add(parentPath);
        return newSet;
      });
    } catch (error) {
      console.error('Failed to create folder:', error);
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setNewFolderDialog(false);
      setNewName('');
    }
  };

  const handleRenameFile = async () => {
    if (!contextMenuFile || !newName) return;
    
    try {
      const oldPath = contextMenuFile.path;
      const dirPath = oldPath.substring(0, oldPath.lastIndexOf('/'));
      const newPath = `${dirPath}/${newName}`;
      
      await fetch('/api/files/rename', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ oldPath, newPath }),
      });
      
      // Refresh file tree
      await loadFileTree();
    } catch (error) {
      console.error('Failed to rename file:', error);
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setRenameDialog(false);
      setNewName('');
      setContextMenuFile(null);
    }
  };

  const handleDeleteFile = async () => {
    if (!contextMenuFile) return;
    
    try {
      await fetch(`/api/files?path=${encodeURIComponent(contextMenuFile.path)}`, {
        method: 'DELETE',
      });
      
      // Refresh file tree
      await loadFileTree();
      
      // If the deleted file was selected, clear selection
      if (selectedFile && selectedFile.path === contextMenuFile.path) {
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setDeleteDialog(false);
      setContextMenuFile(null);
    }
  };

  const handleUploadFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !contextMenuFile) return;
    
    try {
      const path = contextMenuFile.type === 'directory' 
        ? contextMenuFile.path 
        : contextMenuFile.path.substring(0, contextMenuFile.path.lastIndexOf('/'));
      
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      formData.append('path', path);
      
      await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });
      
      // Refresh file tree
      await loadFileTree();
      
      // Make sure the folder is expanded
      setExpandedFolders(prev => {
        const newSet = new Set(prev);
        newSet.add(path);
        return newSet;
      });
    } catch (error) {
      console.error('Failed to upload files:', error);
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      closeContextMenu();
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, file: FileNode) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', file.path);
    setDraggedFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, file: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (file.type === 'directory' && draggedFile && file.path !== draggedFile.path) {
      setDropTarget(file);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(null);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetFolder: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(null);
    
    if (!draggedFile || targetFolder.type !== 'directory' || targetFolder.path === draggedFile.path) {
      return;
    }
    
    try {
      const fileName = draggedFile.name;
      const newPath = `${targetFolder.path}/${fileName}`;
      
      await fetch('/api/files/rename', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          oldPath: draggedFile.path, 
          newPath 
        }),
      });
      
      // Refresh file tree
      await loadFileTree();
      
      // Make sure the target folder is expanded
      setExpandedFolders(prev => {
        const newSet = new Set(prev);
        newSet.add(targetFolder.path);
        return newSet;
      });
    } catch (error) {
      console.error('Failed to move file:', error);
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setDraggedFile(null);
    }
  };

  // File icon mapping based on file extension
  const getFileIcon = (file: FileNode) => {
    if (file.type === 'directory') {
      return expandedFolders.has(file.path) ? 
        <FolderOpen className="h-4 w-4 text-yellow-500" /> : 
        <Folder className="h-4 w-4 text-yellow-500" />;
    }
    
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    
    switch (extension) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <Code className="h-4 w-4 text-blue-500" />;
      case 'json':
        return <FileJson className="h-4 w-4 text-orange-500" />;
      case 'html':
        return <Code className="h-4 w-4 text-red-500" />;
      case 'css':
      case 'scss':
      case 'less':
        return <Code className="h-4 w-4 text-purple-500" />;
      case 'md':
        return <FileText className="h-4 w-4 text-gray-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return <Image className="h-4 w-4 text-green-500" />;
      case 'mp4':
      case 'avi':
      case 'mov':
        return <Film className="h-4 w-4 text-pink-500" />;
      case 'mp3':
      case 'wav':
        return <Music className="h-4 w-4 text-indigo-500" />;
      case 'zip':
      case 'rar':
      case 'tar':
      case 'gz':
        return <FileArchive className="h-4 w-4 text-amber-500" />;
      case 'csv':
      case 'xls':
      case 'xlsx':
        return <FileSpreadsheet className="h-4 w-4 text-green-700" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined) return 'Unknown';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const renderFileNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFile && selectedFile.path === node.path;
    const isDropTarget = dropTarget && dropTarget.path === node.path;
    
    return (
      <div key={node.id} className="select-none">
        <div
          className={cn(
            'flex items-center py-1 px-2 rounded-md',
            isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
            isDropTarget ? 'border border-primary' : '',
            'cursor-pointer'
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => handleFileClick(node)}
          onDoubleClick={() => handleFileDblClick(node)}
          onContextMenu={(e) => handleContextMenu(e, node)}
          draggable
          onDragStart={(e) => handleDragStart(e, node)}
          onDragOver={(e) => handleDragOver(e, node)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, node)}
        >
          {node.type === 'directory' && (
            <div 
              className="mr-1 cursor-pointer"
              onClick={(e) => toggleFolder(node.path, e)}
            >
              {isExpanded ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </div>
          )}
          
          {node.type !== 'directory' && (
            <div className="w-4 mr-1" />
          )}
          
          {getFileIcon(node)}
          <span className="ml-2 text-sm truncate">{node.name}</span>
        </div>
        
        {isExpanded && node.children && (
          <div className="ml-2">
            {node.children.map(child => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderFileDetails = (file: FileNode | null) => {
    if (!file) return null;
    
    return (
      <div className="p-4 border-t">
        <h3 className="font-medium">{file.name}</h3>
        <div className="text-sm text-muted-foreground mt-2">
          <p>Type: {file.type === 'directory' ? 'Folder' : file.extension ? `${file.extension.toUpperCase()} File` : 'File'}</p>
          {file.type !== 'directory' && <p>Size: {formatFileSize(file.size)}</p>}
          {file.modified && <p>Modified: {file.modified}</p>}
          <p>Path: {file.path}</p>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("flex flex-col h-full border rounded-md", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b">
        <h2 className="text-sm font-medium">Files</h2>
        <div className="flex gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => loadFileTree()}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => openNewFileDialog('')}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New File</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-1">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center py-2 px-2">
              <Skeleton className="h-4 w-4 mr-2" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))
        ) : fileTree.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No files yet</p>
            <Button 
              variant="outline" 
              size="sm"
              className="mt-4"
              onClick={() => openNewFolderDialog('')}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Folder
            </Button>
          </div>
        ) : (
          fileTree.map(node => renderFileNode(node))
        )}
      </div>
      
      {/* Selected File Details */}
      {selectedFile && renderFileDetails(selectedFile)}
      
      {/* Context Menu */}
      {contextMenuFile && contextMenuPosition && (
        <div 
          className="fixed z-50 bg-background border rounded-md shadow-lg overflow-hidden"
          style={{
            left: contextMenuPosition.x,
            top: contextMenuPosition.y
          }}
        >
          <div className="py-1">
            {contextMenuFile.type === 'directory' ? (
              <>
                <div 
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-accent"
                  onClick={() => {
                    openNewFileDialog(contextMenuFile.path);
                    closeContextMenu();
                  }}
                >
                  New File
                </div>
                <div 
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-accent"
                  onClick={() => {
                    openNewFolderDialog(contextMenuFile.path);
                    closeContextMenu();
                  }}
                >
                  New Folder
                </div>
                <div 
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-accent"
                  onClick={() => {
                    handleUploadFile();
                  }}
                >
                  Upload Files
                </div>
              </>
            ) : null}
            
            <div 
              className="px-4 py-2 text-sm cursor-pointer hover:bg-accent"
              onClick={() => {
                openRenameDialog(contextMenuFile);
                closeContextMenu();
              }}
            >
              Rename
            </div>
            <div 
              className="px-4 py-2 text-sm text-red-500 cursor-pointer hover:bg-accent"
              onClick={() => {
                openDeleteDialog(contextMenuFile);
                closeContextMenu();
              }}
            >
              Delete
            </div>
          </div>
        </div>
      )}
      
      {/* Invisible file input for uploads */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileInputChange}
        multiple
      />
      
      {/* Dialogs */}
      <Dialog open={newFileDialog} onOpenChange={setNewFileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New File</DialogTitle>
            <DialogDescription>
              Enter a name for the new file.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="filename">File Name</Label>
            <Input
              id="filename"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="example.js"
              className="mt-2"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFileDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFile}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={newFolderDialog} onOpenChange={setNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for the new folder.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="foldername">Folder Name</Label>
            <Input
              id="foldername"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="my-folder"
              className="mt-2"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={renameDialog} onOpenChange={setRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {contextMenuFile?.type === 'directory' ? 'Folder' : 'File'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="newname">New Name</Label>
            <Input
              id="newname"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mt-2"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameFile}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {contextMenuFile?.type === 'directory' ? 'Folder' : 'File'}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{contextMenuFile?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteFile}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FileExplorer;
