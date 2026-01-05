# Mobile Payment Testing Guide

## ✅ Setup Complete!

Your mobile app is now configured to use **REAL payment integration** with Chapa and Telebirr (no mock data).

## 🚀 How to Test Payment on Mobile

### Prerequisites
1. ✅ Backend API running (`npm run dev` in `services/api`)
2. ✅ Chapa credentials configured in `.env`
3. ✅ Mobile app connected to backend
4. ✅ Test device/emulator ready

### Step-by-Step Testing Process

#### **Step 1: Start Your Servers**

**Backend API:**
```bash
cd services/api
npm run dev
```

**Mobile App:**
```bash
cd app/mobile
flutter run
```

#### **Step 2: Navigate to Event**
1. Open the mobile app
2. Browse available events
3. Select an event you want to book

#### **Step 3: Select Tickets**
1. Choose ticket tier (VIP, Regular, etc.)
2. Select quantity
3. Tap "Continue to Checkout"

#### **Step 4: Review Checkout**
1. Review your order details
2. See the price breakdown:
   - Subtotal
   - Service Fee
   - Total
3. (Optional) Apply promo code if you have one

#### **Step 5: Initiate Payment**
1. Tap **"Pay Now"** button
2. The app will:
   - Create a reservation
   - Call the backend API
   - Initialize payment with Chapa/Telebirr
   - Open the payment gateway in your browser

#### **Step 6: Complete Payment**

**For Test Mode (Chapa Sandbox):**
- You'll be redirected to Chapa's test payment page
- Use test credentials provided by Chapa
- Complete the test payment

**For Real Telebirr:**
- You'll be redirected to Telebirr payment page
- Enter your Telebirr PIN
- Confirm payment

#### **Step 7: Verify Tickets**
1. After successful payment, return to the app
2. Navigate to "My Tickets"
3. Your tickets should appear with QR codes

## 🔍 What Happens Behind the Scenes

### Payment Flow:
```
Mobile App → Backend API → Payment Provider (Chapa/Telebirr) → User Payment → Verification → Ticket Issuance
```

### Detailed Steps:
1. **Reservation Created**: Backend creates a purchase record with status `PENDING`
2. **Payment Initialized**: Backend calls Chapa/Telebirr API to get checkout URL
3. **User Redirected**: Mobile app opens the payment URL in browser
4. **Payment Completed**: User completes payment on provider's page
5. **Webhook Called**: Provider notifies backend of payment status
6. **Verification**: Backend verifies payment with provider
7. **Tickets Issued**: Backend generates tickets with QR codes
8. **SMS Sent**: User receives SMS confirmation (if configured)

## 📱 Expected Behavior

### Success Flow:
```
1. Tap "Pay Now" → Loading indicator appears
2. Browser opens → Chapa/Telebirr payment page
3. Complete payment → Success message
4. Return to app → "Payment initiated" notification
5. Check tickets → Tickets appear with QR codes
```

### Error Handling:
- **401 Unauthorized**: Shows login dialog
- **Network Error**: Shows error message with retry option
- **Payment Failed**: Purchase remains in PENDING state, can retry

## 🧪 Testing Scenarios

### Test Case 1: Successful Payment
- Select tickets
- Complete payment
- Verify tickets are issued

### Test Case 2: Failed Payment
- Select tickets
- Cancel payment on gateway
- Verify purchase stays PENDING
- Can retry payment

### Test Case 3: Unauthenticated User
- Logout
- Try to book tickets
- Should prompt to login
- After login, should continue booking

### Test Case 4: Promo Code
- Enter valid promo code
- Verify discount applied
- Complete payment with discounted price

## 🔧 Troubleshooting

### Issue: "Payment initialization failed"
**Check:**
- Backend API is running
- Chapa credentials are correct in `.env`
- Network connectivity

**Solution:**
```bash
# Check backend logs
cd services/api
# Look for error messages in terminal
```

### Issue: "Could not launch payment page"
**Check:**
- URL is valid
- Device has browser installed
- Internet connection

**Solution:**
- Ensure `url_launcher` package is properly configured
- Check Android/iOS permissions

### Issue: "Tickets not appearing"
**Check:**
- Payment was successful
- Backend processed webhook
- Ticket service completed

**Solution:**
```bash
# Check backend logs for ticket issuance
# Look for: "Ticket issuance completed"
```

### Issue: "Connection Refused" (Android Physical Device)
**Check:**
- Using physical Android device
- Error "Connection refused" or `errno = 111`

**Solution:**
1. Connect device via USB
2. Run in terminal:
   ```bash
   adb reverse tcp:4000 tcp:4000
   ```
3. Ensure app uses `http://127.0.0.1:4000/api`

## 📊 Monitoring

### Backend Logs to Watch:
```
✅ Initializing Chapa payment
✅ Chapa payment initialized successfully
✅ Payment verification successful
✅ Ticket issuance completed
```

### Mobile App Logs:
```dart
// In terminal running flutter
flutter: Payment Process started
flutter: Reservation created: {purchaseId: 123}
flutter: Payment URL received: https://...
flutter: Launching payment URL
```

## 🎯 Payment Methods Available

Via Chapa (configured):
- ✅ Telebirr
- ✅ CBE Birr
- ✅ Amole
- ✅ Awash Wallet
- ✅ M-Pesa
- ✅ Credit/Debit Cards

Direct Telebirr (configured):
- ✅ Telebirr Direct Integration

## 📝 Test Checklist

Before going live, test:
- [ ] Successful payment flow
- [ ] Failed payment handling
- [ ] Network error handling
- [ ] Authentication flow
- [ ] Promo code application
- [ ] Ticket generation
- [ ] QR code display
- [ ] SMS notifications
- [ ] Multiple payment methods
- [ ] Different ticket quantities
- [ ] Different ticket tiers

## 🔐 Security Notes

### Current Setup (Test Mode):
- Using Chapa TEST credentials
- Using Telebirr TEST credentials
- Safe for development/testing
- No real money transactions

### Before Production:
- [ ] Replace with production Chapa key
- [ ] Replace with production Telebirr credentials
- [ ] Enable HTTPS
- [ ] Configure proper webhook URLs
- [ ] Test with small real amounts
- [ ] Set up monitoring and alerts

## 📞 Support

### If Payment Fails:
1. Check backend logs
2. Verify credentials in `.env`
3. Test with Chapa dashboard
4. Contact Chapa support if needed

### Chapa Support:
- Email: support@chapa.co
- Dashboard: https://dashboard.chapa.co

### Telebirr Support:
- Phone: 994
- Email: support@ethiotelecom.et

## 🎉 You're Ready to Test!

Your mobile app is now configured with **real payment integration**. No mock data is being used. All payments go through actual Chapa/Telebirr APIs (in test mode).

**Next Steps:**
1. Run the mobile app
2. Select an event and tickets
3. Complete the payment flow
4. Verify tickets are issued

Good luck with testing! 🚀
