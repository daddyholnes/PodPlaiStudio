import React, { useState, useEffect, useCallback } from 'react';
import { VirtualList } from 'react-virtualized';
import { FaFolder, FaFolderOpen, FaFile, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import { listFiles, createFile, deleteFile, renameFile } from '../../services/fileService';

const FileTree = ({ onFileSelect, currentFilePath }) => {
  const [files, setFiles] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [parentFolderForNewItem, setParentFolderForNewItem] = useState('');
  const [editingFile, setEditingFile] = useState(null);
  const [editName, setEditName] = useState('');

  // Load files on component mount
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      setError('');
      const fileList = await listFiles();
      setFiles(fileList);
    } catch (err) {
      setError('Failed to load files');
      console.error('Error loading files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFolder = (path) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const handleFileClick = (file) => {
    if (file.type === 'file') {
      onFileSelect(file.path);
    } else {
      toggleFolder(file.path);
    }
  };

  const startFileCreation = (parentPath) => {
    setParentFolderForNewItem(parentPath);
    setIsCreatingFile(true);
    setNewItemName('');
  };

  const startFileRename = (file) => {
    setEditingFile(file);
    setEditName(file.name);
  };

  const handleCreateFile = async () => {
    if (!newItemName) return;
    
    try {
      const path = parentFolderForNewItem 
        ? `${parentFolderForNewItem}/${newItemName}` 
        : newItemName;
        
      await createFile(path, '');
      await loadFiles();
      setIsCreatingFile(false);
      setNewItemName('');
    } catch (err) {
      setError('Failed to create file');
      console.error('Error creating file:', err);
    }
  };

  const handleDeleteFile = async (file) => {
    try {
      await deleteFile(file.path);
      await loadFiles();
    } catch (err) {
      setError('Failed to delete file');
      console.error('Error deleting file:', err);
    }
  };

  const handleRenameFile = async () => {
    if (!editName || !editingFile) return;
    
    try {
      const directory = editingFile.path.substring(0, editingFile.path.lastIndexOf('/') + 1);
      const newPath = directory + editName;
      
      await renameFile(editingFile.path, newPath);
      await loadFiles();
      setEditingFile(null);
      setEditName('');
    } catch (err) {
      setError('Failed to rename file');
      console.error('Error renaming file:', err);
    }
  };

  // Build flat list of visible files based on expanded state
  const getVisibleFiles = useCallback(() => {
    const visibleFiles = [];
    
    const addFilesRecursively = (fileList, level) => {
      fileList.forEach(file => {
        // Add the current file/folder
        visibleFiles.push({ ...file, level });
        
        // If it's an expanded folder, add its children
        if (file.type === 'directory' && expandedFolders[file.path]) {
          addFilesRecursively(file.children || [], level + 1);
        }
      });
    };
    
    addFilesRecursively(files, 0);
    return visibleFiles;
  }, [files, expandedFolders]);

  const renderFile = ({ index, style }) => {
    const visibleFiles = getVisibleFiles();
    const file = visibleFiles[index];
    const indent = file.level * 20;
    const isSelected = currentFilePath === file.path;
    
    if (editingFile && editingFile.path === file.path) {
      return (
        <div style={{ ...style, paddingLeft: `${indent}px` }} className="file-row editing">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRenameFile()}
            autoFocus
          />
          <button onClick={handleRenameFile} aria-label="Save">✓</button>
          <button onClick={() => setEditingFile(null)} aria-label="Cancel">✕</button>
        </div>
      );
    }
    
    return (
      <div 
        style={{ ...style, paddingLeft: `${indent}px` }}
        className={`file-row ${isSelected ? 'selected' : ''}`}
        onClick={() => handleFileClick(file)}
      >
        {file.type === 'directory' ? (
          expandedFolders[file.path] ? <FaFolderOpen /> : <FaFolder />
        ) : (
          <FaFile />
        )}
        <span className="file-name">{file.name}</span>
        <div className="file-actions">
          {file.type === 'directory' && (
            <button 
              onClick={(e) => { e.stopPropagation(); startFileCreation(file.path); }}
              aria-label="Create new file"
            >
              <FaPlus />
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); startFileRename(file); }}
            aria-label="Rename file"
          >
            <FaEdit />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleDeleteFile(file); }}
            aria-label="Delete file"
          >
            <FaTrash />
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div>Loading files...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  const visibleFiles = getVisibleFiles();

  return (
    <div className="file-explorer">
      <div className="file-explorer-header">
        <h3>Files</h3>
        <button 
          onClick={() => startFileCreation('')}
          aria-label="Create new file at root"
          className="new-file-button"
        >
          <FaPlus /> New File
        </button>
        <button onClick={loadFiles} aria-label="Refresh files">↻</button>
      </div>
      
      {isCreatingFile && (
        <div className="new-file-form">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Enter file name"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
            autoFocus
          />
          <button onClick={handleCreateFile}>Create</button>
          <button onClick={() => setIsCreatingFile(false)}>Cancel</button>
        </div>
      )}
      
      <VirtualList
        width={300}
        height={500}
        rowCount={visibleFiles.length}
        rowHeight={30}
        rowRenderer={renderFile}
        overscanRowCount={10}
      />
    </div>
  );
};

export default FileTree;
