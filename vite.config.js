import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Express server endpoints (port 5000)
      '/api/proxy': 'http://localhost:5000',
      '/api/gemini/initialize': 'http://localhost:5000',
      '/api/health': 'http://localhost:5000',
      
      // Python ADK backend endpoints (port 5001)
      '/api/agent/generate': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      },
      '/api/agent/health': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      }
    },
  },
  base: '/',
  resolve: {
    alias: {
      '@': '/src',
    },
  },
}); 