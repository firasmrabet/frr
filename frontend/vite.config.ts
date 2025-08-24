import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          utils: ['react-icons']
        }
      }
    },
    sourcemap: true
  },
  server: {
    port: 5173,
    host: true
  },
  define: {
    'process.env': process.env
  },
});
