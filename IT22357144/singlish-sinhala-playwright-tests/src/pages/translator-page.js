const { expect } = require('@playwright/test');

class TranslatorPage {
    constructor(page) {
        this.page = page;
    }

    async goto() {
        await this.page.goto('https://www.swifttranslator.com/');
    }

    async enterSinglishText(text) {
        const inputSelector = 'textarea[placeholder="Input Your Singlish Text Here."], textarea';
        const locator = this.page.locator(inputSelector).first();
        await locator.click();
        await locator.fill('');
        await this.page.waitForTimeout(500);
        await locator.fill(text);
    }

    async getSinhalaOutput() {
        const outputSelector = 'div.w-full.h-80.bg-slate-50.whitespace-pre-wrap';
        const locator = this.page.locator(outputSelector);
        try {
            await expect(locator).not.toBeEmpty({ timeout: 5000 });
        } catch (e) { }
        const output = await locator.textContent();
        return output?.trim() || '';
    }

    async clearInput() {
        const clearBtn = await this.page.$('button:has-text("Clear"), button:has-text("×"), button:has-text("X")');
        if (clearBtn) {
            await clearBtn.click();
        } else {
            const inputSelector = 'textarea';
            await this.page.fill(inputSelector, '');
        }
    }
}

module.exports = { TranslatorPage };
