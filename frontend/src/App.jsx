import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  ChefHat, Sparkles, Download, RotateCcw, Key, X, AlertCircle, CheckCircle, Settings,
  History, BarChart3, Heart, Star, Search, Filter, Trash2, Clock, Users, Timer,
  Copy, RefreshCw, BookOpen, TrendingUp, StickyNote, Edit3, Save,
  Globe, Plus, Minus
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ErrorBoundary from './ErrorBoundary';
import './index.css';

function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('generate');
  
  // Flag to prevent race conditions when switching tabs
  const switchingToFavorites = useRef(false);
  
  // Generator State (Enhanced)
  const [ingredients, setIngredients] = useState(['', '', '', '', '']);
  const [servings, setServings] = useState(4);
  const [quantity, setQuantity] = useState(1);
  const [cuisine, setCuisine] = useState('');
  const [generatedRecipes, setGeneratedRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // API Key Management State (Existing)
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [apiKeyError, setApiKeyError] = useState('');
  const [apiKeySuccess, setApiKeySuccess] = useState('');

  // Recipe History State
  const [historyRecipes, setHistoryRecipes] = useState([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [maxTimeFilter, setMaxTimeFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 8, total: 0, pages: 0 });
  
  // Analytics State
  const [stats, setStats] = useState({
    totalRecipes: 0,
    favoriteRecipes: 0,
    recentRecipes: 0,
    topIngredients: []
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // Notes State
  const [editingNotes, setEditingNotes] = useState(null);
  const [notesInput, setNotesInput] = useState('');

  // Similar Recipe Loading State
  const [similarRecipeLoading, setSimilarRecipeLoading] = useState(null);

  // Email functionality removed for portfolio version

  // Duplicate Recipe Detection State
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateRecipeData, setDuplicateRecipeData] = useState(null);

  // Cuisine options
  const cuisineOptions = [
    { value: '', label: '🌍 Any Cuisine' },
    { value: 'Italian', label: '🇮🇹 Italian' },
    { value: 'Mexican', label: '🇲🇽 Mexican' },
    { value: 'Asian', label: '🥢 Asian' },
    { value: 'Indian', label: '🇮🇳 Indian' },
    { value: 'Mediterranean', label: '🫒 Mediterranean' },
    { value: 'French', label: '🇫🇷 French' },
    { value: 'Japanese', label: '🍣 Japanese' },
    { value: 'Thai', label: '🇹🇭 Thai' },
    { value: 'Chinese', label: '🇨🇳 Chinese' },
    { value: 'American', label: '🇺🇸 American' },
    { value: 'Middle Eastern', label: '🥙 Middle Eastern' },
    { value: 'Korean', label: '🇰🇷 Korean' },
    { value: 'Greek', label: '🇬🇷 Greek' },
    { value: 'Spanish', label: '🇪🇸 Spanish' }
  ];

  // Check API key status on component mount
  useEffect(() => {
    checkApiKeyStatus();
    fetchRecipes();
    fetchStats();
  }, []);

  // Fetch recipes when tab changes to history or favorites
  useEffect(() => {
    if (activeTab === 'history' || activeTab === 'favorites') {
      if (activeTab === 'favorites') {
        switchingToFavorites.current = true;
        // Reset search when switching to favorites tab
        setSearchTerm('');
        setShowFavoritesOnly(false);
        // Small delay to allow state updates to complete
        setTimeout(() => {
          setPagination(prev => ({ ...prev, page: 1 }));
          fetchRecipes(1);
          switchingToFavorites.current = false;
        }, 10);
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchRecipes(1);
      }
    }
  }, [activeTab]);

  // Fetch recipes when search/filter changes (but not during tab switching)
  useEffect(() => {
    if (!switchingToFavorites.current && (activeTab === 'history' || activeTab === 'favorites')) {
      setPagination(prev => ({ ...prev, page: 1 })); // Reset pagination
      fetchRecipes(1); // Reset to page 1 when searching
    }
  }, [searchTerm, showFavoritesOnly, cuisineFilter, maxTimeFilter]);

  // Fetch recipes when page changes
  useEffect(() => {
    if (activeTab === 'history' || activeTab === 'favorites') {
      fetchRecipes(pagination.page);
    }
  }, [pagination.page]);

  // Fetch stats when tab changes to analytics
  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchStats();
    }
  }, [activeTab]);

  const checkApiKeyStatus = async () => {
    try {
      const response = await axios.get('/api/check-api-key');
      setHasApiKey(response.data.hasApiKey);
      
      // Show modal if no API key is configured
      if (!response.data.hasApiKey) {
        setShowApiKeyModal(true);
      }
    } catch (error) {
      console.error('Error checking API key status:', error);
    }
  };

  const saveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      setApiKeyError('Please enter your OpenAI API key');
      return;
    }

    setApiKeyLoading(true);
    setApiKeyError('');
    setApiKeySuccess('');

    try {
      const response = await axios.post('/api/set-api-key', {
        apiKey: apiKeyInput.trim()
      });

      setApiKeySuccess('API key saved successfully! 🎉');
      setHasApiKey(true);
      setApiKeyInput('');
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowApiKeyModal(false);
        setApiKeySuccess('');
      }, 2000);

    } catch (error) {
      setApiKeyError(error.response?.data?.error || 'Failed to save API key');
    } finally {
      setApiKeyLoading(false);
    }
  };

  // Fetch Recipe History
  const fetchRecipes = async (page = pagination.page) => {
    console.log('📡 Fetching recipes:', { page, activeTab, searchTerm, showFavoritesOnly });
    setRecipesLoading(true);
    setError(''); // Clear any existing errors
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: activeTab === 'history' ? pagination.limit.toString() : '50', // Limit favorites to 50
        ...(searchTerm && { search: searchTerm }),
        ...((showFavoritesOnly || activeTab === 'favorites') && { favorites: 'true' }),
        ...(cuisineFilter && { cuisine: cuisineFilter }),
        ...(maxTimeFilter && { maxTime: maxTimeFilter })
      });

      console.log('📡 API call params:', params.toString());
      console.log('📡 Full URL:', `/api/recipes?${params}`);
      
      const response = await axios.get(`/api/recipes?${params}`);
      console.log('✅ Raw API response:', response);
      console.log('✅ Response data:', response.data);
      console.log('✅ Fetched recipes:', response.data?.recipes?.length, 'recipes');
      
      // Enhanced validation
      if (!response) {
        throw new Error('No response received from API');
      }
      if (!response.data) {
        throw new Error('No data in API response');
      }
      if (!response.data.recipes) {
        throw new Error('No recipes field in API response');
      }
      if (!Array.isArray(response.data.recipes)) {
        throw new Error(`Expected recipes to be array, got ${typeof response.data.recipes}`);
      }
      
      console.log('✅ Setting historyRecipes:', response.data.recipes);
      setHistoryRecipes(response.data.recipes);
      
      console.log('✅ Setting pagination:', response.data.pagination);
      setPagination(response.data.pagination || { page: 1, pages: 1, total: 0, limit: 20 });
      
      console.log('✅ fetchRecipes completed successfully');
    } catch (error) {
      console.error('❌ Error fetching recipes:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      
      // Set a user-friendly error message
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load recipes. Please try again.';
      setError(errorMessage);
      
      // Set safe default values
      setHistoryRecipes([]);
      setPagination({ page: 1, pages: 1, total: 0, limit: 20 });
    } finally {
      setRecipesLoading(false);
      console.log('📡 fetchRecipes finally block executed');
    }
  };

  // Fetch Analytics
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await axios.get('/api/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Check for duplicate recipe names when favoriting
  const checkForDuplicateRecipe = async (recipeToFavorite) => {
    try {
      const response = await axios.get('/api/recipes', {
        params: { favorites: 'true', limit: 100 }
      });
      
      const existingFavorites = response.data.recipes;
      const duplicates = existingFavorites.filter(recipe => 
        recipe.title.toLowerCase().trim() === recipeToFavorite.title.toLowerCase().trim() &&
        recipe.id !== recipeToFavorite.id
      );
      
      return duplicates;
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      return [];
    }
  };

  // Toggle Recipe Favorite
  const toggleFavorite = async (recipeId, currentStatus) => {
    console.log('toggleFavorite called:', { recipeId, currentStatus });
    
    // If removing from favorites, do optimistic update and proceed
    if (currentStatus) {
      // OPTIMISTIC UPDATE: Update UI immediately
      updateRecipeInAllStates(recipeId, { isFavorite: false });
      console.log('⚡ Optimistic update applied immediately for unfavoriting');
      
      try {
        await axios.patch(`/api/recipes/${recipeId}`, {
          isFavorite: false
        });
        
        // Refresh favorites list if on favorites tab, refresh stats if on analytics tab
        if (activeTab === 'favorites') {
          fetchRecipes();
        }
        if (activeTab === 'analytics') {
          fetchStats();
        }
      } catch (error) {
        console.error('Error updating favorite status:', error);
        // Revert optimistic update on error
        updateRecipeInAllStates(recipeId, { isFavorite: true });
        console.log('↩️ Reverted optimistic update due to error');
      }
      return;
    }

    // If adding to favorites, find the recipe
    const currentRecipe = [...generatedRecipes, ...historyRecipes].find(r => r.id === recipeId);
    if (!currentRecipe) {
      console.log('Current recipe not found:', recipeId);
      return;
    }

    console.log('Found current recipe:', currentRecipe.title);

    // OPTIMISTIC UPDATE: Update UI immediately for favoriting
    updateRecipeInAllStates(recipeId, { isFavorite: true });
    console.log('⚡ Optimistic update applied immediately for favoriting');

    try {
      // Check for duplicates when favoriting any recipe
      const duplicates = await checkForDuplicateRecipe(currentRecipe);
      console.log('Duplicates found:', duplicates.length);
      
      if (duplicates.length > 0) {
        // Revert optimistic update since we need user input
        updateRecipeInAllStates(recipeId, { isFavorite: false });
        console.log('↩️ Reverted optimistic update due to duplicates');
        
        // Show duplicate comparison modal
        setDuplicateRecipeData({
          newRecipe: currentRecipe,
          existingRecipes: duplicates,
          action: 'favorite'
        });
        setShowDuplicateModal(true);
        return;
      }
      
      // No duplicates, proceed with backend update
      console.log('Proceeding with favorite action');
      await performFavoriteAction(recipeId, true);
    } catch (error) {
      console.error('Error in favoriting process:', error);
      // Revert optimistic update on error
      updateRecipeInAllStates(recipeId, { isFavorite: false });
      console.log('↩️ Reverted optimistic update due to error');
    }
  };

  // Helper function to update recipe in all state arrays
  const updateRecipeInAllStates = (recipeId, updates) => {
    console.log('updateRecipeInAllStates called:', { recipeId, updates });
    
    setGeneratedRecipes(prev => {
      const updated = prev.map(recipe => 
        recipe.id === recipeId ? { ...recipe, ...updates } : recipe
      );
      console.log('Updated generatedRecipes:', updated.find(r => r.id === recipeId));
      return updated;
    });
    
    setHistoryRecipes(prev => {
      const updated = prev.map(recipe => 
        recipe.id === recipeId ? { ...recipe, ...updates } : recipe
      );
      console.log('Updated historyRecipes:', updated.find(r => r.id === recipeId));
      return updated;
    });
  };

  // Perform the actual favorite action
  const performFavoriteAction = async (recipeId, isFavorite, customTitle = null) => {
    console.log('performFavoriteAction called:', { recipeId, isFavorite, customTitle });
    
    try {
      const updateData = { isFavorite };
      if (customTitle) {
        updateData.title = customTitle;
      }

      console.log('Sending PATCH request with:', updateData);
      const response = await axios.patch(`/api/recipes/${recipeId}`, updateData);
      console.log('PATCH response:', response.data);
      
      // Only update title if customTitle was provided (optimistic update already handled isFavorite)
      if (customTitle) {
        updateRecipeInAllStates(recipeId, { title: customTitle });
        console.log('Updated title in local state');
      }
      
      // Refresh favorites list if on favorites tab, refresh stats if on analytics tab
      if (activeTab === 'favorites') {
        fetchRecipes();
      }
      if (activeTab === 'analytics') {
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating favorite status:', error);
      throw error; // Re-throw to allow caller to handle
    }
  };

  // Rate Recipe
  const rateRecipe = async (recipeId, rating) => {
    try {
      await axios.patch(`/api/recipes/${recipeId}`, { rating });
      
      // Update local state for both generated and history recipes
      setGeneratedRecipes(prev => prev.map(recipe => 
        recipe.id === recipeId 
          ? { ...recipe, rating }
          : recipe
      ));
      
      setHistoryRecipes(prev => prev.map(recipe => 
        recipe.id === recipeId 
          ? { ...recipe, rating }
          : recipe
      ));
    } catch (error) {
      console.error('Error rating recipe:', error);
    }
  };

  // Update Personal Notes
  const updateNotes = async (recipeId, notes) => {
    try {
      await axios.patch(`/api/recipes/${recipeId}`, { personalNotes: notes });
      
      // Update local state
      setGeneratedRecipes(prev => prev.map(recipe => 
        recipe.id === recipeId 
          ? { ...recipe, personalNotes: notes }
          : recipe
      ));
      
      setHistoryRecipes(prev => prev.map(recipe => 
        recipe.id === recipeId 
          ? { ...recipe, personalNotes: notes }
          : recipe
      ));
      
      setEditingNotes(null);
      setNotesInput('');
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  // Email functionality removed for portfolio version

  // Delete Recipe
  const deleteRecipe = async (recipeId) => {
    if (!confirm('Are you sure you want to delete this recipe?')) return;
    
    try {
      await axios.delete(`/api/recipes/${recipeId}`);
      setHistoryRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
      setGeneratedRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
      
      // Refresh stats
      if (activeTab === 'analytics') {
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
    }
  };

  // Generate Similar Recipe
  const generateSimilarRecipe = async (recipeId) => {
    console.log('🔄 Starting similar recipe generation for:', recipeId);
    setSimilarRecipeLoading(recipeId);
    setError(''); // Clear any existing errors
    
    try {
      const response = await axios.post(`/api/recipes/${recipeId}/similar`);
      console.log('✅ Similar recipe response:', response.data);
      
      // Validate response structure
      if (!response.data.recipe) {
        throw new Error('Invalid response: no recipe data');
      }
      
      const newRecipe = response.data.recipe;
      
      // Ensure the new recipe has all required fields
      const safeRecipe = {
        id: newRecipe.id,
        title: newRecipe.title || 'Similar Recipe',
        description: newRecipe.description || 'A similar recipe variation',
        servings: newRecipe.servings || 4,
        prepTime: newRecipe.prepTime || '15 minutes',
        cookTime: newRecipe.cookTime || '30 minutes',
        ingredients: Array.isArray(newRecipe.ingredients) ? newRecipe.ingredients : [],
        instructions: Array.isArray(newRecipe.instructions) ? newRecipe.instructions : [],
        tips: newRecipe.tips || '',
        cuisine: newRecipe.cuisine || 'International',
        isFavorite: newRecipe.isFavorite || false,
        rating: newRecipe.rating || null,
        personalNotes: newRecipe.personalNotes || null,
        createdAt: newRecipe.createdAt || new Date().toISOString()
      };
      
      console.log('✅ Safe recipe object:', safeRecipe);
      
      // Replace the recipe it's branching off of instead of adding
      setGeneratedRecipes(prev => {
        console.log('Previous generated recipes:', prev.length);
        const updated = prev.map(recipe => 
          recipe.id === recipeId ? safeRecipe : recipe
        );
        console.log('Replaced recipe with similar recipe:', updated.length);
        return updated;
      });
      
      // Switch to generator tab to show result
      setActiveTab('generate');
      console.log('✅ Switched to generate tab');
      
      // Refresh recipe history and stats
      fetchRecipes();
      fetchStats();
      console.log('✅ Similar recipe generation complete');
    } catch (error) {
      console.error('❌ Similar recipe generation failed:', error);
      setError(error.response?.data?.error || 'Failed to generate similar recipe');
    } finally {
      setSimilarRecipeLoading(null);
    }
  };

  const handleIngredientChange = (index, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const generateRecipe = async () => {
    const filledIngredients = ingredients.filter(ing => ing.trim() !== '');
    
    if (filledIngredients.length === 0) {
      setError('Please enter at least one ingredient!');
      return;
    }

    setLoading(true);
    setError('');
    
    // Check if we have existing recipes before clearing
    const hasExistingRecipes = generatedRecipes.length > 0;
    
    // Only clear if this is a fresh generation (not "Generate More")
    if (!hasExistingRecipes) {
      setGeneratedRecipes([]);
    }

    try {
      const response = await axios.post('/api/generate-recipe', {
        ingredients: filledIngredients,
        servings: servings,
        quantity: quantity,
        cuisine: cuisine
      });

      // If we already have generated recipes, append new ones; otherwise replace
      if (hasExistingRecipes) {
        setGeneratedRecipes(prev => [...prev, ...response.data.recipes]);
      } else {
        setGeneratedRecipes(response.data.recipes);
      }
      
      // Refresh recipe history and stats
      fetchRecipes();
      fetchStats();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Something went wrong. Please try again!';
      setError(errorMessage);
      
      // Show API key modal if API key is required
      if (err.response?.data?.requiresApiKey) {
        setShowApiKeyModal(true);
        setHasApiKey(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIngredients(['', '', '', '', '']);
    setServings(4);
    setQuantity(1);
    setCuisine('');
    setGeneratedRecipes([]);
    setError('');
  };

  const exportToPDF = async (recipeToExport) => {
    if (!recipeToExport) return;

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = margin;

      // Add title
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text(recipeToExport.title, pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      // Add description
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'italic');
      const description = pdf.splitTextToSize(recipeToExport.description, pageWidth - 2 * margin);
      pdf.text(description, pageWidth / 2, yPos, { align: 'center' });
      yPos += description.length * 5 + 10;

      // Add meta info
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Servings: ${recipeToExport.servings} | Prep: ${recipeToExport.prepTime} | Cook: ${recipeToExport.cookTime}`, pageWidth / 2, yPos, { align: 'center' });
      if (recipeToExport.cuisine) {
        yPos += 7;
        pdf.text(`Cuisine: ${recipeToExport.cuisine}`, pageWidth / 2, yPos, { align: 'center' });
      }
      yPos += 15;

      // Add ingredients
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Ingredients', margin, yPos);
      yPos += 10;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      recipeToExport.ingredients.forEach((ingredient, index) => {
        if (yPos > 250) {
          pdf.addPage();
          yPos = margin;
        }
        pdf.text(`• ${ingredient}`, margin + 5, yPos);
        yPos += 6;
      });

      yPos += 10;

      // Add instructions
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Instructions', margin, yPos);
      yPos += 10;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      recipeToExport.instructions.forEach((instruction, index) => {
        if (yPos > 250) {
          pdf.addPage();
          yPos = margin;
        }
        const wrappedText = pdf.splitTextToSize(`${index + 1}. ${instruction}`, pageWidth - 2 * margin);
        pdf.text(wrappedText, margin, yPos);
        yPos += wrappedText.length * 5 + 5;
      });

      // Add tips if available
      if (recipeToExport.tips) {
        yPos += 10;
        if (yPos > 220) {
          pdf.addPage();
          yPos = margin;
        }
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Chef\'s Tips', margin, yPos);
        yPos += 10;

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'italic');
        const tipsText = pdf.splitTextToSize(recipeToExport.tips, pageWidth - 2 * margin);
        pdf.text(tipsText, margin, yPos);
      }

      // Add personal notes if available
      if (recipeToExport.personalNotes) {
        yPos += 15;
        if (yPos > 220) {
          pdf.addPage();
          yPos = margin;
        }
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Personal Notes', margin, yPos);
        yPos += 10;

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        const notesText = pdf.splitTextToSize(recipeToExport.personalNotes, pageWidth - 2 * margin);
        pdf.text(notesText, margin, yPos);
      }

      pdf.save(`${recipeToExport.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_recipe.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF. Please try again.');
    }
  };

  // Render Navigation Tabs
  const renderTabs = () => (
    <div className="tabs">
      <button
        className={`tab ${activeTab === 'generate' ? 'active' : ''}`}
        onClick={() => setActiveTab('generate')}
      >
        <Sparkles size={20} />
        Generate Recipe
      </button>
      
      <button
        className={`tab ${activeTab === 'history' ? 'active' : ''}`}
        onClick={() => setActiveTab('history')}
      >
        <History size={20} />
        Recipe History
        {stats.totalRecipes > 0 && (
          <span className="tab-badge">{stats.totalRecipes}</span>
        )}
      </button>
      
      <button
        className={`tab ${activeTab === 'favorites' ? 'active' : ''}`}
        onClick={() => setActiveTab('favorites')}
      >
        <Heart size={20} />
        Favorites
        {stats.favoriteRecipes > 0 && (
          <span className="tab-badge">{stats.favoriteRecipes}</span>
        )}
      </button>
      
      <button
        className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
        onClick={() => setActiveTab('analytics')}
      >
        <BarChart3 size={20} />
        Analytics
      </button>
    </div>
  );

  // Render Recipe Card
  const renderRecipeCard = (recipe) => (
    <div key={recipe.id} className="recipe-card">
      <div className="recipe-card-header">
        <h3 className="recipe-card-title">{recipe.title}</h3>
        <div className="recipe-card-actions">
          <button
            className={`btn-icon ${recipe.isFavorite ? 'favorite' : ''}`}
            onClick={() => toggleFavorite(recipe.id, recipe.isFavorite)}
            title={recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
                                          <Heart size={16} fill={recipe.isFavorite ? '#e53e3e' : 'none'} color={recipe.isFavorite ? '#e53e3e' : '#718096'} />
          </button>
          
          {/* Email functionality removed for portfolio version */}
          
          <button
            className="btn-icon"
            onClick={() => deleteRecipe(recipe.id)}
            title="Delete recipe"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <p className="recipe-card-description">{recipe.description}</p>
      
      {recipe.cuisine && recipe.cuisine !== 'International' && (
        <div className="recipe-cuisine">
          <Globe size={14} />
          <span>{recipe.cuisine} Cuisine</span>
        </div>
      )}
      
      <div className="recipe-card-meta">
        <div className="meta-item">
          <Users size={14} />
          <span>{recipe.servings} servings</span>
        </div>
        <div className="meta-item">
          <Clock size={14} />
          <span>Prep: {recipe.prepTime}</span>
        </div>
        <div className="meta-item">
          <Timer size={14} />
          <span>Cook: {recipe.cookTime}</span>
        </div>
      </div>
      
      <div className="recipe-card-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            className="star-button"
            onClick={() => rateRecipe(recipe.id, star)}
            title={`Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            <Star 
              size={14} 
              fill={star <= (recipe.rating || 0) ? '#fbbf24' : 'none'}
              color={star <= (recipe.rating || 0) ? '#fbbf24' : '#d1d5db'}
            />
          </button>
        ))}
      </div>

      {/* Personal Notes Section */}
      <div className="recipe-notes">
        {editingNotes === recipe.id ? (
          <div className="notes-edit">
            <textarea
              className="notes-textarea"
              placeholder="Add your personal notes..."
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              rows="3"
            />
            <div className="notes-actions">
              <button
                className="btn btn-xs btn-secondary"
                onClick={() => {
                  setEditingNotes(null);
                  setNotesInput('');
                }}
              >
                <X size={12} />
                Cancel
              </button>
              <button
                className="btn btn-xs btn-primary"
                onClick={() => updateNotes(recipe.id, notesInput)}
              >
                <Save size={12} />
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="notes-display">
            {recipe.personalNotes ? (
              <div className="notes-content">
                <StickyNote size={14} />
                <span>{recipe.personalNotes}</span>
                <button
                  className="btn-icon-mini"
                  onClick={() => {
                    setEditingNotes(recipe.id);
                    setNotesInput(recipe.personalNotes || '');
                  }}
                  title="Edit notes"
                >
                  <Edit3 size={12} />
                </button>
              </div>
            ) : (
              <button
                className="btn-add-notes"
                onClick={() => {
                  setEditingNotes(recipe.id);
                  setNotesInput('');
                }}
              >
                <StickyNote size={14} />
                Add personal notes
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Expandable Recipe Details */}
      <div className="recipe-details">
        <details className="recipe-expandable" onToggle={(e) => {
          const summary = e.target.querySelector('.recipe-summary');
          const text = e.target.open ? 'Collapse Recipe' : 'View Full Recipe';
          summary.querySelector('.recipe-toggle-text').textContent = text;
        }}>
          <summary className="recipe-summary">
            <ChefHat size={16} />
            <span className="recipe-toggle-text">View Full Recipe</span>
          </summary>
          
          <div className="recipe-content">
            <div className="recipe-section">
              <h4>Ingredients</h4>
              <ul className="ingredients-list">
                {recipe.ingredients.map((ingredient, idx) => (
                  <li key={idx} className="ingredient-item">
                    {typeof ingredient === 'string' 
                      ? ingredient 
                      : ingredient.ingredient 
                        ? `${ingredient.amount || ''} ${ingredient.ingredient} ${ingredient.preparation || ''}`.trim()
                        : 'Invalid ingredient'
                    }
                  </li>
                ))}
              </ul>
            </div>

            <div className="recipe-section">
              <h4>Instructions</h4>
              <ol className="instructions-list">
                {recipe.instructions.map((instruction, idx) => (
                  <li key={idx} className="instruction-item">
                    <span className="instruction-number">{idx + 1}</span>
                    <span className="instruction-text">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>

            {recipe.tips && (
              <div className="recipe-section">
                <h4>Chef's Tips <img src="/Chef_izzy.png" alt="Chef Izzy" style={{width: '37px', height: '37px', display: 'inline-block', marginLeft: '8px'}} /></h4>
                <p className="tips-text">{recipe.tips}</p>
              </div>
            )}
          </div>
        </details>
      </div>

      <div className="recipe-card-footer">
        <button
          className="btn btn-sm btn-secondary"
          onClick={() => generateSimilarRecipe(recipe.id)}
          disabled={similarRecipeLoading === recipe.id}
        >
          {similarRecipeLoading === recipe.id ? (
            <>
              <div className="loading-spinner" style={{ width: '14px', height: '14px', margin: '0' }} />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw size={14} />
              Similar Recipe
            </>
          )}
        </button>
        
        <button
          className="btn btn-sm btn-secondary"
          onClick={() => exportToPDF(recipe)}
        >
          <Download size={14} />
          Export PDF
        </button>
      </div>
      
      <div className="recipe-card-date">
        Created: {new Date(recipe.createdAt).toLocaleDateString()}
      </div>
    </div>
  );

  // Render Recipe History Tab
  const renderHistoryTab = () => (
    <div className="history-tab">
      <div className="history-header">
        <h2>
          <History size={24} />
          Recipe History
          <span className="recipe-count">({stats.totalRecipes} recipes)</span>
        </h2>
        
        <div className="history-controls">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-controls">
            <select
              className="filter-select"
              value={cuisineFilter}
              onChange={(e) => setCuisineFilter(e.target.value)}
            >
              <option value="">All Cuisines</option>
              {cuisineOptions.slice(1).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.value}
                </option>
              ))}
            </select>
            
            <select
              className="filter-select"
              value={maxTimeFilter}
              onChange={(e) => setMaxTimeFilter(e.target.value)}
            >
              <option value="">Any Time</option>
              <option value="30">≤ 30 min</option>
              <option value="45">≤ 45 min</option>
              <option value="60">≤ 1 hour</option>
              <option value="90">≤ 1.5 hours</option>
              <option value="120">≤ 2 hours</option>
            </select>
            
            {(cuisineFilter || maxTimeFilter) && (
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setCuisineFilter('');
                  setMaxTimeFilter('');
                }}
                title="Clear filters"
              >
                <X size={14} />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
      
      {recipesLoading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <span>Loading recipes...</span>
        </div>
      ) : historyRecipes.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={48} />
          <h3>No recipes found</h3>
          <p>{searchTerm || showFavoritesOnly ? 'Try adjusting your filters' : 'Generate your first recipe to get started!'}</p>
          {!searchTerm && !showFavoritesOnly && (
            <button
              className="btn btn-primary"
              onClick={() => setActiveTab('generate')}
            >
              <Sparkles size={16} />
              Generate Recipe
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="recipe-grid">
            {historyRecipes.map(renderRecipeCard)}
          </div>
          
          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-sm btn-secondary"
                disabled={pagination.page === 1}
                onClick={() => fetchRecipes(pagination.page - 1)}
              >
                Previous
              </button>
              
              <span className="pagination-info">
                Page {pagination.page} of {pagination.pages}
              </span>
              
              <button
                className="btn btn-sm btn-secondary"
                disabled={pagination.page === pagination.pages}
                onClick={() => fetchRecipes(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Render Favorites Tab
  const renderFavoritesTab = () => {
    console.log('🔍 Rendering favorites tab:', { 
      recipesLoading, 
      historyRecipes: historyRecipes?.length, 
      stats: stats?.favoriteRecipes,
      activeTab,
      switchingToFavorites: switchingToFavorites.current
    });

    // Additional safety check during tab switching
    if (switchingToFavorites.current) {
      return (
        <div className="history-tab">
          <div className="loading-container">
            <div className="loading-spinner" />
            <span>Loading favorite recipes...</span>
          </div>
        </div>
      );
    }

    return (
      <div className="history-tab">
        <div className="history-header">
          <h2>
            <Heart size={24} />
            Favorite Recipes
            <span className="recipe-count">({stats?.favoriteRecipes || 0} favorites)</span>
          </h2>
          
          <div className="history-controls">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search favorites..."
                value={searchTerm || ''}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {recipesLoading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <span>Loading favorite recipes...</span>
          </div>
        ) : !historyRecipes || historyRecipes.length === 0 ? (
          <div className="empty-state">
            <Heart size={48} />
            <h3>No favorite recipes yet</h3>
            <p>{searchTerm ? 'No favorites match your search' : 'Star your favorite recipes to see them here!'}</p>
            <button
              className="btn btn-primary"
              onClick={() => setActiveTab('generate')}
            >
              <Sparkles size={16} />
              Generate New Recipe
            </button>
          </div>
        ) : (
          <>
            <div className="recipe-grid">
              {Array.isArray(historyRecipes) && historyRecipes.map((recipe, index) => {
                if (!recipe || typeof recipe !== 'object') {
                  console.warn('⚠️ Found invalid recipe at index:', index, recipe);
                  return null;
                }
                
                try {
                  return renderRecipeCard(recipe);
                } catch (error) {
                  console.error('❌ Error rendering recipe card:', error, recipe);
                  return null;
                }
              }).filter(Boolean)}
            </div>
            
            {pagination?.pages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-sm btn-secondary"
                  disabled={pagination.page === 1}
                  onClick={() => fetchRecipes(pagination.page - 1)}
                >
                  Previous
                </button>
                
                <span className="pagination-info">
                  Page {pagination.page} of {pagination.pages}
                </span>
                
                <button
                  className="btn btn-sm btn-secondary"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => fetchRecipes(pagination.page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // Render Analytics Tab
  const renderAnalyticsTab = () => (
    <div className="analytics-tab">
      <h2>
        <BarChart3 size={24} />
        Recipe Analytics
      </h2>
      
      {statsLoading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <span>Loading analytics...</span>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <BookOpen size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.totalRecipes}</div>
                <div className="stat-label">Total Recipes</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <Heart size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.favoriteRecipes}</div>
                <div className="stat-label">Favorite Recipes</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <TrendingUp size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.recentRecipes}</div>
                <div className="stat-label">Recent (7 days)</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <ChefHat size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">
                  {Math.round((stats.favoriteRecipes / Math.max(stats.totalRecipes, 1)) * 100)}%
                </div>
                <div className="stat-label">Favorite Rate</div>
              </div>
            </div>
          </div>
          
          {stats.topIngredients.length > 0 && (
            <div className="top-ingredients">
              <h3>Top Ingredients</h3>
              <div className="ingredients-chart">
                {stats.topIngredients.map((item, index) => (
                  <div key={index} className="ingredient-bar">
                    <div className="ingredient-name">{item.ingredient}</div>
                    <div className="ingredient-bar-container">
                      <div 
                        className="ingredient-bar-fill"
                        style={{ 
                          width: `${(item.count / stats.topIngredients[0].count) * 100}%` 
                        }}
                      />
                    </div>
                    <div className="ingredient-count">{item.count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <ErrorBoundary>
      <div className="app">
        <div className="container">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div>
              <h1><img src="/Chef_izzy.png" alt="Chef Izzy" style={{width: '96px', height: '96px', display: 'inline-block', marginRight: '12px'}} /> Chef Izzy's AI Cookbook</h1>
              <p>Turn your ingredients into delicious recipes with AI magic!</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className={`api-key-status ${hasApiKey ? 'configured' : 'not-configured'}`}>
                {hasApiKey ? (
                  <>
                    <CheckCircle size={16} />
                    <span>API Key Configured</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={16} />
                    <span>API Key Required</span>
                  </>
                )}
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => setShowApiKeyModal(true)}
                style={{ padding: '0.5rem 1rem' }}
              >
                <Settings size={16} />
                Configure API Key
              </button>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        {renderTabs()}

        {/* Generator Tab */}
        {activeTab === 'generate' && (
          <>
            <div className="card">
              <form className="ingredient-form" onSubmit={(e) => { e.preventDefault(); generateRecipe(); }}>
                <div className="input-group">
                  <label>Your Ingredients (up to 5)</label>
                  <div className="ingredient-inputs">
                    {ingredients.map((ingredient, index) => (
                      <input
                        key={index}
                        type="text"
                        className="ingredient-input"
                        placeholder={`Ingredient ${index + 1}`}
                        value={ingredient}
                        onChange={(e) => handleIngredientChange(index, e.target.value)}
                      />
                    ))}
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label>Recipes to Generate</label>
                    <div className="quantity-selector">
                      <button
                        type="button"
                        className="quantity-btn"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="quantity-display">{quantity}</span>
                      <button
                        type="button"
                        className="quantity-btn"
                        onClick={() => setQuantity(Math.min(5, quantity + 1))}
                        disabled={quantity >= 5}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <small className="input-help">Generate 1-5 unique recipes at once</small>
                  </div>

                  <div className="input-group">
                    <label>Number of Servings</label>
                    <input
                      type="number"
                      className="servings-input"
                      min="1"
                      max="20"
                      value={servings}
                      onChange={(e) => setServings(parseInt(e.target.value) || 4)}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>
                    <Globe size={16} style={{ display: 'inline', marginRight: '8px' }} />
                    Cuisine Style (Optional)
                  </label>
                  <select
                    className="cuisine-select"
                    value={cuisine}
                    onChange={(e) => setCuisine(e.target.value)}
                  >
                    {cuisineOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <small className="input-help">Choose a cuisine style for more targeted recipes</small>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || !hasApiKey}
                  >
                    {loading ? (
                      <>
                        <div className="loading-spinner" style={{ width: '20px', height: '20px', margin: '0' }} />
                        Cooking up magic...
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        Generate Recipe
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={resetForm}
                    disabled={loading}
                  >
                    <RotateCcw size={20} />
                    Reset
                  </button>
                </div>
              </form>

              {error && (
                <div className="error">
                  {error}
                  {error.includes('API key') && (
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowApiKeyModal(true)}
                      style={{ marginTop: '1rem' }}
                    >
                      <Key size={16} />
                      Configure API Key
                    </button>
                  )}
                </div>
              )}
            </div>

            {generatedRecipes.length > 0 && (
              <div className="generated-recipes">
                <div className="generated-header">
                  <h2>
                    ✨ Generated Recipe{generatedRecipes.length > 1 ? 's' : ''} 
                    <span className="recipe-count">({generatedRecipes.length})</span>
                  </h2>
                  <div className="generated-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => setGeneratedRecipes([])}
                    >
                      <X size={16} />
                      Clear All
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={generateRecipe}
                      disabled={loading}
                    >
                      <Sparkles size={16} />
                      Generate More
                    </button>
                  </div>
                </div>

                <div className="recipe-grid">
                  {[...generatedRecipes].reverse().map((recipe, index) => (
                    <div key={recipe.id || index} className="recipe-card generated-recipe-card">
                      <div className="recipe-card-header">
                        <h3 className="recipe-card-title">{recipe.title}</h3>
                        <div className="recipe-card-actions">
                                    <button
            className={`btn-icon ${recipe.isFavorite ? 'favorite' : ''}`}
            onClick={() => recipe.id ? toggleFavorite(recipe.id, recipe.isFavorite) : null}
            title={recipe.id ? (recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites') : 'Save recipe to add to favorites'}
            disabled={!recipe.id}
          >
            <Heart size={16} fill={recipe.isFavorite ? '#e53e3e' : 'none'} color={recipe.isFavorite ? '#e53e3e' : '#718096'} />
          </button>
                          
                                                        {/* Email functionality removed for portfolio version */}
                          
                          <button
                            className="btn-icon"
                            onClick={() => exportToPDF(recipe)}
                            title="Export to PDF"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <p className="recipe-card-description">{recipe.description}</p>
                      
                      {recipe.cuisine && recipe.cuisine !== 'International' && (
                        <div className="recipe-cuisine">
                          <Globe size={14} />
                          <span>{recipe.cuisine} Cuisine</span>
                        </div>
                      )}
                      
                      <div className="recipe-card-meta">
                        <div className="meta-item">
                          <Users size={14} />
                          <span>{recipe.servings} servings</span>
                        </div>
                        <div className="meta-item">
                          <Clock size={14} />
                          <span>Prep: {recipe.prepTime}</span>
                        </div>
                        <div className="meta-item">
                          <Timer size={14} />
                          <span>Cook: {recipe.cookTime}</span>
                        </div>
                      </div>
                      
                      {recipe.id && (
                        <div className="recipe-card-rating">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              className="star-button"
                              onClick={() => rateRecipe(recipe.id, star)}
                              title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                            >
                              <Star 
                                size={14} 
                                fill={star <= (recipe.rating || 0) ? '#fbbf24' : 'none'}
                                color={star <= (recipe.rating || 0) ? '#fbbf24' : '#d1d5db'}
                              />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Personal Notes for Generated Recipes */}
                      {recipe.id && (
                        <div className="recipe-notes">
                          {editingNotes === recipe.id ? (
                            <div className="notes-edit">
                              <textarea
                                className="notes-textarea"
                                placeholder="Add your personal notes..."
                                value={notesInput}
                                onChange={(e) => setNotesInput(e.target.value)}
                                rows="3"
                              />
                              <div className="notes-actions">
                                <button
                                  className="btn btn-xs btn-secondary"
                                  onClick={() => {
                                    setEditingNotes(null);
                                    setNotesInput('');
                                  }}
                                >
                                  <X size={12} />
                                  Cancel
                                </button>
                                <button
                                  className="btn btn-xs btn-primary"
                                  onClick={() => updateNotes(recipe.id, notesInput)}
                                >
                                  <Save size={12} />
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="notes-display">
                              {recipe.personalNotes ? (
                                <div className="notes-content">
                                  <StickyNote size={14} />
                                  <span>{recipe.personalNotes}</span>
                                  <button
                                    className="btn-icon-mini"
                                    onClick={() => {
                                      setEditingNotes(recipe.id);
                                      setNotesInput(recipe.personalNotes || '');
                                    }}
                                    title="Edit notes"
                                  >
                                    <Edit3 size={12} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  className="btn-add-notes"
                                  onClick={() => {
                                    setEditingNotes(recipe.id);
                                    setNotesInput('');
                                  }}
                                >
                                  <StickyNote size={14} />
                                  Add personal notes
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Expandable Recipe Details */}
                      <div className="recipe-details">
                        <details className="recipe-expandable" onToggle={(e) => {
                          const summary = e.target.querySelector('.recipe-summary');
                          const text = e.target.open ? 'Collapse Recipe' : 'View Full Recipe';
                          summary.querySelector('.recipe-toggle-text').textContent = text;
                        }}>
                          <summary className="recipe-summary">
                            <ChefHat size={16} />
                            <span className="recipe-toggle-text">View Full Recipe</span>
                          </summary>
                          
                          <div className="recipe-content">
                            <div className="recipe-section">
                              <h4>Ingredients</h4>
                              <ul className="ingredients-list">
                                {recipe.ingredients.map((ingredient, idx) => (
                                  <li key={idx} className="ingredient-item">
                                    {typeof ingredient === 'string' 
                                      ? ingredient 
                                      : ingredient.ingredient 
                                        ? `${ingredient.amount || ''} ${ingredient.ingredient} ${ingredient.preparation || ''}`.trim()
                                        : 'Invalid ingredient'
                                    }
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="recipe-section">
                              <h4>Instructions</h4>
                              <ol className="instructions-list">
                                {recipe.instructions.map((instruction, idx) => (
                                  <li key={idx} className="instruction-item">
                                    <span className="instruction-number">{idx + 1}</span>
                                    <span className="instruction-text">{instruction}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>

                            {recipe.tips && (
                              <div className="recipe-section">
                                <h4>Chef's Tips <img src="/Chef_izzy.png" alt="Chef Izzy" style={{width: '37px', height: '37px', display: 'inline-block', marginLeft: '8px'}} /></h4>
                                <p className="tips-text">{recipe.tips}</p>
                              </div>
                            )}
                          </div>
                        </details>
                      </div>

                      {recipe.id && (
                        <div className="recipe-card-footer">
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => generateSimilarRecipe(recipe.id)}
                            disabled={similarRecipeLoading === recipe.id}
                          >
                            {similarRecipeLoading === recipe.id ? (
                              <>
                                <div className="loading-spinner" style={{ width: '14px', height: '14px', margin: '0' }} />
                                Generating...
                              </>
                            ) : (
                              <>
                                <RefreshCw size={14} />
                                Similar Recipe
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {recipe.createdAt && (
                        <div className="recipe-card-date">
                          Created: {new Date(recipe.createdAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* History Tab */}
        {activeTab === 'history' && renderHistoryTab()}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && renderFavoritesTab()}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && renderAnalyticsTab()}

        {/* API Key Configuration Modal */}
        {showApiKeyModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>
                  <Key size={20} />
                  Configure OpenAI API Key
                </h3>
                <button
                  className="modal-close"
                  onClick={() => setShowApiKeyModal(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-content">
                <p>
                  To generate recipes, you need to provide your OpenAI API key. 
                  This key will be securely saved to your local environment file.
                </p>

                <div className="input-group">
                  <label>OpenAI API Key</label>
                  <input
                    type="password"
                    className="api-key-input"
                    placeholder="sk-..."
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    disabled={apiKeyLoading}
                  />
                  <small className="input-help">
                    Your API key starts with "sk-" and can be found at{' '}
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                      platform.openai.com/api-keys
                    </a>
                  </small>
                </div>

                {apiKeyError && (
                  <div className="error">
                    <AlertCircle size={16} />
                    {apiKeyError}
                  </div>
                )}

                {apiKeySuccess && (
                  <div className="success">
                    <CheckCircle size={16} />
                    {apiKeySuccess}
                  </div>
                )}

                <div className="modal-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowApiKeyModal(false)}
                    disabled={apiKeyLoading}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={saveApiKey}
                    disabled={apiKeyLoading || !apiKeyInput.trim()}
                  >
                    {apiKeyLoading ? (
                      <>
                        <div className="loading-spinner" style={{ width: '16px', height: '16px', margin: '0' }} />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Key size={16} />
                        Save API Key
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Email functionality removed for portfolio version */}

        {/* Duplicate Recipe Comparison Modal */}
        {showDuplicateModal && duplicateRecipeData && (
          <div className="modal-overlay">
            <div className="modal duplicate-modal">
              <div className="modal-header">
                <h3>
                  <AlertCircle size={20} />
                  Duplicate Recipe Detected
                </h3>
                <button
                  className="modal-close"
                  onClick={() => {
                    setShowDuplicateModal(false);
                    setDuplicateRecipeData(null);
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-content">
                <p>
                  You already have {duplicateRecipeData.existingRecipes.length} favorite recipe{duplicateRecipeData.existingRecipes.length > 1 ? 's' : ''} with a similar name:
                  <strong> "{duplicateRecipeData.newRecipe.title}"</strong>
                </p>

                <div className="recipe-comparison">
                  <div className="comparison-section">
                    <h4>🆕 New Recipe</h4>
                    <div className="recipe-summary">
                      <strong>{duplicateRecipeData.newRecipe.title}</strong>
                      <p>{duplicateRecipeData.newRecipe.description}</p>
                      <div className="recipe-meta-summary">
                        <span>👥 {duplicateRecipeData.newRecipe.servings} servings</span>
                        <span>⏱️ Prep: {duplicateRecipeData.newRecipe.prepTime}</span>
                        <span>🔥 Cook: {duplicateRecipeData.newRecipe.cookTime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="comparison-section">
                    <h4>⭐ Existing Favorite{duplicateRecipeData.existingRecipes.length > 1 ? 's' : ''}</h4>
                    {duplicateRecipeData.existingRecipes.map((recipe, index) => (
                      <div key={recipe.id} className="recipe-summary existing">
                        <strong>{recipe.title}</strong>
                        <p>{recipe.description}</p>
                        <div className="recipe-meta-summary">
                          <span>👥 {recipe.servings} servings</span>
                          <span>⏱️ Prep: {recipe.prepTime}</span>
                          <span>🔥 Cook: {recipe.cookTime}</span>
                          {recipe.rating && <span>⭐ {recipe.rating}/5 stars</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="duplicate-actions">
                  <h4>What would you like to do?</h4>
                  
                  {duplicateRecipeData.existingRecipes.length < 2 ? (
                    <div className="action-options">
                      <button
                        className="btn btn-primary"
                        onClick={async () => {
                          await performFavoriteAction(duplicateRecipeData.newRecipe.id, true, `${duplicateRecipeData.newRecipe.title} (Alternative Version)`);
                          setShowDuplicateModal(false);
                          setDuplicateRecipeData(null);
                        }}
                      >
                        <Plus size={16} />
                        Save Both (as "Alternative Version")
                      </button>
                      
                      <button
                        className="btn btn-secondary"
                        onClick={async () => {
                          // Remove existing favorite and add new one
                          await performFavoriteAction(duplicateRecipeData.existingRecipes[0].id, false);
                          await performFavoriteAction(duplicateRecipeData.newRecipe.id, true);
                          setShowDuplicateModal(false);
                          setDuplicateRecipeData(null);
                        }}
                      >
                        <RefreshCw size={16} />
                        Replace Existing
                      </button>
                    </div>
                  ) : (
                    <div className="action-options">
                      <p className="warning-text">
                        ⚠️ You already have {duplicateRecipeData.existingRecipes.length} versions saved. 
                        You can delete existing versions and save this new one, or cancel.
                      </p>
                      
                      <button
                        className="btn btn-secondary"
                        onClick={async () => {
                          // Delete all existing duplicates and save new one
                          for (const recipe of duplicateRecipeData.existingRecipes) {
                            await performFavoriteAction(recipe.id, false);
                          }
                          await performFavoriteAction(duplicateRecipeData.newRecipe.id, true);
                          setShowDuplicateModal(false);
                          setDuplicateRecipeData(null);
                        }}
                      >
                        <Trash2 size={16} />
                        Delete All Existing & Save New
                      </button>
                    </div>
                  )}
                  
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowDuplicateModal(false);
                      setDuplicateRecipeData(null);
                    }}
                  >
                    <X size={16} />
                    Cancel (Don't Save)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </ErrorBoundary>
  );
}

export default App; 