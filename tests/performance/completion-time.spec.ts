import { test, expect, Page } from '@playwright/test';

// Performance test configuration
const PERFORMANCE_TARGETS = {
  IVR_COMPLETION_TIME: 120000, // 2 minutes in milliseconds
  AUTO_POPULATION_RESPONSE: 300, // 300ms
  FORM_SAVE_TIME: 1000, // 1 second
  PAGE_LOAD_TIME: 3000, // 3 seconds
  API_RESPONSE_TIME: 500 // 500ms
};

const TEST_ITERATIONS = 10; // Number of test runs for averaging

test.describe('Phase 2 Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await loginUser(page);
  });

  test('IVR completion time under 2 minutes', async ({ page }) => {
    const completionTimes: number[] = [];

    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();

      // Navigate to IVR creation
      await page.click('[data-testid="create-ivr-button"]');

      // Enable speed tools for optimal performance
      await page.click('[data-testid="enable-speed-tools"]');

      // Complete form efficiently using all Phase 2 features
      await completeIVRFormOptimized(page);

      // Submit form
      await page.click('[data-testid="submit-ivr"]');
      await page.waitForSelector('[data-testid="success-message"]');

      const completionTime = Date.now() - startTime;
      completionTimes.push(completionTime);

      console.log(`IVR completion ${i + 1}: ${completionTime}ms`);

      // Reset for next iteration
      await page.click('[data-testid="dashboard-home"]');
    }

    // Analyze results
    const avgCompletionTime = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;
    const maxCompletionTime = Math.max(...completionTimes);
    const minCompletionTime = Math.min(...completionTimes);

    console.log(`Average completion time: ${avgCompletionTime}ms`);
    console.log(`Max completion time: ${maxCompletionTime}ms`);
    console.log(`Min completion time: ${minCompletionTime}ms`);

    // Performance assertions
    expect(avgCompletionTime).toBeLessThan(PERFORMANCE_TARGETS.IVR_COMPLETION_TIME);
    expect(maxCompletionTime).toBeLessThan(PERFORMANCE_TARGETS.IVR_COMPLETION_TIME * 1.2); // 20% tolerance

    // At least 80% of completions should be under target
    const underTargetCount = completionTimes.filter(time => time < PERFORMANCE_TARGETS.IVR_COMPLETION_TIME).length;
    expect(underTargetCount / completionTimes.length).toBeGreaterThanOrEqual(0.8);
  });

  test('Smart auto-population response time', async ({ page }) => {
    const responseTimes: number[] = [];
    const queries = ['blue cross', 'aetna', 'cigna', 'humana', 'medicare'];

    await page.click('[data-testid="create-ivr-button"]');

    for (const query of queries) {
      for (let i = 0; i < 3; i++) {
        // Clear previous input
        await page.fill('[data-testid="insurance-search"]', '');

        const startTime = performance.now();

        // Trigger auto-population
        await page.fill('[data-testid="insurance-search"]', query);
        await page.waitForSelector('[data-testid="insurance-suggestion"]');

        const endTime = performance.now();
        const responseTime = endTime - startTime;
        responseTimes.push(responseTime);

        console.log(`Auto-population for "${query}" (${i + 1}): ${responseTime}ms`);
      }
    }

    // Analyze results
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];

    console.log(`Average auto-population response time: ${avgResponseTime}ms`);
    console.log(`Max response time: ${maxResponseTime}ms`);
    console.log(`95th percentile: ${p95ResponseTime}ms`);

    // Performance assertions
    expect(avgResponseTime).toBeLessThan(PERFORMANCE_TARGETS.AUTO_POPULATION_RESPONSE);
    expect(p95ResponseTime).toBeLessThan(PERFORMANCE_TARGETS.AUTO_POPULATION_RESPONSE * 1.5);
  });

  test('Auto-save performance and reliability', async ({ page }) => {
    const saveTimes: number[] = [];

    await page.click('[data-testid="create-ivr-button"]');
    await page.click('[data-testid="enable-auto-save"]');

    // Test auto-save with various field changes
    const testData = [
      { field: 'patient-name', value: 'John Doe' },
      { field: 'date-of-birth', value: '1980-01-01' },
      { field: 'medical-condition', value: 'Diabetic ulcer' },
      { field: 'wound-location', value: 'Left foot' },
      { field: 'insurance-provider', value: 'Blue Cross Blue Shield' }
    ];

    for (const data of testData) {
      const startTime = performance.now();

      // Fill field and trigger auto-save
      await page.fill(`[data-testid="${data.field}"]`, data.value);

      // Wait for auto-save indicator
      await page.waitForSelector('[data-testid="auto-save-success"]', { timeout: 5000 });

      const endTime = performance.now();
      const saveTime = endTime - startTime;
      saveTimes.push(saveTime);

      console.log(`Auto-save for ${data.field}: ${saveTime}ms`);

      // Small delay between saves
      await page.waitForTimeout(500);
    }

    // Analyze auto-save performance
    const avgSaveTime = saveTimes.reduce((a, b) => a + b, 0) / saveTimes.length;
    const maxSaveTime = Math.max(...saveTimes);

    console.log(`Average auto-save time: ${avgSaveTime}ms`);
    console.log(`Max auto-save time: ${maxSaveTime}ms`);

    // Performance assertions
    expect(avgSaveTime).toBeLessThan(PERFORMANCE_TARGETS.FORM_SAVE_TIME);
    expect(maxSaveTime).toBeLessThan(PERFORMANCE_TARGETS.FORM_SAVE_TIME * 2);
  });

  test('Keyboard shortcuts efficiency', async ({ page }) => {
    const shortcutTimes: number[] = [];

    await page.click('[data-testid="create-ivr-button"]');

    // Test various keyboard shortcuts
    const shortcuts = [
      { keys: 'Control+S', action: 'Quick save', selector: '[data-testid="save-success"]' },
      { keys: 'Control+Z', action: 'Undo', selector: '[data-testid="undo-success"]' },
      { keys: 'Control+Y', action: 'Redo', selector: '[data-testid="redo-success"]' },
      { keys: 'Tab', action: 'Field navigation', selector: ':focus' }
    ];

    for (const shortcut of shortcuts) {
      const startTime = performance.now();

      await page.keyboard.press(shortcut.keys);

      if (shortcut.selector !== ':focus') {
        await page.waitForSelector(shortcut.selector, { timeout: 2000 });
      }

      const endTime = performance.now();
      const responseTime = endTime - startTime;
      shortcutTimes.push(responseTime);

      console.log(`${shortcut.action} (${shortcut.keys}): ${responseTime}ms`);
    }

    // All shortcuts should be nearly instantaneous
    const avgShortcutTime = shortcutTimes.reduce((a, b) => a + b, 0) / shortcutTimes.length;
    expect(avgShortcutTime).toBeLessThan(100); // Under 100ms
  });

  test('Form field optimization and smart suggestions', async ({ page }) => {
    const suggestionTimes: number[] = [];

    await page.click('[data-testid="create-ivr-button"]');

    // Test smart suggestions for various fields
    const testInputs = [
      { field: 'patient-name', input: 'John D', expected: 'John Doe' },
      { field: 'medical-condition', input: 'diab', expected: 'Diabetic ulcer' },
      { field: 'wound-location', input: 'left f', expected: 'Left foot' }
    ];

    for (const test of testInputs) {
      const startTime = performance.now();

      await page.fill(`[data-testid="${test.field}"]`, test.input);
      await page.waitForSelector('[data-testid="suggestion-dropdown"]');

      const endTime = performance.now();
      const suggestionTime = endTime - startTime;
      suggestionTimes.push(suggestionTime);

      console.log(`Suggestions for ${test.field}: ${suggestionTime}ms`);

      // Accept first suggestion
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      // Verify suggestion was applied
      const fieldValue = await page.inputValue(`[data-testid="${test.field}"]`);
      expect(fieldValue).toContain(test.expected.substring(0, 5)); // Partial match
    }

    // Suggestions should appear quickly
    const avgSuggestionTime = suggestionTimes.reduce((a, b) => a + b, 0) / suggestionTimes.length;
    expect(avgSuggestionTime).toBeLessThan(200); // Under 200ms
  });

  test('Delegation permission lookup performance', async ({ page }) => {
    const lookupTimes: number[] = [];

    // Navigate to delegation management
    await page.click('[data-testid="delegation-menu"]');

    for (let i = 0; i < 5; i++) {
      const startTime = performance.now();

      await page.click('[data-testid="manage-delegations"]');
      await page.waitForSelector('[data-testid="delegations-list"]');

      const endTime = performance.now();
      const lookupTime = endTime - startTime;
      lookupTimes.push(lookupTime);

      console.log(`Delegation lookup ${i + 1}: ${lookupTime}ms`);

      // Navigate back for next iteration
      await page.click('[data-testid="dashboard-home"]');
    }

    const avgLookupTime = lookupTimes.reduce((a, b) => a + b, 0) / lookupTimes.length;
    expect(avgLookupTime).toBeLessThan(500); // Under 500ms
  });

  test('Voice recording performance and quality', async ({ page }) => {
    // Set mobile viewport for voice recording tests
    await page.setViewportSize({ width: 375, height: 667 });

    await page.click('[data-testid="create-ivr-button"]');
    await page.click('[data-testid="voice-recording-tab"]');

    // Mock microphone for testing
    await page.evaluate(() => {
      navigator.mediaDevices.getUserMedia = () =>
        Promise.resolve({
          getTracks: () => [{ stop: () => {} }]
        } as any);
    });

    const recordingMetrics: number[] = [];

    for (let i = 0; i < 3; i++) {
      const startTime = performance.now();

      // Start recording
      await page.click('[data-testid="start-recording"]');
      await page.waitForSelector('[data-testid="recording-indicator"]');

      const recordingStartTime = performance.now() - startTime;

      // Record for 2 seconds
      await page.waitForTimeout(2000);

      // Stop recording
      const stopStartTime = performance.now();
      await page.click('[data-testid="stop-recording"]');
      await page.waitForSelector('[data-testid="recording-complete"]');

      const stopTime = performance.now() - stopStartTime;

      recordingMetrics.push(recordingStartTime);
      recordingMetrics.push(stopTime);

      console.log(`Recording ${i + 1} - Start: ${recordingStartTime}ms, Stop: ${stopTime}ms`);
    }

    // Recording operations should be fast
    const avgMetric = recordingMetrics.reduce((a, b) => a + b, 0) / recordingMetrics.length;
    expect(avgMetric).toBeLessThan(300); // Under 300ms
  });

  test('Concurrent user simulation', async ({ browser }) => {
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext()
    ]);

    const pages = await Promise.all(contexts.map(context => context.newPage()));

    // Simulate 3 concurrent users
    const userTasks = pages.map(async (page, index) => {
      await page.goto('http://localhost:3000');
      await loginUser(page);

      const startTime = Date.now();

      // Each user creates an IVR
      await page.click('[data-testid="create-ivr-button"]');
      await completeIVRFormOptimized(page);
      await page.click('[data-testid="submit-ivr"]');
      await page.waitForSelector('[data-testid="success-message"]');

      const completionTime = Date.now() - startTime;
      console.log(`Concurrent user ${index + 1} completion: ${completionTime}ms`);

      return completionTime;
    });

    const completionTimes = await Promise.all(userTasks);

    // All concurrent users should complete within reasonable time
    completionTimes.forEach((time, index) => {
      expect(time).toBeLessThan(PERFORMANCE_TARGETS.IVR_COMPLETION_TIME * 1.5); // 50% tolerance for concurrency
    });

    // Cleanup
    await Promise.all(contexts.map(context => context.close()));
  });

  test('Memory usage and cleanup', async ({ page }) => {
    // Test memory usage during extended session
    await page.click('[data-testid="create-ivr-button"]');

    // Create and discard multiple forms to test memory cleanup
    for (let i = 0; i < 10; i++) {
      await page.fill('[data-testid="patient-name"]', `Patient ${i}`);
      await page.fill('[data-testid="medical-condition"]', 'Test condition');

      // Trigger auto-save
      await page.waitForSelector('[data-testid="auto-save-success"]');

      // Clear form
      await page.click('[data-testid="clear-form"]');

      console.log(`Memory test iteration ${i + 1} completed`);
    }

    // Check that the application is still responsive
    const startTime = performance.now();
    await page.fill('[data-testid="patient-name"]', 'Final Test');
    await page.waitForSelector('[data-testid="auto-save-success"]');
    const responseTime = performance.now() - startTime;

    // Should still be responsive after memory stress test
    expect(responseTime).toBeLessThan(1000);
  });
});

// Helper functions
async function loginUser(page: Page) {
  await page.fill('[data-testid="email-input"]', 'doctor@healthcare.local');
  await page.fill('[data-testid="password-input"]', 'doctor123');
  await page.click('[data-testid="login-button"]');
  await page.waitForSelector('[data-testid="dashboard"]');
}

async function completeIVRFormOptimized(page: Page) {
  // Use all Phase 2 optimization features for fastest completion

  // Smart auto-population for insurance
  await page.fill('[data-testid="insurance-search"]', 'blue cross');
  await page.waitForSelector('[data-testid="insurance-suggestion"]');
  await page.click('[data-testid="insurance-suggestion"]:first-child');

  // Use keyboard shortcuts for navigation
  await page.keyboard.press('Tab');
  await page.type('[data-testid="patient-name"]', 'John Doe');

  await page.keyboard.press('Tab');
  await page.type('[data-testid="date-of-birth"]', '1980-01-01');

  // Use medical condition template
  await page.keyboard.press('Tab');
  await page.type('[data-testid="medical-condition"]', 'diabetic ulcer');
  await page.waitForSelector('[data-testid="condition-template"]');
  await page.keyboard.press('Enter'); // Accept template

  // Quick save using keyboard shortcut
  await page.keyboard.press('Control+S');
  await page.waitForSelector('[data-testid="save-success"]');
}

async function measureAPIResponseTime(page: Page, endpoint: string): Promise<number> {
  const startTime = performance.now();

  const response = await page.evaluate(async (url) => {
    const res = await fetch(url);
    return res.json();
  }, endpoint);

  const endTime = performance.now();
  return endTime - startTime;
}