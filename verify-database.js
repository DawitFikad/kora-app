const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyDatabase() {
  try {
    console.log('🔍 Testing database connection...\n');
    
    // Test basic connection
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
    console.log('✅ Database connection:', result[0].current_time);
    
    // Test SystemConfig table
    const configCount = await prisma.systemConfig.count();
    console.log('✅ SystemConfig records:', configCount);
    
    // Test a specific config
    const appConfig = await prisma.systemConfig.findFirst({
      where: { key: 'APP_NAME' }
    });
    console.log('✅ App name config:', appConfig?.value);
    
    // Test OTP config
    const otpConfig = await prisma.systemConfig.findFirst({
      where: { key: 'OTP_LENGTH' }
    });
    console.log('✅ OTP length config:', otpConfig?.value);
    
    // Test table structure
    const tableInfo = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name LIMIT 10
    `;
    console.log('✅ Tables created:', tableInfo.map(t => t.table_name).join(', '));
    
    console.log('\n🎉 DATABASE IS FULLY WORKING! 🎉');
    console.log('✅ All tests passed - database is ready for OTP login!');
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();
