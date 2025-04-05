/**
 * Configures Monaco Editor with additional features and settings
 * @param {Object} monaco - Monaco Editor instance
 */
export const configureMonaco = (monaco) => {
  // Register custom themes if needed
  monaco.editor.defineTheme('customDarkTheme', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#1e1e1e',
      'editor.lineHighlightBackground': '#303030',
      'editorCursor.foreground': '#a6a6a6',
      'editor.selectionBackground': '#264f78',
      'editor.inactiveSelectionBackground': '#3a3d41'
    }
  });

  // Configure TypeScript/JavaScript defaults
  const compilerOptions = {
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    noEmit: true,
    esModuleInterop: true,
    jsx: monaco.languages.typescript.JsxEmit.React,
    reactNamespace: 'React',
    allowJs: true,
    typeRoots: ['node_modules/@types']
  };

  // Configure JavaScript
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions(compilerOptions);
  
  // Configure TypeScript
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions(compilerOptions);

  // Add extra libraries (React, etc.) if needed
  try {
    // Example: add React types
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      `declare module 'react' {
        export interface Component<P = {}, S = {}> {}
        export function useState<T>(initialState: T | (() => T)): [T, (newState: T) => void];
        export function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
        export function useRef<T>(initialValue: T): { current: T };
        export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: readonly any[]): T;
        export function useMemo<T>(factory: () => T, deps: readonly any[]): T;
      }`,
      'node_modules/@types/react/index.d.ts'
    );
  } catch (e) {
    console.warn('Failed to load extra libraries for Monaco editor', e);
  }
};
