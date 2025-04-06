import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('lucide') || id.includes('@radix')) {
              return 'vendor-ui';
            }
            return 'vendor';
          }
        }
      }
    }
  },
  server: {
    port: 3000, // Use a different port than the server (which uses 5050)
    strictPort: true, // Fail if port is already in use
    host: true, // Listen on all addresses
    open: true, // Open browser automatically
    cors: true, // Enable CORS
    proxy: {
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        secure: false,
      },
      '/assets': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  preview: {
    port: 5050,
    strictPort: true,
    host: true,
  }
});
