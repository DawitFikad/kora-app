# Ticketing Testing Guide

This guide explains how to test the **Ticketing & Seat Locking** system.

## The Two-Step Flow
1.  **Reserve**: Locks the capacity/seat for 5 minutes in Redis.
2.  **Confirm**: After payment, the ticket is finalized and persisted in PostgreSQL.

## How to Test

### 1. Preparation
- Ensure you have a **User Access Token** (via `test-auth.http`).
- Ensure there is an **Approved Event** with at least one Ticket Tier.

### 2. Testing Concurrency (The "Hard" Part)
To see the seat locking in action:
1. Open two separate REST Client instances or Postman tabs.
2. Send a `POST /api/tickets/reserve` for the **same seat** (e.g., A1) or the **last remaining capacity**.
3. The first request should get `Success`.
4. The second request should get `409 Conflict: One or more seats are already reserved`.

### 3. Endpoints
| Feature | Method | Endpoint | Auth | Body |
| :--- | :--- | :--- | :--- | :--- |
| Reserve | `POST` | `/api/tickets/reserve` | User Token | `{"eventId": 1, "tierId": 1, "quantity": 2}` |
| Confirm | `POST` | `/api/tickets/confirm` | User Token | Same as Reserve |
| My Tickets| `GET` | `/api/tickets/me` | User Token | N/A |

### 4. Data Verification
After clicking **Confirm**:
- Check the database: A new `Purchase` and corresponding `Ticket` records should exist.
- User's `GET /me` should show the new tickets.

---

## Technical Note: TTL
The Redis lock expires in **5 minutes**. If you reserve but don't confirm within that time, the capacity will naturally "return" to the public pool without any manual action.
