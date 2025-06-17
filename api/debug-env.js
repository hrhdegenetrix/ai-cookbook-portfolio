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
    const databaseUrl = process.env.DATABASE_URL;
    
    // Mask the password for security
    let maskedUrl = 'Not set';
    if (databaseUrl) {
      // Replace password with asterisks
      maskedUrl = databaseUrl.replace(/:([^@]+)@/, ':****@');
    }

    res.json({
      DATABASE_URL_exists: !!databaseUrl,
      DATABASE_URL_masked: maskedUrl,
      DATABASE_URL_length: databaseUrl ? databaseUrl.length : 0,
      host_extracted: databaseUrl ? databaseUrl.match(/@([^:]+):/)?.[1] : 'N/A',
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL_ENV || 'unknown'
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ 
      error: 'Debug failed',
      details: error.message 
    });
  }
} 