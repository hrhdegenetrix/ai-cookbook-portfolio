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
      const { default: OpenAI } = await import('openai');
      const testClient = new OpenAI({ apiKey });
      await testClient.models.list(); // Simple test request
    } catch (testError) {
      return res.status(400).json({ 
        error: 'Invalid API key. Please check your OpenAI API key and try again.' 
      });
    }

    // For Vercel, we'll store this in memory for the session
    // In production, you'd want to use a proper database or secure storage
    process.env.OPENAI_API_KEY = apiKey;

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
} 