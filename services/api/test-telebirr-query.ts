import * as fs from 'fs';
import { TelebirrProvider } from './src/services/providers/telebirr.provider';

async function testQuery() {
    const orderId = 'TX176772483423671a78d13';
    console.log(`Querying Telebirr for order: ${orderId}`);
    try {
        const result = await TelebirrProvider.verify(orderId);
        fs.writeFileSync('query-result.json', JSON.stringify(result, null, 2));
        console.log('Result saved to query-result.json');
    } catch (error) {
        console.error('Query Error:', error);
    }
}

testQuery();
