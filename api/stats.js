const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client
const prisma = new PrismaClient();

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📊 Starting stats calculation...');
    
    // Get basic counts with individual queries to avoid prepared statement conflicts
    const totalRecipes = await prisma.recipe.count();
    console.log('📊 Total recipes:', totalRecipes);
    
    const favoriteRecipes = await prisma.recipe.count({ where: { isFavorite: true } });
    console.log('📊 Favorite recipes:', favoriteRecipes);
    
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentRecipes = await prisma.recipe.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    });
    console.log('📊 Recent recipes:', recentRecipes);

    // Get top ingredients from original ingredients
    const recipes = await prisma.recipe.findMany({
      select: { originalIngredients: true }
    });

    const ingredientCounts = {};
    recipes.forEach(recipe => {
      try {
        const ingredients = JSON.parse(recipe.originalIngredients);
        ingredients.forEach(ingredient => {
          if (ingredient && ingredient.trim()) {
            const cleaned = ingredient.trim().toLowerCase();
            ingredientCounts[cleaned] = (ingredientCounts[cleaned] || 0) + 1;
          }
        });
      } catch (error) {
        console.error('Error parsing ingredients:', error);
      }
    });

    // Sort ingredients by usage count and get top 5
    const topIngredients = Object.entries(ingredientCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([ingredient, count]) => ({
        ingredient: ingredient.charAt(0).toUpperCase() + ingredient.slice(1),
        count
      }));

    const stats = {
      totalRecipes,
      favoriteRecipes,
      recentRecipes,
      topIngredients
    };

    res.json(stats);

  } catch (error) {
    console.error('❌ Stats API error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json({ 
      error: 'Failed to fetch stats',
      details: error.message,
      code: error.code
    });
  } finally {
    await prisma.$disconnect();
  }
} 