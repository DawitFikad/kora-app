const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedSystemConfig() {
  try {
    // Add default system config values
    const configs = [
      { key: 'APP_NAME', value: 'ET-Ticket Platform', description: 'Application name' },
      { key: 'OTP_LENGTH', value: '6', description: 'Length of OTP codes' },
      { key: 'OTP_EXPIRY_MINUTES', value: '5', description: 'OTP expiry time in minutes' },
      { key: 'MAX_LOGIN_ATTEMPTS', value: '3', description: 'Maximum login attempts' },
      { key: 'SESSION_TIMEOUT_HOURS', value: '24', description: 'Session timeout in hours' }
    ];

    for (const config of configs) {
      await prisma.systemConfig.upsert({
        where: { key: config.key },
        update: config,
        create: config
      });
    }

    console.log('✅ SystemConfig seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding SystemConfig:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSystemConfig();
