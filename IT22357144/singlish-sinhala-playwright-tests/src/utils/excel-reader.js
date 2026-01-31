const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

class ExcelReader {
    constructor(filePath) {
        this.filePath = path.resolve(filePath);
    }

    getTestCases() {
        try {
            if (!fs.existsSync(this.filePath)) {
                throw new Error(`File not found: ${this.filePath}`);
            }

            const workbook = XLSX.readFile(this.filePath);
            const sheetName = 'Test cases';

            if (!workbook.Sheets[sheetName]) {
                throw new Error(`Sheet '${sheetName}' not found in workbook`);
            }

            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

            // Filter and map data to match the expected format
            return data
                .filter(row => row['TC ID'] && row['TC ID'].trim() !== '')
                .map(row => ({
                    id: row['TC ID'],
                    name: row['Test case name'],
                    input: row['Input'],
                    expected: row['Expected output'],
                    type: (row['TC ID'].startsWith('Pos_Fun') || row['TC ID'].startsWith('Pos_UI')) ? 'Positive' : 'Negative',
                    // Normalize keys for easier access
                    ...row
                }));

        } catch (error) {
            console.error(`Error loading test cases: ${error.message}`);
            return [];
        }
    }
}

module.exports = ExcelReader;
