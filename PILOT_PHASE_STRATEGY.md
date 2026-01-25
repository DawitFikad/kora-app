# 🎯 ET-Ticket Pilot Phase Strategy

Scaling from development to launch requires a staged pilot to mitigate operational risk.

## Phase 1: Internal "Dark Launch" (7 Days)
*   **Goal:** Verify hardware and staff workflows in a controlled environment.
*   **Participants:** Internal team members.
*   **Actions:**
    *   Deploy Backend to Production Staging (AWS/DigitalOcean).
    *   Initialize "ET-Ticket Internal" event (Capacity: 20).
    *   Distribute Android APKs to test devices.
    *   Perform end-to-end "Buy-Scan-Payout" cycle using test payment keys.

## Phase 2: Cinema Pilot (Live B2B Test)
*   **Location:** 1 Selected Cinema (Addis Ababa).
*   **Goal:** Multi-tier validation and real payment processing.
*   **Actions:**
    *   Setup "Cinema Hall 1" with Seat Map.
    *   Train 2 gate staff agents on scanning procedures (Online/Offline).
    *   Onboard Cinema Manager to the Organizer Dashboard.
    *   Launch "Limited Public Access": Only 10% of seats sold via app for 3 days.

## Phase 3: Major Event Pilot (Stress Test)
*   **Location:** Music Concert or Corporate Conference (500+ capacity).
*   **Goal:** High-concurrency entry and financial settlement.
*   **Actions:**
    *   Enable multiple scanner devices at 3 entrance gates.
    *   Monitor Live Entry Metrics in the Organizer Dashboard.
    *   Verify SMS delivery speed under high network congestion.
    *   Perform complete payout settlement within 24 hours of event finish.

---

## 🚦 Go/No-Go Checklist for Full Launch

| Milestone | Requirement | Status |
|-----------|-------------|--------|
| **Stability** | 99.9% API Uptime over 14 days. | [ ] |
| **Integrity** | 0 over-booked seats across all pilots. | [ ] |
| **Financials** | Bank statements match Platform Net Revenue totals. | [ ] |
| **Staff UX** | Average scan time per person < 2 seconds. | [ ] |
| **Security** | Zero unauthorized data access incidents. | [ ] |

---

## 📈 Monitoring & Feedback Loop
- **Sentry/LogRocket:** Track mobile app crashes.
- **WhatsApp Support Group:** Real-time feedback from gate staff.
- **In-App Survey:** Short "Rate your experience" for users after scanning.
