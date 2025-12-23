import { prisma } from "../src/lib/prisma";
import { ProfileService } from "../src/services/profile.service";
import { AuthService } from "../src/services/auth.service";
import { Role, AccountStatus, OrganizerStatus } from "@prisma/client";

async function main() {
    console.log("Starting Profile Module Verification...");

    const testPhone = "+1112223333";
    const orgPhone = "+4445556666";

    // 1. Cleanup
    await prisma.user.deleteMany({ where: { phoneNumber: { in: [testPhone, orgPhone] } } });
    console.log("Cleanup done.");

    // 2. Test User Profile Creation (via Login flow)
    console.log("\n2. Testing User Profile Creation...");
    // Mocking verifyOtp logic or just calling it
    // For this script, we'll manually create a user and check if profile is there
    const user = await prisma.user.create({
        data: {
            phoneNumber: testPhone,
            role: Role.USER,
            status: AccountStatus.ACTIVE,
            profile: {
                create: {
                    fullName: "Test User",
                    language: "en"
                }
            }
        }
    });

    const profile = await ProfileService.getUserProfile(user.id);
    console.log("Profile retrieved:", profile?.fullName === "Test User" ? "SUCCESS" : "FAILED");

    // 3. Test Organizer Profile Creation
    console.log("\n3. Testing Organizer Registration...");
    await AuthService.registerOrganizer({
        phoneNumber: orgPhone,
        email: "org@verify.com",
        name: "Verified Org"
    });

    const organizer = await prisma.user.findUnique({
        where: { phoneNumber: orgPhone },
        include: { organizer: true }
    });

    console.log("Organizer Role:", organizer?.role);
    console.log("Organizer Profile Status:", organizer?.organizer?.status);
    console.log("Organizer Registration:", organizer?.organizer?.organizationName === "Verified Org" ? "SUCCESS" : "FAILED");

    // 4. Test Admin Approval
    console.log("\n4. Testing Admin Approval...");
    if (organizer?.organizer) {
        await ProfileService.reviewOrganizer(organizer.organizer.id, OrganizerStatus.APPROVED, "Looks good!");
        const updatedOrg = await prisma.organizerProfile.findUnique({ where: { id: organizer.organizer.id } });
        console.log("New Status:", updatedOrg?.status === OrganizerStatus.APPROVED ? "SUCCESS (APPROVED)" : "FAILED");
    }

    console.log("\nVerification Finished.");
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
