const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs-extra');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Initialize Prisma client
const prisma = new PrismaClient();

const app = express();

// Dynamic port assignment with fallback options
const findAvailablePort = async (startPort = 5000) => {
  const net = require('net');
  
  const isPortAvailable = (port) => {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.listen(port, () => {
        server.close(() => resolve(true));
      });
      server.on('error', () => resolve(false));
    });
  };

  for (let port = startPort; port < startPort + 100; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error('No available ports found');
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Path to .env file
const envPath = path.join(__dirname, '.env');

// Dynamic OpenAI client creation
let openaiClient = null;

function createOpenAIClient(apiKey) {
  const OpenAI = require('openai');
  return new OpenAI({ apiKey });
}

function getOpenAIClient() {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    openaiClient = createOpenAIClient(process.env.OPENAI_API_KEY);
  }
  return openaiClient;
}

// API Key management endpoints
app.get('/api/check-api-key', (req, res) => {
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  res.json({ 
    hasApiKey,
    isConfigured: hasApiKey
  });
});

app.post('/api/set-api-key', async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return res.status(400).json({ error: 'API key is required' });
    }

    // Validate API key format (should start with sk-)
    if (!apiKey.startsWith('sk-')) {
      return res.status(400).json({ error: 'Invalid API key format. OpenAI API keys should start with "sk-"' });
    }

    // Test the API key by making a simple request
    try {
      const testClient = createOpenAIClient(apiKey);
      await testClient.models.list(); // Simple test request
    } catch (testError) {
      return res.status(400).json({ 
        error: 'Invalid API key. Please check your OpenAI API key and try again.' 
      });
    }

    // Read current .env file or create empty object
    let envContent = '';
    try {
      if (await fs.pathExists(envPath)) {
        envContent = await fs.readFile(envPath, 'utf8');
      }
    } catch (readError) {
      console.log('Creating new .env file...');
    }

    // Parse existing env variables
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    // Update API key
    envVars.OPENAI_API_KEY = apiKey;

    // Generate new .env content
    const newEnvContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n') + '\n';

    // Write to .env file securely
    await fs.writeFile(envPath, newEnvContent, { mode: 0o600 }); // Secure permissions

    // Update process.env
    process.env.OPENAI_API_KEY = apiKey;

    // Reset OpenAI client to use new key
    openaiClient = createOpenAIClient(apiKey);

    res.json({ 
      success: true, 
      message: 'API key saved successfully!' 
    });

  } catch (error) {
    console.error('Error saving API key:', error);
    res.status(500).json({ 
      error: 'Failed to save API key. Please try again.' 
    });
  }
});

// Recipe generation endpoint
app.post('/api/generate-recipe', async (req, res) => {
  try {
    const client = getOpenAIClient();
    
    if (!client) {
      return res.status(400).json({ 
        error: 'OpenAI API key not configured. Please set your API key first.',
        requiresApiKey: true
      });
    }

    const { ingredients, servings, quantity = 1, cuisine = '' } = req.body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: 'Please provide at least one ingredient' });
    }

    if (ingredients.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 ingredients allowed' });
    }

    if (quantity < 1 || quantity > 5) {
      return res.status(400).json({ error: 'Recipe quantity must be between 1 and 5' });
    }

    const ingredientList = ingredients.join(', ');
    const cuisineText = cuisine ? ` in ${cuisine} style` : '';
    const pluralText = quantity > 1 ? `${quantity} different recipes` : 'a recipe';
    
    let prompt;
    if (quantity === 1) {
      prompt = `Create a delicious and creative recipe${cuisineText} using these ingredients: ${ingredientList}. 
      The recipe should serve ${servings || 4} people. 
      Please format the response as a JSON object with the following structure:
      {
        "title": "Recipe Name",
        "description": "Brief appetizing description",
        "servings": ${servings || 4},
        "prepTime": "preparation time",
        "cookTime": "cooking time",
        "ingredients": ["ingredient 1 with amount", "ingredient 2 with amount", ...],
        "instructions": ["step 1", "step 2", ...],
        "tips": "Any helpful cooking tips",
        "cuisine": "${cuisine || 'International'}"
      }
      
      Make it creative and delicious! Focus on flavors that complement each other.`;
    } else {
      prompt = `Create ${quantity} different and creative recipes${cuisineText} using these ingredients: ${ingredientList}. 
      Each recipe should serve ${servings || 4} people and be distinctly different from the others.
      Please format the response as a JSON array of recipe objects:
      [
        {
          "title": "Recipe Name 1",
          "description": "Brief appetizing description",
          "servings": ${servings || 4},
          "prepTime": "preparation time",
          "cookTime": "cooking time",
          "ingredients": ["ingredient 1 with amount", "ingredient 2 with amount", ...],
          "instructions": ["step 1", "step 2", ...],
          "tips": "Any helpful cooking tips",
          "cuisine": "${cuisine || 'International'}"
        },
        {
          "title": "Recipe Name 2",
          // ... similar structure for other recipes
        }
      ]
      
      Make each recipe unique in cooking method, flavor profile, or presentation while using the same base ingredients.`;
    }

    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a creative chef who loves to create delicious recipes${cuisine ? ` specializing in ${cuisine} cuisine` : ''}. Always respond with valid JSON format. When creating multiple recipes, ensure they are distinctly different in cooking methods and flavor profiles.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: quantity === 1 ? 1000 : 2500,
      temperature: 0.8,
    });

    const recipeText = completion.choices[0].message.content;
    
    // Try to parse the JSON response with improved robustness
    let recipes;
    try {
      // Clean the response text - remove any markdown code blocks or extra text
      let cleanedText = recipeText.trim();
      
      // Remove markdown code blocks if present
      cleanedText = cleanedText.replace(/```json\s*/gi, '').replace(/```\s*$/g, '');
      cleanedText = cleanedText.replace(/```\s*/g, '');
      
      // Find JSON content between curly braces or square brackets
      const jsonMatch = cleanedText.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
      if (jsonMatch) {
        cleanedText = jsonMatch[1];
      }
      
      // Fix common JSON issues
      cleanedText = cleanedText
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/([{\[,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys
        .trim();
      
      console.log('🔍 Attempting to parse cleaned JSON:', cleanedText.substring(0, 200) + '...');
      
      const parsed = JSON.parse(cleanedText);
      recipes = Array.isArray(parsed) ? parsed : [parsed];
      
      // Validate recipe structure
      recipes = recipes.map(recipe => ({
        title: recipe.title || 'Delicious Recipe',
        description: recipe.description || 'A wonderful recipe created with AI',
        servings: recipe.servings || servings || 4,
        prepTime: recipe.prepTime || '15 minutes',
        cookTime: recipe.cookTime || '30 minutes',
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : ingredients.map(ing => `1 cup ${ing}`),
        instructions: Array.isArray(recipe.instructions) ? recipe.instructions : ['Follow the recipe steps provided'],
        tips: recipe.tips || 'Adjust seasoning to taste and enjoy!',
        cuisine: recipe.cuisine || cuisine || 'International'
      }));
      
      console.log(`✅ Successfully parsed ${recipes.length} recipe(s)`);
      
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError.message);
      console.log('📝 Raw response:', recipeText.substring(0, 500) + '...');
      
      // Enhanced fallback with better error handling
      recipes = Array.from({ length: quantity }, (_, index) => ({
        title: `AI Recipe ${index + 1}`,
        description: "A creative recipe generated by AI - try it out!",
        servings: servings || 4,
        prepTime: "15 minutes",
        cookTime: "25 minutes",
        ingredients: ingredients.map(ing => `Fresh ${ing} (amount to taste)`),
        instructions: [
          "Prepare your ingredients according to the AI suggestions below:",
          "⚠️ Note: Recipe formatting was adjusted for display",
          ...recipeText.split('\n').filter(line => line.trim()).slice(0, 5)
        ],
        tips: "This recipe was generated but had formatting issues. Use as inspiration and adjust ingredients and steps as needed!",
        cuisine: cuisine || 'International'
      }));
    }

    // Save recipes to database
    const savedRecipes = [];
    for (const recipe of recipes) {
      try {
        // Check if we need to cleanup old recipes (keep last 50)
        const totalRecipes = await prisma.recipe.count();
        if (totalRecipes >= 50) {
          // Get oldest non-favorite recipes to delete
          const recipesToDelete = await prisma.recipe.findMany({
            where: { isFavorite: false },
            orderBy: { createdAt: 'asc' },
            take: totalRecipes - 49 // Keep 49 + 1 new = 50 total
          });
          
          for (const oldRecipe of recipesToDelete) {
            await prisma.recipe.delete({ where: { id: oldRecipe.id } });
            console.log(`🗑️ Deleted old recipe: ${oldRecipe.title}`);
          }
        }

        const savedRecipe = await prisma.recipe.create({
          data: {
            title: recipe.title,
            description: recipe.description,
            servings: recipe.servings,
            prepTime: recipe.prepTime,
            cookTime: recipe.cookTime,
            ingredients: JSON.stringify(recipe.ingredients),
            instructions: JSON.stringify(recipe.instructions),
            tips: recipe.tips || '',
            originalIngredients: JSON.stringify(ingredients),
            cuisine: (recipe.cuisine || cuisine || 'International').toLowerCase()
          }
        });
        
        // Add database info to recipe
        savedRecipes.push({
          ...recipe,
          id: savedRecipe.id,
          createdAt: savedRecipe.createdAt,
          isFavorite: false,
          rating: null,
          personalNotes: null
        });
        
        console.log(`✅ Recipe "${recipe.title}" saved to database with ID: ${savedRecipe.id}`);
      } catch (dbError) {
        console.error('⚠️ Failed to save recipe to database:', dbError);
        // Add recipe without DB info if save fails
        savedRecipes.push(recipe);
      }
    }

    res.json({ 
      recipes: savedRecipes,
      quantity: recipes.length 
    });

  } catch (error) {
    console.error('Error generating recipe:', error);
    
    // Handle specific OpenAI errors
    if (error.code === 'insufficient_quota') {
      return res.status(400).json({ 
        error: 'OpenAI API quota exceeded. Please check your API key billing status.',
        requiresApiKey: true
      });
    }
    
    if (error.code === 'invalid_api_key') {
      return res.status(400).json({ 
        error: 'Invalid OpenAI API key. Please update your API key.',
        requiresApiKey: true
      });
    }

    res.status(500).json({ 
      error: 'Sorry, I couldn\'t generate a recipe right now. Please try again later!' 
    });
  }
});

// Recipe History Management Endpoints

// Get all recipes with pagination and filtering
app.get('/api/recipes', async (req, res) => {
  try {
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
    
    console.log('🔍 Converted search terms:', { searchLower, cuisineLower });
    
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
    
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

// Get single recipe by ID
app.get('/api/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const recipe = await prisma.recipe.findUnique({
      where: { id }
    });
    
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    // Parse JSON fields back to objects
    const formattedRecipe = {
      ...recipe,
      ingredients: JSON.parse(recipe.ingredients),
      instructions: JSON.parse(recipe.instructions),
      originalIngredients: JSON.parse(recipe.originalIngredients)
    };
    
    res.json({ recipe: formattedRecipe });
    
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});

// Update recipe (favorite, rating, notes)
app.patch('/api/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { isFavorite, rating, personalNotes } = req.body;
    
    const updateData = {};
    if (typeof isFavorite === 'boolean') updateData.isFavorite = isFavorite;
    if (rating !== undefined) updateData.rating = rating;
    if (personalNotes !== undefined) updateData.personalNotes = personalNotes;
    
    const updatedRecipe = await prisma.recipe.update({
      where: { id },
      data: updateData
    });
    
    // Parse JSON fields back to objects
    const formattedRecipe = {
      ...updatedRecipe,
      ingredients: JSON.parse(updatedRecipe.ingredients),
      instructions: JSON.parse(updatedRecipe.instructions),
      originalIngredients: JSON.parse(updatedRecipe.originalIngredients)
    };
    
    res.json({ recipe: formattedRecipe });
    
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({ error: 'Failed to update recipe' });
  }
});

// Delete recipe
app.delete('/api/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.recipe.delete({
      where: { id }
    });
    
    res.json({ message: 'Recipe deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

// Get recipe statistics (dashboard data)
app.get('/api/stats', async (req, res) => {
  try {
    const [
      totalRecipes,
      favoriteRecipes,
      recentRecipes,
      topIngredients
    ] = await Promise.all([
      prisma.recipe.count(),
      prisma.recipe.count({ where: { isFavorite: true } }),
      prisma.recipe.count({ 
        where: { 
          createdAt: { 
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          } 
        } 
      }),
      // Get most common ingredients from originalIngredients
      prisma.recipe.findMany({ 
        select: { originalIngredients: true } 
      })
    ]);
    
    // Process ingredient frequency
    const ingredientCounts = {};
    topIngredients.forEach(recipe => {
      const ingredients = JSON.parse(recipe.originalIngredients);
      ingredients.forEach(ingredient => {
        const cleaned = ingredient.toLowerCase().trim();
        ingredientCounts[cleaned] = (ingredientCounts[cleaned] || 0) + 1;
      });
    });
    
    const sortedIngredients = Object.entries(ingredientCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([ingredient, count]) => ({ ingredient, count }));
    
    res.json({
      totalRecipes,
      favoriteRecipes,
      recentRecipes,
      topIngredients: sortedIngredients
    });
    
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Generate similar recipe based on existing recipe
app.post('/api/recipes/:id/similar', async (req, res) => {
  try {
    const { id } = req.params;
    
    const originalRecipe = await prisma.recipe.findUnique({
      where: { id }
    });
    
    if (!originalRecipe) {
      return res.status(404).json({ error: 'Original recipe not found' });
    }
    
    const client = getOpenAIClient();
    if (!client) {
      return res.status(400).json({ 
        error: 'OpenAI API key not configured. Please set your API key first.',
        requiresApiKey: true
      });
    }
    
    const originalIngredients = JSON.parse(originalRecipe.originalIngredients);
    const prompt = `Create a similar but different recipe using these ingredients: ${originalIngredients.join(', ')}. 
    Make it different from this existing recipe: "${originalRecipe.title}". 
    The recipe should serve ${originalRecipe.servings} people.
    Please format the response as a JSON object with the same structure as before.`;

    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a creative chef who creates variations of recipes. Always respond with valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.9, // Higher temperature for more variation
    });

    const recipeText = completion.choices[0].message.content;
    let recipe;
    
    try {
      // Use the same robust JSON parsing logic as main recipe generation
      let cleanedText = recipeText.trim();
      
      // Remove markdown code blocks if present
      cleanedText = cleanedText.replace(/```json\s*/gi, '').replace(/```\s*$/g, '');
      cleanedText = cleanedText.replace(/```\s*/g, '');
      
      // Find JSON content between curly braces or square brackets
      const jsonMatch = cleanedText.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
      if (jsonMatch) {
        cleanedText = jsonMatch[1];
      }
      
      // Fix common JSON issues
      cleanedText = cleanedText
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/([{\[,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys
        .trim();
      
      console.log('🔍 Attempting to parse similar recipe JSON:', cleanedText.substring(0, 200) + '...');
      
      const parsed = JSON.parse(cleanedText);
      recipe = Array.isArray(parsed) ? parsed[0] : parsed;
      
      // Validate recipe structure
      recipe = {
        title: recipe.title || `${originalRecipe.title} - Variation`,
        description: recipe.description || 'A delicious variation of your favorite recipe!',
        servings: recipe.servings || originalRecipe.servings,
        prepTime: recipe.prepTime || originalRecipe.prepTime,
        cookTime: recipe.cookTime || originalRecipe.cookTime,
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : originalIngredients.map(ing => `Fresh ${ing} (amount to taste)`),
        instructions: Array.isArray(recipe.instructions) ? recipe.instructions : ['Follow the recipe steps provided'],
        tips: recipe.tips || 'This is a creative variation - adjust to your taste!',
        cuisine: (recipe.cuisine || originalRecipe.cuisine || 'International').toLowerCase()
      };
      
      console.log(`✅ Successfully parsed similar recipe: ${recipe.title}`);
      
    } catch (parseError) {
      console.error('❌ Similar recipe JSON parsing failed:', parseError.message);
      console.log('📝 Raw similar recipe response:', recipeText.substring(0, 500) + '...');
      
      // Enhanced fallback
      recipe = {
        title: `${originalRecipe.title} - Creative Variation`,
        description: "A creative variation inspired by your favorite recipe!",
        servings: originalRecipe.servings,
        prepTime: originalRecipe.prepTime,
        cookTime: originalRecipe.cookTime,
        ingredients: originalIngredients.map(ing => `Fresh ${ing} (to taste)`),
        instructions: [
          "Create a variation using the AI inspiration below:",
          "⚠️ Note: Recipe formatting was adjusted for display",
          ...recipeText.split('\n').filter(line => line.trim()).slice(0, 4)
        ],
        tips: "This is a creative variation based on AI suggestions. Adjust ingredients and methods to your taste!",
        cuisine: (originalRecipe.cuisine || 'International').toLowerCase()
      };
    }

    // Save the new recipe
    const savedRecipe = await prisma.recipe.create({
      data: {
        title: recipe.title,
        description: recipe.description,
        servings: recipe.servings,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        ingredients: JSON.stringify(recipe.ingredients),
        instructions: JSON.stringify(recipe.instructions),
        tips: recipe.tips || '',
        originalIngredients: JSON.stringify(originalIngredients),
        cuisine: recipe.cuisine.toLowerCase()
      }
    });
    
    recipe.id = savedRecipe.id;
    recipe.createdAt = savedRecipe.createdAt;
    
    res.json({ recipe });
    
  } catch (error) {
    console.error('Error generating similar recipe:', error);
    res.status(500).json({ 
      error: 'Sorry, I couldn\'t generate a similar recipe right now. Please try again later!' 
    });
  }
});

// Email recipe sharing endpoint
app.post('/api/recipes/:id/email', async (req, res) => {
  try {
    const { id } = req.params;
    const { recipientEmail, senderName = 'A friend', personalMessage = '' } = req.body;
    
    if (!recipientEmail || !recipientEmail.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }
    
    const recipe = await prisma.recipe.findUnique({
      where: { id }
    });
    
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    // Parse JSON fields
    const formattedRecipe = {
      ...recipe,
      ingredients: JSON.parse(recipe.ingredients),
      instructions: JSON.parse(recipe.instructions)
    };
    
    // Create email-friendly format
    const emailContent = {
      subject: `🍳 ${senderName} shared a delicious recipe: ${formattedRecipe.title}`,
      recipe: formattedRecipe,
      senderName,
      personalMessage,
      recipientEmail
    };
    
    // For now, return the email content (in a real app, you'd send via nodemailer/SendGrid)
    res.json({ 
      message: 'Email content generated successfully!',
      emailPreview: {
        to: recipientEmail,
        subject: emailContent.subject,
        htmlContent: generateEmailHTML(emailContent)
      }
    });
    
  } catch (error) {
    console.error('Error sharing recipe:', error);
    res.status(500).json({ error: 'Failed to share recipe' });
  }
});

// Helper function to parse time strings to minutes
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  
  const cleanTime = timeStr.toLowerCase().replace(/[^\d\s]/g, '');
  const match = cleanTime.match(/(\d+)/);
  
  if (match) {
    return parseInt(match[1]);
  }
  
  return 0;
}

// Helper function to generate email HTML
function generateEmailHTML({ recipe, senderName, personalMessage, recipientEmail }) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .recipe-title { font-size: 28px; margin: 0 0 10px 0; }
        .recipe-meta { display: flex; gap: 20px; margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
        .meta-item { text-align: center; }
        .meta-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .meta-value { font-size: 16px; font-weight: bold; color: #333; }
        .section { margin: 25px 0; }
        .section-title { font-size: 20px; color: #667eea; margin-bottom: 15px; border-bottom: 2px solid #f1f3f4; padding-bottom: 8px; }
        .ingredients { list-style: none; padding: 0; }
        .ingredients li { padding: 8px 0; border-bottom: 1px solid #f1f3f4; }
        .instructions { padding-left: 20px; }
        .instructions li { margin-bottom: 12px; }
        .personal-message { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .footer { text-align: center; padding: 20px; background: #f8f9fa; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🍳 Recipe Shared With Love</h1>
          <p>From ${senderName}</p>
        </div>
        
        <div class="content">
          ${personalMessage ? `
            <div class="personal-message">
              <strong>Personal Message:</strong><br>
              ${personalMessage}
            </div>
          ` : ''}
          
          <h2 class="recipe-title">${recipe.title}</h2>
          <p>${recipe.description}</p>
          
          <div class="recipe-meta">
            <div class="meta-item">
              <div class="meta-label">Servings</div>
              <div class="meta-value">${recipe.servings}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Prep Time</div>
              <div class="meta-value">${recipe.prepTime}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Cook Time</div>
              <div class="meta-value">${recipe.cookTime}</div>
            </div>
          </div>
          
          <div class="section">
            <h3 class="section-title">🥘 Ingredients</h3>
            <ul class="ingredients">
              ${recipe.ingredients.map(ingredient => `<li>• ${ingredient}</li>`).join('')}
            </ul>
          </div>
          
          <div class="section">
            <h3 class="section-title">👨‍🍳 Instructions</h3>
            <ol class="instructions">
              ${recipe.instructions.map(instruction => `<li>${instruction}</li>`).join('')}
            </ol>
          </div>
          
          ${recipe.tips ? `
            <div class="section">
              <h3 class="section-title">💡 Chef's Tips</h3>
              <p>${recipe.tips}</p>
            </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <p>Generated by AI Recipe Generator • Happy Cooking! 👨‍🍳</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running!',
    hasApiKey: !!process.env.OPENAI_API_KEY,
    database: 'Connected ✅'
  });
});

// Start server with dynamic port assignment
const startServer = async () => {
  try {
    const PORT = process.env.PORT || await findAvailablePort(5000);
    const portFile = path.join(__dirname, '.port');
    
    app.listen(PORT, () => {
      console.log(`🍳 Recipe Generator API running on port ${PORT}`);
      console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Configured ✅' : 'Not configured ⚠️'}`);
      console.log(`🔗 Frontend should proxy to: http://localhost:${PORT}`);
      
      // Write port to a file so frontend can discover it
      fs.writeFileSync(portFile, PORT.toString());
    });
    
    // Graceful shutdown handling
    const cleanup = async () => {
      console.log('\n🧹 Cleaning up...');
      try {
        // Disconnect Prisma
        await prisma.$disconnect();
        console.log('✅ Database disconnected');
        
        if (fs.existsSync(portFile)) {
          fs.unlinkSync(portFile);
          console.log('✅ Port file cleaned up');
        }
      } catch (error) {
        console.log('⚠️ Could not clean up:', error.message);
      }
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('SIGQUIT', cleanup);
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer(); 