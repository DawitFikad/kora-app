# ET-Ticket Financial Architecture Blueprint

## 1) Target Vision
Build ET-Ticket as a trusted multi-provider ticket-finance platform where:
- customer payments are captured through Telebirr and Chapa
- funds are tracked in a platform escrow ledger
- platform commission is recognized transparently
- organizer earnings are released to organizer wallets by policy
- organizer payouts are executed to bank/mobile channels with full auditability

This creates a structure comparable to global ticketing systems: clear settlement rules, strong controls, and event-level traceability.

---

## 2) Canonical Money Flow

Rule: No direct user-to-organizer settlement. All customer payments are first treated as platform escrow inflow, then split into platform fee and organizer liability.

```text
Mobile App / Web
        |
        v
Backend API
        |
        v
Payment Gateway (Telebirr / Chapa)
        |
        v
Platform Escrow Account
        |
        +--> Platform Commission Ledger
        |
        v
Organizer Wallet (Pending -> Available)
        |
        v
Organizer Bank/Mobile Payout
```

### Flow States (recommended)
1. INITIATED: checkout created
2. AUTHORIZED: provider authorizes payment (if supported)
3. CAPTURED: payment confirmed
4. SETTLED: escrow settlement confirmed
5. RELEASED: organizer amount moved from pending to available
6. PAID_OUT: payout sent to organizer
7. REFUNDED/DISPUTED: reversal path

---

## 3) Core Financial Accounts (logical)
Use account-style thinking even if funds are physically in one bank account.

1. Escrow Clearing Account
- represents all successfully captured customer funds not yet fully distributed

2. Platform Revenue Account
- platform commission and convenience fees recognized as ET-Ticket income

3. Organizer Liability Account
- amount owed by ET-Ticket to organizers until payout

4. Refund Reserve / Chargeback Reserve
- optional risk buffer for disputes and delayed reversals

---

## 4) ET-Ticket Ledger Model (mapped to existing backend)
Your current backend already has core primitives:
- purchase status tracking
- financial transactions
- organizer wallet balances (pending/available)
- wallet ledger entries
- payout batches

### Recommended mapping
- Purchase success -> create TICKET_PURCHASE financial transaction
- Split values at settlement:
  - grossAmount = customer paid amount
  - platformFee = commission + convenience fee
  - organizerNet = grossAmount - platformFee - tax/withholding (if applicable)
- Wallet movement:
  - pendingBalance += organizerNet at CAPTURED/SETTLED
  - availableBalance += organizerNet only after release policy is met
- Payout approval:
  - availableBalance -= payoutAmount
  - totalWithdrawn += payoutAmount
  - write ORGANIZER_PAYOUT ledger entry

---

## 5) Settlement and Release Policy (global-grade behavior)
Define a formal release policy by event and risk profile.

### Baseline policy
- T+1 or T+2 after event end: move pending -> available
- hold extension for high-risk events (new organizer, abnormal refund ratio, fraud signals)
- immediate hold on dispute/chargeback alerts

### Payout triggers (enforced)
- Event completed
- Refund window closed (configurable via `financial.refund_window_hours`, default 48)
- Fraud checks passed (no unresolved HIGH/CRITICAL fraud alerts)

### Why this matters
- protects cashflow and limits negative wallet conditions
- prevents paying out money that may be refunded or charged back

---

## 6) Provider Abstraction Standard
Standardize all gateways under one internal contract.

### Internal provider interface
- initializePayment()
- verifyPayment()
- handleWebhook()
- reconcileTransaction()
- refundPayment()
- payoutTransfer() (if provider supports B2B/B2C)

### Provider-specific notes
- Telebirr: direct channel + potential B2C/B2B payout use
- Chapa: aggregator for multiple rails

This allows adding/removing gateways without changing business finance logic.

---

## 7) Escrow and Reconciliation Controls

### Daily reconciliation (must have)
1. Provider report vs ET-Ticket CAPTURED transactions
2. Bank escrow balance vs internal escrow clearing balance
3. Wallet liabilities vs pending + available balances
4. Payout batches vs successful transfer confirmations

### Automated anomaly flags
- CAPTURED in provider but missing in ET-Ticket
- duplicate webhook/callback for same paymentRef
- payout marked PAID_OUT without transfer reference
- negative organizer available balance after refunds

---

## 8) Refund and Dispute Lifecycle

### Refund rule model
- pre-event refund windows by organizer policy + platform minimum standard
- partial/full refund support
- refund fee handling policy (platform absorbs or organizer absorbs)

### Accounting effects
- create REFUND financial transaction
- reverse organizer liability from available first, then pending
- if insufficient balance, mark organizer debt/negative exposure

### Disputes
- dispute reserve can delay release and payouts for affected organizer/events
- track reason codes and resolution SLA

---

## 9) Payout Architecture

### Payout pipeline
1. Organizer requests payout (or scheduled auto-payout)
2. Eligibility engine validates:
- KYC complete
- availableBalance >= threshold
- no compliance/risk blocks
3. Batch created (INITIATED)
4. Approval workflow (manual/admin or policy-based)
5. Transfer execution (bank/mobile/manual)
6. Status updates + ledger entry + notification

### Operational recommendations
- support both scheduled payouts (weekly) and on-demand payouts
- add payout reference IDs from rails for full audit trace
- add retry + idempotency keys for payout execution

---

## 10) Security and Compliance Baseline

1. Idempotency
- enforce unique idempotency keys on payment init, verify, webhook, payout approval

2. Signature validation
- verify gateway signatures for all webhooks

3. Least privilege
- payout approvals restricted to finance/admin roles with audit log

4. Immutable financial audit trail
- never hard-delete financial rows
- append correction entries instead of overwrite

5. Data governance
- encrypt sensitive payout details
- redact PII in operational logs

---

## 11) KPI Dashboard (what investors/operations care about)

1. GMV (daily/weekly/monthly)
2. Platform take rate (%)
3. Escrow balance and organizer liability
4. Pending-to-available release lag
5. Payout success rate and payout SLA
6. Refund ratio and dispute ratio
7. Net cash position (escrow - liabilities)

---

## 12) Immediate Implementation Plan for ET-Ticket

### Phase 1 (stabilize current stack)
1. Enforce strict state transitions for FinancialStatus and PaymentStatus
2. Make payment verification and webhook processing idempotent end-to-end
3. Add daily reconciliation job and mismatch report endpoint

### Proven integration guardrails (from existing ET-Ticket incidents)
1. Always normalize and validate webhook signatures across provider header variants.
2. Treat unknown payment references in webhook callbacks as non-fatal (accepted/ignored), not server errors.
3. For local Telebirr development, keep deterministic test mode switchable to avoid blocking frontend/mobile QA.
4. Ensure runtime env resolution is deterministic in compiled/dist scripts so payment keys are loaded from the intended root environment.

### Phase 2 (escrow-grade controls)
1. Introduce explicit release job: pending -> available by event/date/risk rules
2. Add payout transfer reference tracking and retry policy
3. Add organizer debt handling for refunds after payout

### Phase 3 (global readiness)
1. Add second aggregator or direct bank rail under the same provider abstraction (if needed)
2. Add multi-currency architecture boundaries (if expansion planned)
3. Add compliance modules: KYC level checks, sanctions screening hooks, payout limits

---

## 13) Minimum API/Service Boundaries

- Payment Service: initialize/verify/webhook/reconcile
- Financial Service: ledger posting, split logic, release scheduler
- Payout Service: request/approve/execute/retry/reverse
- Risk Service: fraud scoring, reserve rules, payout blocks
- Reconciliation Service: provider-bank-ledger consistency checks

---

## 14) Decision Matrix (recommended defaults)

1. Commission model:
- HYBRID (fixed + %) for small tickets, percentage-only for larger tickets

2. Release policy:
- default T+2 post-event, configurable per organizer risk class

3. Payout policy:
- weekly automatic payouts + optional manual payout above threshold

4. Risk reserve:
- enable reserve for new organizers for first N events

5. Refund precedence:
- consume available balance first, then pending, then debt flag

---

## 15) Recommendation: Move Beyond Logical Escrow

The current ET-Ticket backend is already operating a logical escrow model:
- customer payments are captured and posted into `FinancialTransaction`
- organizer earnings are held in `OrganizerWallet.pendingBalance`
- release into `availableBalance` happens only after event completion and policy checks

This is a strong internal control model, but it is not the same as a real segregated cash structure.

### Recommended target
ET-Ticket should adopt a dedicated platform-controlled settlement account for customer funds. This does not have to start as a formal bank escrow product on day one, but it must be operationally segregated from the company operating account.

### Preferred rollout
1. Keep the current logical escrow ledger as the internal source of truth.
2. Open one dedicated settlement account used only for incoming customer payment settlements and organizer payouts.
3. Configure Telebirr and Chapa settlement destinations to that dedicated account.
4. Reconcile provider settlements, bank movements, and internal ledger balances daily.
5. Upgrade later to a regulated escrow or safeguarded-client-funds structure when transaction volume, compliance, or investor diligence requires it.

### Why this is the right path
- prevents mixing customer funds with operating cash
- makes reconciliation materially easier
- improves auditability for organizer liabilities and payout operations
- strengthens investor, auditor, and banking credibility
- reduces operational risk during refunds, disputes, and payout spikes

### Minimum additional system components needed
1. `SettlementAccount`
- one row per real bank or safeguarded settlement account
- fields: provider/bank name, account label, currency, account type, active status, last reconciled balance, last reconciled at

2. `SettlementEntry`
- records actual inbound and outbound cash movements on the settlement account
- examples: provider settlement credit, bank fee debit, organizer payout debit, manual adjustment

3. `ReconciliationRun`
- stores each reconciliation execution and whether provider totals, bank cash, and internal ledger balances matched

4. `ReconciliationMismatch`
- stores unmatched or suspicious items for investigation
- examples: provider shows captured payment but no bank credit, payout marked paid without transfer reference

5. Payout transfer references
- every real payout should store rail/provider reference IDs, transfer status, failure reason, and retry count

### Recommendation for ET-Ticket now
For the current stage, use a hybrid approach:
- logical escrow in the database remains mandatory
- real cash segregation at the bank/provider level should be added next
- legal or regulated escrow can come after product-market fit and transaction scale justify the extra compliance cost

This gives ET-Ticket a model that is practical now and still credible under due diligence.

---

## 16) Professional Positioning Statement
ET-Ticket operates a controlled escrow-based financial architecture with multi-gateway payment orchestration, deterministic revenue split, policy-driven organizer settlement, and auditable payout operations. This model supports scale, compliance readiness, and investor-grade financial reporting.
