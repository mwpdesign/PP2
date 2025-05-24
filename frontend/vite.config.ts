import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

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
    // Add CORS and proxy settings if needed
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
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
}); 