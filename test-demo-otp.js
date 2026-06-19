const axios = require('axios');

async function testDemoOTP() {
  try {
    console.log('🧪 Testing demo OTP system...\n');
    
    // Test 1: Request OTP with demo phone
    console.log('📱 Requesting OTP for demo phone...');
    const response1 = await axios.post('http://localhost:4001/api/auth/otp/request', {
      phoneNumber: '+251954948027'
    });
    console.log('✅ OTP request sent:', response1.data.message);
    
    // Test 2: Verify with demo OTP
    console.log('\n🔓 Testing demo OTP: 123456');
    const response2 = await axios.post('http://localhost:4001/api/auth/otp/verify', {
      phoneNumber: '+251954948027',
      otp: '123456'
    });
    
    if (response2.data.token) {
      console.log('✅ Demo OTP SUCCESS! Token received');
      console.log('🎉 You can now use: 123456 as OTP for any phone number');
      console.log('🔑 Master OTP: 999999 also available');
      console.log('📱 Demo phone: +251954948027');
    } else {
      console.log('❌ Demo OTP failed:', response2.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testDemoOTP();
