# Payment Integration Testing Guide

This module handles the transition from a **Reservation** to a **Finalized Ticket**.

## Supported Methods
- **TeleBirr**
- **CBE Birr**
- **Amole**
- **Chapa** (Default)

## Testing the Mock Gateway
The system includes a built-in Mock Payment Gateway UI for local development.

1.  **Reserve**: Call `POST /api/tickets/reserve`. You will get a `purchaseId` and `paymentRef`.
2.  **Initialize**: Call `POST /api/payments/initialize` with the `purchaseId`.
3.  **Checkout**: Copy the `checkoutUrl` from the response and open it in your browser.
4.  **Simulate FAILURE**: Click **Simulate Failure**. The status in DB will become `FAILED`.
5.  **Retry**: Call `POST /api/payments/initialize` again. The status resets to `PENDING`.
6.  **Simulate SUCCESS**: Open the URL again and click **Simulate Success**.
7.  **Result**: The UI will call the backend `/verify` endpoint. Your tickets are now issued!

## How to Verify
- **Database**: Check the `Purchase` table. The status should be `SUCCESS`.
- **Tickets**: Check `GET /api/tickets/me`. Your new tickets should appear there.
- **Redis**: The inventory locks should have been automatically cleaned up.

---

## Technical Note: Webhooks
In production, we use the `POST /api/payments/webhook` endpoint. Providers call this to notify our system of successful payments even if the user closes their browser/app.
