import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Function to get backend port dynamically
const getBackendPort = () => {
  try {
    const portFile = path.join(__dirname, '../backend/.port');
    if (fs.existsSync(portFile)) {
      const port = fs.readFileSync(portFile, 'utf8').trim();
      console.log(`📡 Using backend port: ${port}`);
      // Validate port number to prevent encoding issues
      const portNum = parseInt(port);
      if (isNaN(portNum) || portNum < 1000 || portNum > 65535) {
        console.log('📡 Invalid port in file, using default 5007');
        return 5007;
      }
      return portNum;
    }
  } catch (error) {
    console.log('📡 Port file not found, using default port 5007');
  }
  return 5007; // Changed default to 5007 to match current backend
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: `http://localhost:${getBackendPort()}`,
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js']
  }
}) 