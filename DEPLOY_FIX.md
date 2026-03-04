# Deployment Fix for Vercel 500 Error

The "Serverless Function has crashed" (500 Internal Server Error) on Vercel is likely caused by the Prisma Client not being correctly initialized in the `services/api` directory during the build process.

## The Fix

I have updated `build-all.js` to explicitly run `prisma generate` (via `npm run postinstall`) inside the `services/api` directory. This ensures the nested Prisma Client used by the API is properly generated and available at runtime.

Previously, only the root Prisma Client was generated, causing the nested API code to fail when trying to import its own client.

## Action Required

1.  **Commit and Push** these changes to your GitHub repository.
2.  **Redeploy** on Vercel (pushing changes should trigger a new deployment automatically).
3.  Check the Vercel logs. If the error persists, ensure your Environment Variables (`DATABASE_URL`, etc.) are correctly set in the Vercel Project Settings.

This change ensures that `services/api/node_modules/.prisma/client` exists and is compatible with the runtime environment.
