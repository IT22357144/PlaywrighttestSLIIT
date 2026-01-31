const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue.bold('Setting up IT3040 Assignment 1 Test Environment...\n'));

// Create directory structure
const directories = [
    'test-data',
    'tests/pages',
    'tests/utils',
    'results',
    'test-reports/screenshots',
    'test-reports/videos',
    'scripts'
];

directories.forEach(dir => {
    fs.ensureDirSync(dir);
    console.log(chalk.green(`Created directory: ${dir}`));
});

// Copy files
const filesToCreate = [
    {
        source: 'templates/test-cases.xlsx',
        dest: 'test-data/test-cases.xlsx'
    },
    {
        source: 'templates/README.md',
        dest: 'README.md'
    },
    {
        source: 'templates/.gitignore',
        dest: '.gitignore'
    }
];

filesToCreate.forEach(file => {
    if (fs.existsSync(file.source)) {
        fs.copySync(file.source, file.dest);
        console.log(chalk.green(`Copied: ${file.dest}`));
    }
});

// Run npm install
console.log(chalk.yellow('\n Installing dependencies...'));
try {
    execSync('npm install', { stdio: 'inherit' });
    console.log(chalk.green('Dependencies installed'));
} catch (error) {
    console.log(chalk.red('Error installing dependencies'));
}

// Install Playwright browsers
console.log(chalk.yellow('\n Installing Playwright browsers...'));
try {
    execSync('npx playwright install', { stdio: 'inherit' });
    console.log(chalk.green('Playwright browsers installed'));
} catch (error) {
    console.log(chalk.red('Error installing Playwright browsers'));
}

// Generate test cases
console.log(chalk.yellow('\nGenerating test cases...'));
try {
    // @ts-ignore
    const TestCaseManager = require('../utils/test-case');
    const manager = new TestCaseManager();
    manager.collectAllData();
    manager.saveToExcel('test-data/test-cases.xlsx');
    console.log(chalk.green('Test cases generated'));
} catch (error) {
    console.log(chalk.red(`Error generating test cases: ${error.message}`));
}

console.log(chalk.blue.bold('\nSetup completed successfully!'));
console.log(chalk.white('\nNext steps:'));
console.log(chalk.cyan('1. Review test cases in test-data/test-cases.xlsx'));
console.log(chalk.cyan('2. Run tests: npm test'));
console.log(chalk.cyan('3. Check results in results/ folder'));