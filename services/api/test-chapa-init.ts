import { ChapaProvider } from "./src/services/providers/chapa.provider";
import { env } from "./src/config/env";
import axios from 'axios';

async function testChapa() {
    console.log("Testing Chapa Initialization...");
    try {
        const result = await ChapaProvider.initialize({
            amount: 100,
            email: "test@example.com",
            firstName: "Test",
            lastName: "User",
            txRef: `TEST-REF-${Date.now()}`,
            callbackUrl: "http://localhost:4000/callback",
            returnUrl: "http://localhost:4000/return",
        });
        console.log("Success! Checkout URL:", result.checkoutUrl);
    } catch (e: any) {
        console.error("Failed!");
        console.error("Error Message:", e.message);
    }
}

testChapa();
