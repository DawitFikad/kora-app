# QR Ticket Validation Testing Guide

This module ensures secure entry at venue gates, supporting both real-time and offline modes.

## How to Test

### 1. Preparation
- Generate a ticket by completing a purchase (use `test-payments.http`).
- Copy the `qrPayload` from the database `Ticket` table.
- Ensure you have an **ADMIN** or **SCANNER** token (log in as admin).

### 2. Online Mode
- Submit the `qrPayload` to `POST /api/validate/scan`.
- Success: Status `200` with `Access Granted`. Ticket becomes `USED`.
- Double Entry: Submit again -> Status `400` with `Duplicate Entry` and `fraudDetected: true`.

### 3. Offline Mode (Simulation)
- Call `GET /api/validate/sync-data/:eventId` to get all valid ticket IDs.
- For syncing, submit a batch of logs to `POST /api/validate/sync`.
- The backend will reconcile the logs and update statuses, flagging any conflicts (e.g., if a ticket was already scanned online).

## Monitoring
- Check the `ScanLog` table in the database for an immutable trail of every scan attempt, including Device IDs and Gate IDs.
