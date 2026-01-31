const { test, expect } = require('@playwright/test');
const ExcelReader = require('../utils/excel-reader');

// Helper functions
async function findAndFillInput(page, text) {
    const selectors = [
        'textarea[placeholder="Input Your Singlish Text Here."]',
        'textarea',
        'input[type="text"]',
        '[contenteditable="true"]'
    ];

    for (const selector of selectors) {
        const locator = page.locator(selector).first();
        if (await locator.count() > 0) {
            await locator.click();
            await locator.fill('');
            // Wait for output to clear
            await page.waitForTimeout(500);

            // Fill with keyboard to better simulate user and trigger events
            // await locator.fill(text); 
            // Using fill is faster, but if it doesn't trigger, type is better.
            // Let's use fill then wait.
            await locator.fill(text);
            return true;
        }
    }
    return false;
}

async function getOutput(page) {
    const outputSelector = 'div.w-full.h-80.bg-slate-50.whitespace-pre-wrap';
    const locator = page.locator(outputSelector);

    // Wait for output to be non-empty (with timeout)
    try {
        await expect(locator).not.toBeEmpty({ timeout: 5000 });
    } catch (e) {
        // If it doesn't appear in 5s, it might just be empty or took too long
    }

    const text = await locator.textContent();
    return text || '';
}

test.describe('Translation System Tests', () => {
    let page;
    let context;
    let testCases;

    test.beforeAll(async () => {
        // Load data
        const reader = new ExcelReader('test-data/test-cases.xlsx');
        testCases = reader.getTestCases();
    });

    test.beforeEach(async ({ browser }) => {
        // Setup browser and page for each test
        context = await browser.newContext({
            viewport: { width: 1280, height: 720 },
            // recordVideo: { dir: 'test-reports/videos' } — enable after running: npx playwright install
        });
        page = await context.newPage();

        // Open site
        await page.goto('https://www.swifttranslator.com/', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        await page.waitForLoadState('domcontentloaded');

        // Clear input
        const specificTextarea = page.locator('textarea[placeholder="Input Your Singlish Text Here."]');
        if (await specificTextarea.count() > 0) {
            await specificTextarea.click();
            await specificTextarea.fill('');
            await page.waitForTimeout(500); // Wait
        } else {
            const inputSelectors = ['textarea', 'input[type="text"]', '[contenteditable="true"]'];
            for (const selector of inputSelectors) {
                const elements = await page.$$(selector);
                if (elements.length > 0) {
                    await page.fill(selector, '');
                    break;
                }
            }
        }
    });

    test.afterEach(async () => {
        // Close page and context after each test (guard if setup failed)
        if (page) await page.close().catch(() => {});
        if (context) await context.close().catch(() => {});
    });

    // Positive tests
    test('Positive functional test cases', async () => {
        test.setTimeout(300000); // Set timeout
        const positiveCases = testCases.filter(tc =>
            tc.id && (tc.id.startsWith('Pos_Fun') || tc.id.startsWith('Pos_UI'))
        );

        for (const testCase of positiveCases) {
            await test.step(`Test ${testCase.id}: ${testCase.name}`, async () => {
                // Find input
                const inputFound = await findAndFillInput(page, testCase.input);
                expect(inputFound).toBeTruthy();

                // Wait
                await page.waitForTimeout(3000);

                // Get output
                const output = await getOutput(page);

                // Compare
                if (testCase.expected) {
                    // Normalize output
                    const clean = (str) => str
                        .replace(/[\u200B-\u200D\uFEFF]/g, '')
                        .replace(/\s+/g, ' ')
                        .trim()
                        .replace(/[.]+$/, '');

                    const normalizedOutput = clean(output);
                    const normalizedExpected = clean(testCase.expected);
                    expect(normalizedOutput).toBe(normalizedExpected);
                }
            });
        }
    });

    // Negative tests
    test('Negative functional test cases', async () => {
        test.setTimeout(300000); // Set timeout
        const negativeCases = testCases.filter(tc =>
            tc.id && tc.id.startsWith('Neg_Fun')
        );

        for (const testCase of negativeCases) {
            await test.step(`Test ${testCase.id}: ${testCase.name}`, async () => {
                // Find input
                const inputFound = await findAndFillInput(page, testCase.input);
                expect(inputFound).toBeTruthy();

                // Wait
                await page.waitForTimeout(2000);

                // Get output
                const output = await getOutput(page);

                // Assert mismatch
                if (testCase.expected) {
                    expect(output.trim()).not.toBe(testCase.expected.trim());
                }
            });
        }
    });

    // UI tests
    test('UI test - Real-time update', async () => {
        await test.step('Verify real-time conversion', async () => {
            // Type
            const testInput = 'mama '; // Added space
            let previousOutput = '';
            let updatesDetected = 0;

            // Find input
            const textarea = page.locator('textarea');
            await expect(textarea).toBeVisible();
            await textarea.click();
            await textarea.fill(''); // Clear
            await page.waitForTimeout(500);

            for (let i = 0; i < testInput.length; i++) {
                await page.keyboard.type(testInput[i]);
                await page.waitForTimeout(500); // Wait

                const currentOutput = await getOutput(page);
                // Check output
                if (currentOutput && currentOutput !== previousOutput) {
                    updatesDetected++;
                    previousOutput = currentOutput;
                }
            }

            // Final check
            await page.waitForTimeout(1000);
            const finalOutput = await getOutput(page);
            if (finalOutput && finalOutput !== previousOutput) {
                updatesDetected++;
            }

            expect(updatesDetected).toBeGreaterThan(0);
        });
    });
});