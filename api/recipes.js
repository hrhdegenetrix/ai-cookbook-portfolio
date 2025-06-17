const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client
const prisma = new PrismaClient();

// Helper function to parse time strings to minutes
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  
  const timePattern = /(\d+)\s*(hour|hr|h|minute|min|m)/gi;
  let totalMinutes = 0;
  let match;
  
  while ((match = timePattern.exec(timeStr)) !== null) {
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    if (unit.startsWith('h')) {
      totalMinutes += value * 60;
    } else {
      totalMinutes += value;
    }
  }
  
  return totalMinutes || 30; // Default to 30 minutes if can't parse
}

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Handle GET /api/recipes
      const { 
        page = 1, 
        limit = 12, 
        search = '', 
        favorites = false,
        cuisine = '',
        maxTime = '',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      console.log('🔍 Recipe search request:', {
        page, limit, search, favorites, cuisine, maxTime, sortBy, sortOrder
      });
      
      // Convert search terms to lowercase for case-insensitive search in SQLite
      const searchLower = search ? search.toLowerCase() : null;
      const cuisineLower = cuisine ? cuisine.toLowerCase() : null;
      
      const where = {
        ...(searchLower && {
          OR: [
            { title: { contains: searchLower } },
            { description: { contains: searchLower } },
            { ingredients: { contains: searchLower } },
            { tips: { contains: searchLower } }
          ]
        }),
        ...(favorites === 'true' && { isFavorite: true }),
        ...(cuisineLower && { cuisine: { contains: cuisineLower } })
      };
      
      // Handle maxTime filter (calculate total time from prep + cook)
      let filteredRecipes = [];
      if (maxTime) {
        // Get all recipes first, then filter by total time
        const allRecipes = await prisma.recipe.findMany({
          where,
          orderBy: { [sortBy]: sortOrder }
        });
        
        const maxMinutes = parseInt(maxTime);
        filteredRecipes = allRecipes.filter(recipe => {
          const prepMinutes = parseTimeToMinutes(recipe.prepTime);
          const cookMinutes = parseTimeToMinutes(recipe.cookTime);
          return (prepMinutes + cookMinutes) <= maxMinutes;
        });
        
        // Apply pagination to filtered results
        const total = filteredRecipes.length;
        const paginatedRecipes = filteredRecipes.slice(skip, skip + parseInt(limit));
        
        // Parse JSON fields back to objects
        const formattedRecipes = paginatedRecipes.map(recipe => ({
          ...recipe,
          ingredients: JSON.parse(recipe.ingredients),
          instructions: JSON.parse(recipe.instructions),
          originalIngredients: JSON.parse(recipe.originalIngredients)
        }));
        
        return res.json({
          recipes: formattedRecipes,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        });
      }
      
      const [recipes, total] = await Promise.all([
        prisma.recipe.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: parseInt(limit)
        }),
        prisma.recipe.count({ where })
      ]);
      
      // Parse JSON fields back to objects
      const formattedRecipes = recipes.map(recipe => ({
        ...recipe,
        ingredients: JSON.parse(recipe.ingredients),
        instructions: JSON.parse(recipe.instructions),
        originalIngredients: JSON.parse(recipe.originalIngredients)
      }));
      
      res.json({
        recipes: formattedRecipes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
            });
      
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Error in recipes API:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 