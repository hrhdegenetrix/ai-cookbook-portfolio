#!/bin/bash

# AI Recipe Generator - Linux/Mac Setup Script
# Professional Portfolio Project Setup

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Clear screen and show header
clear
echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}          AI RECIPE GENERATOR - PORTFOLIO PROJECT${NC}"
echo -e "${CYAN}              Linux/Mac Installation Script${NC}"  
echo -e "${CYAN}================================================================${NC}"
echo ""

# Function to check Node.js version compatibility
check_node_version() {
    local version=$1
    local version_number=${version#v}  # Remove 'v' prefix
    local major=$(echo $version_number | cut -d. -f1)
    local minor=$(echo $version_number | cut -d. -f2)
    
    # Check if version is >= 18.16
    if [ "$major" -gt 18 ]; then
        return 0
    elif [ "$major" -eq 18 ] && [ "$minor" -ge 16 ]; then
        return 0
    else
        return 1
    fi
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Step 1: Check Node.js installation
echo -e "${YELLOW}[1/6] Checking Node.js installation...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo ""
    echo -e "${YELLOW}Please install Node.js 18.16.0 or higher from:${NC}"
    echo -e "${YELLOW}https://nodejs.org/${NC}"
    echo ""
    echo -e "${YELLOW}Or use a package manager:${NC}"
    echo -e "${WHITE}  • Ubuntu/Debian: sudo apt install nodejs npm${NC}"
    echo -e "${WHITE}  • CentOS/RHEL: sudo yum install nodejs npm${NC}"
    echo -e "${WHITE}  • macOS: brew install node${NC}"
    echo ""
    echo -e "${YELLOW}After installation, restart this script.${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js found: $NODE_VERSION${NC}"

if ! check_node_version "$NODE_VERSION"; then
    echo -e "${RED}❌ Node.js version $NODE_VERSION is too old!${NC}"
    echo -e "${RED}❌ This project requires Node.js 18.16.0 or higher.${NC}"
    echo ""
    echo -e "${YELLOW}Please update Node.js from: https://nodejs.org/${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version is compatible!${NC}"
echo ""

# Step 2: Check npm installation
echo -e "${YELLOW}[2/6] Checking npm installation...${NC}"

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed!${NC}"
    echo -e "${YELLOW}Please install npm or reinstall Node.js.${NC}"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${GREEN}✅ npm found: v$NPM_VERSION${NC}"
echo ""

# Step 3: Install backend dependencies
echo -e "${YELLOW}[3/6] Installing backend dependencies...${NC}"

if [ ! -d "backend" ]; then
    echo -e "${RED}❌ Backend directory not found!${NC}"
    echo -e "${YELLOW}Please make sure you're running this script from the project root directory.${NC}"
    exit 1
fi

cd backend
echo -e "${CYAN}Installing backend packages (this may take a few minutes)...${NC}"

if ! npm install; then
    echo -e "${RED}❌ Backend installation failed!${NC}"
    echo -e "${YELLOW}Please check the error messages above.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend dependencies installed!${NC}"
cd ..
echo ""

# Step 4: Install frontend dependencies
echo -e "${YELLOW}[4/6] Installing frontend dependencies...${NC}"

if [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Frontend directory not found!${NC}"
    echo -e "${YELLOW}Please make sure you're running this script from the project root directory.${NC}"
    exit 1
fi

cd frontend
echo -e "${CYAN}Installing frontend packages (this may take a few minutes)...${NC}"

if ! npm install; then
    echo -e "${RED}❌ Frontend installation failed!${NC}"
    echo -e "${YELLOW}Please check the error messages above.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend dependencies installed!${NC}"
cd ..
echo ""

# Step 5: Setup database
echo -e "${YELLOW}[5/6] Setting up database...${NC}"

cd backend

if ! npx prisma generate; then
    echo -e "${RED}❌ Database schema generation failed!${NC}"
    exit 1
fi

if ! npx prisma db push; then
    echo -e "${RED}❌ Database setup failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Database setup complete!${NC}"
cd ..
echo ""

# Step 6: Create launchers and shortcuts
echo -e "${YELLOW}[6/6] Creating shortcuts and launchers...${NC}"

# Create shell launcher script
cat > start-app.sh << 'EOF'
#!/bin/bash

# AI Recipe Generator Launcher

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

clear
echo -e "${CYAN}Starting AI Recipe Generator...${NC}"
echo -e "${YELLOW}Backend starting on port 5001...${NC}"

# Start backend in background
cd backend
npm start &
BACKEND_PID=$!
cd ..

sleep 3

echo -e "${YELLOW}Frontend starting on port 3000...${NC}"

# Start frontend in background
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo -e "${GREEN}✅ AI Recipe Generator is starting!${NC}"
echo -e "${CYAN}  Backend: http://localhost:5001${NC}"
echo -e "${CYAN}  Frontend: http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}Both servers are now running.${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop both servers.${NC}"
echo ""

# Wait for Ctrl+C
trap 'echo -e "\n${YELLOW}Stopping servers...${NC}"; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT

# Keep script running
wait
EOF

chmod +x start-app.sh

# Create desktop shortcut for Linux
if command_exists desktop-file-install 2>/dev/null; then
    cat > ai-recipe-generator.desktop << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=AI Recipe Generator
Comment=Professional AI-powered recipe generator portfolio project
Exec=$PWD/start-app.sh
Icon=$PWD/Chef_izzy.png
Path=$PWD
Terminal=true
Categories=Development;Education;
EOF
    
    # Try to install desktop shortcut
    if [ -d "$HOME/Desktop" ]; then
        cp ai-recipe-generator.desktop "$HOME/Desktop/" 2>/dev/null
        chmod +x "$HOME/Desktop/ai-recipe-generator.desktop" 2>/dev/null
    fi
fi

echo -e "${GREEN}✅ Created start-app.sh launcher${NC}"
echo ""

# Display completion message
echo -e "${CYAN}================================================================${NC}"
echo -e "${GREEN}                    🎉 INSTALLATION COMPLETE! 🎉${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""
echo -e "${GREEN}Your AI Recipe Generator is ready to use!${NC}"
echo ""
echo -e "${YELLOW}📁 Files created:${NC}"
echo -e "${WHITE}  • start-app.sh - Launch script${NC}"
if [ -f "$HOME/Desktop/ai-recipe-generator.desktop" ]; then
    echo -e "${WHITE}  • Desktop shortcut (if supported)${NC}"
fi
echo ""
echo -e "${YELLOW}🚀 To start the application:${NC}"
echo -e "${WHITE}  1. Run: ./start-app.sh${NC}"
echo -e "${WHITE}  2. Or manually run:${NC}"
echo -e "${WHITE}     - Backend: cd backend && npm start${NC}"
echo -e "${WHITE}     - Frontend: cd frontend && npm run dev${NC}"
echo ""
echo -e "${YELLOW}🌐 Access URLs:${NC}"
echo -e "${CYAN}  • Frontend: http://localhost:3000${NC}"
echo -e "${CYAN}  • Backend API: http://localhost:5001${NC}"
echo ""
echo -e "${YELLOW}📖 Need help? Check the README.md file for detailed instructions.${NC}"
echo ""
echo -e "${CYAN}================================================================${NC}" 