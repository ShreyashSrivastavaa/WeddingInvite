# Architecture & Design Decisions

This document records architectural, technical, and domain decisions made during the development of RSVP Wedding Manager, following the format: Decision, Alternatives Considered, and Reason.

---

## 1. Monorepo Architecture with npm Workspaces

- **Decision**: Structure the codebase as an npm workspaces monorepo containing `apps/web` (React + Vite + Tailwind), `apps/api` (Node.js + Express + TypeScript + Prisma), and `packages/shared` (Zod schemas, DTOs, invariant checks, pure counting and status calculation logic).
- **Alternatives Considered**:
  - *Single combined fullstack app (e.g., Next.js)*: Heavier, more complex deployment and API decoupling; the prompt explicitly specified `apps/web` and `apps/api` with an Express backend serving the built SPA in production.
  - *Polyrepo (separate repositories)*: Increases friction when keeping DTOs, Zod schemas, and counting logic synchronized between API and client.
- **Reason**: Guarantees zero code drift for critical business rules (attendance counts, invariants, status derivation) by sharing `packages/shared` directly across frontend and backend.

---

## 2. Password Hashing Engine

- **Decision**: Use `@node-rs/argon2` (argon2id algorithm).
- **Alternatives Considered**:
  - `argon2` npm package: Frequently requires Python and Visual Studio C++ build tools on Windows, leading to brittle installs.
  - `bcrypt`: Older algorithm, less memory-hard than Argon2id, and spec recommends argon2id.
- **Reason**: `@node-rs/argon2` provides prebuilt native binaries for all major platforms (Windows x64, Linux, macOS) without requiring local C++ compilers while adhering to argon2id standards.

---

## 3. Database & Connection Management

- **Decision**: Utilize PostgreSQL (Prisma ORM) with local PostgreSQL 18.1 detected on localhost:5432 for development (`wedding_invite_dev`) and testing (`wedding_invite_test`), while supporting hosted providers (e.g., Neon) via `DATABASE_URL`.
- **Alternatives Considered**:
  - SQLite: Rejected because prompt mandates Prisma + PostgreSQL with real PostgreSQL features and transactions.
  - Mock database for testing: Rejected because prompt forbids mocking when real database is available.
- **Reason**: Guarantees full feature parity, transactional locking, composite keys, and cascade behavior matching production.

---

## 4. Single Source of Truth for Attendance and Status Logic

- **Decision**: All attendance counting (`confirmed`, `declined`, `awaiting`, `invited`), invariant enforcement (`confirmed + declined + awaiting = invited`), and status precedence logic reside exclusively in `packages/shared`.
- **Alternatives Considered**:
  - Re-implementing counting logic in React components: High risk of subtle calculation drift between UI and backend.
  - Database-only SQL queries/views: Harder to unit-test and share with client-side state previews.
- **Reason**: Single pure TypeScript implementation testable in pure unit tests without database overhead and directly importable by both `apps/api` and `apps/web`.

---

## 5. WhatsApp Click-to-Chat & Honest Statuses

- **Decision**: Implement WhatsApp click-to-chat (`wa.me/<E.164>?text=<encoded>`) as the default zero-credential messaging provider. Message logs store `PREPARED` when the link is generated/opened and `MARKED_SENT` when the organizer confirms "Mark as sent by you". Never fabricate `DELIVERED`, `READ`, or `SENT_BY_API` in click-to-chat mode.
- **Alternatives Considered**:
  - Unofficial WhatsApp web scrapers or browser extensions: Explicitly forbidden by Operating Rule 9.
  - Requiring Meta Cloud API credentials upfront: Would make the app unusable out-of-the-box for planners without verified Meta Business accounts.
- **Reason**: Full compliance with WhatsApp terms of service, zero barriers to immediate adoption, and 100% truthful data representation for organizers.

---

## 6. CSV Formula Injection Escaping and UTF-8 BOM

- **Decision**: Prefix every cell beginning with `=`, `+`, `-`, `@`, `\t`, or `\r` with a single quote (`'`), escape quotes, and prepend the UTF-8 Byte Order Mark (`\uFEFF`) to all generated CSV files.
- **Alternatives Considered**:
  - Stripping malicious characters: Corrupts legitimate Indian names or notes (e.g., `-` in hyphenated names or `+` in phone numbers).
  - Unsanitized exports: Leaves spreadsheet applications (Excel, LibreOffice) vulnerable to Remote Code Execution or DDE formula injection.
- **Reason**: The prepended single quote neutralizes spreadsheet formula evaluation while preserving all human-readable characters intact, and the BOM guarantees that Devanagari and regional scripts render properly in Microsoft Excel.

---

## 7. Concurrency Control and Idempotent RSVP Submissions

- **Decision**: Enforce optimistic concurrency control on guest and organizer RSVP submissions with an incrementing integer `version` field. When a submission provides a stale `expectedVersion`, return HTTP 409 Conflict with the current state.
- **Alternatives Considered**:
  - Last-write-wins without checks: Silently overwrites changes made concurrently by another family member or organizer.
  - Pessimistic row locking on read: Excessive lock contention on high-traffic RSVP links.
- **Reason**: Protects against double-submits, network retries, and concurrent edits from multiple family devices while providing a friendly "This RSVP was updated from another device" resolution flow.

---

## 8. Export Event Scoping & Default Event Fallback

- **Decision**: While all dashboard metrics and catering calculations are strictly event-scoped, if an export request omits `eventId`, the API automatically selects the wedding's primary event (ordered by `sortOrder` then `startsAt`).
- **Alternatives Considered**:
  - Strict 400 Bad Request if `eventId` query parameter is missing: Leads to brittle integrations and test failures when organizers trigger 1-click full-list exports.
  - Blended cross-event export: Forbidden by domain rules because distinct wedding events (Mehendi, Sangeet, Reception) have completely separate attendance lists.
- **Reason**: Seamless user experience for 1-click downloads while strictly maintaining domain-correct event scoping.

---

## 9. Mobile-First Guest Experience & Bilingual Support

- **Decision**: Build the guest RSVP flow as a lightweight, mobile-first responsive layout (360px-390px viewport target, >= 44px tap targets) with a zero-friction English/Hindi language toggle and Noto Sans Devanagari typography fallback.
- **Alternatives Considered**:
  - Heavy multi-language i18n libraries with dynamic bundle loading: Adds unnecessary network latency on mobile connections in India.
  - English-only invitation flow: Excludes elder relatives and Hindi-speaking family members.
- **Reason**: A lightweight dictionary-based translation structure allows instant toggle with zero network overhead, guaranteeing lightning-fast load times even on 3G/4G connections.

---

## 10. Privacy and Public Link Security

- **Decision**: Public invitation tokens are 24 cryptographically secure random bytes (`crypto.randomBytes(24).toString('base64url')`), indexed and unique. Public endpoints return strictly the minimum data required for that specific household (wedding title, couple names, events, household display name, current RSVP state). Never expose other guests, phone numbers, or organizer IDs. Responses set `X-Robots-Tag: noindex` and `Referrer-Policy: no-referrer`.
- **Alternatives Considered**:
  - Using sequential or predictable IDs in URLs: Allows malicious enumeration and scraping of wedding guest lists.
  - Embedding guest phone numbers or names in the link parameters: Leaks personal identifying information into browser histories, logs, and messaging previews.
- **Reason**: Maximum privacy for families and guests with zero risk of URL tampering or guest list harvesting.

