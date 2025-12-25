# Payment Flow Testing Guide

This guide covers testing the end-to-end payment flow, including redirection, verification, and retries.

## Prerequisites

1.  Start Backend: `cd services/api && npm run dev`
2.  Start Frontend: `cd app/web-app && npm run dev`
    - Ensure frontend runs on port `5173` (or update `CLIENT_URL` in backend `.env`).
3.  Redis must be running.

## Configuration

Ensure your `.env` in `services/api` has:
```env
CHAPA_SECRET_KEY=your_chapa_secret_key_or_mock
CLIENT_URL=http://localhost:5173
```

## Testing Steps

### 1. Booking & Payment Initiation

1.  Navigate to `http://localhost:5173/book/:eventId` (use ID of an active event).
2.  Select tickets and click "Reserve".
3.  You will be redirected to the **Payment Page** (`/payment/:purchaseId`).
4.  Verify the Order Summary matches your selection.
5.  Click **"Pay ETB..."**.
6.  You should be redirected to the Chapa Checkout page (or Mock Gateway if configured).

### 2. Successful Payment

1.  On the Mock Gateway/Chapa, complete the payment (for Mock: click "Simulate Success").
2.  You will be redirected back to the Backend (`/api/payments/verify-callback`).
3.  The Backend verifies the transaction with Chapa.
4.  You are redirected to the Frontend Callback Page (`/payment/callback?status=success...`).
5.  You should see a **"Payment Successful!"** message.
6.  Clicking "View My Tickets" should take you to your dashboard.

### 3. Failed Payment & Retry

1.  Start a new booking or use an existing one.
2.  On the Payment Page, click "Pay".
3.  On the Mock Gateway, click **"Simulate Failure"** (or cancel/fail in Chapa).
4.  You are redirected to the Frontend Callback Page with failure status.
5.  You should see a **"Payment Failed"** message with a reason.
6.  Click **"Retry Payment"**.
7.  You should be taken back to the Payment Page.
8.  Click "Pay" again to generate a NEW payment reference and try again.

### 4. Page Refresh / State Recovery

1.  Go to the Payment Page (`/payment/:purchaseId`).
2.  Refresh the browser.
3.  Verify that order details (Event Title, Price, etc.) are **re-fetched** and displayed correctly.
    - *Note: If this fails, ensure you are logged in (status 401 will redirect to home).*

## Troubleshooting

-   **"Session Info Missing" on Payment Page**: Means `location.state` was lost and the fetch fallback failed (likely auth issue or invalid ID).
-   **Verification Failed**: Check backend logs (`npm run dev` output) for Chapa error messages.
-   **Redirect to wrong URL**: Check `CLIENT_URL` in backend `.env`.

## API Endpoints Used

-   `GET /api/booking/:purchaseId` - Fetch purchase details (Protected)
-   `POST /api/payments/initialize` - Start payment (Protected)
-   `GET /api/payments/verify-callback` - Handle provider return (Public)
