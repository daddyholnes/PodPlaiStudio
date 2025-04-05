import { v4 as uuidv4 } from 'uuid';

// File system types
export interface FileSystemNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  parentId: string | null;
  children?: string[]; // Used for folders to store children IDs
  content?: string; // Used for files to store content
  createdAt: number;
  updatedAt: number;
}

export interface FileSystemState {
  nodes: Record<string, FileSystemNode>;
  rootId: string;
  activeProjectId: string | null;
  projects: Record<string, {
    id: string;
    name: string;
    rootId: string;
  }>;
  currentFileId: string | null;
}

// Default project content with common files
const DEFAULT_PROJECT = {
  'index.js': '// Welcome to PodPlai Studio\n\nconsole.log("Hello, world!");\n',
  'index.html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Project</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <h1>Hello, World!</h1>\n  <script src="index.js"></script>\n</body>\n</html>',
  'styles.css': '/* Main styles */\nbody {\n  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;\n  line-height: 1.6;\n  color: #333;\n  margin: 0;\n  padding: 20px;\n  max-width: 800px;\n  margin: 0 auto;\n}\n\nh1 {\n  color: #0066cc;\n}\n',
  'README.md': '# My Project\n\nThis is a new project created with PodPlai Studio.\n\n## Getting Started\n\n1. Edit the files in the editor\n2. Run your code with the Run button\n3. See the output in the terminal\n',
};

// Create initial filesystem with default project
const createInitialFileSystem = (): FileSystemState => {
  const rootId = uuidv4();
  const projectId = uuidv4();
  
  const nodes: Record<string, FileSystemNode> = {
    [rootId]: {
      id: rootId,
      name: 'My Project',
      path: 'My Project',
      type: 'folder',
      parentId: null,
      children: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  };
  
  // Create files for the default project
  const fileIds: string[] = [];
  
  for (const [fileName, fileContent] of Object.entries(DEFAULT_PROJECT)) {
    const fileId = uuidv4();
    nodes[fileId] = {
      id: fileId,
      name: fileName,
      path: `My Project/${fileName}`,
      type: 'file',
      parentId: rootId,
      content: fileContent,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    fileIds.push(fileId);
  }
  
  // Set children IDs for root folder
  nodes[rootId].children = fileIds;
  
  return {
    nodes,
    rootId,
    activeProjectId: projectId,
    projects: {
      [projectId]: {
        id: projectId,
        name: 'My Project',
        rootId,
      }
    },
    currentFileId: null,
  };
};

// Load filesystem from localStorage or create a new one
const loadFileSystem = (): FileSystemState => {
  try {
    const stored = localStorage.getItem('podplai-filesystem');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading filesystem:', error);
  }
  
  return createInitialFileSystem();
};

// Save filesystem to localStorage
const saveFileSystem = (state: FileSystemState): void => {
  try {
    localStorage.setItem('podplai-filesystem', JSON.stringify(state));
  } catch (error) {
    console.error('Error saving filesystem:', error);
  }
};

// FileSystem API class
export class FileSystemService {
  private state: FileSystemState;
  
  constructor() {
    this.state = loadFileSystem();
  }
  
  // Get current state
  getState(): FileSystemState {
    return { ...this.state };
  }
  
  // Save current state
  private saveState(): void {
    saveFileSystem(this.state);
  }
  
  // Get all files in a flat structure
  getAllFiles(): FileSystemNode[] {
    return Object.values(this.state.nodes).filter(node => node.type === 'file');
  }
  
  // Get all folders in a flat structure
  getAllFolders(): FileSystemNode[] {
    return Object.values(this.state.nodes).filter(node => node.type === 'folder');
  }
  
  // Get file by path
  getFileByPath(path: string): FileSystemNode | null {
    const node = Object.values(this.state.nodes).find(n => n.path === path);
    return node || null;
  }
  
  // Get file by ID
  getFileById(id: string): FileSystemNode | null {
    return this.state.nodes[id] || null;
  }
  
  // Get current file
  getCurrentFile(): FileSystemNode | null {
    if (!this.state.currentFileId) return null;
    return this.state.nodes[this.state.currentFileId] || null;
  }
  
  // Set current file by ID
  setCurrentFile(id: string): FileSystemNode | null {
    const file = this.state.nodes[id];
    if (file && file.type === 'file') {
      this.state.currentFileId = id;
      this.saveState();
      return file;
    }
    return null;
  }
  
  // Set current file by path
  setCurrentFileByPath(path: string): FileSystemNode | null {
    const file = this.getFileByPath(path);
    if (file && file.type === 'file') {
      this.state.currentFileId = file.id;
      this.saveState();
      return file;
    }
    return null;
  }
  
  // Get file content
  getFileContent(id: string): string {
    const file = this.state.nodes[id];
    if (file && file.type === 'file') {
      return file.content || '';
    }
    return '';
  }
  
  // Update file content
  updateFileContent(id: string, content: string): boolean {
    const file = this.state.nodes[id];
    if (file && file.type === 'file') {
      this.state.nodes[id] = {
        ...file,
        content,
        updatedAt: Date.now(),
      };
      this.saveState();
      return true;
    }
    return false;
  }
  
  // Create a new file
  createFile(parentPath: string, name: string, content: string = ''): FileSystemNode | null {
    // Find parent folder
    const parentFolder = Object.values(this.state.nodes).find(
      node => node.type === 'folder' && node.path === parentPath
    );
    
    if (!parentFolder) {
      // If parent not found, try to create at root level
      const rootFolder = this.state.nodes[this.state.rootId];
      if (!rootFolder) return null;
      
      const path = `${rootFolder.path}/${name}`;
      
      // Check if file already exists
      const existingFile = this.getFileByPath(path);
      if (existingFile) return existingFile;
      
      const newId = uuidv4();
      const newFile: FileSystemNode = {
        id: newId,
        name,
        path,
        type: 'file',
        parentId: rootFolder.id,
        content,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      this.state.nodes[newId] = newFile;
      
      // Add to parent's children
      if (!rootFolder.children) {
        rootFolder.children = [];
      }
      rootFolder.children.push(newId);
      
      this.saveState();
      return newFile;
    }
    
    const path = `${parentFolder.path}/${name}`;
    
    // Check if file already exists
    const existingFile = this.getFileByPath(path);
    if (existingFile) return existingFile;
    
    const newId = uuidv4();
    const newFile: FileSystemNode = {
      id: newId,
      name,
      path,
      type: 'file',
      parentId: parentFolder.id,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    this.state.nodes[newId] = newFile;
    
    // Add to parent's children
    if (!parentFolder.children) {
      parentFolder.children = [];
    }
    parentFolder.children.push(newId);
    
    this.saveState();
    return newFile;
  }
  
  // Create a new folder
  createFolder(parentPath: string, name: string): FileSystemNode | null {
    // Find parent folder
    const parentFolder = Object.values(this.state.nodes).find(
      node => node.type === 'folder' && node.path === parentPath
    );
    
    if (!parentFolder) {
      // If parent not found, try to create at root level
      const rootFolder = this.state.nodes[this.state.rootId];
      if (!rootFolder) return null;
      
      const path = `${rootFolder.path}/${name}`;
      
      // Check if folder already exists
      const existingFolder = this.getFileByPath(path);
      if (existingFolder) return existingFolder;
      
      const newId = uuidv4();
      const newFolder: FileSystemNode = {
        id: newId,
        name,
        path,
        type: 'folder',
        parentId: rootFolder.id,
        children: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      this.state.nodes[newId] = newFolder;
      
      // Add to parent's children
      if (!rootFolder.children) {
        rootFolder.children = [];
      }
      rootFolder.children.push(newId);
      
      this.saveState();
      return newFolder;
    }
    
    const path = `${parentFolder.path}/${name}`;
    
    // Check if folder already exists
    const existingFolder = this.getFileByPath(path);
    if (existingFolder) return existingFolder;
    
    const newId = uuidv4();
    const newFolder: FileSystemNode = {
      id: newId,
      name,
      path,
      type: 'folder',
      parentId: parentFolder.id,
      children: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    this.state.nodes[newId] = newFolder;
    
    // Add to parent's children
    if (!parentFolder.children) {
      parentFolder.children = [];
    }
    parentFolder.children.push(newId);
    
    this.saveState();
    return newFolder;
  }
  
  // Delete a file or folder
  deleteNode(id: string): boolean {
    const node = this.state.nodes[id];
    if (!node) return false;
    
    // If it's a folder, delete all children recursively
    if (node.type === 'folder' && node.children) {
      for (const childId of node.children) {
        this.deleteNode(childId);
      }
    }
    
    // Remove from parent's children
    if (node.parentId) {
      const parent = this.state.nodes[node.parentId];
      if (parent && parent.children) {
        parent.children = parent.children.filter(childId => childId !== id);
      }
    }
    
    // Remove from state
    delete this.state.nodes[id];
    
    // If it was the current file, clear current file
    if (this.state.currentFileId === id) {
      this.state.currentFileId = null;
    }
    
    this.saveState();
    return true;
  }
  
  // Rename a file or folder
  renameNode(id: string, newName: string): boolean {
    const node = this.state.nodes[id];
    if (!node) return false;
    
    const oldPath = node.path;
    const pathParts = oldPath.split('/');
    pathParts[pathParts.length - 1] = newName;
    const newPath = pathParts.join('/');
    
    // Check if a node with this path already exists
    const existingNode = this.getFileByPath(newPath);
    if (existingNode && existingNode.id !== id) {
      return false;
    }
    
    // Update node path
    node.name = newName;
    node.path = newPath;
    node.updatedAt = Date.now();
    
    // If it's a folder, update all children paths recursively
    if (node.type === 'folder' && node.children) {
      this.updateChildrenPaths(node.id, oldPath, newPath);
    }
    
    this.saveState();
    return true;
  }
  
  // Update paths of all children when a folder is renamed
  private updateChildrenPaths(folderId: string, oldBasePath: string, newBasePath: string): void {
    const folder = this.state.nodes[folderId];
    if (!folder || !folder.children) return;
    
    for (const childId of folder.children) {
      const child = this.state.nodes[childId];
      if (!child) continue;
      
      // Update path by replacing the base path
      child.path = child.path.replace(oldBasePath, newBasePath);
      
      // If it's a folder, recursively update its children
      if (child.type === 'folder' && child.children) {
        this.updateChildrenPaths(child.id, oldBasePath, newBasePath);
      }
    }
  }
  
  // Get all projects
  getProjects(): Array<{ id: string; name: string }> {
    return Object.values(this.state.projects).map(project => ({
      id: project.id,
      name: project.name
    }));
  }
  
  // Get active project
  getActiveProject(): { id: string; name: string } | null {
    if (!this.state.activeProjectId) return null;
    const project = this.state.projects[this.state.activeProjectId];
    if (!project) return null;
    return {
      id: project.id,
      name: project.name
    };
  }
  
  // Set active project
  setActiveProject(projectId: string): boolean {
    if (!this.state.projects[projectId]) return false;
    this.state.activeProjectId = projectId;
    this.saveState();
    return true;
  }
  
  // Create a new project
  createProject(name: string): { id: string; name: string } {
    const projectId = uuidv4();
    const rootId = uuidv4();
    
    // Create root folder for project
    this.state.nodes[rootId] = {
      id: rootId,
      name,
      path: name,
      type: 'folder',
      parentId: null,
      children: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    // Create project entry
    this.state.projects[projectId] = {
      id: projectId,
      name,
      rootId,
    };
    
    // Set as active project
    this.state.activeProjectId = projectId;
    
    // Create default files
    const fileIds: string[] = [];
    
    for (const [fileName, fileContent] of Object.entries(DEFAULT_PROJECT)) {
      const fileId = uuidv4();
      this.state.nodes[fileId] = {
        id: fileId,
        name: fileName,
        path: `${name}/${fileName}`,
        type: 'file',
        parentId: rootId,
        content: fileContent,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      fileIds.push(fileId);
    }
    
    // Set children IDs for root folder
    this.state.nodes[rootId].children = fileIds;
    
    this.saveState();
    
    return {
      id: projectId,
      name,
    };
  }
  
  // Delete a project
  deleteProject(projectId: string): boolean {
    const project = this.state.projects[projectId];
    if (!project) return false;
    
    // Delete all files in the project
    this.deleteNode(project.rootId);
    
    // Remove project from projects list
    delete this.state.projects[projectId];
    
    // If it was the active project, set active project to another one
    if (this.state.activeProjectId === projectId) {
      const projects = Object.keys(this.state.projects);
      this.state.activeProjectId = projects.length > 0 ? projects[0] : null;
    }
    
    this.saveState();
    return true;
  }
  
  // Rename a project
  renameProject(projectId: string, newName: string): boolean {
    const project = this.state.projects[projectId];
    if (!project) return false;
    
    // Update project name
    project.name = newName;
    
    // Update root folder name and path
    const rootFolder = this.state.nodes[project.rootId];
    if (rootFolder) {
      const oldPath = rootFolder.path;
      rootFolder.name = newName;
      rootFolder.path = newName;
      
      // Update paths of all children
      this.updateChildrenPaths(rootFolder.id, oldPath, newName);
    }
    
    this.saveState();
    return true;
  }
  
  // Get the file tree structure for UI
  getFileTree(): any {
    const buildTree = (nodeId: string) => {
      const node = this.state.nodes[nodeId];
      if (!node) return null;
      
      if (node.type === 'file') {
        return {
          id: node.id,
          name: node.name,
          path: node.path,
          type: 'file',
        };
      }
      
      // It's a folder, build children tree
      const children = node.children?.map(childId => buildTree(childId)).filter(Boolean) || [];
      
      return {
        id: node.id,
        name: node.name,
        path: node.path,
        type: 'folder',
        children,
      };
    };
    
    // Start with the root of the active project
    if (!this.state.activeProjectId) return null;
    const activeProject = this.state.projects[this.state.activeProjectId];
    if (!activeProject) return null;
    
    return buildTree(activeProject.rootId);
  }
}

// Create a singleton instance
export const fileSystemService = new FileSystemService();
