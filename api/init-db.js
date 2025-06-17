const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🗄️ Initializing database...');
    
    // Try to create the tables using raw SQL
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "recipes" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "servings" INTEGER NOT NULL DEFAULT 4,
        "prepTime" TEXT NOT NULL,
        "cookTime" TEXT NOT NULL,
        "ingredients" TEXT NOT NULL,
        "instructions" TEXT NOT NULL,
        "tips" TEXT,
        "cuisine" TEXT NOT NULL DEFAULT 'International',
        "isFavorite" BOOLEAN NOT NULL DEFAULT false,
        "rating" INTEGER,
        "personalNotes" TEXT,
        "originalIngredients" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
      );
    `;

    // Test the connection by checking if we can query the table
    const count = await prisma.recipe.count();
    
    console.log('✅ Database initialized successfully');
    console.log(`📊 Current recipe count: ${count}`);
    
    res.json({ 
      success: true, 
      message: 'Database initialized successfully',
      recipeCount: count
    });

  } catch (error) {
    console.error('❌ Database initialization error:', error);
    res.status(500).json({ 
      error: 'Database initialization failed',
      details: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
} 