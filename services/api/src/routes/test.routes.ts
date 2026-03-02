import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/rbac.middleware";
import { Role } from "@prisma/client";
import { env } from "process";
import { ChapaProvider } from "../services/providers/chapa.provider";
import { TelebirrProvider } from "../services/providers/telebirr.provider";
import crypto from "crypto";

const router = Router();

// Test protected route (any authenticated user)
router.get("/protected", authenticate, (req, res) => {
    res.json({
        message: "Access granted",
        user: req.user
    });
});

// Test organizer-only route
router.get("/organizer-only", authenticate, authorize([Role.ORGANIZER, Role.ADMIN]), (req, res) => {
    res.json({
        message: "Organizer access granted",
        user: req.user
    });
});



router.get('/telebirr-config', async (req, res) => {
    try {
        console.log('🔍 Testing Telebirr configuration...');

        // Check environment variables
        const envCheck = {
            TELEBIRR_MERCHANT_APP_ID: env.teleBirrMerchantAppId ?
                '✓ Set (' + env.teleBirrMerchantAppId.substring(0, 4) + '...' + env.teleBirrMerchantAppId.slice(-4) + ')' :
                '✗ Missing',
            TELEBIRR_FABRIC_APP_ID: env.teleBirrFabricAppId ?
                '✓ Set (' + env.teleBirrFabricAppId.substring(0, 8) + '...)' :
                '✗ Missing',
            TELEBIRR_SHORT_CODE: env.teleBirrShortCode ?
                '✓ Set (' + env.teleBirrShortCode + ')' :
                '✗ Missing',
            TELEBIRR_APP_SECRET: env.teleBirrAppSecret ?
                '✓ Set (' + env.teleBirrAppSecret.substring(0, 8) + '...)' :
                '✗ Missing',
            TELEBIRR_PRIVATE_KEY: env.teleBirrPrivateKey ?
                '✓ Set (' + env.teleBirrPrivateKey.length + ' chars)' :
                '✗ Missing',
            TELEBIRR_API_URL: env.teleBirrApiUrl ?
                '✓ Set (' + env.teleBirrApiUrl + ')' :
                '✗ Missing'
        };

        // Check configuration
        const isConfigured = TelebirrProvider.isConfigured();

        // Test connection
        const connectionTest = await TelebirrProvider.testConnection();

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            envCheck,
            configuration: {
                isConfigured,
                message: isConfigured ? '✅ Telebirr is properly configured' : '❌ Telebirr is not configured'
            },
            connection: connectionTest,
            network: {
                gatewayUrl: env.teleBirrApiUrl,
                endpoints: {
                    token: `${env.teleBirrApiUrl}/payment/v1/token`,
                    preOrder: `${env.teleBirrApiUrl}/payment/v1/merchant/preOrder`,
                    queryOrder: `${env.teleBirrApiUrl}/payment/v1/merchant/queryOrder`
                }
            }
        });
    } catch (error: any) {
        console.error('❌ Telebirr config test error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            details: error.response?.data
        });
    }
});

/**
 * Test Telebirr Payment Initialization
 * POST /api/test/telebirr-payment
 */
router.post('/telebirr-payment', async (req, res) => {
    try {
        const { amount = 10, returnUrl, notifyUrl } = req.body;

        console.log('💳 Testing Telebirr payment initialization...');

        // Generate unique transaction reference
        const txRef = `TEST_TX_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

        // Use default URLs if not provided
        const testReturnUrl = returnUrl || `${env.apiUrl}/api/payments/verify-callback?ref=${txRef}`;
        const testNotifyUrl = notifyUrl || `${env.apiUrl}/api/payments/webhook`;

        const testResult = await TelebirrProvider.initialize({
            amount: Number(amount),
            orderId: `TEST_ORDER_${Date.now()}`,
            returnUrl: testReturnUrl,
            notifyUrl: testNotifyUrl,
            subject: 'Test Payment - ET Tickets',
            outTradeNo: txRef
        });

        // Generate QR code for easy testing
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(testResult.checkoutUrl)}`;

        res.json({
            success: true,
            message: '✅ Test payment initialized successfully',
            data: {
                transaction: {
                    reference: txRef,
                    amount: amount,
                    currency: 'ETB'
                },
                payment: {
                    checkoutUrl: testResult.checkoutUrl,
                    prepayId: testResult.prepayId,
                    qrCode: qrCodeUrl,
                    shortUrl: testResult.checkoutUrl.substring(0, 100) + '...'
                },
                instructions: [
                    '1. Scan the QR code or open the checkout URL',
                    '2. Use test credentials if prompted',
                    '3. Complete the payment in test mode',
                    '4. Check webhook/notification logs'
                ]
            }
        });
    } catch (error: any) {
        console.error('❌ Telebirr payment test error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            details: {
                error: error.message,
                response: error.response?.data,
                stack: process.env.NODE_ENV === 'development' ? error.stack?.split('\n')[0] : undefined
            }
        });
    }
});

/**
 * Test Telebirr Payment Verification
 * GET /api/test/telebirr-verify/:txRef
 */
router.get('/telebirr-verify/:txRef', async (req, res) => {
    try {
        const { txRef } = req.params;

        console.log(`🔍 Verifying Telebirr payment: ${txRef}`);

        const verification = await TelebirrProvider.verify(txRef);

        res.json({
            success: true,
            message: 'Verification completed',
            data: verification,
            timestamp: new Date().toISOString(),
            interpretation: {
                isSuccess: verification.success ? '✅ Payment Successful' : '❌ Payment Failed/Pending',
                nextSteps: verification.success ?
                    'Payment verified successfully. Issue tickets.' :
                    'Payment not yet successful. Check again later or investigate.'
            }
        });
    } catch (error: any) {
        console.error('❌ Telebirr verification error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Compare Payment Providers
 * GET /api/test/payment-providers
 */
router.get('/payment-providers', async (req, res) => {
    try {
        const telebirrConfigured = TelebirrProvider.isConfigured();
        const chapaConfigured = ChapaProvider.isConfigured();

        const telebirrTest = telebirrConfigured ? await TelebirrProvider.testConnection() : null;

        res.json({
            success: true,
            providers: {
                telebirr: {
                    name: 'Telebirr',
                    configured: telebirrConfigured,
                    connection: telebirrTest,
                    supportedMethods: TelebirrProvider.getSupportedMethods(),
                    apiUrl: env.teleBirrApiUrl
                },
                chapa: {
                    name: 'Chapa',
                    configured: chapaConfigured,
                    supportedMethods: ChapaProvider.getSupportedMethods(),
                    baseUrl: 'https://api.chapa.co/v1'
                }
            },
            recommendations: {
                ifTelebirrFails: 'Check: 1) Network connectivity 2) SSL certificates 3) Credential validity',
                ifBothWork: 'Both providers configured. Use based on customer preference.',
                ifNoneWork: 'Check environment variables and network connectivity.'
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Test Private Key Format
 * GET /api/test/telebirr-private-key
 */
router.get('/telebirr-private-key', (req, res) => {
    try {
        const privateKey = env.teleBirrPrivateKey;

        if (!privateKey) {
            return res.json({
                success: false,
                message: 'Private key not found in environment'
            });
        }

        // Check key characteristics
        const hasBegin = privateKey.includes('BEGIN');
        const hasEnd = privateKey.includes('END');
        const hasNewlines = privateKey.includes('\n');
        const length = privateKey.length;

        // Try to format it
        let formattedKey = '';
        try {
            // This would call the internal formatPrivateKey method
            // For now, just show analysis
            formattedKey = 'Analysis only - cannot format without calling internal method';
        } catch (error) {
            const errorMessage = typeof error === 'object' && error !== null && 'message' in error
                ? (error as { message: string }).message
                : String(error);
            formattedKey = `Format error: ${errorMessage}`;
        }

        res.json({
            success: true,
            analysis: {
                length,
                hasBeginTag: hasBegin,
                hasEndTag: hasEnd,
                hasNewlines: hasNewlines,
                first50Chars: privateKey.substring(0, 50) + '...',
                last50Chars: '...' + privateKey.substring(length - 50),
                issues: {
                    missingTags: !hasBegin || !hasEnd ? 'Key missing PEM tags' : 'OK',
                    tooShort: length < 100 ? 'Key seems too short' : 'Length OK',
                    hasQuotes: privateKey.includes('"') || privateKey.includes("'") ? 'Contains quotes' : 'No quotes'
                }
            },
            suggestions: [
                'If missing tags, ensure key has -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY-----',
                'If contains quotes, remove them from environment variable',
                'Key should be about 1600-1700 characters for 2048-bit RSA'
            ]
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Test Network Connectivity
 * GET /api/test/network
 */
router.get('/network', async (req, res) => {
    try {
        const axios = require('axios');
        const https = require('https');

        const testUrl = env.teleBirrApiUrl;

        if (!testUrl) {
            return res.json({
                success: false,
                message: 'No API URL configured'
            });
        }

        // Create agent that ignores SSL errors
        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        // Test simple connection
        const startTime = Date.now();

        try {
            const response = await axios.get(testUrl, {
                httpsAgent: agent,
                timeout: 10000
            });

            const endTime = Date.now();
            const latency = endTime - startTime;

            res.json({
                success: true,
                message: `✅ Connected to ${testUrl}`,
                details: {
                    url: testUrl,
                    latency: `${latency}ms`,
                    status: response.status,
                    headers: Object.keys(response.headers)
                }
            });
        } catch (error: any) {
            const endTime = Date.now();
            const latency = endTime - startTime;

            res.json({
                success: false,
                message: `❌ Cannot connect to ${testUrl}`,
                details: {
                    url: testUrl,
                    latency: `${latency}ms`,
                    error: error.message,
                    code: error.code,
                    suggestion: 'Check if the IP/port is accessible from your server network'
                }
            });
        }

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Health Check
 * GET /api/test/health
 */
// Health route removed to avoid conflict with main app health check


// Test admin-only route
router.get("/admin-only", authenticate, authorize([Role.ADMIN]), (req, res) => {
    res.json({
        message: "Admin access granted",
        user: req.user
    });
});



import { prisma } from "../lib/prisma";
import { AccountStatus, OrganizerStatus } from "@prisma/client";

/**
 * Force create an Admin or Organizer via URL (useful for Vercel remote database seeding)
 * GET /api/test/make-admin?phone=09...&role=ADMIN|ORGANIZER
 */
router.get("/make-admin", async (req, res) => {
    try {
        const rawPhone = req.query.phone as string;
        const roleArg = (req.query.role as string || "ADMIN").toUpperCase();

        if (!rawPhone) {
            return res.status(400).json({ success: false, message: "Please provide ?phone=..." });
        }

        if (roleArg !== "ADMIN" && roleArg !== "ORGANIZER") {
            return res.status(400).json({ success: false, message: "Role must be ADMIN or ORGANIZER" });
        }

        let phoneNumber = rawPhone.trim();
        const digits = phoneNumber.replace(/\D/g, '');
        if (phoneNumber.startsWith('+') && digits.startsWith('251')) {
            phoneNumber = `+${digits}`;
        } else if (digits.startsWith('0') && digits.length === 10) {
            phoneNumber = `+251${digits.slice(1)}`;
        } else if (digits.startsWith('9') && digits.length === 9) {
            phoneNumber = `+251${digits}`;
        }

        const user = await prisma.user.upsert({
            where: { phoneNumber },
            update: {
                role: roleArg as Role,
                status: AccountStatus.ACTIVE
            },
            create: {
                phoneNumber,
                role: roleArg as Role,
                status: AccountStatus.ACTIVE,
                profile: {
                    create: {
                        fullName: roleArg === 'ADMIN' ? 'System ' + roleArg : 'Test ' + roleArg,
                        language: 'en'
                    }
                }
            },
        });

        if (roleArg === 'ORGANIZER') {
            await prisma.organizerProfile.upsert({
                where: { userId: user.id },
                update: { status: OrganizerStatus.APPROVED },
                create: {
                    userId: user.id,
                    organizationName: 'Demo Organization',
                    status: OrganizerStatus.APPROVED,
                    contactEmail: 'demo@org.com',
                    contactPhone: phoneNumber,
                    city: 'Addis Ababa',
                    payoutDetails: 'CBE 1000123456789'
                }
            });
        }

        res.json({
            success: true,
            message: `User ${phoneNumber} is now an active ${roleArg}.`,
            user: { id: user.id, phone: user.phoneNumber, role: user.role }
        });

    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
