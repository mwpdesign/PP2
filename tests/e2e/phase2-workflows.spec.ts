import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const API_URL = process.env.BACKEND_URL || 'http://localhost:8000';

// Test credentials
const TEST_CREDENTIALS = {
  doctor: {
    email: 'doctor@healthcare.local',
    password: 'doctor123'
  },
  nurse: {
    email: 'nurse@healthcare.local',
    password: 'nurse123'
  },
  admin: {
    email: 'admin@healthcare.local',
    password: 'admin123'
  }
};

test.describe('Phase 2 Complete Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to application
    await page.goto(BASE_URL);
  });

  test('Complete IVR workflow with Smart Auto-Population', async ({ page }) => {
    // Login as doctor
    await loginUser(page, TEST_CREDENTIALS.doctor);

    // Navigate to IVR creation
    await page.click('[data-testid="create-ivr-button"]');

    // Start timer for completion time tracking
    const startTime = Date.now();

    // Test Smart Auto-Population for insurance
    await page.fill('[data-testid="insurance-search"]', 'blue cross');

    // Wait for auto-population suggestions
    await page.waitForSelector('[data-testid="insurance-suggestion"]');

    // Verify suggestions appear
    const suggestions = await page.locator('[data-testid="insurance-suggestion"]').count();
    expect(suggestions).toBeGreaterThan(0);

    // Select first suggestion
    await page.click('[data-testid="insurance-suggestion"]:first-child');

    // Verify auto-population filled insurance details
    const insuranceValue = await page.inputValue('[data-testid="insurance-provider"]');
    expect(insuranceValue).toContain('Blue Cross');

    // Test medical condition template auto-population
    await page.fill('[data-testid="medical-condition"]', 'diabetic ulcer');
    await page.waitForSelector('[data-testid="condition-template"]');

    // Accept condition template
    await page.click('[data-testid="accept-template"]');

    // Verify template fields were populated
    const woundLocation = await page.inputValue('[data-testid="wound-location"]');
    expect(woundLocation).toBeTruthy();

    // Complete required fields
    await page.fill('[data-testid="patient-name"]', 'John Doe');
    await page.fill('[data-testid="date-of-birth"]', '1980-01-01');

    // Submit IVR
    await page.click('[data-testid="submit-ivr"]');

    // Verify submission success
    await page.waitForSelector('[data-testid="success-message"]');

    // Check completion time
    const completionTime = Date.now() - startTime;
    expect(completionTime).toBeLessThan(120000); // Under 2 minutes
  });

  test('Delegation workflow with permission management', async ({ page }) => {
    // Login as doctor (delegator)
    await loginUser(page, TEST_CREDENTIALS.doctor);

    // Navigate to delegation management
    await page.click('[data-testid="delegation-menu"]');
    await page.click('[data-testid="manage-delegations"]');

    // Create new delegation
    await page.click('[data-testid="create-delegation"]');

    // Fill delegation form
    await page.fill('[data-testid="delegate-to-email"]', TEST_CREDENTIALS.nurse.email);

    // Select permissions
    await page.check('[data-testid="permission-read-patients"]');
    await page.check('[data-testid="permission-write-ivr"]');

    // Set expiration
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    await page.fill('[data-testid="expires-at"]', futureDate.toISOString().split('T')[0]);

    // Submit delegation
    await page.click('[data-testid="submit-delegation"]');

    // Verify delegation created
    await page.waitForSelector('[data-testid="delegation-success"]');

    // Logout doctor
    await page.click('[data-testid="logout"]');

    // Login as nurse (delegatee)
    await loginUser(page, TEST_CREDENTIALS.nurse);

    // Verify nurse can access delegated permissions
    await page.click('[data-testid="patients-menu"]');

    // Should be able to view patients (delegated permission)
    await expect(page.locator('[data-testid="patients-list"]')).toBeVisible();

    // Try to access admin functions (should fail)
    await page.goto(`${BASE_URL}/admin`);
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
  });

  test('Mobile-first voice recording workflow', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Login as doctor
    await loginUser(page, TEST_CREDENTIALS.doctor);

    // Navigate to IVR creation
    await page.click('[data-testid="create-ivr-button"]');

    // Test voice recording feature
    await page.click('[data-testid="voice-recording-tab"]');

    // Mock microphone permissions
    await page.evaluate(() => {
      navigator.mediaDevices.getUserMedia = () =>
        Promise.resolve({
          getTracks: () => [{ stop: () => {} }]
        } as any);
    });

    // Start voice recording
    await page.click('[data-testid="start-recording"]');

    // Verify recording state
    await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="recording-timer"]')).toBeVisible();

    // Simulate recording for a few seconds
    await page.waitForTimeout(3000);

    // Stop recording
    await page.click('[data-testid="stop-recording"]');

    // Verify recording completed
    await expect(page.locator('[data-testid="recording-complete"]')).toBeVisible();

    // Test playback functionality
    await page.click('[data-testid="play-recording"]');
    await expect(page.locator('[data-testid="audio-player"]')).toBeVisible();

    // Test transcription (if enabled)
    if (await page.locator('[data-testid="transcription-text"]').isVisible()) {
      const transcriptionText = await page.textContent('[data-testid="transcription-text"]');
      expect(transcriptionText).toBeTruthy();
    }
  });

  test('Speed tools and sub-2-minute completion workflow', async ({ page }) => {
    // Login as doctor
    await loginUser(page, TEST_CREDENTIALS.doctor);

    // Navigate to IVR creation with speed tools enabled
    await page.click('[data-testid="create-ivr-button"]');
    await page.click('[data-testid="enable-speed-tools"]');

    // Verify speed tools interface
    await expect(page.locator('[data-testid="completion-timer"]')).toBeVisible();
    await expect(page.locator('[data-testid="target-time"]')).toContainText('2:00');

    const startTime = Date.now();

    // Test keyboard shortcuts
    await page.keyboard.press('Control+S'); // Quick save
    await expect(page.locator('[data-testid="auto-save-indicator"]')).toBeVisible();

    // Test smart suggestions
    await page.fill('[data-testid="patient-name"]', 'John D');
    await page.waitForSelector('[data-testid="name-suggestion"]');

    // Accept suggestion
    await page.keyboard.press('Tab');
    const nameValue = await page.inputValue('[data-testid="patient-name"]');
    expect(nameValue).toBe('John Doe'); // Auto-completed

    // Test field optimization
    await page.keyboard.press('Tab'); // Should jump to next optimized field
    expect(await page.locator(':focus').getAttribute('data-testid')).toBe('date-of-birth');

    // Complete form efficiently
    await page.fill('[data-testid="date-of-birth"]', '1980-01-01');
    await page.keyboard.press('Tab');

    await page.fill('[data-testid="medical-condition"]', 'diabetic ulcer');
    await page.keyboard.press('Enter'); // Accept template

    // Submit with keyboard shortcut
    await page.keyboard.press('Control+Enter');

    // Verify completion time
    const completionTime = Date.now() - startTime;
    expect(completionTime).toBeLessThan(120000); // Under 2 minutes

    // Verify success
    await page.waitForSelector('[data-testid="success-message"]');

    // Check completion analytics
    const completionTimeDisplay = await page.textContent('[data-testid="completion-time"]');
    expect(completionTimeDisplay).toMatch(/\d+:\d+/); // MM:SS format
  });

  test('Form duplication and patient history integration', async ({ page }) => {
    // Login as doctor
    await loginUser(page, TEST_CREDENTIALS.doctor);

    // Create first IVR
    await page.click('[data-testid="create-ivr-button"]');

    await page.fill('[data-testid="patient-name"]', 'Jane Smith');
    await page.fill('[data-testid="date-of-birth"]', '1975-05-15');
    await page.fill('[data-testid="insurance-provider"]', 'Aetna');
    await page.fill('[data-testid="medical-condition"]', 'Venous ulcer');

    await page.click('[data-testid="submit-ivr"]');
    await page.waitForSelector('[data-testid="success-message"]');

    // Create second IVR for same patient
    await page.click('[data-testid="create-ivr-button"]');

    // Test patient history integration
    await page.fill('[data-testid="patient-name"]', 'Jane Smith');
    await page.waitForSelector('[data-testid="patient-history-suggestions"]');

    // Verify history suggestions appear
    const historySuggestions = await page.locator('[data-testid="history-suggestion"]').count();
    expect(historySuggestions).toBeGreaterThan(0);

    // Test form duplication
    await page.click('[data-testid="duplicate-previous-form"]');

    // Verify fields were populated from history
    const insuranceValue = await page.inputValue('[data-testid="insurance-provider"]');
    expect(insuranceValue).toBe('Aetna');

    const conditionValue = await page.inputValue('[data-testid="medical-condition"]');
    expect(conditionValue).toBe('Venous ulcer');

    // Modify for new visit
    await page.fill('[data-testid="visit-reason"]', 'Follow-up visit');

    await page.click('[data-testid="submit-ivr"]');
    await page.waitForSelector('[data-testid="success-message"]');
  });

  test('HIPAA compliance and audit trail verification', async ({ page }) => {
    // Login as admin to check audit trails
    await loginUser(page, TEST_CREDENTIALS.admin);

    // Navigate to audit logs
    await page.click('[data-testid="admin-menu"]');
    await page.click('[data-testid="audit-logs"]');

    // Verify audit trail exists for auto-population actions
    await page.fill('[data-testid="audit-search"]', 'auto_populate');
    await page.click('[data-testid="search-audit"]');

    // Check audit entries
    const auditEntries = await page.locator('[data-testid="audit-entry"]').count();
    expect(auditEntries).toBeGreaterThan(0);

    // Verify audit entry details
    const firstEntry = page.locator('[data-testid="audit-entry"]').first();
    await expect(firstEntry.locator('[data-testid="audit-action"]')).toContainText('auto_populate');
    await expect(firstEntry.locator('[data-testid="audit-timestamp"]')).toBeVisible();
    await expect(firstEntry.locator('[data-testid="audit-user"]')).toBeVisible();

    // Test data encryption verification
    await page.click('[data-testid="security-menu"]');
    await page.click('[data-testid="encryption-status"]');

    // Verify encryption indicators
    await expect(page.locator('[data-testid="data-encrypted"]')).toContainText('Encrypted');
    await expect(page.locator('[data-testid="transit-encrypted"]')).toContainText('HTTPS');
  });

  test('Performance benchmarking and load testing', async ({ page }) => {
    // Login as doctor
    await loginUser(page, TEST_CREDENTIALS.doctor);

    // Test auto-population performance
    const performanceMetrics = [];

    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="create-ivr-button"]');

      const startTime = performance.now();

      // Trigger auto-population
      await page.fill('[data-testid="insurance-search"]', 'blue cross');
      await page.waitForSelector('[data-testid="insurance-suggestion"]');

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      performanceMetrics.push(responseTime);

      // Reset for next iteration
      await page.click('[data-testid="cancel-ivr"]');
    }

    // Verify all responses were under 300ms
    performanceMetrics.forEach(time => {
      expect(time).toBeLessThan(300);
    });

    // Calculate average response time
    const avgResponseTime = performanceMetrics.reduce((a, b) => a + b, 0) / performanceMetrics.length;
    expect(avgResponseTime).toBeLessThan(200); // Average under 200ms
  });

  test('Error handling and recovery workflows', async ({ page }) => {
    // Login as doctor
    await loginUser(page, TEST_CREDENTIALS.doctor);

    // Test network error handling
    await page.route('**/api/v1/auto-population/**', route => {
      route.abort('failed');
    });

    await page.click('[data-testid="create-ivr-button"]');
    await page.fill('[data-testid="insurance-search"]', 'test');

    // Verify error handling
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();

    // Test recovery
    await page.unroute('**/api/v1/auto-population/**');
    await page.click('[data-testid="retry-button"]');

    // Should work after retry
    await page.waitForSelector('[data-testid="insurance-suggestion"]');
  });
});

// Helper functions
async function loginUser(page: Page, credentials: { email: string; password: string }) {
  await page.fill('[data-testid="email-input"]', credentials.email);
  await page.fill('[data-testid="password-input"]', credentials.password);
  await page.click('[data-testid="login-button"]');

  // Wait for successful login
  await page.waitForSelector('[data-testid="dashboard"]');
}

async function measureCompletionTime(page: Page, workflow: () => Promise<void>): Promise<number> {
  const startTime = Date.now();
  await workflow();
  return Date.now() - startTime;
}

async function verifyAccessibility(page: Page) {
  // Basic accessibility checks
  const focusableElements = await page.locator('[tabindex]:not([tabindex="-1"])').count();
  expect(focusableElements).toBeGreaterThan(0);

  // Check for ARIA labels
  const ariaLabels = await page.locator('[aria-label]').count();
  expect(ariaLabels).toBeGreaterThan(0);
}