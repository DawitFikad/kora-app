# Event Testing Guide

This guide explains how to test the **Event Management Module** using Postman or the REST Client.

## Event Lifecycle
1.  **Organizer Creates**: Moves to `PENDING`.
2.  **Admin Reviews**: Moves to `APPROVED` or `REJECTED`.
3.  **User Discovers**: Only `APPROVED` events are visible and searchable.

## Testing with Postman

### 1. Preparation
- Get an **Organizer Access Token** (via `test-auth.http`).
- Ensure the organizer is **APPROVED** (via `POST /api/profiles/admin/organizers/:id/review`).

### 2. Endpoints
| Feature | Method | Endpoint | Auth |
| :--- | :--- | :--- | :--- |
| Create Event | `POST` | `{{baseUrl}}/events` | Organizer Token |
| List My Events (Admin)| `GET` | `{{baseUrl}}/events/admin/list` | Admin Token |
| Approve Event | `POST` | `{{baseUrl}}/events/:id/review` | Admin Token |
| Discover Events | `GET` | `{{baseUrl}}/events` | None / Any |

### 3. Body Examples

**Create Event:**
```json
{
    "title": "Test Event",
    "venue": "Hall A",
    "dateTime": "2025-12-25T18:00:00Z",
    "eventType": "CAPACITY",
    "categoryId": 1,
    "cityId": 1,
    "tiers": [
        { "name": "Early Bird", "price": 200, "capacity": 50 }
    ]
}
```

**Admin Review:**
```json
{
    "status": "APPROVED",
    "commission": 12.5
}
```

## Testing with VS Code REST Client
Use [test-events.http](file:///e:/et-ticket-app/services/test/test-events.http) for quick integration testing.
