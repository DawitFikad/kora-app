import { prisma } from "../src/lib/prisma";
import { Role, AccountStatus, OrganizerStatus } from "@prisma/client";

async function createTestOrg() {
    const testPhone = "+251911111111";
    const orgName = "Test Event Solutions";

    console.log(`[Script] Creating test organization: ${orgName}`);

    try {
        // 1. Create User
        const user = await prisma.user.upsert({
            where: { phoneNumber: testPhone },
            update: {
                role: Role.ORGANIZER,
                status: AccountStatus.ACTIVE,
            },
            create: {
                phoneNumber: testPhone,
                role: Role.ORGANIZER,
                status: AccountStatus.ACTIVE,
                profile: {
                    create: {
                        fullName: "Test Organizer Admin",
                    }
                }
            }
        });

        // 2. Create Organizer Profile
        const organizer = await prisma.organizerProfile.upsert({
            where: { userId: user.id },
            update: {
                organizationName: orgName,
                status: OrganizerStatus.APPROVED,
            },
            create: {
                userId: user.id,
                organizationName: orgName,
                contactPhone: testPhone,
                contactEmail: "test@eventsolutions.com",
                city: "Addis Ababa",
                payoutDetails: "Telebirr: 0911111111",
                status: OrganizerStatus.APPROVED,
                description: "A professional event organizer for testing purposes.",
                categoryFocus: ["Music", "Business", "Tech"],
                operatingCities: ["Addis Ababa", "Adama"],
            }
        });

        console.log("✅ Test Organization created successfully!");
        console.log("User ID:", user.id);
        console.log("Organizer ID:", organizer.id);
        console.log("Phone:", testPhone);
        console.log("Status: APPROVED");

    } catch (error) {
        console.error("❌ Failed to create test organization:", error);
    } finally {
        await (prisma as any).$disconnect();
    }
}

createTestOrg();
