const { PrismaClient } = require('@prisma/client');

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

  let prisma;
  
  try {
    console.log('🔍 Creating Prisma client...');
    prisma = new PrismaClient();
    
    console.log('🔍 Testing database connection...');
    await prisma.$connect();
    
    console.log('🔍 Testing raw query...');
    const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM recipes`;
    console.log('🔍 Raw query result:', result);
    
    console.log('🔍 Testing Prisma model query...');
    const count = await prisma.recipe.count();
    console.log('🔍 Prisma count result:', count);
    
    res.json({
      success: true,
      message: 'Database connection successful',
      rawQueryResult: result,
      prismaCount: count,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Database test error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    
    res.status(500).json({
      success: false,
      error: 'Database test failed',
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
  } finally {
    if (prisma) {
      console.log('🔍 Disconnecting Prisma client...');
      await prisma.$disconnect();
    }
  }
} 