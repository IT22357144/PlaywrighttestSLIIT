const XLSX = require('xlsx');
const fs = require('fs-extra');
const path = require('path');

class TestCaseManager {
    constructor(inputFile, outputFile) {
        this.inputFile = inputFile || "test-data/test-cases.xlsx";
        this.outputFile = outputFile || "test-data/test-cases.xlsx";
        this.workbook = null;
        this.testCases = [];
    }

    // Load existing Excel file
    loadWorkbook() {
        try {
            if (fs.existsSync(this.inputFile)) {
                this.workbook = XLSX.readFile(this.inputFile);
                console.log(`Loaded workbook from: ${this.inputFile}`);
            } else {
                console.log(`File not found, creating new workbook`);
                this.workbook = XLSX.utils.book_new();
            }
        } catch (error) {
            console.error(`Error loading workbook: ${error.message}`);
            this.workbook = XLSX.utils.book_new();
        }
    }

    // API for setup.js
    collectAllData() {
        this.generateAllTestCases();
    }

    // API for setup.js
    saveToExcel(filePath) {
        if (filePath) this.outputFile = filePath;

        // Prepare workbook if not already loaded or created
        if (!this.workbook) {
            this.workbook = XLSX.utils.book_new();
        }

        // Generate the sheets
        this.createTestCasesSheet();
        this.createInstructionSheets();
        this.createSummarySheet();

        // Save
        return this.saveWorkbook();
    }

    // Generate all required test cases
    generateAllTestCases() {
        console.log("Generating all required test cases...");

        // Clear existing test cases
        this.testCases = [];

        // 24 Positive Test Cases
        this.generatePositiveTestCases();

        // 10 Negative Test Cases  
        this.generateNegativeTestCases();

        // UI Test Case
        this.generateUITestCases();

        console.log(`Generated ${this.testCases.length} test cases total`);
    }

    generatePositiveTestCases() {
        const positiveCases = [
            {
                id: "Pos_Fun_0001",
                name: "Entrance of attendance in a Sri Lankan",
                length: "M",
                input: "mama gedhara yanawa, habayi vahi na nisa dhenma yanne naha",
                expected: "මම ගෙදර යනවා, හැබැයි වහින නිසා දැන්ම යන්නේ නෑ",
                justification: "Two clauses correctly joined. Conjunction 'habayi' properly rendered.",
                category: "Compound sentence\nWord combination / phrase pattern\nM (31–299 characters)\nAccuracy validation"
            },
            {
                id: "Pos_Fun_0002",
                name: "Condition of different sentences",
                length: "S",
                input: "vassa nathnam yanna epayi.",
                expected: "වැස්ස නැත්නම් යන්න එපයි.",
                justification: "Conditional logic preserved. Verb 'epayi' correctly converted.",
                category: "Complex sentence\nDaily language usage\nS (≤30 characters)\nAccuracy validation"
            },
            {
                id: "Pos_Fun_0003",
                name: "Direct command",
                length: "S",
                input: "israhata yana.",
                expected: "ඉස්සරහට යන්න.",
                justification: "Direct imperative correctly transliterated. No extra words.",
                category: "Imperative (command)\nDaily language usage\nS (≤30 characters)\nAccuracy validation"
            },
            {
                id: "Pos_Fun_0004",
                name: "Positive future tense",
                length: "S",
                input: "api heta ennam.",
                expected: "අපි හෙට එන්නම්.",
                justification: "Future tense correctly expressed. Plural pronoun 'api' properly rendered.",
                category: "Future tense\nInformal\nS (≤30 characters)\nAccuracy validation"
            },
            {
                id: "Pos_Fun_0005",
                name: "Negative present tense",
                length: "S",
                input: "api heta ennee naha.",
                expected: "අපි හෙට එන්නේ නැහැ.",
                justification: "Negation pattern correctly converted. Meaning preserved.",
                category: "Negative (affirmative form)\nPresent tense\nS (≤30 characters)\nAccuracy validation"
            },
            {
                id: "Pos_Fun_0006",
                name: "Common greeting with exclamation",
                length: "S",
                input: "ayubovan!",
                expected: "ආයුබෝවන්!",
                justification: "Standard greeting correctly transliterated. Exclamation retained.",
                category: "Simple sentence\nAccuracy validation\nS (≤30 characters)\nAccuracy validation"
            },
            {
                id: "Pos_Fun_0007",
                name: "Informal colloquial phrase",
                length: "S",
                input: "ayi, meka dhiyan",
                expected: "ඇයි, මේක දියන්.",
                justification: "Colloquial words correctly rendered. Informational tone preserved.",
                category: "Informal language\nS (≤30 characters)\nAccuracy validation"
            },
            {
                id: "Pos_Fun_0008",
                name: "Daily expression of feeling",
                length: "S",
                input: "karuNaakaralaa mata podi udhavvak karanna puLuvandha?",
                expected: "කරුණාකරලා මට පොඩි උදව්වක් කරන්න පුළුවන්ද?",
                justification: "Polite phrasing maintained.",
                category: "Polite phrasing\ninterrogative\nS (≤30 characters)\nAccuracy validation"
            },
            {
                id: "Pos_Fun_0009",
                name: "Informal command",
                length: "S",
                input: "eeka dhenna.",
                expected: "ඒක දෙන්න.",
                justification: "Casual tone converted.",
                category: "Informal phrasing\nimperative\nS (≤30 characters)\nAccuracy validation"
            },
            {
                id: "Pos_Fun_0010",
                name: "Day-to-day expression",
                length: "S",
                input: "mata nidhimathayi.",
                expected: "මට නිදිමතයි.",
                justification: "Common phrase accurate.",
                category: "Daily language\nSimple sentence\nS (≤30 characters)\nFormatting preservation"
            },
            {
                id: "Pos_Fun_0011",
                name: "Multi-word collocation",
                length: "S",
                input: "mata oona",
                expected: "මට ඕන",
                justification: "Frequent pair handled",
                category: "Word combination\nSimple sentence\nS (≤30 characters)\nFormatting preservation"
            },
            {
                id: "Pos_Fun_0012",
                name: "Proper spacing",
                length: "S",
                input: "mama gedhara yanawa.",
                expected: "මම ගෙදර යනවා.",
                justification: "Words segmented correctly",
                category: "Proper spacing\nS (≤30 characters)\nReal-time output update behavior"
            },
            {
                id: "Pos_Fun_0013",
                name: "Repeated emphasis",
                length: "S",
                input: "hari hari",
                expected: "හරි හරි",
                justification: "Duplication preserved.",
                category: "Repeated words\nSimple sentence\nS (≤30 characters)"
            },
            {
                id: "Pos_Fun_0014",
                name: "Past tense singular",
                length: "S",
                input: "mama iiyee gedhara giya.",
                expected: "මම ඊයේ ගෙදර ගියා.",
                justification: "Past form for singular pronoun.",
                category: "Past tense\nsingular pronoun\nS (≤30 characters)\nAccuracy validation"
            },
            {
                id: "Pos_Fun_0015",
                name: "Present plural",
                length: "S",
                input: "api kaeema kanawa.",
                expected: "අපි කෑම කනවා.",
                justification: "Plural pronoun correct.",
                category: "Present tense\nPlural usage\nS (≤30 characters)\nAccuracy validation"
            },
            {
                id: "Pos_Fun_0016",
                name: "Future plural",
                length: "S",
                input: "api yamu.",
                expected: "අපි යමු.",
                justification: "Group future action",
                category: "Future tense\nPlural pronoun\nS (≤30 characters)\nReal-time output update behavior"
            },
            {
                id: "Pos_Fun_0017",
                name: "Mixed English words",
                length: "M",
                input: "online class ekak thiyennee.",
                expected: "online class එකක් තියෙන්නේ.",
                justification: "online unchanged, rest converted.",
                category: "Mixed Singlish+English\ntechnical terms\nM (31–299 characters)\nRobustness validation"
            },
            {
                id: "Pos_Fun_0018",
                name: "Places and English words",
                length: "M",
                input: "mama Kandy yanna hadhannee.",
                expected: "මම Kandy යන්න හදන්නේ.",
                justification: "Kandy preserved.",
                category: "Mixed Singlish + English\nPresent tense\nM (31–299 characters)\nRobustness validation"
            },
            {
                id: "Pos_Fun_0019",
                name: "Abbreviations",
                length: "S",
                input: "LOL",
                expected: "LOL",
                justification: "Short forms intact",
                category: "English abbreviations\nWord combination\nS (≤30 characters)\nAccuracy validation"
            },
            {
                id: "Pos_Fun_0020",
                name: "Currency",
                length: "S",
                input: "Rs. 500",
                expected: "Rs. 500",
                justification: "Formats preserved.",
                category: "Currency\nS (≤30 characters)\nFormatting preservation"
            },
            {
                id: "Pos_Fun_0021",
                name: "Multiple spaces",
                length: "S",
                input: "mama gedhara yanawa.",
                expected: "මම ගෙදර යනවා.",
                justification: "Extra spaces handled.",
                category: "Formatting\nSimple sentence\nS (≤30 characters)\nAccuracy validation"
            },
            {
                id: "Pos_Fun_0022",
                name: "Long paragraph input",
                length: "L",
                input: "dhitvaa suLi kuNaatuva ... bimal rathnaayaka saDHahan kaLeeya.",
                expected: "දිට්වා සුළි කුණාටුව ... බිමල් රත්නායක සඳහන් කළේය.",
                justification: "Full text converted",
                category: "Informal language\nPast tense\nL (≥ 300 characters)\nFormatting preservation"
            },
            {
                id: "Pos_Fun_0023",
                name: "Punctuation variety",
                length: "S",
                input: "hari? (oyaa)",
                expected: "හරි? (ඔයා)",
                justification: "Marks preserved.",
                category: "Punctuation\nPronoun variation\nS (≤30 characters)\nFormatting preservation"
            },
            {
                id: "Pos_Fun_0024",
                name: "Interrogative sentence",
                length: "S",
                input: "oyaa kohomadha?",
                expected: "ඔයා කොහොමද?",
                justification: "Question form correctly converted.",
                category: "Interrogative\nSimple sentence\nS (≤30 characters)\nAccuracy validation"
            }
        ];

        this.testCases.push(...positiveCases);
    }

    generateNegativeTestCases() {
        const negativeCases = [
            {
                id: "Neg_Fun_0001",
                name: "Joined words no spaces",
                length: "S",
                input: "mamagedharayanawa",
                expected: "මම ගෙදර යනවා.",
                justification: "Incorrect segmentation or partial fail.",
                category: "Joined words\nPresent tense\nS (≤30 characters)\nrobustness"
            },
            {
                id: "Neg_Fun_0002",
                name: "Heavy slang",
                length: "S",
                input: "ela machan!",
                expected: "එළ මචං!",
                justification: "Slang not fully handled",
                category: "Slang / informal language\nSimple sentence\nS (≤30 characters)\nRobustness validation"
            },
            {
                id: "Neg_Fun_0003",
                name: "Chat shorthand",
                length: "S",
                input: "thnx bn!",
                expected: "thanks බං!",
                justification: "Unchanged or garbled per note",
                category: "Slang\nSimple sentence\nS (≤30 characters)\nRobustness validation"
            },
            {
                id: "Neg_Fun_0004",
                name: "No space",
                length: "M",
                input: "Oya gedara yanava.mamath enava",
                expected: "ඔයා ගෙදර යනවා.මමත් එනවා",
                justification: "Fail to convert rightly",
                category: "Formatting\nCompound sentence\nM (31–299 characters)\nFormatting preservation"
            },
            {
                id: "Neg_Fun_0005",
                name: "Sentence convert Inconsistent",
                length: "S",
                input: "mokakhari karapu wade",
                expected: "මොකක් හරි කරපු වැඩේ",
                justification: "System fail to join words correctly",
                category: "Informal language\nSimple sentence\nS (≤30 characters)\nRobustness validation"
            },
            {
                id: "Neg_Fun_0006",
                name: "Repeated slang emphasis",
                length: "S",
                input: "ayi mokadha wenne",
                expected: "ඇයි මොකද වෙන්නේ",
                justification: "Emphasis slang fails.",
                category: "Repeated slang\nSimple sentence\nS (≤30 characters)\nRobustness validation"
            },
            {
                id: "Neg_Fun_0007",
                name: "Abbreviations",
                length: "S",
                input: "LVMH",
                expected: "Love you so Much",
                justification: "Not preserved correctly.",
                category: "English abbreviations\nWord combination\nS (≤30 characters)\nRobustness validation"
            },
            {
                id: "Neg_Fun_0008",
                name: "Polite with slang",
                length: "S",
                input: "Please... kiyahanko",
                expected: "කරුණාකරලා... කියහන්කෝ",
                justification: "Mix fails.",
                category: "Slang\nSimple sentence\nS (≤30 characters)\nRobustness validation"
            },
            {
                id: "Neg_Fun_0009",
                name: "Negation with joined",
                length: "S",
                input: "kiyanne naha",
                expected: "කියන්නේ නෑ",
                justification: "Negation pattern broken.",
                category: "Daily language usage\nNegation\nS (≤30 characters)\nRobustness validation"
            },
            {
                id: "Neg_Fun_0010",
                name: "Mixed case English abbreviation",
                length: "S",
                input: "Hi oyaa hodindha?",
                expected: "hello ඔයාට කොහොමද",
                justification: "Fail to convert rightly",
                category: "Greeting\nSimple sentence\nS (≤30 characters)\nRobustness validation"
            }
        ];

        this.testCases.push(...negativeCases);
    }

    generateUITestCases() {
        const uiCases = [
            {
                id: "Pos_UI_0001",
                name: "Real-time output update",
                length: "S",
                input: "mama game yanava",
                expected: "මම ගෙදර යනවා",
                justification: "Output updates live without lag",
                category: "Formatting\nPresent tense\nS (≤30 characters)\nIssue handling / input validation"
            }
        ];

        this.testCases.push(...uiCases);
    }

    // Create Test Cases Sheet
    createTestCasesSheet() {
        console.log("Creating test cases sheet...");

        const header = [
            "TC ID",
            "Test case name",
            "Input length type",
            "Input",
            "Expected output",
            "Actual output",
            "Status",
            "Accuracy justification/ Description of issue type",
            "What is covered by the test"
        ];

        const data = [header];

        this.testCases.forEach(tc => {
            data.push([
                tc.id,
                tc.name,
                tc.length,
                tc.input,
                tc.expected,
                "",
                "",
                tc.justification,
                tc.category
            ]);
        });

        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const colWidths = [
            { wch: 12 }, { wch: 40 }, { wch: 15 }, { wch: 50 }, { wch: 50 },
            { wch: 50 }, { wch: 10 }, { wch: 80 }, { wch: 40 }
        ];
        worksheet['!cols'] = colWidths;

        if (this.workbook.Sheets["Test cases"]) {
            delete this.workbook.Sheets["Test cases"];
            this.workbook.SheetNames = this.workbook.SheetNames.filter(n => n !== "Test cases");
        }
        XLSX.utils.book_append_sheet(this.workbook, worksheet, "Test cases");
    }

    createInstructionSheets() {
        console.log("Creating instruction sheets...");
        const sheet2Data = [
            ["Test case ID conventions:"],
            ["1. Positive functional test cases should begin with 'Pos_Fun'"],
            ["2. Negative functional test cases should begin with 'Neg_Fun'"],
            ["3. UI test cases should begin with 'Pos_UI'"]
        ];
        const sheet2 = XLSX.utils.aoa_to_sheet(sheet2Data);
        if (this.workbook.Sheets["How to fill columns A and C"]) {
            delete this.workbook.Sheets["How to fill columns A and C"];
            this.workbook.SheetNames = this.workbook.SheetNames.filter(n => n !== "How to fill columns A and C");
        }
        XLSX.utils.book_append_sheet(this.workbook, sheet2, "How to fill columns A and C");
    }

    createSummarySheet() {
        console.log("Creating summary sheet...");
        const summaryData = [
            ["TEST COVERAGE SUMMARY"],
            ["Generated: " + new Date().toISOString()]
        ];
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        if (this.workbook.Sheets["Test Coverage Summary"]) {
            delete this.workbook.Sheets["Test Coverage Summary"];
            this.workbook.SheetNames = this.workbook.SheetNames.filter(n => n !== "Test Coverage Summary");
        }
        XLSX.utils.book_append_sheet(this.workbook, summarySheet, "Test Coverage Summary");
    }

    saveWorkbook() {
        try {
            const outputDir = path.dirname(this.outputFile);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            XLSX.writeFile(this.workbook, this.outputFile);
            console.log(`Workbook saved to: ${this.outputFile}`);
            return true;
        } catch (error) {
            console.error(`Error saving workbook: ${error.message}`);
            return false;
        }
    }

    execute() {
        this.loadWorkbook();
        this.generateAllTestCases();
        this.createTestCasesSheet();
        this.createInstructionSheets();
        this.createSummarySheet();
        this.saveWorkbook();
    }
}

// Run the updater
if (require.main === module) {
    const updater = new TestCaseManager();
    updater.execute();
}

module.exports = TestCaseManager;