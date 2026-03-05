"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chapa_provider_1 = require("./src/services/providers/chapa.provider");
async function testChapa() {
    console.log("Testing Chapa Initialization...");
    try {
        const testEmail = process.env.CHAPA_TEST_EMAIL || "test@gmail.com";
        const result = await chapa_provider_1.ChapaProvider.initialize({
            amount: 100,
            email: testEmail,
            firstName: "Test",
            lastName: "User",
            txRef: `TEST-REF-${Date.now()}`,
            callbackUrl: "http://localhost:4000/callback",
            returnUrl: "http://localhost:4000/return",
        });
        console.log("Success! Checkout URL:", result.checkoutUrl);
    }
    catch (e) {
        console.error("Failed!");
        console.error("Error Message:", e.message);
    }
}
testChapa();
