# Admin Testing Guide

## Quick Start

### Step 1: Create Admin Account
Run request #1 in `test-admin.http` to create an admin user.

**Expected Response:**
```json
{
  "message": "Admin created successfully",
  "admin": {
    "id": 1,
    "phoneNumber": "+251900000000",
    "email": "admin@et-ticket.com",
    "role": "ADMIN",
    "status": "ACTIVE"
  }
}
```

### Step 2: Get OTP
Run request #2 to request an OTP for the admin phone number.

**Check your server console** - you should see something like:
```
[MOCK SMS] OTP for +251900000000: 123456
```

### Step 3: Login and Get Token
1. Copy the OTP from the console (e.g., `123456`)
2. In request #3, replace `REPLACE_WITH_OTP_FROM_CONSOLE` with the actual OTP
3. Run request #3

**Expected Response:**
```json
{
  "user": {
    "id": 1,
    "phoneNumber": "+251900000000",
    "email": "admin@et-ticket.com",
    "role": "ADMIN",
    "status": "ACTIVE"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc2NjQyNDQ0NywiZXhwIjoxNzY2NDI1MzQ3fQ.IMTXkoE3OYCrAmzvvOkzJVkm0relHGag6AHWccu83QA",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Step 4: Use the Access Token

**CRITICAL:** You must copy the `accessToken` value from step 3's response.

1. **Find the token:** Look for `"accessToken":` in the response
2. **Copy the entire token:** It's a long string that looks like `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. **Replace in requests 4-9:** Find `YOUR_ADMIN_ACCESS_TOKEN` and replace it with your copied token

**Example:**
```
Before:
Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN

After:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBRE1JTiIsImlhdCI6MTcwMzI1...
```

### Step 5: Test Admin Endpoints

Now you can run requests 4-9 to test admin functionality:

- **Request 4:** List all users
- **Request 5:** List only pending organizers
- **Request 6:** Approve an organizer (get user ID from request 5)
- **Request 7-8:** Suspend/activate users
- **Request 9:** Test admin-only route

## Common Issues

### "Unauthorized" Error
**Cause:** Token is missing or incorrect

**Solutions:**
1. Make sure you copied the ENTIRE `accessToken` from step 3
2. Don't include quotes around the token
3. Make sure there's a space after "Bearer"
4. Token expires in 15 minutes - get a new one by repeating steps 2-3

### "Forbidden" Error
**Cause:** User doesn't have ADMIN role

**Solution:** Make sure you're using the token from the admin account, not a regular user

### "Invalid token" Error
**Cause:** Token is malformed or expired

**Solution:** Get a fresh token by repeating steps 2-3

## Testing Organizer Approval Flow

1. **Create an organizer** (use `test-auth.http` request #4)
2. **List pending organizers** (admin request #5)
3. **Copy the organizer's user ID** from the response
4. **Approve the organizer** (admin request #6, replace USER_ID)
5. **Verify organizer can login** (use `test-auth.http` requests #5-6)

## Token Expiration

- Access tokens expire in **15 minutes**
- If your token expires, just repeat steps 2-3 to get a new one
- You don't need to create a new admin account
