# Notification Event Types Contract

This document defines the canonical notification event types, trigger rules, channel strategy, and payload metadata for ET-Ticket's phone-first notification system.

## Phone-First Channel Policy

- Primary engagement channels: `PUSH` + in-app (`recipient: "APP"`)
- Phone-first critical delivery: `SMS` is included for critical user-impacting events
- Email: optional fallback when user email exists
- If email is missing and email channel is attempted, an `EMAIL_REQUEST` in-app prompt may be generated (throttled)

## Notification Log Shape

Stored in `NotificationLog` with these key fields:

- `id`
- `userId`
- `title`
- `message` (alias for client contract)
- `content` (legacy/full text)
- `type`
- `referenceId`
- `isRead`
- `createdAt`
- `channel` (`SMS | PUSH | EMAIL`)
- `metadata` (event-specific payload)

## Canonical Event Types

## `TICKET_CONFIRMATION`

- Trigger: successful ticket purchase / issuance
- Channels: `PUSH`, `SMS`, `EMAIL` (if available) + in-app
- `referenceId`: purchase id
- Required metadata:
  - `eventId`
  - `purchaseId`
  - `eventName`
  - `eventDateTime`
  - `eventVenue`
  - `ticketCodes`
  - `ticketLink`

## `EVENT_REMINDER`

- Trigger: event approaching in configured windows
- Schedule windows:
  - 72h before
  - 24h before
  - 2h before
- Channels: `PUSH`, `EMAIL` (if available) + in-app
- `referenceId`: composite `"<eventId>-<windowHours>"`
- Required metadata:
  - `eventId`
  - `reminderWindowHours`

## `EVENT_UPDATE`

- Trigger: organizer changes date/time/venue/important details
- Channels: `PUSH`, `EMAIL` (if available) + in-app
- `referenceId`: event id
- Required metadata:
  - `eventId` (recommended)

## `NEW_EVENT`

- Trigger: newly created event matches user city/category profile
- Match rules:
  - city
  - category/interests
  - behavior-based history can also contribute
- Channels: `PUSH` + in-app
- `referenceId`: event id
- Required metadata:
  - `eventId`
  - `cityId`
  - `categoryId`
  - `cityName` (optional)
  - `category` (optional)

## `EVENT_CANCELLED`

- Trigger: event cancelled (organizer/admin flow)
- Channels: `PUSH`, `SMS`, `EMAIL` (if available) + in-app
- `referenceId`: event id
- Required metadata:
  - `eventId` (recommended)

## `EVENT_RATED_THANKS`

- Trigger: user rates an event
- Channels:
  - preferred: `EMAIL`
  - fallback/optional: `PUSH` + in-app
- `referenceId`: event id
- Required metadata:
  - none

## `PERSONALIZED_EVENT`

- Trigger: weekly personalized recommendation job
- Inputs used:
  - past attended events
  - profile interests/categories
  - profile location/city
- Channels: `PUSH` + in-app
- `referenceId`: suggested event id
- Required metadata:
  - `eventId`
  - `cityId`
  - `categoryId`
  - `interests` (optional)

## `EMAIL_REQUEST`

- Trigger: user has no email and system needs backup communication channel
- Channels: in-app (`PUSH` log with `recipient: "APP"`)
- `referenceId`: `"profile"`
- Required metadata:
  - `type: EMAIL_REQUEST`
  - `referenceId: profile`

## `STAFF_INVITATION`

- Trigger: organizer invites a user to event staff
- Channels: `PUSH`, `EMAIL` (if available), plus SMS invitation code flow
- `referenceId`: invitation id
- Required metadata:
  - `invitationId`
  - `role`
  - `organizerId`
  - `inviteCode`
  - `eventId` (when provided)
  - `eventName` (when provided)
  - `actionPath` (e.g. `/profile`)
  - `actions` (e.g. `ACCEPT`, `DECLINE`)

## Throttling and Critical Delivery

- Non-critical events can be deduplicated/throttled (`dedupeMinutes`)
- Critical event types should always attempt delivery:
  - `TICKET_CONFIRMATION`
  - `EVENT_CANCELLED`
  - `STAFF_INVITATION`

## Deep-Link Expectations (Mobile)

Notification tap routing should resolve by priority:

1. `metadata.actionPath` (if valid route)
2. semantic `type`
3. `metadata.eventId`
4. parsed `referenceId`
5. fallback route (`/home`)

Common routes:

- `/my-tickets` for ticket confirmations
- `/event/:id` for event-linked notifications
- `/profile` for staff invitation actions
