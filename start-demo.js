#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🍳 AI Recipe Generator - Quick Demo Launcher');
console.log('============================================\n');

// Check if dependencies are installed
const checkDependencies = () => {
  try {
    // Check if key dependencies actually exist and can be resolved
    require.resolve('express');
    require.resolve('react');
    require.resolve('@prisma/client');
    require.resolve('vite');
    
    // Also check directory structure
    const nodeModulesExists = fs.existsSync(path.join(__dirname, 'node_modules'));
    const frontendNodeModulesExists = fs.existsSync(path.join(__dirname, 'frontend', 'node_modules'));
    
    return nodeModulesExists && frontendNodeModulesExists;
  } catch (error) {
    // If any key dependency can't be resolved, we need to install
    return false;
  }
};

// Quick install function
const quickInstall = () => {
  return new Promise((resolve, reject) => {
    console.log('📦 Installing dependencies (first-time setup)...');
    console.log('    This will be faster on subsequent runs!\n');
    
    const install = spawn('npm', ['install'], { 
      stdio: 'inherit',
      shell: true,
      cwd: __dirname
    });

    install.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Dependencies installed successfully!\n');
        resolve();
      } else {
        reject(new Error(`Installation failed with code ${code}`));
      }
    });
  });
};

// Start the servers
const startServers = () => {
  return new Promise((resolve) => {
    console.log('🚀 Starting servers...');
    console.log('    Backend: http://localhost:5007');
    console.log('    Frontend: http://localhost:3000\n');

    // Start backend
    const backend = spawn('node', ['server.js'], {
      cwd: path.join(__dirname, 'backend'),
      stdio: 'inherit',
      shell: true
    });

    // Wait a moment then start frontend
    setTimeout(() => {
      const frontend = spawn('npm', ['run', 'dev'], {
        cwd: path.join(__dirname, 'frontend'),
        stdio: 'inherit',
        shell: true
      });

      console.log('✅ Demo is starting!');
      console.log('✅ Open http://localhost:3000 in your browser');
      console.log('✅ Press Ctrl+C to stop\n');

      resolve({ backend, frontend });
    }, 2000);
  });
};

// Main demo launcher
const main = async () => {
  try {
    // Check if we need to install dependencies
    if (!checkDependencies()) {
      await quickInstall();
    } else {
      console.log('✅ Dependencies already installed, starting immediately!\n');
    }

    // Start the app
    await startServers();

    // Keep the process alive
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Stopping demo...');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error starting demo:', error.message);
    process.exit(1);
  }
};

// Run the demo
main(); 