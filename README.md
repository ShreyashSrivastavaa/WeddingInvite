# RSVP Wedding Manager 💍

> **A WhatsApp-first Indian wedding guest management SaaS.**  
> Helping wedding planners and families collect reliable attendance data, track live confirmed headcounts and catering bounds, send personal invitations via WhatsApp Click-to-Chat, and export catering-ready spreadsheets.

---

## ⚡ Quick Start (< 10 Minutes Setup)

### Prerequisites
- **Node.js**: v20 or v22 LTS (recorded in `.nvmrc`)
- **PostgreSQL**: Local instance on port 5432 or a hosted database (e.g., [Neon](https://neon.tech))

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd WeddingInvite
npm install
```

### 2. Configure Environment Variables
Copy the example environment file and configure your database connection:
```bash
cp .env.example .env
```
Ensure your `DATABASE_URL` and `TEST_DATABASE_URL` point to your PostgreSQL instance:
```env
DATABASE_URL="postgresql://postgres@localhost:5432/wedding_invite_dev"
TEST_DATABASE_URL="postgresql://postgres@localhost:5432/wedding_invite_test"
SESSION_SECRET="super-secret-random-key-at-least-32-chars-long"
```

### 3. Run Migrations & Seed Sample Data
```bash
npm run db:migrate
npm run db:seed
```
*Tip*: You can also seed the deterministic 400-guest scenario:
```bash
npm run db:seed:scenario
```

### 4. Start Development Server
```bash
npm run dev
```
- Web Application: [http://localhost:5173](http://localhost:5173) (Vite dev server)
- API Backend: [http://localhost:3000](http://localhost:3000) (Express)
- **Demo Login**: `demo@wedding.com` / `DemoPassword123!` (or click "Demo Fill" on login page).

---

## 📦 Monorepo Architecture & Folder Map

```
WeddingInvite/
├── apps/
│   ├── api/                      # Node.js + Express + Prisma REST API
│   │   ├── prisma/               # Schema and database migrations
│   │   └── src/
│   │       ├── db/               # Prisma client & database seed scripts
│   │       ├── middleware/       # Auth, rate limiting, logging, validation
│   │       ├── routes/           # Auth, weddings, households, RSVPs, messaging
│   │       └── __tests__/        # API integration tests (Vitest + Supertest)
│   └── web/                      # React 19 + TypeScript + Vite + Tailwind CSS
│       └── src/
│           ├── components/       # UI layout, modals, drawers, charts
│           ├── pages/            # Dashboard, guests, send queue, public RSVP
│           └── api/              # TanStack Query client & API hooks
├── packages/
│   └── shared/                   # Shared TypeScript library
│       └── src/
│           ├── constants/        # System configs, default themes, product name
│           ├── schemas/          # Zod validation schemas & TypeScript DTOs
│           └── logic/            # Pure attendance counting, status precedence, phone
├── docs/
│   ├── DECISIONS.md              # Architectural decision log (ADR)
│   ├── DEPLOYMENT.md             # Production single-service deployment guide
│   ├── TESTING.md                # Comprehensive test strategy & execution guide
│   └── WHATSAPP.md               # WhatsApp messaging architecture & Cloud API roadmap
├── e2e/                          # Playwright end-to-end tests (Journeys A-G)
├── docker-compose.yml            # Local PostgreSQL container configuration
└── package.json                  # Root npm workspaces configuration
```

---

## 🛠️ Available Scripts

| Script | Command Description |
| :--- | :--- |
| `npm run dev` | Runs both API and Vite frontend concurrently |
| `npm run build` | Compiles `@rsvp/shared`, builds Vite web bundle, and compiles API TypeScript |
| `npm start` | Launches production server (Express serving API and built SPA) |
| `npm test` | Runs 57 Vitest unit & API integration tests |
| `npm run test:e2e` | Runs Playwright E2E journeys (Journeys A-G) |
| `npm run typecheck`| Runs TypeScript checks across all 3 workspaces |
| `npm run lint` | Runs ESLint across the codebase |
| `npm run db:migrate`| Applies Prisma database migrations |
| `npm run db:seed` | Populates demo wedding with 40 realistic households |
| `npm run db:seed:scenario` | Seeds deterministic 400 invited / 280 confirmed / 30 declined / 90 awaiting scenario |

---

## 💎 Core Principles & Features (P0 Verified)

- **Honest Attendance Invariant**: `confirmed + declined + awaiting = invited`. Unconfirmed guests are **never** labeled as confirmed, and attendance forecasts are explicitly disclaimed.
- **WhatsApp Click-to-Chat**: Zero-credential direct messaging via `wa.me` links with honest organizer statuses (`PREPARED`, `MARKED_SENT`).
- **Mobile-First Public RSVP**: Accessible 360px-390px responsive guest flow with bilingual English/Hindi toggle, Devanagari typography, and 1-tap reminder opt-out.
- **Enterprise-Grade Privacy & Security**:
  - Argon2id password hashing with sliding session cookies.
  - Cryptographic 24-byte random invitation tokens.
  - Strict ownership isolation (`requireOwnedWedding` returns 404 for cross-organizer tampering).
  - Formula injection sanitization on all CSV exports (`=, +, -, @, \t, \r` escaped with single quote).
- **Catering Planning Bounds**: Live tracking of *Minimum Certain* (confirmed) vs *Maximum Possible* (confirmed + awaiting) to help families order food accurately.

---

## 📖 Documentation

- [Decisions Log (docs/DECISIONS.md)](./docs/DECISIONS.md)
- [Deployment Guide (docs/DEPLOYMENT.md)](./docs/DEPLOYMENT.md)
- [Testing Architecture (docs/TESTING.md)](./docs/TESTING.md)
- [WhatsApp Architecture & Cloud API Roadmap (docs/WHATSAPP.md)](./docs/WHATSAPP.md)
