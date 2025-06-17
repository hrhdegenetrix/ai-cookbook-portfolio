const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client
const prisma = new PrismaClient();

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Recipe ID is required' });
  }

  try {
    if (req.method === 'GET') {
      // Get a single recipe
      const recipe = await prisma.recipe.findUnique({
        where: { id: parseInt(id) }
      });

      if (!recipe) {
        return res.status(404).json({ error: 'Recipe not found' });
      }

      // Parse JSON fields
      const formattedRecipe = {
        ...recipe,
        ingredients: JSON.parse(recipe.ingredients),
        instructions: JSON.parse(recipe.instructions),
        originalIngredients: JSON.parse(recipe.originalIngredients)
      };

      res.json(formattedRecipe);

    } else if (req.method === 'PATCH') {
      // Update a recipe
      const updateData = {};
      const { isFavorite, rating, personalNotes, title } = req.body;

      if (typeof isFavorite === 'boolean') {
        updateData.isFavorite = isFavorite;
      }
      if (rating !== undefined) {
        updateData.rating = rating;
      }
      if (personalNotes !== undefined) {
        updateData.personalNotes = personalNotes;
      }
      if (title !== undefined) {
        updateData.title = title;
      }

      const updatedRecipe = await prisma.recipe.update({
        where: { id: parseInt(id) },
        data: updateData
      });

      res.json(updatedRecipe);

    } else if (req.method === 'DELETE') {
      // Delete a recipe
      await prisma.recipe.delete({
        where: { id: parseInt(id) }
      });

      res.json({ success: true });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error in recipe operation:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 