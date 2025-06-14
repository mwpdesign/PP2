import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import dns from 'dns';

// Configure DNS to use IPv4 instead of IPv6
dns.setDefaultResultOrder('ipv4first');

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',  // Allow connections from all network interfaces
    strictPort: true,   // Fail if port is in use
    // SECURITY: Prevent serving test files in development
    fs: {
      deny: [
        '**/tests/**',
        '**/*.test.*',
        '**/*.spec.*',
        '**/test_*.html'
      ]
    },
    proxy: {
      '/api/v1': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/v1/, '/api/v1'),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying:', req.method, req.url, 'to', proxyReq.path);
          });
        }
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err) => {
            console.log('ws proxy error', err);
          });
        }
      },
    },
  },
  // Add build options
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Optimize dependencies
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  // Add environment variables
  define: {
    'process.env': process.env,
    global: 'globalThis',
  },
  // SECURITY: Ensure tests directory is not included in production builds
  publicDir: 'public',
});