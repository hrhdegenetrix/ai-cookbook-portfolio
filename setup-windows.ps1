# Chef Izzy's AI Recipe Generator - Windows PowerShell Setup Script

# Set console properties
$Host.UI.RawUI.WindowTitle = "Chef Izzy's AI Recipe Generator - Setup"
Clear-Host

# Colors
$Purple = "Magenta"
$Green = "Green"
$Red = "Red"
$Blue = "Cyan"
$Yellow = "Yellow"

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor $Purple
Write-Host "  ║                    🍳 Chef Izzy's AI Cookbook                   ║" -ForegroundColor $Purple
Write-Host "  ║                    Windows PowerShell Installer                 ║" -ForegroundColor $Purple
Write-Host "  ╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor $Purple
Write-Host ""

# Function to check Node.js version compatibility
function Test-NodeVersion {
    param([string]$Version)
    
    $versionNumber = $Version -replace 'v', ''
    $parts = $versionNumber -split '\.'
    $major = [int]$parts[0]
    $minor = [int]$parts[1]
    
    # Check if version is >= 18.16
    if ($major -gt 18) {
        return $true
    } elseif ($major -eq 18 -and $minor -ge 16) {
        return $true
    } else {
        return $false
    }
}

# Check prerequisites
Write-Host "[1/5] Checking prerequisites..." -ForegroundColor $Blue

# Check for Node.js
if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js is not installed!" -ForegroundColor $Red
    Write-Host ""
    Write-Host "Please install Node.js first:"
    Write-Host "1. Go to https://nodejs.org"
    Write-Host "2. Download and install the LTS version"
    Write-Host "3. Restart your computer"
    Write-Host "4. Run this setup again"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

$nodeVersion = node --version
Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor $Green

if (-not (Test-NodeVersion $nodeVersion)) {
    Write-Host "❌ Node.js version $nodeVersion is too old!" -ForegroundColor $Red
    Write-Host "❌ This project requires Node.js 18.16.0 or higher." -ForegroundColor $Red
    Write-Host ""
    Write-Host "Please update Node.js from: https://nodejs.org/" -ForegroundColor $Yellow
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host "✅ Node.js version is compatible!" -ForegroundColor $Green
Write-Host ""

# Check for npm
if (-not (Test-Command "npm")) {
    Write-Host "❌ npm is not available!" -ForegroundColor $Red
    Read-Host "Press Enter to exit"
    exit 1
}

$npmVersion = npm --version
Write-Host "✅ npm $npmVersion detected" -ForegroundColor $Green
Write-Host ""

# Install dependencies
Write-Host "[2/5] Installing application dependencies..." -ForegroundColor $Blue
Write-Host "This may take a few minutes..." -ForegroundColor $Yellow
Write-Host ""

try {
    & npm run install-all
    if ($LASTEXITCODE -ne 0) { throw "Installation failed" }
}
catch {
    Write-Host "❌ Installation failed!" -ForegroundColor $Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Dependencies installed successfully" -ForegroundColor $Green
Write-Host ""

# Setup database
Write-Host "[3/5] Setting up database..." -ForegroundColor $Blue
Push-Location backend
try {
    & npx prisma generate 2>$null
    & npx prisma db push 2>$null
}
catch {
    Write-Host "⚠️ Database setup encountered issues, but continuing..." -ForegroundColor $Yellow
}
Pop-Location
Write-Host "✅ Database configured" -ForegroundColor $Green
Write-Host ""

# Create launcher script
Write-Host "[4/5] Creating application launcher..." -ForegroundColor $Blue

$launcherContent = @'
# Chef Izzy's AI Recipe Generator Launcher
$Host.UI.RawUI.WindowTitle = "Chef Izzy's AI Recipe Generator"
Clear-Host

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "  ║                    🍳 Chef Izzy's AI Cookbook                   ║" -ForegroundColor Magenta
Write-Host "  ║                     Starting Application...                     ║" -ForegroundColor Magenta
Write-Host "  ╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""
Write-Host "⚡ Starting backend server..." -ForegroundColor Cyan
Write-Host "⚡ Starting frontend server..." -ForegroundColor Cyan
Write-Host "⚡ Opening browser..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Your recipe generator will open in your browser shortly!" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the application." -ForegroundColor Green
Write-Host ""

# Start the application
& npm run dev
'@

Set-Content -Path "Chef Izzy Recipe Generator.ps1" -Value $launcherContent

# Create batch launcher for double-click convenience
$batchLauncher = @'
@echo off
powershell -ExecutionPolicy Bypass -File "Chef Izzy Recipe Generator.ps1"
pause
'@

Set-Content -Path "Chef Izzy Recipe Generator.bat" -Value $batchLauncher

# Create shortcuts
Write-Host "[5/5] Creating shortcuts..." -ForegroundColor $Blue

# Create desktop shortcut
try {
    $WshShell = New-Object -comObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Chef Izzy Recipe Generator.lnk")
    $Shortcut.TargetPath = "$PWD\Chef Izzy Recipe Generator.bat"
    $Shortcut.WorkingDirectory = $PWD
    $Shortcut.Description = "Chef Izzy's AI Recipe Generator - Transform ingredients into delicious recipes!"
    $Shortcut.IconLocation = "$PWD\Chef_izzy.png"
    $Shortcut.Save()
    Write-Host "✅ Desktop shortcut created" -ForegroundColor $Green
}
catch {
    Write-Host "⚠️ Could not create desktop shortcut" -ForegroundColor $Yellow
}

Write-Host "✅ Launcher created: Chef Izzy Recipe Generator.ps1" -ForegroundColor $Green
Write-Host "✅ Batch launcher created: Chef Izzy Recipe Generator.bat" -ForegroundColor $Green
Write-Host ""

# Success message
Write-Host "  ╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor $Purple
Write-Host "  ║                        🎉 SETUP COMPLETE! 🎉                    ║" -ForegroundColor $Purple
Write-Host "  ╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor $Purple
Write-Host ""
Write-Host "🚀 Quick Start Options:" -ForegroundColor $Green
Write-Host ""
Write-Host "   1. Double-click: Chef Izzy Recipe Generator.bat"
Write-Host "   2. Run PowerShell: .\Chef` Izzy` Recipe` Generator.ps1"
Write-Host "   3. Or run: npm run dev"
Write-Host "   4. Or use the desktop shortcut (if created)"
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor $Blue
Write-Host "   • The app will open in your browser automatically"
Write-Host "   • You'll be prompted for your OpenAI API key on first use"
Write-Host "   • Get your API key at: https://platform.openai.com/api-keys"
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor $Yellow
Write-Host "   • Keep the terminal window open while using the app"
Write-Host "   • Close the terminal to stop the application"
Write-Host "   • Your recipes are saved automatically to a local database"
Write-Host ""
Write-Host "Ready to start cooking with AI? 👨‍🍳✨" -ForegroundColor $Purple
Write-Host ""

# Ask if user wants to start now
$choice = Read-Host "Would you like to start Chef Izzy now? (y/n)"
if ($choice -eq "y" -or $choice -eq "Y") {
    Write-Host ""
    Write-Host "Starting Chef Izzy's AI Recipe Generator..." -ForegroundColor $Green
    & ".\Chef Izzy Recipe Generator.ps1"
}

exit 0 