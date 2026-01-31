# Singlish → Sinhala Translator (Playwright Tests)

Automated test suite for the Singlish-to-Sinhala translation website (https://www.swifttranslator.com/) using Playwright.

This repo includes:

- Excel-based test case generation (`test-data/test-cases.xlsx`)
- Playwright test suite execution + JSON report output
- Optional custom Node-based test runner (headed mode)

## Requirements

- Node.js 16+ (recommended: Node 18+)

## Project Structure (high level)

- `src/tests/playwright-tests.spec.js` → main Playwright tests
- `src/scripts/setup.js` → generates the Excel test data file and prepares folders
- `src/tests/test-runner.js` → custom Node runner (uses Playwright directly)
- `test-data/test-cases.xlsx` → generated test cases workbook
- `test-results.json` → Playwright JSON reporter output

## End-to-end: Setup → Run → Report

### 1) Install + generate test data

From the project root:

```bash
npm install
npx playwright install
npm run setup
```

What `npm run setup` does:

- Ensures required folders exist (e.g. `test-data`, `results`, `test-reports/...`)
- Generates `test-data/test-cases.xlsx` (required by the test suite)

### 2) Run the Playwright test suite

```bash
npm test
```

Notes:

- Tests run from `src/tests` (see `playwright.config.ts`)
- Default run is headless (`use.headless: true`)
- On failure, Playwright captures screenshots/videos based on config and test settings

### 3) View the Playwright report

```bash
npm run test:report
```

### 4) (Optional) Run the custom Node test runner

This runner reads the same Excel workbook and executes cases in a browser (headed, slow motion).

```bash
npm run test:runner
```

Or run it directly with Node (same thing):

```bash
node ./src/tests/test-runner.js
```

## Common Commands

```bash
# One-time setup (recommended after cloning)
npm run setup

# Run Playwright tests
npm test

# Show Playwright HTML report
npm run test:report

# Run custom Node-based runner
npm run test:runner

# Run custom Node-based runner (direct Node)
node ./src/tests/test-runner.js
```

## Output Files & Folders

- `test-data/test-cases.xlsx` → generated workbook with all test cases
- `test-results.json` → Playwright JSON reporter output
- `test-results/` → Playwright artifacts (screenshots, traces/videos depending on run)
- `results/` → custom runner reports (HTML/summary) when using `test:runner`
- `test-reports/` → videos/screenshots recorded by custom runner

## Troubleshooting

### “playwright is not recognized”

```bash
npm install
```

### “File not found: test-data/test-cases.xlsx”

```bash
npm run setup
```

## Configuration

- `playwright.config.ts` controls test directory, reporter output (`test-results.json`), headless/headed mode, timeouts, and artifact retention.
