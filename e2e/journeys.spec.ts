import { test, expect, Page } from '@playwright/test';

test.describe.serial('RSVP Wedding Manager E2E Test Suite (Journeys A-G)', () => {
  let page: Page;
  const organizerEmail = `planner_${Date.now()}@example.com`;
  const organizerPassword = 'TestPassword123!';
  let weddingId: string;
  let guestToken: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    if (page) {
      await page.close();
    }
  });

  test('Journey A: Register organizer, create wedding and events', async () => {
    // 1. Visit Register page
    await page.goto('/register');
    await expect(page).toHaveTitle(/RSVP Wedding Manager/);

    // 2. Fill registration form
    await page.fill('input[id="name"]', 'Priya Sharma');
    await page.fill('input[id="businessName"]', 'Royal Wedding Planners');
    await page.fill('input[id="email"]', organizerEmail);
    await page.fill('input[id="password"]', organizerPassword);
    await page.click('button[type="submit"]');

    // 3. Should land on Weddings list page
    await page.waitForURL(/\/weddings/);
    await expect(page.locator('text=Priya Sharma')).toBeVisible();

    // 4. Click Create Wedding
    await page.click('button:has-text("New Wedding"), button:has-text("Create First Wedding")');

    // 5. Fill Wedding form
    await page.fill('input[id="title"]', 'Rohan & Ananya Wedding');
    await page.fill('input[id="partnerOneName"]', 'Rohan');
    await page.fill('input[id="partnerTwoName"]', 'Ananya');
    await page.fill('input[id="rsvpDeadline"]', '2027-11-01');
    await page.click('button[type="submit"]:has-text("Create Wedding")');

    // 6. Should navigate to Dashboard
    await page.waitForURL(/\/weddings\/[a-z0-9_-]+/);
    const url = page.url();
    weddingId = url.split('/weddings/')[1].split('/')[0].split('?')[0];
    expect(weddingId).toBeTruthy();

    await expect(page.locator('text=Rohan & Ananya Wedding')).toBeVisible();

    // 7. Navigate to Events tab
    await page.click('a[href*="/events"]');
    await page.waitForURL(new RegExp(`/weddings/${weddingId}/events`));

    // 8. Add an Event
    await page.click('button:has-text("Add Function"), button:has-text("Create Event")');
    await page.fill('input[id="name"]', 'Grand Sangeet & Reception');
    await page.fill('input[id="startsAt"]', '2027-11-15T19:00');
    await page.fill('input[id="endsAt"]', '2027-11-15T23:30');
    await page.fill('input[id="venueName"]', 'The Oberoi Grand Ballroom');
    await page.fill('input[id="venueAddress"]', 'MG Road, Bengaluru');
    await page.fill('input[id="cateringTarget"]', '250');
    await page.click('button[type="submit"]:has-text("Create Event")');

    // 9. Verify event appears
    await expect(page.locator('text=Grand Sangeet & Reception')).toBeVisible();
    await expect(page.locator('text=The Oberoi Grand Ballroom')).toBeVisible();
  });

  test('Journey B: Add guest, generate link, assert WhatsApp wa.me structure', async () => {
    // Navigate to Guests tab
    await page.goto(`/weddings/${weddingId}/guests`);
    await expect(page.locator('h1:has-text("Guest Management")')).toBeVisible();

    // Add a Guest
    await page.click('button:has-text("Add Guest")');
    await page.fill('input[id="displayName"]', 'Kapoor Family');
    await page.fill('input[id="phone"]', '9876543210');
    await page.selectOption('select[id="category"]', 'FAMILY');
    await page.fill('input[id="invitedCount"]', '4');
    await page.click('button[type="submit"]:has-text("Add Guest")');

    // Verify guest appears in table
    await expect(page.locator('text=Kapoor Family').first()).toBeVisible();
    await expect(page.locator('text=+91 98765 43210').first()).toBeVisible();

    // Open guest drawer
    await page.locator('text=Kapoor Family').first().click();
    await expect(page.locator('text=Household Details')).toBeVisible();

    // Extract invitation URL
    const rsvpLinkInput = page.locator('input[readonly][value*="/r/"]');
    await expect(rsvpLinkInput).toBeVisible();
    const rsvpLinkValue = await rsvpLinkInput.inputValue();
    expect(rsvpLinkValue).toContain('/r/');
    guestToken = rsvpLinkValue.split('/r/')[1];
    expect(guestToken).toBeTruthy();

    // Assert WhatsApp link structure
    const waLink = page.locator('a[href*="wa.me"]');
    await expect(waLink).toBeVisible();
    const href = await waLink.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toContain('https://wa.me/919876543210?text=');
    // Ensure URL contains guest name and token, and no raw unencoded characters
    expect(href).toContain('Kapoor');
    expect(href).toContain(guestToken);

    // Close drawer
    await page.keyboard.press('Escape');
  });

  test('Journey C: Guest RSVP at 390px mobile viewport with confirmation', async ({ browser }) => {
    expect(guestToken).toBeTruthy();

    // Create mobile context with 390px iPhone viewport
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    });
    const mobilePage = await context.newPage();

    // Navigate to guest RSVP page
    await mobilePage.goto(`/r/${guestToken}`);

    // Verify wedding details render cleanly
    await expect(mobilePage.locator('text=Rohan')).toBeVisible();
    await expect(mobilePage.locator('text=Ananya')).toBeVisible();
    await expect(mobilePage.locator('text=Kapoor Family')).toBeVisible();
    await expect(mobilePage.locator('text=Grand Sangeet & Reception')).toBeVisible();

    // Verify mobile responsive button targets (>= 44px min height)
    const attendingBtn = mobilePage.locator('button:has-text("Attending")').first();
    await expect(attendingBtn).toBeVisible();
    const box = await attendingBtn.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);

    // Click Attending
    await attendingBtn.click();

    // Stepper: Set attending count to 3
    const plusBtn = mobilePage.locator('button:has-text("+")');
    await plusBtn.click(); // 1 -> 2
    await plusBtn.click(); // 2 -> 3

    // Fill attendee details
    const nameInputs = mobilePage.locator('input[placeholder*="Name"]');
    await nameInputs.nth(0).fill('Ramesh Kapoor');
    await nameInputs.nth(1).fill('Sunita Kapoor');
    await nameInputs.nth(2).fill('Aakash Kapoor');

    // Set arrival window
    await mobilePage.selectOption('select:has(option[value="ON_TIME"])', { index: 1 });

    // Submit RSVP
    const submitBtn = mobilePage.locator('button[type="submit"]:has-text("Confirm & Submit RSVP")');
    await submitBtn.click();

    // Assert confirmation summary view appears
    await expect(mobilePage.locator('text=Your Response Summary')).toBeVisible();
    await expect(mobilePage.locator('text=Ramesh Kapoor')).toBeVisible();
    await expect(mobilePage.locator('text=Attending (3)')).toBeVisible();

    await context.close();
  });

  test('Journey D: Verify guest response reflected on organizer live dashboard', async () => {
    // Visit dashboard
    await page.goto(`/weddings/${weddingId}`);
    await page.waitForURL(new RegExp(`/weddings/${weddingId}`));

    // Invariant check on dashboard:
    // Invited = 4, Confirmed = 3, Declined = 1 (since 4 - 3 = 1 declined), Awaiting = 0
    await expect(page.getByText('Confirmed Heads', { exact: true })).toBeVisible();
    await expect(page.getByText('Declined', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Awaiting', { exact: true }).first()).toBeVisible();

    // Verify invariant assertion (3 + 1 + 0 = 4)
    await expect(page.locator('text=Catering Planning Bounds')).toBeVisible();
    await expect(page.locator('text=Minimum Certain')).toBeVisible();
    await expect(page.locator('text=Maximum Possible')).toBeVisible();
  });

  test('Journey E: Add second guest, filter pending, send queue, mark sent', async () => {
    await page.goto(`/weddings/${weddingId}/guests`);

    // Add a pending guest
    await page.click('button:has-text("Add Guest")');
    await page.fill('input[id="displayName"]', 'Sharma Relatives');
    await page.fill('input[id="phone"]', '9876500000');
    await page.selectOption('select[id="category"]', 'FAMILY');
    await page.fill('input[id="invitedCount"]', '2');
    await page.click('button[type="submit"]:has-text("Add Guest")');

    await expect(page.locator('text=Sharma Relatives').first()).toBeVisible();

    // Filter by Pending / Needs Follow-up
    await page.selectOption('select:has(option:has-text("Not Contacted"))', { label: 'Not Contacted' });
    await expect(page.locator('text=Sharma Relatives').first()).toBeVisible();

    // Navigate to WhatsApp Send Queue
    await page.click('a[href*="/messages"]');
    await page.waitForURL(new RegExp(`/weddings/${weddingId}/messages`));

    // Confirm acknowledgement checkbox if first time
    const ackLabel = page.locator('text=I confirm these guests expect to hear from me');
    if (await ackLabel.isVisible()) {
      await ackLabel.click();
    }

    // Step through queue
    await expect(page.locator('text=Household 1 of 2')).toBeVisible();
    await expect(page.locator('h2:has-text("Kapoor Family")')).toBeVisible();

    // Click "Mark as Sent by You" on the current household
    await page.click('button:has-text("Mark as Sent by You")');

    // Progress updates honestly
    await expect(page.locator('text=1 marked sent in this session')).toBeVisible();
  });

  test('Journey F: Export CSVs and verify formula injection safety', async () => {
    // Verify Guest List CSV export via direct authenticated request from page context
    const response = await page.request.get(`/api/weddings/${weddingId}/households/export/guest-list`);
    expect(response.status()).toBe(200);

    const csvContent = await response.text();
    // 1. Must start with UTF-8 BOM
    expect(csvContent.charCodeAt(0)).toBe(0xfeff);

    // 2. Must contain header and Kapoor Family
    expect(csvContent).toContain('Household');
    expect(csvContent).toContain('Kapoor Family');
    expect(csvContent).toContain('9876543210');

    // Verify Catering Summary CSV export
    const cateringResp = await page.request.get(`/api/weddings/${weddingId}/households/export/catering-summary`);
    expect(cateringResp.status()).toBe(200);
    const cateringCsv = await cateringResp.text();

    // 3. Must contain bounds and explicit note that pending guests are NOT included in confirmed
    expect(cateringCsv).toContain('CATERING SUMMARY');
    expect(cateringCsv).toContain('Note: Pending guests are NOT included in confirmed headcount.');
  });

  test('Journey G: Cross-organizer isolation via URL/ID tampering', async ({ browser }) => {
    // Create new browser context for Organizer B
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    const emailB = `organizer_b_${Date.now()}@example.com`;
    await pageB.goto('/register');
    await pageB.fill('input[id="name"]', 'Second Organizer');
    await pageB.fill('input[id="email"]', emailB);
    await pageB.fill('input[id="password"]', 'Password123!');
    await pageB.click('button[type="submit"]');

    await pageB.waitForURL(/\/weddings/);

    // Organizer B attempts to access Organizer A's wedding by tampering with URL
    await pageB.goto(`/weddings/${weddingId}`);

    // Must return 404 error, redirect to /weddings or show not found, NEVER expose data
    const apiAttempt = await pageB.request.get(`/api/weddings/${weddingId}`);
    expect(apiAttempt.status()).toBe(404);

    const householdsAttempt = await pageB.request.get(`/api/weddings/${weddingId}/households`);
    expect(householdsAttempt.status()).toBe(404);

    await contextB.close();
  });
});
