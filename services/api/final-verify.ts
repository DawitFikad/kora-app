import { ChapaProvider } from "./src/services/providers/chapa.provider";
import { env } from "./src/config/env";

async function verifyFinalLogic() {
    console.log("--- FINAL CHAPA LOGIC VERIFICATION ---");

    // Simulate a User with NO name (The thing that caused the last crash)
    const mockUser = {
        email: "amanuel2123alex@gmail.com",
        profile: {
            fullName: "" // EMPTY - This crashed it before
        }
    };

    console.log("Testing name parsing logic...");
    const fullName = mockUser.profile?.fullName || "";
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.slice(1).join(" ") || "Valued";

    console.log(`Parsed Name: [${firstName}] [${lastName}]`);

    if (firstName === "Customer" && lastName === "Valued") {
        console.log("✅ Name parsing is safe (No crash).");
    } else {
        console.error("❌ Name parsing failed.");
        return;
    }

    console.log("\nTesting Chapa API Initialization...");
    try {
        const result = await ChapaProvider.initialize({
            amount: 5, // Small amount for test
            email: mockUser.email,
            firstName: firstName,
            lastName: lastName,
            txRef: `BOSS-DEMO-${Date.now()}`,
            callbackUrl: "https://et-ticket-api-v2.vercel.app/api/payments/webhook",
            returnUrl: "https://et-ticket-api-v2.vercel.app/api/payments/completion",
            customization: {
                title: "ET-Tickets",
                description: "Boss Demo Payment"
            }
        });

        console.log("✅ SUCCESS!");
        console.log("Checkout URL:", result.checkoutUrl);
        console.log("--- TEST PASSED ---");
    } catch (e: any) {
        console.error("❌ FAILED!");
        console.error(e.message);
    }
}

verifyFinalLogic();
