const { chromium } = require('playwright');
const XLSX = require('xlsx');
const path = require('path');

async function updateActualOutputs() {
    console.log('Starting browser to collect actual translation outputs...');

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Load the Excel file
    const excelPath = path.join(__dirname, '../../test-data/test-cases.xlsx');
    const workbook = XLSX.readFile(excelPath);
    const worksheet = workbook.Sheets['Test cases'];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log(`Found ${data.length - 1} test cases to process`);

    // Navigate to the translator
    await page.goto('https://www.swifttranslator.com/');
    await page.waitForTimeout(2000);

    // Process each test case (skip header row)
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const testId = row[0];
        const input = row[3]; // Input column

        if (!input || input === '') {
            console.log(`Skipping ${testId} - no input`);
            continue;
        }

        console.log(`Processing ${testId}: "${input}"`);

        try {
            // Clear previous input
            const inputSelector = 'textarea[placeholder="Input Your Singlish Text Here."], textarea';
            const inputLocator = page.locator(inputSelector).first();
            await inputLocator.click();
            await inputLocator.fill('');
            await page.waitForTimeout(500);

            // Enter new text
            await inputLocator.fill(input);
            await page.waitForTimeout(2000); // Wait for translation

            // Get output
            const outputSelector = 'div.w-full.h-80.bg-slate-50.whitespace-pre-wrap';
            const outputLocator = page.locator(outputSelector);
            const actualOutput = await outputLocator.textContent();
            const trimmedOutput = actualOutput?.trim() || '';

            console.log(`  Actual output: "${trimmedOutput}"`);

            // Update the Excel data (Actual output is column F, index 5)
            data[i][5] = trimmedOutput;

            // Determine status (Pass/Fail) - column G, index 6
            const expectedOutput = row[4]; // Expected output column
            if (trimmedOutput === expectedOutput) {
                data[i][6] = 'Pass';
                console.log(`  ✓ PASS`);
            } else {
                data[i][6] = 'Fail';
                console.log(`  ✗ FAIL (Expected: "${expectedOutput}")`);
            }

        } catch (error) {
            console.error(`  Error processing ${testId}: ${error.message}`);
            data[i][5] = 'ERROR';
            data[i][6] = 'Fail';
        }

        // Small delay between tests
        await page.waitForTimeout(1000);
    }

    await browser.close();

    // Save updated Excel file
    console.log('\nSaving updated Excel file...');
    const newWorksheet = XLSX.utils.aoa_to_sheet(data);

    // Preserve column widths
    newWorksheet['!cols'] = [
        { wch: 12 }, { wch: 40 }, { wch: 15 }, { wch: 50 }, { wch: 50 },
        { wch: 50 }, { wch: 10 }, { wch: 80 }, { wch: 40 }
    ];

    workbook.Sheets['Test cases'] = newWorksheet;
    XLSX.writeFile(workbook, excelPath);

    console.log('✓ Excel file updated successfully!');

    // Print summary
    const passCount = data.slice(1).filter(row => row[6] === 'Pass').length;
    const failCount = data.slice(1).filter(row => row[6] === 'Fail').length;
    console.log(`\nSummary: ${passCount} passed, ${failCount} failed out of ${data.length - 1} tests`);
}

updateActualOutputs().catch(console.error);
