const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addDemoOTP() {
  try {
    console.log('🔧 Adding demo OTP codes...\n');
    
    // Add demo OTP configuration
    await prisma.systemConfig.upsert({
      where: { key: 'DEMO_OTP' },
      update: { value: '123456', description: 'Demo OTP for easy access' },
      create: { key: 'DEMO_OTP', value: '123456', description: 'Demo OTP for easy access' }
    });
    
    // Add master OTP bypass
    await prisma.systemConfig.upsert({
      where: { key: 'MASTER_OTP' },
      update: { value: '999999', description: 'Master OTP for system access' },
      create: { key: 'MASTER_OTP', value: '999999', description: 'Master OTP for system access' }
    });
    
    // Enable test bypass
    await prisma.systemConfig.upsert({
      where: { key: 'ALLOW_TEST_OTP_BYPASS' },
      update: { value: 'true', description: 'Allow test OTP bypass' },
      create: { key: 'ALLOW_TEST_OTP_BYPASS', value: 'true', description: 'Allow test OTP bypass' }
    });
    
    // Add easy phone number
    await prisma.systemConfig.upsert({
      where: { key: 'DEMO_PHONE' },
      update: { value: '+251954948027', description: 'Demo phone number for testing' },
      create: { key: 'DEMO_PHONE', value: '+251954948027', description: 'Demo phone number for testing' }
    });
    
    console.log('✅ Demo OTP codes added:');
    console.log('🔓 Demo OTP: 123456');
    console.log('🔑 Master OTP: 999999');
    console.log('📱 Demo Phone: +251954948027');
    console.log('✅ Test bypass enabled');
    console.log('\n🎉 You can now use these codes to login easily!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addDemoOTP();
