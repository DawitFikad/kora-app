# Ticket Booking API Testing Guide

This guide covers testing the complete ticket booking flow with seat/zone selection, real-time locking, price breakdown, and promo code support.

## Prerequisites

1. API server running on `http://localhost:4000`
2. Redis server running (for seat locking)
3. At least one approved event with ticket tiers
4. A user account with valid auth token

## API Endpoints

### 1. Public Endpoints (No Auth Required)

#### Get Event for Booking
```http
GET http://localhost:4000/api/booking/events/{{eventId}}
```

#### Get Seat Status (SEAT_MAP events only)
```http
GET http://localhost:4000/api/booking/events/{{eventId}}/tiers/{{tierId}}/seats
```

#### Calculate Price Breakdown
```http
POST http://localhost:4000/api/booking/calculate-price
Content-Type: application/json

{
    "eventId": 1,
    "tierId": 1,
    "quantity": 2,
    "promoCode": "SAVE10"
}
```

#### Validate Promo Code
```http
POST http://localhost:4000/api/booking/validate-promo
Content-Type: application/json

{
    "code": "SAVE10",
    "eventId": 1
}
```

### 2. Protected Endpoints (Auth Required)

#### Lock Seats (SEAT_MAP events)
```http
POST http://localhost:4000/api/booking/lock-seats
Authorization: Bearer {{token}}
Content-Type: application/json

{
    "eventId": 1,
    "tierId": 1,
    "seatNumbers": ["S1", "S2", "S3"]
}
```

#### Release Seats
```http
POST http://localhost:4000/api/booking/release-seats
Authorization: Bearer {{token}}
Content-Type: application/json

{
    "eventId": 1,
    "tierId": 1,
    "seatNumbers": ["S1", "S2", "S3"]
}
```

#### Create Reservation
```http
POST http://localhost:4000/api/booking/reserve
Authorization: Bearer {{token}}
Content-Type: application/json

{
    "eventId": 1,
    "tierId": 1,
    "quantity": 2,
    "seatNumbers": ["S1", "S2"],
    "paymentMethod": "CHAPA",
    "promoCode": "SAVE10"
}
```

**For CAPACITY events (no seat numbers):**
```http
POST http://localhost:4000/api/booking/reserve
Authorization: Bearer {{token}}
Content-Type: application/json

{
    "eventId": 1,
    "tierId": 1,
    "quantity": 2,
    "paymentMethod": "CHAPA"
}
```

#### Extend Lock Time
```http
POST http://localhost:4000/api/booking/{{purchaseId}}/extend
Authorization: Bearer {{token}}
```

#### Cancel Reservation
```http
POST http://localhost:4000/api/booking/{{purchaseId}}/cancel
Authorization: Bearer {{token}}
```

## Response Examples

### Event for Booking Response
```json
{
    "success": true,
    "data": {
        "id": 1,
        "title": "Test Concert",
        "description": "A great concert",
        "venue": "Main Hall",
        "dateTime": "2025-02-01T19:00:00.000Z",
        "coverImage": null,
        "eventType": "CAPACITY",
        "category": "Music",
        "city": "Addis Ababa",
        "organizer": "Test Organizer",
        "feeType": "PERCENTAGE",
        "feeFixed": 0,
        "feePercentage": 5,
        "tiers": [
            {
                "id": 1,
                "name": "Regular",
                "price": 500,
                "capacity": 100,
                "soldCount": 10,
                "available": 90
            },
            {
                "id": 2,
                "name": "VIP",
                "price": 1500,
                "capacity": 20,
                "soldCount": 5,
                "available": 15
            }
        ]
    }
}
```

### Price Breakdown Response
```json
{
    "success": true,
    "data": {
        "basePrice": 500,
        "ticketPrice": 500,
        "subtotal": 1000,
        "commission": 50,
        "convenienceFee": 25,
        "discount": 100,
        "total": 975,
        "promoApplied": {
            "code": "SAVE10",
            "type": "PERCENTAGE",
            "value": 10
        }
    }
}
```

### Reservation Response
```json
{
    "success": true,
    "data": {
        "purchaseId": 123,
        "paymentRef": "TX-1703552400000-a1b2c3d4",
        "priceBreakdown": {
            "basePrice": 500,
            "ticketPrice": 500,
            "subtotal": 1000,
            "commission": 50,
            "convenienceFee": 25,
            "discount": 100,
            "total": 975
        },
        "lockExpiry": "2025-12-25T20:00:00.000Z"
    }
}
```

### Seat Status Response (SEAT_MAP events)
```json
{
    "success": true,
    "data": [
        { "seatNumber": "S1", "status": "available" },
        { "seatNumber": "S2", "status": "locked", "lockedBy": 5, "ttl": 280 },
        { "seatNumber": "S3", "status": "sold" }
    ]
}
```

## Testing Flow

### Complete Booking Flow

1. **Get Event Details**
   - Call GET `/api/booking/events/{eventId}`
   - Review available tiers and capacity

2. **For SEAT_MAP Events - Get Seat Status**
   - Call GET `/api/booking/events/{eventId}/tiers/{tierId}/seats`
   - Identify available seats

3. **Calculate Price**
   - Call POST `/api/booking/calculate-price`
   - Optionally include promo code
   - Review breakdown (subtotal, fees, discount, total)

4. **Create Reservation**
   - Call POST `/api/booking/reserve` with auth token
   - System locks seats/capacity in Redis (5 min TTL)
   - Returns purchaseId and paymentRef

5. **Complete Payment**
   - Use paymentRef with payment gateway
   - After successful payment, tickets are issued

### Promo Code Testing

1. Create a promo code for an event (via organizer dashboard)
2. Test validation: POST `/api/booking/validate-promo`
3. Apply to price calculation to see discount
4. Include in reservation to get discounted total

### Concurrency Testing

To test real-time seat locking:

1. Open two browser sessions
2. Try to select the same seat in both
3. First user locks the seat, second user sees it as "locked"
4. After 5 minutes (or cancellation), seat becomes available again

## Error Handling

| Error | Status | Description |
|-------|--------|-------------|
| Event not found | 404 | Invalid eventId or event not approved |
| Tier not found | 400 | Invalid tierId |
| Seats unavailable | 409 | Requested seats are locked/sold |
| Not enough capacity | 409 | Insufficient tickets available |
| Invalid promo code | 400 | Code doesn't exist or isn't valid for event |
| Max tickets exceeded | 400 | Cannot purchase more than 10 tickets |
| Reservation expired | 400 | Lock TTL exceeded |

## Redis Keys

The seat locking mechanism uses Redis with these key patterns:

- Seat lock: `lock:event:{eventId}:tier:{tierId}:seat:{seatNumber}`
- Capacity reserved: `lock:event:{eventId}:tier:{tierId}:capacity:reserved`
- User capacity: `lock:event:{eventId}:tier:{tierId}:user:{userId}:qty`

All locks have a 5-minute TTL.
