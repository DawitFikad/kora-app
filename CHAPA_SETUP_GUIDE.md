# Chapa Configuration Guide

## How to Configure Chapa Payment Gateway

### Step 1: Get Your API Keys from Chapa Dashboard

Visit: https://dashboard.chapa.co/dashboard/profile/profile/api

You will see three keys:
1. **Test Public Key** - Not needed for backend
2. **Test Secret Key** - THIS IS WHAT YOU NEED! ✅
3. **Encryption Key** - Optional (for additional security)

### Step 2: Copy Your Test Secret Key

The Test Secret Key looks like this:
```
CHASECK_TEST-1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
```

### Step 3: Update Your .env File

Open `services/api/.env` and find line 27:

**BEFORE:**
```env
CHAPA_SECRET_KEY="CHASECK_TEST-xxxxxxxxxxxxxxxx"
```

**AFTER (replace with your actual key):**
```env
CHAPA_SECRET_KEY="CHASECK_TEST-your_actual_secret_key_here"
```

### Step 4: Verify Configuration

After updating the `.env` file:

1. **Restart your API server:**
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

2. **Check the logs** - You should see:
   ```
   ✅ Chapa payment initialized successfully
   ```
   
   Instead of:
   ```
   ⚠️  Chapa not configured, using mock mode
   ```

### Step 5: Test the Integration

1. Create a test purchase
2. Initialize payment
3. You should be redirected to Chapa's payment page
4. Complete the test payment
5. Verify the payment was successful

## Example Configuration

Here's what your `.env` should look like (with your actual key):

```env
# ----------------------------------------
# 🔹 CHAPA PAYMENT GATEWAY
# ----------------------------------------
CHAPA_SECRET_KEY="CHASECK_TEST-abc123def456ghi789jkl012mno345pqr"

# Optional: Add encryption key if you want extra security
# CHAPA_ENCRYPTION_KEY="your_encryption_key_from_dashboard"
```

## Supported Payment Methods via Chapa

Once configured, users can pay using:
- ✅ Telebirr
- ✅ Chapa


## Testing vs Production

### Test Mode (Current)
- Use keys starting with `CHASECK_TEST-`
- No real money is charged
- Perfect for development and testing

### Production Mode (When Ready)
- Get production keys from Chapa dashboard
- Use keys starting with `CHASECK-` (without TEST)
- Real money transactions
- Requires business verification

## Troubleshooting

### Issue: "Chapa not configured, using mock mode"
**Solution:** Make sure your secret key:
- Starts with `CHASECK_TEST-`
- Is copied correctly (no extra spaces)
- Is in the `.env` file
- Server has been restarted

### Issue: "Chapa initialization failed"
**Possible causes:**
- Invalid API key
- Network connectivity issues
- Chapa service is down

**Solution:**
- Double-check your API key
- Test your internet connection
- Check Chapa status page

### Issue: Payment verification fails
**Solution:**
- Check Chapa dashboard for transaction status
- Verify the transaction reference matches
- Check server logs for detailed error messages

## Need Help?

- **Chapa Support:** support@chapa.co
- **Chapa Documentation:** https://developer.chapa.co
- **Chapa Dashboard:** https://dashboard.chapa.co

## Quick Start Checklist

- [ ] Visit Chapa dashboard
- [ ] Copy Test Secret Key
- [ ] Update `.env` file with your key
- [ ] Restart API server
- [ ] Test a payment
- [ ] Verify payment completes successfully
- [ ] Check tickets are issued

---

**Note:** Keep your secret keys secure! Never commit them to git or share them publicly.
