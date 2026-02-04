import { prisma } from "../src/lib/prisma";
import { Role, AccountStatus, OrganizerStatus } from "@prisma/client";

async function createPendingOrg() {
    const testPhone = "+251922222222";
    const orgName = "Pending Arts Collective";

    console.log(`[Script] Creating pending organization: ${orgName}`);

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
                        fullName: "Artistic Director",
                    }
                }
            }
        });

        // 2. Create Organizer Profile
        const organizer = await prisma.organizerProfile.upsert({
            where: { userId: user.id },
            update: {
                organizationName: orgName,
                status: OrganizerStatus.PENDING,
            },
            create: {
                userId: user.id,
                organizationName: orgName,
                contactPhone: testPhone,
                contactEmail: "arts@collective.com",
                city: "Bahir Dar",
                payoutDetails: "CBE: 100012345678",
                status: OrganizerStatus.PENDING,
                description: "A cultural arts collective seeking approval.",
                categoryFocus: ["Arts", "Culture"],
                operatingCities: ["Bahir Dar"],
            }
        });

        console.log("✅ Pending Organization created successfully!");
        console.log("User ID:", user.id);
        console.log("Organizer ID:", organizer.id);
        console.log("Phone:", testPhone);
        console.log("Status: PENDING");

    } catch (error) {
        console.error("❌ Failed to create pending organization:", error);
    } finally {
        await (prisma as any).$disconnect();
    }
}

createPendingOrg();
