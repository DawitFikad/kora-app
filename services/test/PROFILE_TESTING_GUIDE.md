# Profile Testing Guide

This guide explains how to test the User and Organizer Profile module using **Postman** or**REST Client** 

## Testing with Postman (Recommended)

### 1. Setup Environment
In Postman, create an environment or set global variables:
- `baseUrl`: `http://localhost:4000/api`
- `status`: `Bearer <paste_your_token_here>`

### 2. User Profiles
| Feature | Method | Endpoint | Auth | Body (JSON) |
| :--- | :--- | :--- | :--- | :--- |
| Get My Profile | `GET` | `{{baseUrl}}/profiles/me` | Bearer Token | N/A |
| Update Profile | `PUT` | `{{baseUrl}}/profiles/me` | Bearer Token | `{"fullName": "Your Name", "language": "am"}` |

### 3. Organizer Profiles
> **Note**: You must be logged in as an account with `role: ORGANIZER`.

| Feature | Method | Endpoint | Auth | Body (JSON) |
| :--- | :--- | :--- | :--- | :--- |
| Get Org Profile | `GET` | `{{baseUrl}}/profiles/organizer` | Bearer Token | N/A |
| Update Org Profile| `PUT` | `{{baseUrl}}/profiles/organizer` | Bearer Token | `{"organizationName": "My Org", "city": "Addis"}` |

### 4. Admin Review Flow
> **Note**: You must be logged in as an `ADMIN`.

1.  **List Organizers**: `GET {{baseUrl}}/profiles/admin/organizers`
    - Find the ID of the organizer you want to approve.
2.  **Review Organizer**: `POST {{baseUrl}}/profiles/admin/organizers/:id/review`
    - Replace `:id` with the actual ID (e.g., `/organizers/1/review`).
    - Body: `{"status": "APPROVED", "adminNote": "Verified"}`

---

## Testing with VS Code REST Client

If you have the **REST Client** extension installed:
1.  Open [test-profiles.http](file:///e:/et-ticket-app/services/test/test-profiles.http).
2.  Paste your token into the `@userToken`, `@orgToken`, or `@adminToken` variables at the top.
3.  Click **Send Request** above each endpoint.

## How to get tokens?
Use [test-auth.http](file:///e:/et-ticket-app/services/test/test-auth.http) to:
1.  Request OTP for a phone number.
2.  Verify OTP to get the `accessToken`.
3.  Copy that token into your Postman Auth header or the `.http` variables.
