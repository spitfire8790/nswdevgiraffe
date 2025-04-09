import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const PROXY_URL = 'https://proxy-server.jameswilliamstrutt.workers.dev'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    proxy: {
      '/eplanning': {
        target: 'https://api.apps1.nsw.gov.au',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/eplanning/, '/eplanning'),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('ePlanning proxy error:', {
              error: err.message,
              stack: err.stack
            });
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Pass through all headers from the original request
            if (req.headers.epiname) {
              proxyReq.setHeader('EpiName', req.headers.epiname);
            }
            if (req.headers.zonecode) {
              proxyReq.setHeader('ZoneCode', req.headers.zonecode);
            }
            if (req.headers.zonedescription) {
              proxyReq.setHeader('ZoneDescription', req.headers.zonedescription);
            }

            // Set required headers
            proxyReq.setHeader('Accept', 'application/json');

            console.log('Proxying ePlanning request:', {
              method: req.method,
              url: req.url,
              headers: proxyReq.getHeaders()
            });
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            // Set CORS headers
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'EpiName, ZoneCode, ZoneDescription, Accept';

            console.log('Received ePlanning response:', {
              method: req.method,
              url: req.url,
              status: proxyRes.statusCode,
              headers: proxyRes.headers
            });
          });
        }
      },
      '/api/proxy': {
        target: PROXY_URL,
        changeOrigin: true,
        secure: true,
        rewrite: (path) => '',  // Remove the /api/proxy prefix
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Set required headers
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0');
            proxyReq.setHeader('Accept', '*/*');

            console.log('Proxying spatial request:', {
              method: req.method,
              url: req.url,
              headers: proxyReq.getHeaders()
            });
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            // Set CORS headers
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Accept';

            console.log('Received spatial response:', {
              method: req.method,
              url: req.url,
              status: proxyRes.statusCode
            });
          });
        }
      },
      '/metromap': {
        target: 'https://api.metromap.com.au',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/metromap/, '')
      },
      '/api/fetch-title': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('Title fetch proxy error:', {
              error: err.message,
              stack: err.stack
            });
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying title fetch request:', {
              method: req.method,
              url: req.url,
              body: req.body
            });
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received title fetch response:', {
              method: req.method,
              url: req.url,
              status: proxyRes.statusCode
            });
          });
        }
      }
    }
  },
  assetsInclude: ['**/*.csv']
})