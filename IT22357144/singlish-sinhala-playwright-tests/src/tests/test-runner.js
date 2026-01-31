const { chromium, firefox, webkit } = require('playwright');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');

class TestRunner {
    constructor() {
        this.testResults = [];
        this.summary = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: 0,
            startTime: null,
            endTime: null
        };
    }

    async initialize() {
        console.log(chalk.blue(' Initializing Test Runner...'));

        // Create necessary directories for reports and screenshots
        await fs.ensureDir('results');
        await fs.ensureDir('test-reports');
        await fs.ensureDir('test-reports/screenshots');

        // Load cases
        this.testCases = this.loadTestCases();
        this.summary.total = this.testCases.length;
        this.summary.startTime = new Date();

        console.log(chalk.green(` Loaded ${this.testCases.length} test cases`));
    }

    loadTestCases() {
        try {
            const filePath = path.resolve('test-data/test-cases.xlsx');
            const workbook = XLSX.readFile(filePath);
            const worksheet = workbook.Sheets['Test cases'];
            const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

            return data.filter(row => row['TC ID'] && row['TC ID'].trim() !== '');
        } catch (error) {
            console.error(chalk.red(` Error loading test cases: ${error.message}`));
            return [];
        }
    }

    async runTests() {
        console.log(chalk.blue(' Starting test execution...'));

        // Launch chromium - using headless: false so we can see what's happening if needed
        const browser = await chromium.launch({
            headless: false,
            slowMo: 100 // slowMo helps with stability on some systems
        });

        const context = await browser.newContext({
            viewport: { width: 1280, height: 720 },
            recordVideo: { dir: 'test-reports/videos' }
        });

        const page = await context.newPage();

        try {
            // Navigate
            await page.goto('https://www.swifttranslator.com/', {
                waitUntil: 'networkidle',
                timeout: 30000
            });

            console.log(chalk.green(' Successfully loaded translator website'));

            // Wait for load
            await page.waitForSelector('textarea, input[type="text"]', { timeout: 10000 });

            // Find elements
            const inputSelector = await this.findInputElement(page);
            const outputSelector = await this.findOutputElement(page);

            if (!inputSelector || !outputSelector) {
                // If we can't find the elements, there's no point in continuing
                throw new Error('Could not find input/output elements on the page. Website UI might have changed.');
            }

            console.log(chalk.blue(`Input selector: ${inputSelector}`));
            console.log(chalk.blue(` Output selector: ${outputSelector}`));

            // Run cases
            for (let i = 0; i < this.testCases.length; i++) {
                const testCase = this.testCases[i];
                await this.executeTestCase(page, testCase, inputSelector, outputSelector, i + 1);
            }

        } catch (error) {
            console.error(chalk.red(` Test execution error: ${error.message}`));
        } finally {
            // Close
            await browser.close();

            // Report
            await this.generateReports();

            // Display summary
            this.displaySummary();
        }
    }

    async findInputElement(page) {
        // Try different selectors for input field
        const selectors = [
            'textarea',
            'input[type="text"]',
            'input[name*="text"]',
            'input[name*="input"]',
            '[contenteditable="true"]',
            '.input-field',
            '#input',
            '#text',
            '[aria-label*="input"]',
            '[placeholder*="Type"]'
        ];

        for (const selector of selectors) {
            const elements = await page.$$(selector);
            if (elements.length > 0) {
                return selector;
            }
        }

        return null;
    }

    async findOutputElement(page) {
        // Try specific selector first, then generic ones
        const selectors = [
            'div.w-full.h-80.bg-slate-50.whitespace-pre-wrap', // Specific selector for this app
            'div[class*="output"]',
            'div[class*="result"]',
            'div[id*="output"]',
            'div[id*="result"]',
            '.output-field',
            '#output',
            '#result',
            '[aria-label*="output"]',
            '[class*="translat"]'
        ];

        for (const selector of selectors) {
            const elements = await page.$$(selector);
            if (elements.length > 0) {
                return selector;
            }
        }

        return null;
    }

    async executeTestCase(page, testCase, inputSelector, outputSelector, testNumber) {
        const startTime = new Date();
        let result = {
            ...testCase,
            'Actual output': '',
            'Status': 'Error',
            'Execution time': '',
            'Error message': '',
            'Screenshot': ''
        };

        try {
            console.log(chalk.yellow(`\nTest ${testNumber}/${this.testCases.length}: ${testCase['TC ID']} - ${testCase['Test case name']}`));

            // Clear input field
            await page.fill(inputSelector, '');
            await page.waitForTimeout(500);

            // Special handling for UI tests
            if (testCase['TC ID'] === 'Pos_UI_0001') {
                // Test real-time update
                const isRealTime = await this.testRealTimeUpdate(page, inputSelector, outputSelector, testCase.Input);
                result['Actual output'] = isRealTime ? 'Real-time update verified' : 'No real-time update detected';
                result['Status'] = isRealTime ? 'Pass' : 'Fail';

                if (isRealTime) {
                    console.log(chalk.green('   PASS'));
                    this.summary.passed++;
                } else {
                    console.log(chalk.red('   FAIL'));
                    this.summary.failed++;
                }

            } else if (testCase['TC ID'] === 'UI_TC_02') {
                // Test clear button functionality
                const isClear = await this.testClearFunctionality(page, inputSelector, outputSelector, testCase.Input);
                result['Actual output'] = isClear ? 'Clear functionality verified' : 'Clear functionality failed';
                result['Status'] = isClear ? 'Pass' : 'Fail';

                if (isClear) {
                    console.log(chalk.green('   PASS'));
                    this.summary.passed++;
                } else {
                    console.log(chalk.red('   FAIL'));
                    this.summary.failed++;
                }

            } else {
                // Regular functional test
                // Enter text
                await page.fill(inputSelector, testCase.Input);

                // Wait for conversion (adjust based on website behavior)
                // For the first test, give it a bit more time to wake up
                await page.waitForTimeout(testNumber === 1 ? 3000 : 2000);

                // Get output with retry/wait logic 
                // Sometimes the conversion takes a second to appear
                let actualOutput = "";
                for (let j = 0; j < 5; j++) {
                    await page.waitForTimeout(1000);
                    actualOutput = await page.textContent(outputSelector);
                    if (actualOutput && actualOutput.trim() !== "") break;
                }

                // Keep it clean
                result['Actual output'] = actualOutput.trim();

                // Compare with expected output
                if (testCase['TC ID'].startsWith('Pos_Fun') || testCase['TC ID'].startsWith('Pos_UI')) {
                    // Positive test - should match expected output
                    const isMatch = this.compareOutput(actualOutput, testCase['Expected output'], true);
                    result['Status'] = isMatch ? 'Pass' : 'Fail';

                    if (isMatch) {
                        console.log(chalk.green('   PASS'));
                        this.summary.passed++;
                    } else {
                        console.log(chalk.red('   FAIL'));
                        console.log(chalk.gray(`    Expected: ${testCase['Expected output']}`));
                        console.log(chalk.gray(`    Actual: ${actualOutput}`));
                        this.summary.failed++;
                    }

                } else if (testCase['TC ID'].startsWith('Neg_Fun')) {
                    // Negative test - expected to fail/differ from ideal
                    const isMatch = this.compareOutput(actualOutput, testCase['Expected output'], false);
                    result['Status'] = isMatch ? 'Fail' : 'Pass'; // Inverted logic for negative tests

                    if (!isMatch) {
                        console.log(chalk.green('   PASS (Expected failure/issue)'));
                        this.summary.passed++;
                    } else {
                        console.log(chalk.red('   FAIL (Handled too perfectly?)'));
                        this.summary.failed++;
                    }
                }
            }

            // Take screenshot on failure
            if (result['Status'] === 'Fail') {
                const screenshotPath = `test-reports/screenshots/${testCase['TC ID']}.png`;
                await page.screenshot({ path: screenshotPath });
                result['Screenshot'] = screenshotPath;
            }

        } catch (error) {
            console.log(chalk.red(`   ERROR: ${error.message}`));
            result['Status'] = 'Error';
            result['Error message'] = error.message;
            this.summary.errors++;

        } finally {
            const endTime = new Date();
            result['Execution time'] = `${endTime.getTime() - startTime.getTime()}ms`;
            this.testResults.push(result);
        }
    }

    async testRealTimeUpdate(page, inputSelector, outputSelector, inputText) {
        console.log(chalk.blue('  Testing real-time update...'));

        // Clear input and Focus
        await page.click(inputSelector);
        await page.fill(inputSelector, '');
        await page.waitForTimeout(1000);
        await page.click(inputSelector);

        let previousOutput = '';
        let updatesDetected = 0;

        // Type character by character
        for (let i = 0; i < inputText.length; i++) {
            await page.keyboard.press(inputText[i]);
            await page.waitForTimeout(500); // Wait for potential update

            const currentOutput = await page.textContent(outputSelector);
            // console.log(`    Typed '${inputText[i]}', Output: '${currentOutput}'`);

            if (currentOutput && currentOutput !== previousOutput) {
                updatesDetected++;
                previousOutput = currentOutput;
            }
        }

        // Final check after typing everything (especially space)
        await page.waitForTimeout(1000);
        const finalOutput = await page.textContent(outputSelector);
        if (finalOutput && finalOutput !== previousOutput) {
            updatesDetected++;
        }

        if (updatesDetected > 0) {
            console.log(chalk.green(`  Real-time updates detected: ${updatesDetected} times`));
            return true;
        } else {
            console.log(chalk.red('  No real-time updates detected'));
            // Debug final state
            const finalHtml = await page.innerHTML(outputSelector);
            console.log(chalk.gray(`    Final Output: '${finalOutput}'`));
            console.log(chalk.gray(`    Final HTML: '${finalHtml}'`));
            return false;
        }
    }

    async testClearFunctionality(page, inputSelector, outputSelector, inputText) {
        console.log(chalk.blue('  Testing clear functionality...'));

        // Enter text
        await page.fill(inputSelector, inputText);
        await page.waitForTimeout(1000);

        // Find and click clear button
        const clearButtons = await page.$$('button');
        let cleared = false;

        for (const button of clearButtons) {
            const text = await button.textContent();
            if (text.toLowerCase().includes('clear') || text === '×' || text === 'X') {
                await button.click();
                await page.waitForTimeout(500);

                const inputValue = await page.inputValue(inputSelector);
                if (inputValue === '') {
                    cleared = true;
                    break;
                }
            }
        }

        if (cleared) {
            console.log(chalk.green('   Clear functionality works'));
            return true;
        } else {
            console.log(chalk.yellow('   Clear button not found or not working'));
            return false;
        }
    }

    compareOutput(actual, expected, isPositive = true) {
        if (!actual || !expected) return false;

        if (isPositive) {
            const clean = (str) => str
                .replace(/[\u200B-\u200D\uFEFF]/g, '')
                .replace(/\s+/g, ' ')
                .trim()
                .replace(/[.]+$/, '');
            return clean(actual) === clean(expected);
        } else {
            // For negative tests, be more strict to catch issues (like multiple spaces)
            return actual.trim() === expected.trim();
        }
    }

    async generateReports() {
        this.summary.endTime = new Date();
        const totalTime = this.summary.endTime - this.summary.startTime;

        // Save results to Excel
        await this.saveResultsToExcel();

        // Generate HTML report
        await this.generateHTMLReport(totalTime);

        // Generate summary file
        await this.generateSummaryFile(totalTime);
    }

    async saveResultsToExcel() {
        const workbook = XLSX.readFile('test-data/test-cases.xlsx');

        // Update test cases sheet with results
        const ws = workbook.Sheets['Test cases'];
        const data = XLSX.utils.sheet_to_json(ws, { defval: '', header: 1 });

        // Update header row indices
        const header = data[0];
        const tcIdIndex = header.indexOf('TC ID');
        const actualIndex = header.indexOf('Actual output');
        const statusIndex = header.indexOf('Status');

        // Update each row with results
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const tcId = row[tcIdIndex];

            if (tcId) {
                const result = this.testResults.find(r => r['TC ID'] === tcId);
                if (result) {
                    if (actualIndex !== -1) row[actualIndex] = result['Actual output'];
                    if (statusIndex !== -1) row[statusIndex] = result['Status'];
                }
            }
        }

        const newWs = XLSX.utils.aoa_to_sheet(data);
        workbook.Sheets['Test cases'] = newWs;

        // Add results summary sheet
        const summaryData = [
            ['Test Execution Summary'],
            [''],
            ['Total Tests:', this.summary.total],
            ['Passed:', this.summary.passed],
            ['Failed:', this.summary.failed],
            ['Errors:', this.summary.errors],
            ['Pass Rate:', `${((this.summary.passed / this.summary.total) * 100).toFixed(2)}%`],
            ['Start Time:', this.summary.startTime.toISOString()],
            ['End Time:', this.summary.endTime.toISOString()],
            ['Total Duration:', `${(this.summary.endTime - this.summary.startTime) / 1000} seconds`]
        ];

        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summaryWs, 'Summary');

        XLSX.writeFile(workbook, 'results/test-results.xlsx');
        console.log(chalk.green('Results saved to results/test-results.xlsx'));
    }

    async generateHTMLReport(totalTime) {
        const passRate = ((this.summary.passed / this.summary.total) * 100).toFixed(2);
        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Test Execution Report</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    background-color: #f4f7f9; 
                    color: #333; 
                    margin: 0;
                    padding: 20px;
                }
                .container { 
                    max-width: 1100px; 
                    margin: 0 auto; 
                    background: #fff;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
                .summary { 
                    display: flex; 
                    justify-content: space-between;
                    background: #ecf0f1;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .summary-item { text-align: center; flex: 1; }
                .summary-item strong { display: block; font-size: 1.2em; color: #2980b9; }
                
                table { width: 100%; border-collapse: collapse; margin-top: 25px; }
                th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #34495e; color: white; font-weight: normal; }
                
                .status-pass { color: #27ae60; font-weight: bold; }
                .status-fail { color: #e74c3c; font-weight: bold; }
                
                code { 
                    background: #f8f8f8; 
                    padding: 2px 4px; 
                    border-radius: 3px; 
                    font-family: monospace;
                    font-size: 0.9em;
                }
                
                .screenshot-link { color: #3498db; text-decoration: none; }
                .screenshot-link:hover { text-decoration: underline; }
                
                .meta-info { font-size: 0.85em; color: #7f8c8d; margin-top: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Translation Test Results</h1>
                <div class="meta-info">
                    Execution Time: ${new Date().toLocaleString()} | 
                    Total Duration: ${(totalTime / 1000).toFixed(2)}s
                </div>

                <div class="summary">
                    <div class="summary-item">
                        <strong>${this.summary.total}</strong>
                        Total Tests
                    </div>
                    <div class="summary-item">
                        <strong style="color: #27ae60;">${this.summary.passed}</strong>
                        Passed
                    </div>
                    <div class="summary-item">
                        <strong style="color: #e74c3c;">${this.summary.failed + this.summary.errors}</strong>
                        Failed
                    </div>
                    <div class="summary-item">
                        <strong>${passRate}%</strong>
                        Pass Rate
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>TC ID</th>
                            <th>Test Name</th>
                            <th>Input Sample</th>
                            <th>Output Sample</th>
                            <th>Status</th>
                            <th>Artifacts</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.testResults.map(r => `
                        <tr>
                            <td>${r['TC ID']}</td>
                            <td>${r['Test case name']}</td>
                            <td><code>${r.Input.substring(0, 20)}${r.Input.length > 20 ? '...' : ''}</code></td>
                            <td><code>${(r['Actual output'] || '').substring(0, 20)}${(r['Actual output'] || '').length > 20 ? '...' : ''}</code></td>
                            <td class="status-${r.Status.toLowerCase().includes('pass') ? 'pass' : 'fail'}">
                                ${r.Status}
                            </td>
                            <td>
                                ${r.Screenshot ? `<a href="../${r.Screenshot}" target="_blank" class="screenshot-link">Screenshot</a>` : '-'}
                            </td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
        `;

        await fs.writeFile('results/execution-report.html', html);
        console.log(chalk.green(' HTML report generated: results/execution-report.html'));
    }

    async generateSummaryFile(totalTime) {
        const passRate = ((this.summary.passed / this.summary.total) * 100).toFixed(2);
        const summary = `
=============================================
        TRANSLATION SYSTEM TEST SUMMARY
=============================================
Execution Date: ${new Date().toLocaleString()}
Target System:  https://www.swifttranslator.com/
Environment:    Node.js ${process.version} / Playwright Chromium

---------------------------------------------
TEST STATISTICS
---------------------------------------------
Total Tests:      ${this.summary.total}
Passed:           ${this.summary.passed}
Failed/Errors:    ${this.summary.failed + this.summary.errors}
Pass Rate:        ${passRate}%
Duration:         ${(totalTime / 1000).toFixed(2)} seconds

---------------------------------------------
OUTPUT ARTIFACTS
---------------------------------------------
1. Excel Workbook: results/test-results.xlsx
2. HTML Report:     results/execution-report.html
3. Screenshots:     test-reports/screenshots/
4. Videos:          test-reports/videos/

---------------------------------------------
DETAILED RESULTS BY CASE
---------------------------------------------
${this.testResults.map((r, i) =>
            `${String(i + 1).padStart(2, '0')}. [${r['TC ID']}] ${r.Status.padEnd(6)} | ${r['Test case name']}`
        ).join('\n')}

=============================================
             END OF EXECUTION
=============================================
`;

        await fs.writeFile('results/execution-summary.txt', summary);
    }

    displaySummary() {
        console.log(chalk.cyan('\n' + '='.repeat(60)));
        console.log(chalk.cyan.bold('TEST EXECUTION COMPLETE'));
        console.log(chalk.cyan('='.repeat(60)));

        console.log(chalk.blue.bold('\nSUMMARY:'));
        console.log(chalk.green(`  Passed: ${this.summary.passed}`));
        console.log(chalk.red(`  Failed: ${this.summary.failed}`));
        console.log(chalk.yellow(`  Errors: ${this.summary.errors}`));
        console.log(chalk.blue(`  Total: ${this.summary.total}`));

        const passRate = (this.summary.passed / this.summary.total) * 100;
        console.log(chalk.magenta(`  Pass Rate: ${passRate.toFixed(2)}%`));

        const duration = (this.summary.endTime - this.summary.startTime) / 1000;
        console.log(chalk.cyan(`  Duration: ${duration.toFixed(2)} seconds`));

        console.log(chalk.cyan('\nOUTPUT FILES:'));
        console.log(chalk.white('  1. results/test-results.xlsx'));
        console.log(chalk.white('  2. results/execution-report.html'));
        console.log(chalk.white('  3. results/execution-summary.txt'));

        console.log(chalk.cyan('\n' + '='.repeat(60)));
    }
}

// Main execution
(async () => {
    try {
        const runner = new TestRunner();
        await runner.initialize();
        await runner.runTests();
    } catch (error) {
        console.error(chalk.red(`Fatal error: ${error.message}`));
        process.exit(1);
    }
})();