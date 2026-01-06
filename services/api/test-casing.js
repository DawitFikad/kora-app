const axios = require('axios');
const https = require('https');

async function testCasing() {
    const prefixes = [
        '/apiaccess/payment/gateway',
        '/apiAccess/payment/gateway',
        '/APIACCESS/PAYMENT/GATEWAY',
        '/apiaccess/payment/Gateway',
        '/apiaccess/Payment/Gateway'
    ];
    const paths = [
        '/payment/v1/merchant/fabricToken',
        '/auth/v1/applyFabricToken'
    ];

    const agent = new https.Agent({ rejectUnauthorized: false });

    for (const prefix of prefixes) {
        for (const path of paths) {
            const url = `https://196.188.120.3:38443${prefix}${path}`;
            try {
                process.stdout.write(`Testing ${url}... `);
                const res = await axios.post(url, {}, {
                    headers: { 'Content-Type': 'application/json' },
                    httpsAgent: agent,
                    timeout: 2000
                });
                console.log(`SUCCESS: ${res.status}`);
            } catch (err) {
                if (err.response) {
                    console.log(`FAIL: ${err.response.status}`);
                    if (err.response.status === 400) {
                        console.log("   DATA:", JSON.stringify(err.response.data));
                        process.exit(0); // Found a path that isn't 404!
                    }
                } else {
                    console.log(`ERR: ${err.message}`);
                }
            }
        }
    }
}

testCasing();
