import { useState, useEffect, useCallback } from 'react';
import { fileSystemService, FileSystemNode } from '@/services/FileSystemService';
import { toast } from '@/hooks/use-toast';

interface UseFileSystemReturn {
  files: FileSystemNode[];
  currentFile: FileSystemNode | null;
  fileContent: string;
  setFileContent: (content: string) => void;
  saveFile: (path: string, content: string) => Promise<boolean>;
  createFile: (name: string, content?: string, parentPath?: string) => Promise<FileSystemNode | null>;
  renameFile: (id: string, newName: string) => Promise<boolean>;
  deleteFile: (id: string) => Promise<boolean>;
  selectFile: (path: string) => Promise<FileSystemNode | null>;
  createFolder: (name: string, parentPath?: string) => Promise<FileSystemNode | null>;
  fileTree: any;
  refreshFileTree: () => void;
  activeProject: string | null;
  setActiveProject: (id: string) => Promise<boolean>;
  projects: Array<{ id: string; name: string }>;
  createProject: (name: string) => Promise<{ id: string; name: string }>;
  deleteProject: (id: string) => Promise<boolean>;
  renameProject: (id: string, newName: string) => Promise<boolean>;
  getLanguageFromFilename: (filename: string) => string;
}

export function useFileSystem(): UseFileSystemReturn {
  const [files, setFiles] = useState<FileSystemNode[]>([]);
  const [currentFile, setCurrentFile] = useState<FileSystemNode | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [fileTree, setFileTree] = useState<any>(null);
  const [activeProject, setActiveProjectState] = useState<string | null>(null);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  
  // Refresh the file list
  const refreshFiles = useCallback(() => {
    const allFiles = fileSystemService.getAllFiles();
    setFiles(allFiles);
    
    // Update current file if needed
    const currentFileFromService = fileSystemService.getCurrentFile();
    if (currentFileFromService) {
      setCurrentFile(currentFileFromService);
      setFileContent(currentFileFromService.content || '');
    } else {
      setCurrentFile(null);
      setFileContent('');
    }
  }, []);
  
  // Refresh the file tree
  const refreshFileTree = useCallback(() => {
    const tree = fileSystemService.getFileTree();
    setFileTree(tree);
    
    // Also refresh projects
    const projectsList = fileSystemService.getProjects();
    setProjects(projectsList);
    
    // Set active project
    const active = fileSystemService.getActiveProject();
    setActiveProjectState(active?.name || null);
  }, []);
  
  // Initialize
  useEffect(() => {
    refreshFiles();
    refreshFileTree();
  }, [refreshFiles, refreshFileTree]);
  
  // Save file content
  const saveFile = useCallback(async (path: string, content: string): Promise<boolean> => {
    try {
      // Find file by path
      const file = fileSystemService.getFileByPath(path);
      if (!file) {
        toast({
          title: 'Error',
          description: `File not found: ${path}`,
          variant: 'destructive',
        });
        return false;
      }
      
      // Update file content
      const success = fileSystemService.updateFileContent(file.id, content);
      if (success) {
        refreshFiles();
        toast({
          title: 'Success',
          description: `File saved: ${path}`,
          variant: 'default',
        });
        return true;
      } else {
        toast({
          title: 'Error',
          description: `Failed to save file: ${path}`,
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error saving file:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while saving the file',
        variant: 'destructive',
      });
      return false;
    }
  }, [refreshFiles]);
  
  // Create a new file
  const createFile = useCallback(async (
    name: string, 
    content: string = '', 
    parentPath?: string
  ): Promise<FileSystemNode | null> => {
    try {
      const parent = parentPath || (fileSystemService.getActiveProject()?.name || '');
      const newFile = fileSystemService.createFile(parent, name, content);
      
      if (newFile) {
        refreshFiles();
        refreshFileTree();
        
        // Select the new file
        fileSystemService.setCurrentFile(newFile.id);
        setCurrentFile(newFile);
        setFileContent(content);
        
        toast({
          title: 'Success',
          description: `File created: ${name}`,
          variant: 'default',
        });
        
        return newFile;
      } else {
        toast({
          title: 'Error',
          description: `Failed to create file: ${name}`,
          variant: 'destructive',
        });
        return null;
      }
    } catch (error) {
      console.error('Error creating file:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while creating the file',
        variant: 'destructive',
      });
      return null;
    }
  }, [refreshFiles, refreshFileTree]);
  
  // Create a new folder
  const createFolder = useCallback(async (
    name: string, 
    parentPath?: string
  ): Promise<FileSystemNode | null> => {
    try {
      const parent = parentPath || (fileSystemService.getActiveProject()?.name || '');
      const newFolder = fileSystemService.createFolder(parent, name);
      
      if (newFolder) {
        refreshFiles();
        refreshFileTree();
        
        toast({
          title: 'Success',
          description: `Folder created: ${name}`,
          variant: 'default',
        });
        
        return newFolder;
      } else {
        toast({
          title: 'Error',
          description: `Failed to create folder: ${name}`,
          variant: 'destructive',
        });
        return null;
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while creating the folder',
        variant: 'destructive',
      });
      return null;
    }
  }, [refreshFiles, refreshFileTree]);
  
  // Rename a file or folder
  const renameFile = useCallback(async (id: string, newName: string): Promise<boolean> => {
    try {
      const success = fileSystemService.renameNode(id, newName);
      
      if (success) {
        refreshFiles();
        refreshFileTree();
        
        toast({
          title: 'Success',
          description: `Renamed to: ${newName}`,
          variant: 'default',
        });
        
        return true;
      } else {
        toast({
          title: 'Error',
          description: `Failed to rename to: ${newName}`,
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error renaming file:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while renaming',
        variant: 'destructive',
      });
      return false;
    }
  }, [refreshFiles, refreshFileTree]);
  
  // Delete a file or folder
  const deleteFile = useCallback(async (id: string): Promise<boolean> => {
    try {
      const node = fileSystemService.getFileById(id);
      if (!node) {
        toast({
          title: 'Error',
          description: 'File not found',
          variant: 'destructive',
        });
        return false;
      }
      
      const success = fileSystemService.deleteNode(id);
      
      if (success) {
        refreshFiles();
        refreshFileTree();
        
        toast({
          title: 'Success',
          description: `Deleted: ${node.name}`,
          variant: 'default',
        });
        
        return true;
      } else {
        toast({
          title: 'Error',
          description: `Failed to delete: ${node.name}`,
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while deleting',
        variant: 'destructive',
      });
      return false;
    }
  }, [refreshFiles, refreshFileTree]);
  
  // Select a file
  const selectFile = useCallback(async (path: string): Promise<FileSystemNode | null> => {
    try {
      const file = fileSystemService.getFileByPath(path);
      if (!file || file.type !== 'file') {
        return null;
      }
      
      fileSystemService.setCurrentFile(file.id);
      setCurrentFile(file);
      setFileContent(file.content || '');
      
      return file;
    } catch (error) {
      console.error('Error selecting file:', error);
      return null;
    }
  }, []);
  
  // Set active project
  const setActiveProject = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = fileSystemService.setActiveProject(id);
      
      if (success) {
        refreshFiles();
        refreshFileTree();
        
        // Update active project state
        const active = fileSystemService.getActiveProject();
        setActiveProjectState(active?.name || null);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error setting active project:', error);
      return false;
    }
  }, [refreshFiles, refreshFileTree]);
  
  // Create a new project
  const createProject = useCallback(async (name: string): Promise<{ id: string; name: string }> => {
    try {
      const project = fileSystemService.createProject(name);
      
      refreshFiles();
      refreshFileTree();
      
      // Update active project state
      setActiveProjectState(name);
      
      toast({
        title: 'Success',
        description: `Project created: ${name}`,
        variant: 'default',
      });
      
      return project;
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while creating the project',
        variant: 'destructive',
      });
      throw error;
    }
  }, [refreshFiles, refreshFileTree]);
  
  // Delete a project
  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = fileSystemService.deleteProject(id);
      
      if (success) {
        refreshFiles();
        refreshFileTree();
        
        // Update active project state
        const active = fileSystemService.getActiveProject();
        setActiveProjectState(active?.name || null);
        
        toast({
          title: 'Success',
          description: 'Project deleted',
          variant: 'default',
        });
        
        return true;
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete project',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while deleting the project',
        variant: 'destructive',
      });
      return false;
    }
  }, [refreshFiles, refreshFileTree]);
  
  // Rename a project
  const renameProject = useCallback(async (id: string, newName: string): Promise<boolean> => {
    try {
      const success = fileSystemService.renameProject(id, newName);
      
      if (success) {
        refreshFiles();
        refreshFileTree();
        
        // Update active project state if needed
        const active = fileSystemService.getActiveProject();
        if (active?.id === id) {
          setActiveProjectState(newName);
        }
        
        toast({
          title: 'Success',
          description: `Project renamed to: ${newName}`,
          variant: 'default',
        });
        
        return true;
      } else {
        toast({
          title: 'Error',
          description: `Failed to rename project to: ${newName}`,
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error renaming project:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while renaming the project',
        variant: 'destructive',
      });
      return false;
    }
  }, [refreshFiles, refreshFileTree]);
  
  // Get language from filename
  const getLanguageFromFilename = useCallback((filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    if (!extension) return 'plaintext';
    
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
      'php': 'php',
    };
    
    return languageMap[extension] || 'plaintext';
  }, []);
  
  return {
    files,
    currentFile,
    fileContent,
    setFileContent,
    saveFile,
    createFile,
    renameFile,
    deleteFile,
    selectFile,
    createFolder,
    fileTree,
    refreshFileTree,
    activeProject,
    setActiveProject,
    projects,
    createProject,
    deleteProject,
    renameProject,
    getLanguageFromFilename,
  };
}
