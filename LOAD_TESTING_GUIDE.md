# ⚡ ET-Ticket Load Testing Guide

We use **k6** (Grafana) for high-performance load testing of our API and booking logic.

## 1. Prerequisites
- Install k6: `choco install k6` or `brew install k6`
- Auth Token: Obtain a valid JWT token from `/api/auth/verify-otp`.

## 2. Flash Sale Simulation Script
Create a file named `load_test_booking.js`:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // ramp up to 50 users
    { duration: '1m', target: 200 }, // stay at 200 users (peak sale)
    { duration: '30s', target: 0 },  // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must be under 500ms
  },
};

const BASE_URL = 'http://localhost:4000/api';
const TOKEN = 'YOUR_JWT_TOKEN';

export default function () {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`,
    },
  };

  // 1. Browse Event Details
  const eventRes = http.get(`${BASE_URL}/events/1`, params);
  check(eventRes, { 'status is 200': (r) => r.status === 200 });

  // 2. Attempt Reservation (Simulate high-speed booking)
  const payload = JSON.stringify({
    eventId: 1,
    tierId: 1,
    quantity: 1,
    paymentMethod: 'CHAPA'
  });

  const reserveRes = http.post(`${BASE_URL}/tickets/reserve`, payload, params);
  
  check(reserveRes, {
    'reservation status is 200 or 409': (r) => [200, 409].includes(r.status),
    'no 500 errors': (r) => r.status !== 500,
  });

  sleep(1);
}
```

## 3. QR Validation Stress Script
Create a file named `load_test_scanning.js`:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50, // 50 gate staff scanning simultaneously
  duration: '1m',
};

const BASE_URL = 'http://localhost:4000/api';
const SCANNER_TOKEN = 'YOUR_SCANNER_JWT_TOKEN';

export default function () {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SCANNER_TOKEN}`,
    },
  };

  const payload = JSON.stringify({
    qrPayload: 'MANUAL-TICKET-ID-' + Math.floor(Math.random() * 1000),
    gateId: 'GATE-NORTH-01',
    deviceId: 'HANDHELD-L2'
  });

  const scanRes = http.post(`${BASE_URL}/validate/scan`, payload, params);
  
  check(scanRes, {
    'scan response < 100ms': (r) => r.timings.duration < 100,
    'not 500': (r) => r.status !== 500,
  });

  sleep(0.1); // Fast scanning
}
```

## 4. Execution
```bash
# Run Booking Test
k6 run load_test_booking.js

# Run Scanner Stress Test
k6 run load_test_scanning.js
```

## 5. Success Criteria
1. **Zero Over-booking**: Check DB after the test. If capacity was 100, exactly 100 successful reservations should exist.
2. **Atomic Locks**: No race conditions in Redis or Prisma Transactions.
3. **Database Health**: CPU/Memory of DB instance remains stable.
