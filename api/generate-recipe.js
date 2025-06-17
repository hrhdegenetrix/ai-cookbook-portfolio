import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
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

    // Import OpenAI dynamically
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
  } finally {
    await prisma.$disconnect();
  }
} 