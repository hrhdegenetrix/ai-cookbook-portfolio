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

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Recipe ID is required' });
  }

  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({ 
        error: 'OpenAI API key not configured. Please set your API key first.',
        requiresApiKey: true
      });
    }

    // Get the original recipe
    const originalRecipe = await prisma.recipe.findUnique({
      where: { id: parseInt(id) }
    });

    if (!originalRecipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    // Parse original ingredients
    const originalIngredients = JSON.parse(originalRecipe.originalIngredients);

    // Import OpenAI dynamically
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `Create a similar but distinctly different recipe inspired by "${originalRecipe.title}". 
    Use these same core ingredients: ${originalIngredients.join(', ')}.
    The new recipe should serve ${originalRecipe.servings} people and be in the same cuisine style (${originalRecipe.cuisine}).
    
    Make it different by:
    - Using a different cooking method
    - Different flavor profile or seasoning approach  
    - Different presentation or serving style
    
    Please format the response as a JSON object with the following structure:
    {
      "title": "New Recipe Name (should be different from the original)",
      "description": "Brief appetizing description explaining how it differs from the original",
      "servings": ${originalRecipe.servings},
      "prepTime": "preparation time",
      "cookTime": "cooking time", 
      "ingredients": ["ingredient 1 with amount", "ingredient 2 with amount", ...],
      "instructions": ["step 1", "step 2", ...],
      "tips": "Any helpful cooking tips",
      "cuisine": "${originalRecipe.cuisine}"
    }
    
    Make it creative and distinctly different from the original while keeping the same core ingredients!`;

    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a creative chef who specializes in creating recipe variations. You excel at taking existing recipes and creating similar but distinctly different versions using the same core ingredients. Always respond with valid JSON format.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.9, // Higher temperature for more creativity
    });

    const recipeText = completion.choices[0].message.content;
    
    // Parse the JSON response
    let recipe;
    try {
      // Clean the response text
      let cleanedText = recipeText.trim();
      cleanedText = cleanedText.replace(/```json\s*/gi, '').replace(/```\s*$/g, '');
      cleanedText = cleanedText.replace(/```\s*/g, '');
      
      const jsonMatch = cleanedText.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        cleanedText = jsonMatch[1];
      }
      
      cleanedText = cleanedText
        .replace(/,(\s*[}\]])/g, '$1')
        .replace(/([{\[,]\s*)(\w+):/g, '$1"$2":')
        .trim();
      
      const parsed = JSON.parse(cleanedText);
      
      // Validate and ensure all required fields
      recipe = {
        title: parsed.title || `Similar to ${originalRecipe.title}`,
        description: parsed.description || 'A delicious variation of the original recipe',
        servings: parsed.servings || originalRecipe.servings,
        prepTime: parsed.prepTime || originalRecipe.prepTime,
        cookTime: parsed.cookTime || originalRecipe.cookTime,
        ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : originalIngredients.map(ing => `1 cup ${ing}`),
        instructions: Array.isArray(parsed.instructions) ? parsed.instructions : ['Follow the recipe steps provided'],
        tips: parsed.tips || 'Adjust seasoning to taste and enjoy!',
        cuisine: parsed.cuisine || originalRecipe.cuisine
      };
      
      console.log(`✅ Successfully parsed similar recipe`);
      
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError.message);
      
      // Fallback recipe
      recipe = {
        title: `Variation of ${originalRecipe.title}`,
        description: "A creative variation generated by AI - try it out!",
        servings: originalRecipe.servings,
        prepTime: originalRecipe.prepTime,
        cookTime: originalRecipe.cookTime,
        ingredients: originalIngredients.map(ing => `Fresh ${ing} (amount to taste)`),
        instructions: [
          "Prepare your ingredients according to the AI suggestions below:",
          "⚠️ Note: Recipe formatting was adjusted for display",
          ...recipeText.split('\n').filter(line => line.trim()).slice(0, 5)
        ],
        tips: "This recipe was generated but had formatting issues. Use as inspiration and adjust ingredients and steps as needed!",
        cuisine: originalRecipe.cuisine
      };
    }

    // Save the new recipe to database
    let savedRecipe;
    try {
      // Check if we need to cleanup old recipes (keep last 50)
      const totalRecipes = await prisma.recipe.count();
      if (totalRecipes >= 50) {
        const recipesToDelete = await prisma.recipe.findMany({
          where: { isFavorite: false },
          orderBy: { createdAt: 'asc' },
          take: totalRecipes - 49
        });
        
        for (const oldRecipe of recipesToDelete) {
          await prisma.recipe.delete({ where: { id: oldRecipe.id } });
          console.log(`🗑️ Deleted old recipe: ${oldRecipe.title}`);
        }
      }

      savedRecipe = await prisma.recipe.create({
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
      
      // Add database info to recipe
      const finalRecipe = {
        ...recipe,
        id: savedRecipe.id,
        createdAt: savedRecipe.createdAt,
        isFavorite: false,
        rating: null,
        personalNotes: null
      };
      
      console.log(`✅ Similar recipe "${recipe.title}" saved to database with ID: ${savedRecipe.id}`);
      
      res.json({ recipe: finalRecipe });
      
    } catch (dbError) {
      console.error('⚠️ Failed to save similar recipe to database:', dbError);
      // Return recipe without DB info if save fails
      res.json({ recipe });
    }

  } catch (error) {
    console.error('Error generating similar recipe:', error);
    
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
      error: 'Sorry, I couldn\'t generate a similar recipe right now. Please try again later!' 
    });
  } finally {
    await prisma.$disconnect();
  }
} 