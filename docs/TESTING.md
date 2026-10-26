# Testing Strategy & Automated Test Suite

This document describes the automated testing architecture of **RSVP Wedding Manager**, detailing test organization, database isolation, scenario verification, and execution instructions.

---

## 1. Test Suite Overview

The project maintains 100% automated coverage across three distinct testing tiers:

```
┌─────────────────────────────────────────────────────────────┐
│                   Playwright E2E Tests                      │
│             (Journeys A-G, Mobile Viewport)                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│              API Integration Tests (Vitest)                 │
│      (Real Postgres Database, Transactions, 404 Isolation)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                  Unit Tests (Vitest)                        │
│   (Packages/Shared: Invariants, Counting, Phone, Security)  │
└─────────────────────────────────────────────────────────────┘
```

Total Automated Tests: **57 Vitest Tests** across 12 suites + **7 Playwright E2E Journeys**.

---

## 2. Unit Testing (`packages/shared`)

Pure business logic resides exclusively in `packages/shared` and is tested in isolation without network or database dependencies:

- **`attendance.test.ts`**:
  - Invariant assertion: `confirmed + declined + awaiting = invited`.
  - Partial household confirmations (e.g., household invited for 4 confirms 3, producing 3 confirmed and 1 declined).
  - Dietary aggregations per event.
  - Arrival distribution counts across clock-derived windows.
- **`status.test.ts`**:
  - Full precedence evaluation (1: Responded, 2: Needs Follow-Up, 3: Pending, 4: Invited, 5: Not Contacted).
  - Plain-language reason generation for follow-up flags.
- **`phone.test.ts`**:
  - E.164 normalization with default country `+91` (India).
  - Validates inputs such as `98765 43210`, `+91 98765-43210`, `09876543210`.
  - Rejection of invalid inputs with descriptive error messages.
- **`csv-security.test.ts`**:
  - Neutralization of spreadsheet formula injection characters (`=`, `+`, `-`, `@`, `\t`, `\r`) with single quote prefixing.
  - UTF-8 Byte Order Mark (`\uFEFF`) verification for Excel compatibility.
- **`template.test.ts`**:
  - Placeholder replacement and missing field detection.

---

## 3. Integration Testing (`apps/api`)

Integration tests run against a real, dedicated PostgreSQL database defined by `TEST_DATABASE_URL`:

- **Database Isolation Strategy**:
  - Tests run sequentially (`fileParallelism: false`) to eliminate database deadlocks.
  - Before each test suite, `clearTestDatabase()` executes an atomic multi-table `TRUNCATE TABLE ... CASCADE` command.
- **Test Suites**:
  - **`auth.test.ts`**: Registration, Argon2id hashing, session creation, sliding session renewal, password change, generic failure responses.
  - **`wedding-event.test.ts`**: Wedding CRUD, multi-event management, chronological sort order, deadline warnings.
  - **`household-import.test.ts`**: CSV parsing, 1 MB limit, BOM stripping, Hindi Devanagari character preservation, duplicate phone warnings, transaction safety.
  - **`rsvp-scenarios.test.ts`**:
    - **Scenario 1**: 400 invited / 280 confirmed / 30 declined / 90 awaiting.
    - **Scenario 2**: Household invited for 4 confirms 3 (confirmed = 3, declined = 1).
    - **Scenario 3**: Household updates 3 -> 2 (confirmed decreases by 1, append-only revisions recorded, idempotent re-submissions).
    - **Scenario 4**: Concurrent double-submit race condition handling.
    - **Scenario 5**: Token security (invalid, revoked, and rotated tokens return safe 404/expired page without leaking metadata).
  - **`isolation.test.ts`**: Strict multi-tenant authorization testing. Asserts that Organizer B receives HTTP 404 for every single resource owned by Organizer A across weddings, events, households, invitations, and exports.
  - **`exports.test.ts`**: Guest list, catering summary, and attendee list CSV exports with formula escaping and non-forecast disclaimers.
  - **`messaging.test.ts`**: WhatsApp click-to-chat message log lifecycle (`PREPARED`, `MARKED_SENT`).

---

## 4. End-to-End Testing (`e2e/journeys.spec.ts`)

Playwright tests simulate complete user workflows in a headless browser:

- **Journey A**: Register new organizer, create wedding ("Aarav & Ishita"), configure multi-event schedule (Mehendi, Sangeet, Reception).
- **Journey B**: Add guest ("Kapoor Family", invited 4), generate invitation link, verify generated WhatsApp URL structure (`https://wa.me/919876543210?text=...`).
- **Journey C**: Guest opens RSVP link in a **390px mobile viewport**, selects 3 attendees, specifies dietary preferences, selects arrival window, and confirms submission.
- **Journey D**: Organizer dashboard dynamically reflects guest attendance in real time: Confirmed = 3, Declined = 1, Awaiting = 0, with catering bounds.
- **Journey E**: Add second household, filter by "Not Contacted", enter the WhatsApp Send Queue, toggle consent acknowledgment, and click "Mark as Sent by You".
- **Journey F**: Export guest list and catering summary CSVs; verify UTF-8 BOM, sanitized cells, and prominent notice that pending guests are not counted in confirmed attendance.
- **Journey G**: Cross-organizer security test. Organizer B attempts to access Organizer A's wedding URL and receives HTTP 404 without data disclosure.

---

## 5. Execution Commands

### Run All Unit & Integration Tests (Vitest)
```bash
npm test
```

### Run Playwright E2E Journeys
```bash
npx playwright test
```

### Run Playwright with Interactive UI
```bash
npx playwright test --ui
```

### Run Type Checking
```bash
npm run typecheck
```
