const axios = require('axios');
const https = require('https');

async function testPaths() {
    const urls = [
        '/payment/v1/auth/applyFabricToken',
        '/payment/v1/owner/applyFabricToken',
        '/auth/v1/applyFabricToken',
        '/payment/v1/merchant/fabricToken',
        '/apiaccess/payment/gateway/payment/v1/merchant/fabricToken',
        '/apiaccess/payment/gateway/auth/v1/applyFabricToken'
    ];

    const agent = new https.Agent({ rejectUnauthorized: false });

    for (const path of urls) {
        try {
            const url = `https://196.188.120.3:38443${path}`;
            console.log(`\nTesting ${url}...`);
            const res = await axios.post(url, {
                appId: '1547579123609609',
                appKey: 'fad0f06383c6297f545876694b974599'
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Host': 'developerportal.ethiotelebirr.et'
                },
                httpsAgent: agent,
                timeout: 5000
            });
            console.log(`SUCCESS for ${path}:`, JSON.stringify(res.data).substring(0, 200));
        } catch (err) {
            if (err.response) {
                console.log(`FAILED for ${path}: ${err.response.status} - ${JSON.stringify(err.response.data).substring(0, 200)}`);
            } else {
                console.log(`ERROR for ${path}: ${err.message}`);
            }
        }
    }
}

testPaths();
