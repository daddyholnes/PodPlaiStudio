import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
  extension?: string;
  content?: string;
  children?: FileNode[];
}

export class FileService {
  private static instance: FileService;
  private cache: Map<string, FileNode> = new Map();

  private constructor() {}

  public static getInstance(): FileService {
    if (!FileService.instance) {
      FileService.instance = new FileService();
    }
    return FileService.instance;
  }

  public async getFileTree(): Promise<FileNode[]> {
    try {
      const response = await axios.get('/api/files/tree');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch file tree:', error);
      throw error;
    }
  }

  public async getFile(path: string): Promise<string> {
    try {
      const response = await axios.get(`/api/files?path=${encodeURIComponent(path)}`);
      return response.data.content;
    } catch (error) {
      console.error(`Failed to fetch file: ${path}`, error);
      throw error;
    }
  }

  public async createFile(path: string, content: string = ''): Promise<FileNode> {
    try {
      const response = await axios.post('/api/files', { path, content });
      return response.data;
    } catch (error) {
      console.error(`Failed to create file: ${path}`, error);
      throw error;
    }
  }

  public async createDirectory(path: string): Promise<FileNode> {
    try {
      const response = await axios.post('/api/files/directories', { path });
      return response.data;
    } catch (error) {
      console.error(`Failed to create directory: ${path}`, error);
      throw error;
    }
  }

  public async updateFile(path: string, content: string): Promise<FileNode> {
    try {
      const response = await axios.put('/api/files', { path, content });
      return response.data;
    } catch (error) {
      console.error(`Failed to update file: ${path}`, error);
      throw error;
    }
  }

  public async deleteFile(path: string): Promise<void> {
    try {
      await axios.delete(`/api/files?path=${encodeURIComponent(path)}`);
      // Invalidate cache for this path
      this.cache.delete(path);
    } catch (error) {
      console.error(`Failed to delete file: ${path}`, error);
      throw error;
    }
  }

  public async renameFile(oldPath: string, newPath: string): Promise<FileNode> {
    try {
      const response = await axios.patch('/api/files/rename', { oldPath, newPath });
      // Invalidate cache for old path
      this.cache.delete(oldPath);
      return response.data;
    } catch (error) {
      console.error(`Failed to rename file from ${oldPath} to ${newPath}`, error);
      throw error;
    }
  }

  public async uploadFile(path: string, file: File): Promise<FileNode> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', path);

      const response = await axios.post('/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error(`Failed to upload file to ${path}`, error);
      throw error;
    }
  }

  public async uploadFiles(path: string, files: File[]): Promise<FileNode[]> {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      formData.append('path', path);
      
      const response = await axios.post('/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Failed to upload files to ${path}`, error);
      throw error;
    }
  }

  public getFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    // Common file types
    const fileTypes: Record<string, string> = {
      // Code files
      js: 'JavaScript',
      ts: 'TypeScript',
      jsx: 'React JSX',
      tsx: 'React TSX',
      html: 'HTML',
      css: 'CSS',
      scss: 'SCSS',
      less: 'LESS',
      py: 'Python',
      java: 'Java',
      rb: 'Ruby',
      php: 'PHP',
      go: 'Go',
      rs: 'Rust',
      c: 'C',
      cpp: 'C++',
      cs: 'C#',
      swift: 'Swift',
      kt: 'Kotlin',
      
      // Data files
      json: 'JSON',
      xml: 'XML',
      yaml: 'YAML',
      yml: 'YAML',
      csv: 'CSV',
      
      // Document files
      md: 'Markdown',
      txt: 'Text',
      docx: 'Word',
      pdf: 'PDF',
      
      // Media files
      jpg: 'Image',
      jpeg: 'Image',
      png: 'Image',
      gif: 'Image',
      svg: 'SVG',
      mp4: 'Video',
      mp3: 'Audio',
      
      // Config files
      gitignore: 'Git',
      env: 'Environment',
      lock: 'Lock',
      
      // Package files
      'package.json': 'NPM Package',
      'yarn.lock': 'Yarn Lock',
      'package-lock.json': 'NPM Lock',
    };
    
    return fileTypes[extension] || 'Unknown';
  }

  public getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    // Map extensions to icon names
    // You can extend this based on your icon library
    const iconMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      jsx: 'react',
      tsx: 'react',
      html: 'html',
      css: 'css',
      py: 'python',
      md: 'markdown',
      json: 'json',
      pdf: 'pdf',
      docx: 'word',
      jpg: 'image',
      jpeg: 'image',
      png: 'image',
      gif: 'image',
      svg: 'image',
      mp4: 'video',
      mp3: 'audio'
    };
    
    return iconMap[extension] || 'document';
  }

  // Helper methods to process response data
  private processFileTree(data: any[]): FileNode[] {
    return data.map(node => this.processFileNode(node));
  }

  private processFileNode(node: any): FileNode {
    const fileNode: FileNode = {
      id: node.id || uuidv4(),
      name: node.name,
      path: node.path,
      type: node.type,
      size: node.size,
      modified: node.modified,
      extension: node.name.includes('.') ? node.name.split('.').pop() : undefined
    };

    if (node.children) {
      fileNode.children = node.children.map((child: any) => this.processFileNode(child));
    }

    // Cache this node for quick access
    this.cache.set(fileNode.path, fileNode);

    return fileNode;
  }
}

export default FileService;
