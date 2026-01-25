# 🧪 ET-Ticket QA Testing Plan

This document outlines the systematic testing approach to ensure the platform is "Mission Critical Ready."

## 1. Role-Based Functional Testing

### 👤 B2C User (Mobile App)
| ID | Scenario | Expected Result | Status |
|----|----------|-----------------|--------|
| U1 | Register via OTP | SMS received, account created with USR role. | [ ] |
| U2 | Browse Events | Correct categories/cities show; featured items visible. | [ ] |
| U3 | Book Ticket (Capacity) | Seat selection (if applicable) or quantity selection works. | [ ] |
| U4 | Payment (Success) | Redirect to Chapa -> Return -> Ticket issued + SMS. | [ ] |
| U5 | Payment (Failure) | Seat/Capacity lock released; no ticket issued. | [ ] |
| U6 | Valid QR Display | QR shows signed data; screen brightness increases. | [ ] |
| U7 | Notifications | Received for confirmation, updates, and reminders. | [ ] |

### 🏢 Organizer (B2B Web Portal)
| ID | Scenario | Expected Result | Status |
|----|----------|-----------------|--------|
| O1 | Register Org | Application submitted; status "PENDING" in Admin. | [ ] |
| O2 | Create Event | Form submits with tiers, images, and policies. | [ ] |
| O3 | Sales Dashboard | Real-time counts match purchase logs perfectly. | [ ] |
| O4 | Promo Codes | Apply % or Fixed discount at checkout correctly. | [ ] |
| O5 | Export Reports | CSV/PDF downloads with correct sales breakdown. | [ ] |
| O6 | Cancel Event | Event hidden; ticket holders notified; tickets Invalid. | [ ] |

### 🛂 Gate Staff (Scanner App)
| ID | Scenario | Expected Result | Status |
|----|----------|-----------------|--------|
| S1 | Online Scan | Green screen; attendee name shown; status becomes USED. | [ ] |
| S2 | Duplicate Scan | Red screen; "ALERT: Double Entry" error shown. | [ ] |
| S3 | Offline Scan | Validates against local DB; stores log for sync. | [ ] |
| S4 | Manual Sync | Batch logs uploaded to server; status reconciled. | [ ] |
| S5 | Event Mismatch | Error shown if ticket belongs to a different event. | [ ] |

---

## 2. Security & Penetration Testing

- [ ] **JWT Hijacking:** Verify access tokens cannot be reused after expiry.
- [ ] **IDOR Check:** Ensure Users cannot view other users' tickets by changing UUID in URL.
- [ ] **Rate Limit Stress:** Trigger 20+ OTP requests; verify 429 "Too many requests" status.
- [ ] **Payment Spoofing:** Attempt to bypass payment by calling the `/callback` directly with fake data (Verify backend checks Chapa Signature).

---

## 3. Load Testing (Performance)

*Tool: k6*

### Scenario: Flash Sale (High Concurrency)
- **Target:** 500 concurrent users attempting to reserve the same tier.
- **Goal:** No "Over-booking" (Redis locks must remain atomic); < 500ms p95 latency.

### Scenario: Gate Entry (Scanning Pulse)
- **Target:** 50 validation requests per second per gate.
- **Goal:** Valid response < 100ms; No DB deadlock on `Ticket.update`.

---

## 4. Payment Scenario Matrix

| Scenario | Chapa Signal | Internal Action |
|----------|--------------|-----------------|
| User abandons | No webhook | Reclaim lock after 15 mins (Redis expire). |
| Success | Webhook: `success` | Issue Tickets + Sync Hub. |
| Timeout | Webhook delayed | Poll Chapa API every 10 mins (fallback worker). |
| Refund | Manual Trigger | Mark Ticket: `CANCELLED` -> Record Financial: `REFUNDED`. |

---

## 5. Pilot Phase (Event Simulation)

### Pilot 1: Small Cinema (50 Capacity)
- **Duration:** 1 Day
- **Focus:** User UI/UX, Payment speed, Gate Scanning.
- **Success Metric:** 100% of attendees scanned without manual list lookups.

### Pilot 2: Concert/Conference (500+ Capacity)
- **Duration:** 3-5 Days
- **Focus:** Load handling, Multi-gate performance, Live dashboard accuracy.
- **Success Metric:** Zero over-booking; Net Revenue matches Bank Settlement.
