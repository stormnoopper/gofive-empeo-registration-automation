import { expect, type Locator, type Page } from '@playwright/test';

export type PasswordRule = 'Aa' | '123' | '8 ตัวอักษรขึ้นไป';

export class CreatePasswordPage {
  static readonly url = /\/Register\/empeo\/create-password\?token=/;

  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly successHeading: Locator;
  readonly startButton: Locator;

  constructor(readonly page: Page) {
    this.passwordInput = page.getByTestId('input_textfield_input_input_password_crate_password_password');
    this.confirmPasswordInput = page.getByTestId('input_textfield_input_input_password_crate_password_confirm_password');
    this.submitButton = page.getByTestId('button_button_create_password_btn_next');
    this.successHeading = page.getByText('empeo พร้อมใช้งานแล้ว!', { exact: true });
    this.startButton = page.getByText('เริ่มต้นใช้งาน', { exact: true });
  }

  rule(name: PasswordRule): Locator {
    return this.page.locator('.condition-item').filter({ hasText: name });
  }

  ruleSatisfied(name: PasswordRule): Locator {
    return this.rule(name).locator('.gf-icon-checkbox');
  }

  async waitForPage() {
    await expect(this.page).toHaveURL(CreatePasswordPage.url, { timeout: 90_000 });
    await expect(this.passwordInput).toBeEditable();
  }

  async fill(password: string, confirm = password) {
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirm);
    await this.confirmPasswordInput.blur();
  }

  async submit() {
    await this.submitButton.click();
    await expect(this.successHeading).toBeVisible({ timeout: 45_000 });
  }
}
