# 🍳 AI Recipe Generator - Portfolio Project

A **comprehensive full-stack recipe management platform** that transforms ingredients into creative, AI-generated recipes! This enterprise-level application showcases advanced React development, modern backend architecture, and sophisticated AI integration - perfect for portfolio demonstrations.

![Chef Izzy](Chef_izzy.png)

## ✨ **Key Features**

### 🤖 **Advanced AI Recipe Generation**
- **Multi-Recipe Generation**: Create 1-5 unique recipes simultaneously
- **15 Cuisine Options**: Italian, Mexican, Asian, Indian, Mediterranean, French, Japanese, Thai, Chinese, American, Middle Eastern, Korean, Greek, Spanish, and International
- **Intelligent Ingredient Processing**: Handles both simple strings and complex ingredient objects
- **Similar Recipe Variations**: Generate creative variations of existing recipes
- **Smart Duplicate Detection**: Prevents duplicate favorites with user-friendly conflict resolution

### 📊 **Comprehensive Recipe Management**
- **Recipe History**: Browse all generated recipes with advanced search and filtering
- **Favorites System**: Star your best recipes with optimistic UI updates
- **Personal Notes**: Add and edit custom notes for each recipe
- **Star Ratings**: Rate recipes from 1-5 stars
- **Advanced Search**: Find recipes by name, description, or ingredients
- **Multi-Filter System**: Filter by cuisine type, cooking time, and favorites
- **Pagination**: Efficient browsing of large recipe collections

### 📈 **Analytics Dashboard**
- **Recipe Statistics**: Total recipes, favorites count, recent activity
- **Favorite Rate Calculation**: Track your preference trends
- **Top Ingredients Analysis**: See your most-used ingredients with visual charts
- **Usage Insights**: 7-day activity tracking

### 🎨 **Premium User Experience**
- **Chef Izzy Mascot**: Adorable AI cooking assistant integrated throughout
- **Modern Responsive Design**: Beautiful gradients, animations, and mobile-friendly layout
- **Optimistic UI Updates**: Instant feedback for all user interactions
- **Comprehensive Error Handling**: Graceful error recovery with user-friendly messages
- **Loading States**: Smooth loading indicators and skeleton screens
- **4-Tab Navigation**: Generate → Recipe History → Favorites → Analytics

### 📄 **Export & Sharing**
- **PDF Export**: Professional recipe cards with complete formatting
- **Copy to Clipboard**: Easy recipe sharing
- **Print-Friendly**: Optimized layouts for printing

## 🚀 **Tech Stack**

### **Frontend (React + Vite)**
- **React 18** with Hooks and modern patterns
- **Vite** - Lightning-fast development (30x faster than CRA)
- **Axios** - HTTP client with interceptors
- **Lucide React** - 1000+ beautiful icons
- **jsPDF + html2canvas** - Advanced PDF generation
- **CSS3** - Custom styling with CSS Grid, Flexbox, and animations
- **Error Boundaries** - Comprehensive crash protection

### **Backend (Node.js + Express)**
- **Express.js** - RESTful API architecture
- **Prisma ORM** - Type-safe database operations
- **SQLite** - Embedded database with full SQL support
- **OpenAI API** - GPT-3.5-turbo integration
- **Dynamic Port Management** - Automatic port discovery and coordination
- **Advanced Error Handling** - Comprehensive validation and error recovery
- **Security Suite**: Helmet, CORS, Rate Limiting
- **Graceful Shutdown** - Proper cleanup and database disconnection

### **Database & ORM**
- **SQLite** - Lightweight, embedded database
- **Prisma 5.20** - Modern ORM with migrations and type safety
- **Structured Schema** - Recipes, ratings, notes, timestamps
- **JSON Storage** - Flexible ingredient and instruction storage
- **Automatic Cleanup** - Intelligent old recipe management

## 🛠️ **System Requirements**

### **Prerequisites**
- **Node.js 18.16.0 or higher** - [Download here](https://nodejs.org)
- **npm 8.0.0 or higher** (comes with Node.js)
- **OpenAI API Key** - [Get one here](https://platform.openai.com/api-keys)

> **⚠️ Important**: This project requires Node.js 18.16.0 or higher for Prisma compatibility. The installers will check your version automatically.

### **Version Checking**
```bash
# Check your current versions:
node --version  # Should be v18.16.0 or higher
npm --version   # Should be 8.0.0 or higher
```

## 🚀 **Super Easy Setup**

### **🎉 One-Click Installers** *(Recommended)*

**Windows Users:**
   ```bash
# Download the repository, then double-click:
setup-windows.bat
   ```

**Linux/Mac Users:**
   ```bash
# Download the repository, then run:
chmod +x setup-linux.sh && ./setup-linux.sh
```

**PowerShell Users (Windows):**
```powershell
# Run in PowerShell:
.\setup-windows.ps1
```

### **What the Installers Do:**
- ✅ **Check Node.js version** (requires 18.16.0+)
- ✅ **Install all dependencies** automatically  
- ✅ **Set up the database** with Prisma
- ✅ **Create launcher scripts** (start-app.bat/start-app.sh)
- ✅ **Desktop shortcuts** with Chef Izzy icon (where supported)
- ✅ **Error handling** with helpful guidance

### **Manual Setup** *(For developers)*
   ```bash
# 1. Clone and navigate
git clone https://github.com/hrhdegenetrix/ai-cookbook-portfolio.git
cd ai-cookbook-portfolio

# 2. Install backend dependencies
cd backend
npm install

# 3. Install frontend dependencies  
cd ../frontend
npm install

# 4. Set up database
cd ../backend
npx prisma generate
npx prisma db push

# 5. Start servers (in separate terminals)
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Frontend
cd frontend && npm run dev
   ```

### **Starting the Application:**
After setup, you can start the app using:
- **Windows**: Double-click `start-app.bat`
- **Linux/Mac**: Run `./start-app.sh`
- **Manual**: Run backend and frontend servers separately

## 🎯 **Using the Application**

### **1. First Time Setup**
1. **Start the application** using one of the methods above
2. **Open your browser** to http://localhost:3000
3. **Enter your OpenAI API key** when prompted
4. **Start generating recipes!**

### **2. Recipe Generation**
1. **Add Ingredients**: Enter 1-5 ingredients you have
2. **Choose Options**: Select number of recipes (1-5), servings, and cuisine style
3. **Generate**: Watch AI create multiple unique recipes instantly
4. **Rate & Save**: Star favorites, add personal notes, rate recipes

### **3. Recipe Management**
- **Browse History**: View all generated recipes with search and filters
- **Manage Favorites**: Quick access to your starred recipes
- **Add Notes**: Personal cooking tips and modifications
- **Export**: Download recipes as professional PDF files

### **4. Analytics**
- **Track Usage**: See recipe generation trends and statistics
- **Ingredient Analysis**: Discover your most-used ingredients
- **Preference Insights**: Understand your cooking patterns

## 📁 **Project Architecture**

```
ai-cookbook-portfolio/
├── 📱 frontend/                 # React + Vite Application
│   ├── public/
│   │   ├── Chef_izzy.png       # Mascot image (96px header, 37px tips)
│   │   └── vite.svg           # Vite logo
│   ├── src/
│   │   ├── App.jsx            # Main application (1900+ lines)
│   │   ├── ErrorBoundary.jsx  # Crash protection component
│   │   ├── index.css          # Comprehensive styling (1900+ lines)
│   │   └── main.jsx           # React entry point
│   ├── vite.config.js         # Vite configuration with proxy
│   └── package.json           # Frontend dependencies
├── 🚀 backend/                  # Express + Prisma Server
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema definition
│   │   └── dev.db             # SQLite database file
│   ├── server.js              # Main server (900+ lines)
│   └── package.json           # Backend dependencies
├── 🔧 Setup Scripts
│   ├── setup-windows.bat      # Windows batch installer
│   ├── setup-windows.ps1      # Windows PowerShell installer
│   ├── setup-linux.sh         # Linux/Mac installer
│   ├── start-app.bat          # Windows launcher (created by setup)
│   └── start-app.sh           # Linux/Mac launcher (created by setup)
├── 📦 AI-Recipe-Generator-v1.0.zip  # Clean distribution package
├── 📖 README.md               # This comprehensive documentation
└── 🎨 Chef_izzy.png           # Chef Izzy mascot image
```

## 🔌 **API Documentation**

### **Recipe Management**
- `POST /api/generate-recipe` - Generate 1-5 recipes with AI
- `GET /api/recipes` - Get recipes with search/filter/pagination
- `GET /api/recipes/:id` - Get single recipe by ID
- `PATCH /api/recipes/:id` - Update recipe (favorite, rating, notes)
- `DELETE /api/recipes/:id` - Delete recipe
- `POST /api/recipes/:id/similar` - Generate similar recipe variation

### **Analytics & Stats**
- `GET /api/stats` - Get comprehensive analytics data
- `GET /api/health` - Server health check

### **Configuration**
- `GET /api/check-api-key` - Verify OpenAI API key status
- `POST /api/set-api-key` - Configure OpenAI API key

## 🎨 **Design System**

### **Visual Identity**
- **Chef Izzy Mascot**: Friendly AI cooking assistant
- **Color Palette**: Purple gradients (#667eea to #764ba2)
- **Typography**: Modern, readable font stack
- **Iconography**: Consistent Lucide icon set
- **Animations**: Smooth transitions and hover effects

### **User Experience**
- **Optimistic Updates**: Instant UI feedback
- **Progressive Enhancement**: Graceful degradation
- **Accessibility**: ARIA labels, keyboard navigation
- **Responsive Design**: Mobile-first approach
- **Error Recovery**: Comprehensive error boundaries

## 🔒 **Security & Performance**

### **Security Features**
- **Rate Limiting**: 100 requests per 15 minutes
- **Input Validation**: Comprehensive sanitization
- **CORS Configuration**: Secure cross-origin requests
- **Helmet.js**: Security headers
- **Environment Variables**: Secure API key storage

### **Performance Optimizations**
- **Vite Build System**: 30x faster than Create React App
- **Optimistic UI**: Instant user feedback
- **Efficient Pagination**: Large dataset handling
- **Database Cleanup**: Automatic old recipe management
- **Dynamic Port Management**: No conflicts

## 🚀 **Deployment Ready**

### **Frontend Options**
- **Vercel** (Recommended): Zero-config deployment
- **Netlify**: JAMstack deployment
- **AWS S3 + CloudFront**: Enterprise scaling
- **GitHub Pages**: Free hosting option

### **Backend Options**
- **Railway** (Recommended): Modern hosting platform
- **Heroku**: Classic PaaS option
- **AWS EC2**: Full control environment
- **DigitalOcean**: Developer-friendly VPS

### **Environment Variables**
```bash
# Backend (.env)
OPENAI_API_KEY=sk-your-key-here
PORT=5000
DATABASE_URL="file:./dev.db"
```

## 📊 **Portfolio Impact**

This project demonstrates mastery of:
- ✅ **Full-Stack Architecture**: React + Node.js + Database
- ✅ **Modern Tooling**: Vite, Prisma, advanced CSS
- ✅ **AI Integration**: OpenAI API with error handling
- ✅ **Database Design**: Relational data with JSON fields
- ✅ **User Experience**: Optimistic updates, error boundaries
- ✅ **Performance**: Optimized builds, efficient queries
- ✅ **Security**: Authentication, validation, rate limiting
- ✅ **Scalability**: Pagination, cleanup, resource management

## 🤝 **Contributing**

Perfect for extending and customizing:
- **Add Features**: Nutrition data, dietary restrictions, meal planning
- **Enhance UI**: Dark mode, themes, advanced animations
- **Scale Backend**: User accounts, recipe sharing, social features
- **Add Tests**: Unit tests, integration tests, E2E testing
- **Optimize**: Caching, CDN integration, performance monitoring

## 📄 **License**

MIT License - Open source and portfolio-friendly!

## 🙏 **Acknowledgments**

- **OpenAI** - GPT-3.5-turbo API for recipe generation
- **React Team** - Amazing UI library and ecosystem
- **Prisma** - Modern database toolkit
- **Vite** - Lightning-fast build tool
- **Lucide** - Beautiful icon library

---

**Built with ❤️, AI, and modern web technologies!**  
*Perfect for demonstrating full-stack development expertise, AI integration skills, and modern web application architecture.*

**✨ Ready to impress employers and clients with a production-ready, feature-rich application! If this repo leaves you interested in working with me, please reach out. ✨** 
