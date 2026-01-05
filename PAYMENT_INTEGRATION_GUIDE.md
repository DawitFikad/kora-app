# Payment Integration Guide: Telebirr & Chapa

## Overview
This guide explains how to implement and configure Telebirr and Chapa payment integrations for the ET-Tickets platform.

## Architecture

### Payment Flow
```
User → Purchase Creation → Payment Initialization → Provider Gateway → Verification → Ticket Issuance
```

### Supported Payment Methods
1. **Telebirr** - Direct integration with Ethio Telecom's mobile money
2. **Chapa** - Payment aggregator supporting:
   - Telebirr
   - CBE Birr
   - Amole
   - Awash Wallet
   - M-Pesa
   - Card payments

## Configuration

### 1. Environment Variables

Update your `.env` file with the following credentials:

```env
# Telebirr Configuration (Direct Integration)
TELEBIRR_MERCHANT_APP_ID="your_merchant_app_id_from_telebirr"
TELEBIRR_FABRIC_APP_ID="your_fabric_app_id_from_telebirr"
TELEBIRR_SHORT_CODE="your_short_code"
TELEBIRR_APP_SECRET="your_app_secret_key"
TELEBIRR_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour RSA Private Key Here\n-----END PRIVATE KEY-----"

# Chapa Configuration (Aggregator)
CHAPA_SECRET_KEY="CHASECK_TEST-xxxxxxxxxxxxxxxx"  # Test key
# CHAPA_SECRET_KEY="CHASECK-xxxxxxxxxxxxxxxx"     # Production key

# API URLs
API_URL="http://localhost:4000"
CLIENT_URL="http://localhost:5173"
```

### 2. Getting Credentials

#### Telebirr
1. Visit [Ethio Telecom Business Portal](https://www.ethiotelecom.et)
2. Register as a merchant
3. Complete KYC verification
4. Obtain:
   - Merchant App ID
   - Fabric App ID
   - Short Code
   - App Secret
   - RSA Private Key (for signature generation)

#### Chapa
1. Visit [Chapa Dashboard](https://dashboard.chapa.co)
2. Sign up for an account
3. Complete business verification
4. Get your API keys:
   - Test: `CHASECK_TEST-...`
   - Live: `CHASECK-...`

## Implementation Details

### Provider Classes

#### 1. Telebirr Provider (`telebirr.provider.ts`)

**Features:**
- RSA-SHA256 signature generation
- AES-128-ECB encryption/decryption
- Payment initialization
- Payment verification
- Webhook validation

**Key Methods:**
```typescript
// Initialize payment
TelebirrProvider.initialize({
    amount: 1000,
    orderId: "ORDER123",
    returnUrl: "https://yoursite.com/callback",
    notifyUrl: "https://yoursite.com/webhook",
    subject: "Ticket Purchase",
    outTradeNo: "TXN123456"
})

// Verify payment
TelebirrProvider.verify("TXN123456")

// Validate webhook
TelebirrProvider.validateWebhook(signature, data)
```

#### 2. Chapa Provider (`chapa.provider.ts`)

**Features:**
- Sandbox and production support
- Multiple payment methods
- Payment initialization
- Payment verification
- Webhook validation

**Key Methods:**
```typescript
// Initialize payment
ChapaProvider.initialize({
    amount: 1000,
    email: "customer@example.com",
    firstName: "John",
    lastName: "Doe",
    txRef: "TXN123456",
    callbackUrl: "https://yoursite.com/webhook",
    returnUrl: "https://yoursite.com/callback",
    customization: {
        title: "ET-Tickets",
        description: "Ticket Purchase"
    }
})

// Verify payment
ChapaProvider.verify("TXN123456")

// Check if configured
ChapaProvider.isConfigured()
```

### Payment Service Integration

The `PaymentService` automatically:
1. Detects configured providers
2. Falls back to mock mode if credentials missing
3. Handles initialization and verification
4. Issues tickets on successful payment
5. Records financial transactions

## Testing

### Mock Mode
When credentials are not configured, the system automatically uses mock mode:
- Mock gateway UI for testing
- Simulate success/failure
- No real money transactions

### Test Credentials
Use Chapa's test credentials for sandbox testing:
```env
CHAPA_SECRET_KEY="CHASECK_TEST-xxxxxxxxxxxxxxxx"
```

### Testing Flow
1. Create a purchase
2. Initialize payment
3. Use mock gateway or real provider
4. Verify payment
5. Check ticket issuance

## API Endpoints

### Initialize Payment
```http
POST /api/payments/initialize
Content-Type: application/json

{
  "purchaseId": 123
}

Response:
{
  "checkoutUrl": "https://provider.com/checkout/...",
  "paymentRef": "TXN123456",
  "amount": 1000,
  "method": "TELEBIRR"
}
```

### Verify Payment
```http
POST /api/payments/verify
Content-Type: application/json

{
  "paymentRef": "TXN123456",
  "externalRef": "PROVIDER_TXN_ID" // Optional
}

Response:
{
  "message": "Payment SUCCESS",
  "status": "SUCCESS",
  "purchaseId": 123
}
```

### Webhook (Provider Callback)
```http
POST /api/payments/webhook
Content-Type: application/json

{
  "paymentRef": "TXN123456",
  "status": "SUCCESS",
  "externalRef": "PROVIDER_TXN_ID"
}
```

## Security Considerations

### 1. Signature Validation
- Always validate webhook signatures
- Use provider-specific validation methods
- Reject unsigned requests

### 2. HTTPS Only
- Use HTTPS for all production endpoints
- Secure callback URLs
- Protect sensitive data in transit

### 3. Environment Variables
- Never commit credentials to git
- Use `.env` files (gitignored)
- Rotate keys regularly

### 4. Amount Verification
- Always verify payment amount matches purchase
- Check currency matches
- Validate transaction status

## Troubleshooting

### Common Issues

#### 1. "Telebirr not configured"
**Solution:** Ensure all Telebirr environment variables are set and don't contain placeholder values like `your_`

#### 2. "Chapa initialization failed"
**Possible causes:**
- Invalid API key
- Network connectivity issues
- Incorrect payload format

**Solution:**
- Verify API key is correct
- Check network connection
- Review Chapa documentation for payload requirements

#### 3. "Payment verification failed"
**Possible causes:**
- Transaction not completed
- User cancelled payment
- Network timeout

**Solution:**
- Check provider dashboard for transaction status
- Implement retry logic
- Provide clear user feedback

### Logs
Check application logs for detailed error messages:
```bash
# View payment logs
grep "PaymentService" logs/app.log
grep "TelebirrProvider" logs/app.log
grep "ChapaProvider" logs/app.log
```

## Production Checklist

- [ ] Obtain production credentials from providers
- [ ] Update environment variables
- [ ] Test with small amounts first
- [ ] Implement proper error handling
- [ ] Set up monitoring and alerts
- [ ] Configure webhook endpoints
- [ ] Enable HTTPS
- [ ] Test webhook signature validation
- [ ] Implement idempotency for webhooks
- [ ] Set up transaction reconciliation
- [ ] Configure proper logging
- [ ] Test refund scenarios
- [ ] Document support procedures

## Support

### Telebirr Support
- Email: support@ethiotelecom.et
- Phone: 994
- Documentation: [Telebirr Developer Portal]

### Chapa Support
- Email: support@chapa.co
- Documentation: https://developer.chapa.co
- Dashboard: https://dashboard.chapa.co

## Additional Resources

- [Telebirr API Documentation](https://developer.ethiotelecom.et)
- [Chapa API Documentation](https://developer.chapa.co)
- [Payment Security Best Practices](https://owasp.org/www-project-payment-security/)

## Version History

- v1.0.0 - Initial implementation with Telebirr and Chapa support
- Mock mode fallback for development
- Automatic provider detection
