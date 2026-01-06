const axios = require('axios');
const https = require('https');

const env = {
    UUID: "c4182ef8-9249-458a-985e-06d191f4d505",
    NUMERIC: "1547579123609609",
    SECRET: "fad0f06383c6297f545876694b974599"
};

async function testCombos() {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const hosts = ['developerportal.ethiotelebirr.et', 'app.ethiotelebirr.et', 'ethiotelebirr.et'];
    const bodyCombos = [
        { appId: env.NUMERIC, appKey: env.SECRET },
        { app_id: env.NUMERIC, app_key: env.SECRET },
        { appId: env.UUID, appKey: env.SECRET },
        { app_id: env.UUID, app_key: env.SECRET },
        { appId: env.NUMERIC, appKey: env.UUID },
        { appId: env.UUID, appKey: env.NUMERIC }
    ];

    for (const host of hosts) {
        for (const body of bodyCombos) {
            try {
                const res = await axios.post('https://196.188.120.3:38443/payment/v1/merchant/fabricToken', body, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Host': host,
                        'X-APP-Key': env.UUID
                    },
                    httpsAgent: agent,
                    timeout: 3000
                });
                console.log(`PASS! Host: ${host}, Body: ${JSON.stringify(body)} => ${JSON.stringify(res.data)}`);
                process.exit(0);
            } catch (err) {
                if (err.response && err.response.data && err.response.data.header) {
                    const desc = err.response.data.header.responseDesc || err.response.data.header.errorCause;
                    console.log(`FAIL: Host: ${host}, Body: ${Object.keys(body).join(',')} (${body.appId ? 'appId' : 'app_id'}) => ${desc}`);
                } else {
                    console.log(`ERR: Host: ${host}, Body: ... => ${err.message}`);
                }
            }
        }
    }
}

testCombos();
