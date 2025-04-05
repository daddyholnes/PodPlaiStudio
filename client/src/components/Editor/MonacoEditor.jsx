import React, { useRef, useEffect, useState } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { configureMonaco } from './EditorConfig';

const MonacoEditor = ({ 
  language = 'javascript', 
  value = '', 
  onChange,
  theme = 'vs-dark',
  readOnly = false,
  filename = 'index.js'
}) => {
  const editorRef = useRef(null);
  const monaco = useMonaco();
  const [isReady, setIsReady] = useState(false);
  
  // Configure Monaco when it's available
  useEffect(() => {
    if (monaco) {
      configureMonaco(monaco);
      setIsReady(true);
    }
  }, [monaco]);

  // Set the file language based on filename extension
  useEffect(() => {
    if (!filename) return;
    
    const extension = filename.split('.').pop().toLowerCase();
    let detectedLanguage = 'javascript';
    
    switch (extension) {
      case 'js':
        detectedLanguage = 'javascript';
        break;
      case 'ts':
      case 'tsx':
        detectedLanguage = 'typescript';
        break;
      case 'py':
        detectedLanguage = 'python';
        break;
      case 'html':
        detectedLanguage = 'html';
        break;
      case 'css':
        detectedLanguage = 'css';
        break;
      case 'json':
        detectedLanguage = 'json';
        break;
      case 'md':
        detectedLanguage = 'markdown';
        break;
    }
  }, [filename]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Add editor commands
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Save command
      const code = editor.getValue();
      // Trigger save action
      console.log('Save triggered');
    });
  };

  return (
    <div className="monaco-editor-container" style={{ height: '100%', width: '100%' }}>
      <Editor
        height="100%"
        width="100%"
        language={language}
        value={value}
        theme={theme}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          fontSize: 14,
          lineNumbers: 'on',
          folding: true,
          formatOnPaste: true,
          formatOnType: true,
          suggestOnTriggerCharacters: true,
          scrollbar: {
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10
          }
        }}
      />
    </div>
  );
};

export default MonacoEditor;
