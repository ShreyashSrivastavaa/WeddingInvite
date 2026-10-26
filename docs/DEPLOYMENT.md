# Deployment Guide

This guide details how to deploy **RSVP Wedding Manager** to production as a unified, cost-effective single-service application.

---

## 1. Recommended Production Architecture

The application is structured for simple and robust production deployment:
- **Architecture**: A single Node.js service where Express serves both the REST API endpoints (`/api/*`) and the static production build of the React Single Page App (`apps/web/dist`) on the same origin.
- **Database**: Managed PostgreSQL (such as **Neon**, Supabase, or AWS RDS).
- **Hosting Platform**: PaaS web service (such as **Render**, Fly.io, Railway, or Heroku).
- **Domain & SSL**: Automatic HTTPS termination provided by the PaaS or Cloudflare.

---

## 2. Environment Variables Specification

Configure the following environment variables in your PaaS dashboard:

### Required Variables
| Variable | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment mode | `production` |
| `PORT` | Listening port assigned by host | `3000` (or host assigned `$PORT`) |
| `APP_URL` | Canonical public URL of the application | `https://rsvp.yourdomain.com` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@ep-cool-db.neon.tech/neondb?sslmode=require` |
| `SESSION_SECRET` | 32+ character random cryptographic secret | e.g. `openssl rand -hex 32` |
| `TRUST_PROXY` | Number of reverse proxies (for secure cookies) | `1` |
| `CORS_ORIGIN` | Allowed cross-origin sources (if any) | `https://rsvp.yourdomain.com` |

### Optional / Feature-Flagged Variables
| Variable | Default State | Description |
| :--- | :--- | :--- |
| `EMAIL_PROVIDER_API_KEY` | Unconfigured | If empty, password reset UI is cleanly hidden. When provided, enables email password recovery. |
| `WHATSAPP_CLOUD_API_TOKEN` | Unconfigured | If empty, the app defaults to zero-credential WhatsApp click-to-chat. |
| `WHATSAPP_CLOUD_PHONE_NUMBER_ID`| Unconfigured | Meta Phone Number ID for Cloud API. |
| `WHATSAPP_CLOUD_WEBHOOK_VERIFY_TOKEN` | Unconfigured | Webhook verification token for Meta status events. |
| `STORAGE_ADAPTER` | Unconfigured | If empty, cover image upload is cleanly hidden. |

---

## 3. Step-by-Step Deployment Walkthrough (e.g., Render + Neon)

### Step 1: Provision Database on Neon
1. Create a free PostgreSQL project at [neon.tech](https://neon.tech).
2. Copy the pooled connection string (with `?sslmode=require`).
3. Set this as `DATABASE_URL` in your hosting environment.

### Step 2: Configure Web Service on Render
1. Connect your repository to Render as a **Web Service**.
2. Select runtime: **Node**.
3. Set the following build and start commands:
   - **Build Command**:
     ```bash
     npm ci && npm run build
     ```
   - **Release Command** (runs before new container receives traffic):
     ```bash
     npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
4. Configure the required environment variables listed in Section 2.
5. Set Health Check path:
   ```
   /api/health
   ```

---

## 4. Key Production Considerations

### Reverse Proxies & Secure Cookies
When deployed behind an SSL-terminating reverse proxy (Cloudflare, Render, AWS ALB), Express must be informed that the connection is secure to allow `Secure` session cookies to be saved in browsers. This is controlled by:
```ts
app.set('trust proxy', Number(env.TRUST_PROXY || 1));
```
With `TRUST_PROXY=1`, the cookie is set with `Secure: true`, `HttpOnly: true`, and `SameSite: 'lax'`.

### Zero-Downtime Database Migrations
Always run Prisma migrations during the release phase using `prisma migrate deploy` rather than `prisma migrate dev`. `migrate deploy` executes only pending committed migrations safely without prompting for interaction or resetting data.

### Cold Starts & Free Tier Caveats
- Free tiers on services like Render spin down after 15 minutes of inactivity. When a guest opens their RSVP link, a cold start can cause an initial 30-50 second delay. For real weddings, a low-cost paid instance ($7/month) is strongly recommended to guarantee instant loading.
- Verify Neon compute limits and storage quotas on their current pricing page to ensure sufficient capacity for multi-event guest lists.

---

## 5. Third-Party Services & Cost Transparency

RSVP Wedding Manager does **not** mandate any paid subscription or credit card to operate:
- **WhatsApp**: Click-to-chat (`wa.me`) is 100% free and requires zero credentials.
- **Hosting & Database**: Fully compatible with free tiers (Neon, Render, Fly.io).
- **External Paid Upgrades (Optional)**:
  - Meta WhatsApp Cloud API (per-conversation pricing charged directly by Meta).
  - Transactional Email (Resend / SendGrid / Postmark for password reset emails).
  - S3 / Cloudflare R2 bucket for custom cover image uploads.
