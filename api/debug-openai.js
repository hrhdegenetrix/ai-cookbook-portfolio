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
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    const apiKeyLength = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0;
    const apiKeyStart = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 7) : 'Not set';

    res.json({
      hasOpenAIKey: hasApiKey,
      apiKeyLength: apiKeyLength,
      apiKeyStart: apiKeyStart,
      environment: process.env.VERCEL_ENV || 'unknown',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Debug OpenAI endpoint error:', error);
    res.status(500).json({ 
      error: 'Debug failed',
      details: error.message 
    });
  }
} 