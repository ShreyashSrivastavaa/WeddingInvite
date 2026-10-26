# WhatsApp Integration Guide

This document details the WhatsApp messaging architecture of **RSVP Wedding Manager**, covering the default zero-credential **Click-to-Chat** implementation, honest status tracking, privacy guardrails, and the technical specification for transitioning to the **Meta WhatsApp Cloud API**.

---

## 1. Zero-Credential WhatsApp Click-to-Chat (Default Implementation)

To allow wedding planners and families to begin sending invitations and reminders immediately without complex business verification or cloud accounts, RSVP Wedding Manager uses standard WhatsApp Click-to-Chat deep links (`wa.me`).

### How It Works
1. **URL Construction**:
   ```
   https://wa.me/<E.164-digits-without-plus>?text=<URL-encoded-message>
   ```
   - Phone numbers are validated and normalized to E.164 standard using `libphonenumber-js` (default country: India, `+91`).
   - The message body is constructed from the wedding's active template with placeholders (`{guest_name}`, `{couple_names}`, `{event_name}`, `{date}`, `{venue}`, `{deadline}`, `{rsvp_link}`).
   - Newlines, emojis, Devanagari text, and punctuation are safely encoded with standard URI percent-encoding.
2. **User Experience**:
   - The organizer navigates to the **Send Queue** or clicks **WhatsApp** on any guest card/row.
   - Clicking **Open WhatsApp** opens WhatsApp Web (on desktop) or the native WhatsApp app (on mobile) with the personalized invitation prefilled in the chat box.

---

## 2. Honest Statuses & Philosophy

In click-to-chat mode, browser sandboxes prevent any web application from detecting whether the user actually pressed "Send" inside WhatsApp. Fabricating delivery statuses or claiming messages were "Delivered" without cryptographic proof misleads wedding planners.

RSVP Wedding Manager strictly adheres to **honest statuses**:

| Status | Click-to-Chat Mode | Meaning & UI Copy |
| :--- | :--- | :--- |
| `PREPARED` | ✅ Supported | The organizer clicked "Open WhatsApp". The message was generated and prefilled, but sending is unconfirmed. |
| `MARKED_SENT` | ✅ Supported | The organizer explicitly confirmed "I sent it" via the UI. Copy displays: *"Marked as sent by you"*. |
| `DELIVERED` | ❌ Never produced | Can **ONLY** be produced by an official webhook from the Meta Cloud API. |
| `READ` | ❌ Never produced | Can **ONLY** be produced by an official webhook from the Meta Cloud API. |
| `SENT_BY_API` | ❌ Never produced | Can **ONLY** be produced when dispatched via HTTP to Meta's Cloud API. |
| `FAILED` | ❌ Never produced | Reserved for API dispatch or webhook failure events. |

---

## 3. Reminders & Guardrails

### Guardrails Enforced in MVP:
1. **Opt-Out Enforcement (`doNotContact`)**:
   - Guests can opt out directly from their personal mobile RSVP page via a one-tap confirmation link (*"Please don't send me reminders"*).
   - Organizers can also manually toggle `doNotContact` in the Guest Drawer.
   - Households marked `doNotContact` are **strictly excluded** from the Send Queue and reminder lists with an explanatory badge.
2. **Frequency Cap Warning**:
   - If a reminder was marked sent to a household within the last 48 hours, the Send Queue displays a visible warning to prevent annoying guests.
3. **Organizer Ethical Acknowledgement**:
   - Before launching the Send Queue for any wedding, the organizer must acknowledge a one-time consent confirmation: *"I confirm these guests expect to hear from me about this wedding."*
4. **Transparent Opt-Out Copy**:
   - All seeded reminder templates include natural opt-out instructions: *"Reply STOP if you'd rather not get reminders"*. When an organizer receives a STOP reply on WhatsApp, they mark the household as `doNotContact` in the app.

---

## 4. WhatsApp Cloud API (Future Roadmap & Provider Stub)

RSVP Wedding Manager includes a feature-flagged provider abstraction (`MessagingProvider` interface with `ClickToChatProvider` and `WhatsAppCloudProvider`). The app runs completely out of the box with zero credentials when none are provided.

### Environment Variables for Cloud API
When enabling the official Meta WhatsApp Cloud API, configure the following variables in `.env`:

```env
# Optional WhatsApp Cloud API Credentials
WHATSAPP_CLOUD_API_TOKEN="EAA..."
WHATSAPP_CLOUD_PHONE_NUMBER_ID="10065..."
WHATSAPP_CLOUD_WEBHOOK_VERIFY_TOKEN="my_webhook_secret_verify_token_32char"
```

> **Note**: If any of these variables are empty or omitted, the application transparently falls back to `ClickToChatProvider`.

### Requirements for Meta Production Cloud API
To transition from click-to-chat to automated cloud sending, the business must complete the following Meta requirements:
1. **Meta Business Portfolio & Verification**:
   - Register a Meta for Developers account and create an app with the **WhatsApp** product.
   - Complete official Meta Business Verification (submitting business registration and tax documents).
2. **WhatsApp Business Account (WABA)**:
   - Configure a WABA and attach a dedicated, clean phone number that is NOT currently registered to personal or standard WhatsApp Business apps.
   - Generate a permanent System User Access Token with `whatsapp_business_messaging` permissions.
3. **Template Approval**:
   - Meta requires pre-approved message templates for all outbound messages outside the 24-hour customer service window.
   - Wedding invitations are typically categorized as **Utility** or **Marketing** templates depending on phrasing.
   - Templates must include explicit opt-in verification and opt-out variables.
4. **Webhook Verification & Payload Hardening**:
   - The API must expose an HTTPS webhook endpoint (`/api/webhooks/whatsapp`).
   - Webhook setup requires handling Meta's challenge verification (`hub.mode`, `hub.challenge`, `hub.verify_token`).
   - All inbound delivery receipts (`sent`, `delivered`, `read`, `failed`) must be cryptographically validated using HMAC SHA-256 against `X-Hub-Signature-256` using the Meta App Secret.
5. **Customer Care Window & Pricing Policies**:
   - Meta imposes a 24-hour customer service window: free-form messages can only be sent within 24 hours of a user's inbound message; outside this window, only pre-approved templates can be dispatched.
   - Messaging fees vary by country, recipient region, and message category (Marketing vs Utility). Planners must check current Meta pricing on the official Meta Business Platform documentation.
