import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './client/src'),
      '@components': resolve(__dirname, './client/src/components'),
      '@hooks': resolve(__dirname, './client/src/hooks'),
      '@contexts': resolve(__dirname, './client/src/contexts'),
      '@lib': resolve(__dirname, './client/src/lib'),
      '@pages': resolve(__dirname, './client/src/pages'),
      '@assets': resolve(__dirname, './attached_assets'),
      '@shared': resolve(__dirname, './shared')
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/ws': {
        target: 'http://localhost:5000',
        ws: true
      }
    }
  }
});