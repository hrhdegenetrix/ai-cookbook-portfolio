#!/bin/bash

# Chef Izzy's AI Recipe Generator - Linux/Mac Setup Script
# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Clear screen and show header
clear
echo -e "${PURPLE}"
echo "  ╔══════════════════════════════════════════════════════════════════╗"
echo "  ║                    🍳 Chef Izzy's AI Cookbook                   ║"
echo "  ║                      Linux/Mac Setup Installer                  ║"
echo "  ╚══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}[1/5] Checking prerequisites...${NC}"

# Check for Node.js
if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo ""
    echo "Please install Node.js first:"
    echo "1. Go to https://nodejs.org"
    echo "2. Download and install the LTS version"
    echo "3. Or use your package manager:"
    echo "   • Ubuntu/Debian: sudo apt install nodejs npm"
    echo "   • CentOS/RHEL: sudo yum install nodejs npm"
    echo "   • macOS (Homebrew): brew install node"
    echo "4. Run this setup again"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js $NODE_VERSION detected${NC}"

# Check for npm
if ! command_exists npm; then
    echo -e "${RED}❌ npm is not available!${NC}"
    read -p "Press Enter to exit..."
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${GREEN}✅ npm $NPM_VERSION detected${NC}"
echo ""

# Install dependencies
echo -e "${BLUE}[2/5] Installing application dependencies...${NC}"
echo "This may take a few minutes..."
echo ""

if ! npm run install-all; then
    echo -e "${RED}❌ Installation failed!${NC}"
    read -p "Press Enter to exit..."
    exit 1
fi

echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
echo ""

# Setup database
echo -e "${BLUE}[3/5] Setting up database...${NC}"
cd backend
npx prisma generate >/dev/null 2>&1
npx prisma db push >/dev/null 2>&1
cd ..
echo -e "${GREEN}✅ Database configured${NC}"
echo ""

# Create launcher script
echo -e "${BLUE}[4/5] Creating application launcher...${NC}"

cat > "chef-izzy-launcher.sh" << 'EOF'
#!/bin/bash

# Chef Izzy's AI Recipe Generator Launcher
# Colors
PURPLE='\033[0;35m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

clear
echo -e "${PURPLE}"
echo "  ╔══════════════════════════════════════════════════════════════════╗"
echo "  ║                    🍳 Chef Izzy's AI Cookbook                   ║"
echo "  ║                     Starting Application...                     ║"
echo "  ╚══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "${BLUE}⚡ Starting backend server...${NC}"
echo -e "${BLUE}⚡ Starting frontend server...${NC}"
echo -e "${BLUE}⚡ Opening browser...${NC}"
echo ""
echo -e "${GREEN}Your recipe generator will open in your browser shortly!${NC}"
echo -e "${GREEN}Press Ctrl+C to stop the application.${NC}"
echo ""

# Start the application
npm run dev
EOF

chmod +x chef-izzy-launcher.sh

# Create desktop shortcut (if desktop environment is available)
echo -e "${BLUE}[5/5] Creating shortcuts...${NC}"

# Try to create a desktop shortcut (works on most Linux desktop environments)
if [ -d "$HOME/Desktop" ] && command_exists xdg-desktop-menu; then
    CURRENT_DIR=$(pwd)
    
    cat > "$HOME/Desktop/chef-izzy-recipe-generator.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Chef Izzy's Recipe Generator
Comment=Transform ingredients into delicious recipes with AI!
Exec=$CURRENT_DIR/chef-izzy-launcher.sh
Icon=$CURRENT_DIR/Chef_izzy.png
Path=$CURRENT_DIR
Terminal=true
StartupNotify=true
Categories=Utility;Development;
EOF
    
    chmod +x "$HOME/Desktop/chef-izzy-recipe-generator.desktop"
    echo -e "${GREEN}✅ Desktop shortcut created${NC}"
elif [ "$(uname)" = "Darwin" ]; then
    # macOS - Create a simple app bundle
    if [ -d "/Applications" ]; then
        echo -e "${YELLOW}💡 On macOS, you can create an alias by dragging chef-izzy-launcher.sh to your Applications folder${NC}"
    fi
fi

echo -e "${GREEN}✅ Launcher created: chef-izzy-launcher.sh${NC}"
echo ""

# Success message
echo -e "${PURPLE}"
echo "  ╔══════════════════════════════════════════════════════════════════╗"
echo "  ║                        🎉 SETUP COMPLETE! 🎉                    ║"
echo "  ╚══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "${GREEN}🚀 Quick Start Options:${NC}"
echo ""
echo "   1. Run: ./chef-izzy-launcher.sh"
echo "   2. Or run: npm run dev" 
echo "   3. Or use the desktop shortcut (if created)"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "   • The app will open in your browser automatically"
echo "   • You'll be prompted for your OpenAI API key on first use"
echo "   • Get your API key at: https://platform.openai.com/api-keys"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "   • Keep the terminal window open while using the app"
echo "   • Press Ctrl+C to stop the application"
echo "   • Your recipes are saved automatically to a local database"
echo ""
echo -e "${PURPLE}Ready to start cooking with AI? 👨‍🍳✨${NC}"
echo ""

# Ask if user wants to start now
read -p "Would you like to start Chef Izzy now? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${GREEN}Starting Chef Izzy's AI Recipe Generator...${NC}"
    ./chef-izzy-launcher.sh
fi

exit 0 