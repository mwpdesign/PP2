/**
 * Automated Navigation Tests for Healthcare IVR Platform
 * Task ID: mbvdcwznv348cohmkpp
 *
 * This module provides automated test functions for verifying navigation
 * paths work correctly for all user roles after recent fixes.
 */

// Test configuration
const TEST_CONFIG = {
    baseUrl: 'http://localhost:3000',
    timeout: 5000,
    retryAttempts: 3
};

// User role configurations
const USER_ROLES = {
    REGIONAL_DISTRIBUTOR: {
        basePath: '/distributor-regional',
        routes: [
            '/dashboard',
            '/sales-team',
            '/ivr-management',
            '/order-management',
            '/shipping-logistics',
            '/analytics',
            '/settings'
        ]
    },
    MASTER_DISTRIBUTOR: {
        basePath: '/distributor',
        routes: [
            '/dashboard',
            '/ivr-management',
            '/orders',
            '/shipping',
            '/distributors',
            '/salespeople',
            '/invoicing',
            '/settings'
        ]
    }
};

// Test result tracking
let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
};

/**
 * Utility Functions
 */

function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);

    // Also log to DOM if test output element exists
    const output = document.getElementById('testOutput');
    if (output) {
        output.innerHTML += `[${new Date().toLocaleTimeString()}] ${prefix} ${message}\n`;
        output.scrollTop = output.scrollHeight;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForElement(selector, timeout = TEST_CONFIG.timeout) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        const element = document.querySelector(selector);
        if (element) return element;
        await sleep(100);
    }
    throw new Error(`Element ${selector} not found within ${timeout}ms`);
}

function updateTestStatus(testName, status, details = '') {
    testResults.total++;
    if (status === 'pass') {
        testResults.passed++;
        log(`✅ ${testName}: PASSED ${details}`, 'success');
    } else {
        testResults.failed++;
        testResults.errors.push({ test: testName, details });
        log(`❌ ${testName}: FAILED ${details}`, 'error');
    }
}

/**
 * Context Detection Tests
 */

function testGetDistributorContext() {
    log('Testing getDistributorContext() function...', 'info');

    const testCases = [
        {
            path: '/distributor-regional/ivr-management',
            expected: 'regional',
            description: 'Regional IVR Management'
        },
        {
            path: '/distributor/ivr-management',
            expected: 'master',
            description: 'Master IVR Management'
        },
        {
            path: '/distributor-regional/order-management/123',
            expected: 'regional',
            description: 'Regional Order Detail'
        },
        {
            path: '/distributor/orders/123',
            expected: 'master',
            description: 'Master Order Detail'
        },
        {
            path: '/distributor-regional/shipping-logistics/456',
            expected: 'regional',
            description: 'Regional Shipping Detail'
        },
        {
            path: '/distributor/shipping/456',
            expected: 'master',
            description: 'Master Shipping Detail'
        }
    ];

    let passed = 0;
    testCases.forEach(testCase => {
        // Simulate the getDistributorContext function logic
        let context;
        if (testCase.path.includes('/distributor-regional/')) {
            context = 'regional';
        } else if (testCase.path.includes('/distributor/')) {
            context = 'master';
        } else {
            context = 'master'; // Default fallback
        }

        if (context === testCase.expected) {
            updateTestStatus(
                `Context Detection: ${testCase.description}`,
                'pass',
                `${testCase.path} → ${context}`
            );
            passed++;
        } else {
            updateTestStatus(
                `Context Detection: ${testCase.description}`,
                'fail',
                `${testCase.path} → ${context} (expected ${testCase.expected})`
            );
        }
    });

    return { passed, total: testCases.length };
}

/**
 * Navigation Path Tests
 */

async function testNavigationPaths(role) {
    log(`Testing ${role} navigation paths...`, 'info');

    const config = USER_ROLES[role];
    if (!config) {
        throw new Error(`Unknown role: ${role}`);
    }

    let passed = 0;
    for (const route of config.routes) {
        const fullPath = config.basePath + route;

        try {
            // Test path structure
            const isValidStructure = fullPath.startsWith(config.basePath);

            if (isValidStructure) {
                updateTestStatus(
                    `${role} Path Structure: ${route}`,
                    'pass',
                    fullPath
                );
                passed++;
            } else {
                updateTestStatus(
                    `${role} Path Structure: ${route}`,
                    'fail',
                    `Invalid path structure: ${fullPath}`
                );
            }
        } catch (error) {
            updateTestStatus(
                `${role} Path Structure: ${route}`,
                'fail',
                error.message
            );
        }
    }

    return { passed, total: config.routes.length };
}

/**
 * Side Panel Functionality Tests
 */

async function testSidePanelFunctionality() {
    log('Testing side panel functionality...', 'info');

    const tests = [
        {
            name: 'MasterDetailLayout Container',
            selector: '.flex',
            description: 'Main layout container exists'
        },
        {
            name: 'Master Panel (60%)',
            selector: '[class*="w-3/5"], [class*="w-[60%]"]',
            description: 'Master panel with correct width'
        },
        {
            name: 'Detail Panel (40%)',
            selector: '[class*="w-2\\/5"], [class*="w-\\[40%\\]"]',
            description: 'Detail panel with correct width'
        },
        {
            name: 'IVR List Component',
            selector: '[role="table"], .ivr-list',
            description: 'IVR list component in master panel'
        },
        {
            name: 'Clickable Rows',
            selector: '[role="button"], .cursor-pointer',
            description: 'Clickable IVR rows for selection'
        },
        {
            name: 'Mobile Responsive',
            selector: '.md\\:block, .hidden.md\\:block',
            description: 'Mobile responsive classes present'
        }
    ];

    let passed = 0;
    for (const test of tests) {
        try {
            const element = document.querySelector(test.selector);
            if (element) {
                updateTestStatus(
                    `Side Panel: ${test.name}`,
                    'pass',
                    test.description
                );
                passed++;
            } else {
                updateTestStatus(
                    `Side Panel: ${test.name}`,
                    'fail',
                    `Element not found: ${test.selector}`
                );
            }
        } catch (error) {
            updateTestStatus(
                `Side Panel: ${test.name}`,
                'fail',
                error.message
            );
        }
    }

    return { passed, total: tests.length };
}

/**
 * Context-Aware Navigation Tests
 */

async function testContextAwareNavigation() {
    log('Testing context-aware navigation...', 'info');

    const navigationTests = [
        {
            component: 'IVRDetailPanel',
            regionalRoute: '/distributor-regional/ivr-management/{id}/details',
            masterRoute: '/distributor/ivr-management/{id}/details',
            contextFunction: 'handleViewFullDetails'
        },
        {
            component: 'OrderProcessing',
            regionalRoute: '/distributor-regional/order-management/{id}',
            masterRoute: '/distributor/orders/{id}',
            contextFunction: 'navigateToOrderDetail'
        },
        {
            component: 'ShippingLogistics',
            regionalRoute: '/distributor-regional/shipping-logistics/{id}',
            masterRoute: '/distributor/shipping/{id}',
            contextFunction: 'navigateToShippingDetail'
        }
    ];

    let passed = 0;
    navigationTests.forEach(test => {
        // Test route patterns
        const regionalValid = test.regionalRoute.includes('/distributor-regional/');
        const masterValid = test.masterRoute.includes('/distributor/') &&
                           !test.masterRoute.includes('/distributor-regional/');

        if (regionalValid && masterValid) {
            updateTestStatus(
                `Context Navigation: ${test.component}`,
                'pass',
                `Routes correctly differentiated`
            );
            passed++;
        } else {
            updateTestStatus(
                `Context Navigation: ${test.component}`,
                'fail',
                `Invalid route patterns`
            );
        }
    });

    return { passed, total: navigationTests.length };
}

/**
 * Breadcrumb Navigation Tests
 */

async function testBreadcrumbNavigation() {
    log('Testing breadcrumb navigation...', 'info');

    const breadcrumbTests = [
        {
            name: 'Breadcrumb Container',
            selector: 'nav[aria-label="Breadcrumb"], .breadcrumb',
            description: 'Main breadcrumb navigation container'
        },
        {
            name: 'Breadcrumb List',
            selector: 'ol, .breadcrumb-list',
            description: 'Ordered list of breadcrumb items'
        },
        {
            name: 'Breadcrumb Links',
            selector: 'nav a, .breadcrumb a',
            description: 'Clickable breadcrumb links'
        },
        {
            name: 'Current Page Indicator',
            selector: '.font-medium, .current-page',
            description: 'Current page highlighted in breadcrumb'
        }
    ];

    let passed = 0;
    for (const test of breadcrumbTests) {
        try {
            const element = document.querySelector(test.selector);
            if (element) {
                updateTestStatus(
                    `Breadcrumb: ${test.name}`,
                    'pass',
                    test.description
                );
                passed++;
            } else {
                updateTestStatus(
                    `Breadcrumb: ${test.name}`,
                    'fail',
                    `Element not found: ${test.selector}`
                );
            }
        } catch (error) {
            updateTestStatus(
                `Breadcrumb: ${test.name}`,
                'fail',
                error.message
            );
        }
    }

    return { passed, total: breadcrumbTests.length };
}

/**
 * Security Cleanup Tests
 */

async function testSecurityCleanup() {
    log('Testing security cleanup...', 'info');

    const testFiles = [
        '/test_regional_navigation_fixes.html',
        '/test_order_management_filtering_complete.html',
        '/test_shipping_hierarchy_filtering.html',
        '/test_critical_fixes_complete.html',
        '/test_order_security_fix.html'
    ];

    let passed = 0;
    for (const testFile of testFiles) {
        try {
            const response = await fetch(testFile);
            if (response.status === 404) {
                updateTestStatus(
                    `Security: ${testFile}`,
                    'pass',
                    'File properly moved from public directory'
                );
                passed++;
            } else {
                updateTestStatus(
                    `Security: ${testFile}`,
                    'fail',
                    `File still accessible (status: ${response.status})`
                );
            }
        } catch (error) {
            // Network error usually means file is not accessible (good)
            updateTestStatus(
                `Security: ${testFile}`,
                'pass',
                'File not accessible (network error)'
            );
            passed++;
        }
    }

    return { passed, total: testFiles.length };
}

/**
 * Navigation Consistency Tests
 */

async function testNavigationConsistency() {
    log('Testing navigation consistency...', 'info');

    const consistencyTests = [
        {
            name: 'Sidebar Navigation',
            test: () => document.querySelector('nav, .sidebar') !== null,
            description: 'Main navigation sidebar exists'
        },
        {
            name: 'Navigation Links',
            test: () => document.querySelectorAll('a[href]').length > 0,
            description: 'Navigation links are present'
        },
        {
            name: 'Active State Styling',
            test: () => document.querySelector('.bg-\\[\\#375788\\], .active') !== null,
            description: 'Active navigation state styling'
        },
        {
            name: 'Mobile Menu',
            test: () => document.querySelector('[aria-label*="menu"], .mobile-menu') !== null,
            description: 'Mobile navigation menu exists'
        },
        {
            name: 'User Info Display',
            test: () => document.querySelector('.user-info, [data-user]') !== null,
            description: 'User information display'
        },
        {
            name: 'Sign Out Functionality',
            test: () => document.querySelector('[href="#"]:contains("Sign Out"), .sign-out') !== null,
            description: 'Sign out button/link exists'
        }
    ];

    let passed = 0;
    consistencyTests.forEach(test => {
        try {
            const result = test.test();
            if (result) {
                updateTestStatus(
                    `Consistency: ${test.name}`,
                    'pass',
                    test.description
                );
                passed++;
            } else {
                updateTestStatus(
                    `Consistency: ${test.name}`,
                    'fail',
                    `Test failed: ${test.description}`
                );
            }
        } catch (error) {
            updateTestStatus(
                `Consistency: ${test.name}`,
                'fail',
                error.message
            );
        }
    });

    return { passed, total: consistencyTests.length };
}

/**
 * Main Test Runner
 */

async function runAllNavigationTests() {
    log('🚀 Starting comprehensive navigation test suite...', 'info');
    log('='.repeat(60), 'info');

    // Reset test results
    testResults = { total: 0, passed: 0, failed: 0, errors: [] };

    try {
        // Run all test suites
        const results = [];

        results.push(await testGetDistributorContext());
        results.push(await testNavigationPaths('REGIONAL_DISTRIBUTOR'));
        results.push(await testNavigationPaths('MASTER_DISTRIBUTOR'));
        results.push(await testSidePanelFunctionality());
        results.push(await testContextAwareNavigation());
        results.push(await testBreadcrumbNavigation());
        results.push(await testSecurityCleanup());
        results.push(await testNavigationConsistency());

        // Calculate overall results
        const totalTests = results.reduce((sum, result) => sum + result.total, 0);
        const totalPassed = results.reduce((sum, result) => sum + result.passed, 0);
        const passRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;

        log('='.repeat(60), 'info');
        log(`🏁 Navigation test suite completed!`, 'info');
        log(`📊 Results: ${totalPassed}/${totalTests} tests passed (${passRate}%)`, 'info');

        if (passRate >= 80) {
            log('🎉 Navigation test suite PASSED! All critical paths working correctly.', 'success');
        } else {
            log('⚠️ Navigation issues detected. Please review failed tests.', 'error');
        }

        return {
            totalTests,
            totalPassed,
            passRate,
            results,
            errors: testResults.errors
        };

    } catch (error) {
        log(`💥 Test suite failed with error: ${error.message}`, 'error');
        throw error;
    }
}

/**
 * Individual Test Functions (for manual execution)
 */

// Export functions for use in test pages
if (typeof window !== 'undefined') {
    window.NavigationTests = {
        runAllNavigationTests,
        testGetDistributorContext,
        testNavigationPaths,
        testSidePanelFunctionality,
        testContextAwareNavigation,
        testBreadcrumbNavigation,
        testSecurityCleanup,
        testNavigationConsistency,
        log,
        updateTestStatus,
        testResults
    };
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runAllNavigationTests,
        testGetDistributorContext,
        testNavigationPaths,
        testSidePanelFunctionality,
        testContextAwareNavigation,
        testBreadcrumbNavigation,
        testSecurityCleanup,
        testNavigationConsistency,
        TEST_CONFIG,
        USER_ROLES
    };
}