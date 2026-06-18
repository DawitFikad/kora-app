const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAndSeed() {
  try {
    // Test connection
    const count = await prisma.systemConfig.count();
    console.log('✅ Current SystemConfig count:', count);
    
    if (count === 0) {
      console.log('🌱 Seeding SystemConfig...');
      const configs = [
        { key: 'APP_NAME', value: 'ET-Ticket Platform', description: 'Application name' },
        { key: 'OTP_LENGTH', value: '6', description: 'Length of OTP codes' },
        { key: 'OTP_EXPIRY_MINUTES', value: '5', description: 'OTP expiry time in minutes' },
        { key: 'MAX_LOGIN_ATTEMPTS', value: '3', description: 'Maximum login attempts' },
        { key: 'SESSION_TIMEOUT_HOURS', value: '24', description: 'Session timeout in hours' }
      ];

      for (const config of configs) {
        await prisma.systemConfig.create({ data: config });
      }
      
      console.log('✅ SystemConfig seeded successfully');
    }
    
    // Verify
    const finalCount = await prisma.systemConfig.count();
    console.log('✅ Final SystemConfig count:', finalCount);
    
    // Show sample data
    const sample = await prisma.systemConfig.findFirst();
    console.log('✅ Sample config:', sample);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAndSeed();
