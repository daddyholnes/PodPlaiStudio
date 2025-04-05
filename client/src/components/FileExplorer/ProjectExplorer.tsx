import React, { useState, useRef } from 'react';
import { useFileSystem } from '@/hooks/use-file-system';
import { toast } from '@/hooks/use-toast';

interface ProjectExplorerProps {
  onFileSelect: (path: string) => void;
  onCreateFile?: (name: string, content?: string, parentPath?: string) => Promise<any>;
  onCreateFolder?: (name: string, parentPath?: string) => Promise<any>;
  onRenameFile?: (id: string, newName: string) => Promise<boolean>;
  onDeleteFile?: (id: string) => Promise<boolean>;
  currentFilePath?: string;
}

const ProjectExplorer: React.FC<ProjectExplorerProps> = ({
  onFileSelect,
  onCreateFile,
  onCreateFolder,
  onRenameFile,
  onDeleteFile,
  currentFilePath
}) => {
  const { 
    fileTree, 
    refreshFileTree, 
    activeProject,
    projects,
    createProject,
    setActiveProject
  } = useFileSystem();
  
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenuTarget, setContextMenuTarget] = useState<{ id: string; type: 'file' | 'folder'; path: string } | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<'file' | 'folder' | 'project' | null>(null);
  const [newItemParentPath, setNewItemParentPath] = useState<string>('');
  const [newItemName, setNewItemName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Handle context menu opening
  const handleContextMenu = (e: React.MouseEvent, id: string, type: 'file' | 'folder', path: string) => {
    e.preventDefault();
    setContextMenuVisible(true);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuTarget({ id, type, path });
  };
  
  // Hide context menu when clicking outside
  const handleClickOutside = () => {
    setContextMenuVisible(false);
  };
  
  // Toggle folder expansion
  const toggleFolder = (path: string) => {
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
  
  // Start file/folder creation
  const startCreating = (type: 'file' | 'folder', parentPath: string = '') => {
    setIsCreatingNew(type);
    setNewItemParentPath(parentPath);
    setNewItemName('');
    setContextMenuVisible(false);
    
    // Focus the input after it's rendered
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };
  
  // Start project creation
  const startCreatingProject = () => {
    setIsCreatingNew('project');
    setNewItemName('');
    setContextMenuVisible(false);
    
    // Focus the input after it's rendered
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };
  
  // Start file/folder renaming
  const startRenaming = (id: string, currentName: string) => {
    setIsRenaming(id);
    setRenameValue(currentName);
    setContextMenuVisible(false);
    
    // Focus the input after it's rendered
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };
  
  // Handle file/folder creation submission
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newItemName.trim()) {
      toast({
        title: "Error",
        description: "Name cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (isCreatingNew === 'file' && onCreateFile) {
        await onCreateFile(newItemName, '', newItemParentPath);
        toast({
          title: "Success",
          description: `File '${newItemName}' created`,
          variant: "default"
        });
      } else if (isCreatingNew === 'folder' && onCreateFolder) {
        await onCreateFolder(newItemName, newItemParentPath);
        toast({
          title: "Success",
          description: `Folder '${newItemName}' created`,
          variant: "default"
        });
      } else if (isCreatingNew === 'project') {
        await createProject(newItemName);
        toast({
          title: "Success",
          description: `Project '${newItemName}' created`,
          variant: "default"
        });
      }
      
      refreshFileTree();
    } catch (error) {
      console.error("Error creating item:", error);
      toast({
        title: "Error",
        description: `Failed to create ${isCreatingNew}`,
        variant: "destructive"
      });
    } finally {
      setIsCreatingNew(null);
    }
  };
  
  // Handle file/folder rename submission
  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!renameValue.trim() || !isRenaming) {
      toast({
        title: "Error",
        description: "Name cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (onRenameFile) {
        const success = await onRenameFile(isRenaming, renameValue);
        if (success) {
          toast({
            title: "Success",
            description: `Renamed to '${renameValue}'`,
            variant: "default"
          });
          refreshFileTree();
        } else {
          toast({
            title: "Error",
            description: "Failed to rename item",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("Error renaming item:", error);
      toast({
        title: "Error",
        description: "Failed to rename item",
        variant: "destructive"
      });
    } finally {
      setIsRenaming(null);
    }
  };
  
  // Handle file/folder deletion
  const handleDelete = async () => {
    if (!contextMenuTarget || !onDeleteFile) {
      return;
    }
    
    try {
      const success = await onDeleteFile(contextMenuTarget.id);
      if (success) {
        toast({
          title: "Success",
          description: `${contextMenuTarget.type === 'file' ? 'File' : 'Folder'} deleted`,
          variant: "default"
        });
        refreshFileTree();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete item",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive"
      });
    } finally {
      setContextMenuVisible(false);
    }
  };
  
  // Cancel creation/renaming
  const handleCancel = () => {
    setIsCreatingNew(null);
    setIsRenaming(null);
  };
  
  // Recursive function to render the file tree
  const renderTree = (tree: any) => {
    if (!tree) return null;
    
    return (
      <ul className="ml-2">
        {tree.children?.map((item: any) => {
          const isExpanded = expandedFolders.has(item.path);
          const isCurrentFile = currentFilePath === item.path;
          
          if (isRenaming === item.id) {
            return (
              <li key={item.id} className="py-1">
                <form onSubmit={handleRenameSubmit} className="flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded text-xs p-1 w-full"
                    autoFocus
                  />
                  <button 
                    type="submit"
                    className="ml-1 p-1 text-green-500 hover:text-green-700"
                  >
                    <span className="material-icons text-xs">check</span>
                  </button>
                  <button 
                    type="button"
                    onClick={handleCancel}
                    className="ml-1 p-1 text-red-500 hover:text-red-700"
                  >
                    <span className="material-icons text-xs">close</span>
                  </button>
                </form>
              </li>
            );
          }
          
          return (
            <li 
              key={item.id}
              className={`py-1 ${isCurrentFile ? 'bg-primary/10 dark:bg-primary/20 rounded' : ''}`}
              onContextMenu={(e) => handleContextMenu(e, item.id, item.type, item.path)}
            >
              <div 
                className={`flex items-center text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded px-1 cursor-pointer ${
                  isCurrentFile ? 'text-primary font-medium' : ''
                }`}
              >
                {item.type === 'folder' ? (
                  <span 
                    className="material-icons text-base mr-1 text-neutral-500 cursor-pointer"
                    onClick={() => toggleFolder(item.path)}
                  >
                    {isExpanded ? 'folder_open' : 'folder'}
                  </span>
                ) : (
                  <span className="material-icons text-base mr-1 text-neutral-500">description</span>
                )}
                
                <span 
                  className="truncate"
                  onClick={() => {
                    if (item.type === 'folder') {
                      toggleFolder(item.path);
                    } else {
                      onFileSelect(item.path);
                    }
                  }}
                >
                  {item.name}
                </span>
              </div>
              
              {item.type === 'folder' && isExpanded && (
                <>
                  {item.children?.length > 0 ? (
                    renderTree(item)
                  ) : (
                    <div className="ml-4 text-xs text-neutral-500 py-1">Empty folder</div>
                  )}
                  
                  {/* New file/folder input field */}
                  {isCreatingNew && newItemParentPath === item.path && (
                    <div className="ml-4 py-1">
                      <form onSubmit={handleCreateSubmit} className="flex items-center">
                        <span className="material-icons text-xs mr-1 text-neutral-500">
                          {isCreatingNew === 'file' ? 'description' : 'folder'}
                        </span>
                        <input
                          ref={inputRef}
                          type="text"
                          value={newItemName}
                          placeholder={`New ${isCreatingNew}`}
                          onChange={(e) => setNewItemName(e.target.value)}
                          className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded text-xs p-1 w-full"
                          autoFocus
                        />
                        <button 
                          type="submit"
                          className="ml-1 p-1 text-green-500 hover:text-green-700"
                        >
                          <span className="material-icons text-xs">check</span>
                        </button>
                        <button 
                          type="button"
                          onClick={handleCancel}
                          className="ml-1 p-1 text-red-500 hover:text-red-700"
                        >
                          <span className="material-icons text-xs">close</span>
                        </button>
                      </form>
                    </div>
                  )}
                </>
              )}
            </li>
          );
        })}
        
        {/* New file/folder input field at root level */}
        {isCreatingNew && newItemParentPath === '' && (
          <li className="py-1">
            <form onSubmit={handleCreateSubmit} className="flex items-center">
              <span className="material-icons text-xs mr-1 text-neutral-500">
                {isCreatingNew === 'file' ? 'description' : 'folder'}
              </span>
              <input
                ref={inputRef}
                type="text"
                value={newItemName}
                placeholder={`New ${isCreatingNew}`}
                onChange={(e) => setNewItemName(e.target.value)}
                className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded text-xs p-1 w-full"
                autoFocus
              />
              <button 
                type="submit"
                className="ml-1 p-1 text-green-500 hover:text-green-700"
              >
                <span className="material-icons text-xs">check</span>
              </button>
              <button 
                type="button"
                onClick={handleCancel}
                className="ml-1 p-1 text-red-500 hover:text-red-700"
              >
                <span className="material-icons text-xs">close</span>
              </button>
            </form>
          </li>
        )}
      </ul>
    );
  };
  
  return (
    <div className="h-full flex flex-col" onClick={handleClickOutside}>
      {/* Header with project dropdown */}
      <div className="border-b border-neutral-300 dark:border-neutral-700 p-2 flex items-center justify-between">
        <div className="flex items-center">
          <span className="material-icons text-sm mr-1">folder</span>
          <select 
            className="bg-transparent text-sm font-medium focus:outline-none"
            value={activeProject || ''}
            onChange={(e) => {
              const projectId = projects.find(p => p.name === e.target.value)?.id;
              if (projectId) {
                setActiveProject(projectId);
              }
            }}
          >
            {projects.map(project => (
              <option key={project.id} value={project.name}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex space-x-1">
          <button 
            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded" 
            onClick={startCreatingProject}
            title="New Project"
          >
            <span className="material-icons text-sm">create_new_folder</span>
          </button>
          <button 
            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded" 
            onClick={() => startCreating('file')}
            title="New File"
          >
            <span className="material-icons text-sm">add</span>
          </button>
          <button 
            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded" 
            onClick={() => startCreating('folder')}
            title="New Folder"
          >
            <span className="material-icons text-sm">create_new_folder</span>
          </button>
          <button 
            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded" 
            onClick={refreshFileTree}
            title="Refresh"
          >
            <span className="material-icons text-sm">refresh</span>
          </button>
        </div>
      </div>
      
      {/* Project creation form */}
      {isCreatingNew === 'project' && (
        <div className="border-b border-neutral-300 dark:border-neutral-700 p-2">
          <form onSubmit={handleCreateSubmit} className="flex items-center">
            <span className="material-icons text-xs mr-1 text-neutral-500">folder</span>
            <input
              ref={inputRef}
              type="text"
              value={newItemName}
              placeholder="New project name"
              onChange={(e) => setNewItemName(e.target.value)}
              className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded text-xs p-1 w-full"
              autoFocus
            />
            <button 
              type="submit"
              className="ml-1 p-1 text-green-500 hover:text-green-700"
            >
              <span className="material-icons text-xs">check</span>
            </button>
            <button 
              type="button"
              onClick={handleCancel}
              className="ml-1 p-1 text-red-500 hover:text-red-700"
            >
              <span className="material-icons text-xs">close</span>
            </button>
          </form>
        </div>
      )}
      
      {/* File Tree */}
      <div className="flex-grow overflow-y-auto p-2">
        {fileTree ? (
          renderTree(fileTree)
        ) : (
          <div className="text-center text-neutral-500 pt-4">
            No files found
          </div>
        )}
      </div>
      
      {/* Context Menu */}
      {contextMenuVisible && contextMenuTarget && (
        <div 
          className="fixed bg-white dark:bg-neutral-800 shadow-lg border border-neutral-300 dark:border-neutral-600 rounded z-50"
          style={{ 
            top: contextMenuPosition.y, 
            left: contextMenuPosition.x,
            minWidth: '150px'
          }}
        >
          <ul className="py-1">
            {contextMenuTarget.type === 'folder' && (
              <>
                <li 
                  className="px-3 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer text-sm"
                  onClick={() => startCreating('file', contextMenuTarget.path)}
                >
                  New File
                </li>
                <li 
                  className="px-3 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer text-sm"
                  onClick={() => startCreating('folder', contextMenuTarget.path)}
                >
                  New Folder
                </li>
                <li><hr className="my-1 border-neutral-300 dark:border-neutral-700" /></li>
              </>
            )}
            <li 
              className="px-3 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer text-sm"
              onClick={() => {
                const name = contextMenuTarget.path.split('/').pop() || '';
                startRenaming(contextMenuTarget.id, name);
              }}
            >
              Rename
            </li>
            <li 
              className="px-3 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer text-sm text-red-600 dark:text-red-400"
              onClick={handleDelete}
            >
              Delete
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProjectExplorer;
