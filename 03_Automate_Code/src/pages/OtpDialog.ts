import { expect, type Locator, type Page, type Response } from '@playwright/test';

const Api = {
  verifyOtp: /\/api\/v2\/register\/verify-otp/i,
  resendOtp: /\/api\/register\/empeo\/resend-otp/i,
} as const;

export class OtpDialog {
  static readonly api = Api;

  readonly root: Locator;
  readonly digits: Locator;
  readonly verifyButton: Locator;
  readonly resendButton: Locator;
  readonly countdown: Locator;
  readonly reference: Locator;
  readonly errorPopup: Locator;
  readonly errorPopupConfirm: Locator;

  constructor(readonly page: Page) {
    this.root = page.locator('go5-dialog').filter({ has: page.getByTestId('input_text_registration_otp_Config') });
    this.digits = page.getByTestId('input_text_registration_otp_Config').locator('input');
    this.verifyButton = page.getByTestId('button_button_registration_verify');
    this.resendButton = page.getByTestId('button_button_registration_otp_resend');
    this.countdown = this.root.getByText(/รับ OTP ใหม่อีกครั้งได้ใน \d+:\d{2}/);
    this.reference = this.root.getByText(/ref:\s*\d+/);
    this.errorPopup = page.locator('.swal2-popup');
    this.errorPopupConfirm = page.locator('.swal2-confirm');
  }

  async expectOpen() {
    await expect(this.digits).toHaveCount(6);
    await expect(this.digits.first()).toBeVisible();
  }

  async referenceId(): Promise<string> {
    return (await this.reference.innerText()).match(/ref:\s*(\d+)/)?.[1] ?? '';
  }

  async enter(code: string) {
    await this.digits.first().click();
    await this.page.keyboard.type(code);
  }

  async value(): Promise<string> {
    return (await this.digits.evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value))).join('');
  }

  async verify(code: string): Promise<Response> {
    await this.enter(code);
    const response = this.page.waitForResponse((r) => Api.verifyOtp.test(r.url()), { timeout: 90_000 });
    await this.verifyButton.click();
    return response;
  }

  async resend(): Promise<Response> {
    await expect(this.resendButton).toBeVisible({ timeout: 45_000 });
    const response = this.page.waitForResponse((r) => Api.resendOtp.test(r.url()));
    await this.resendButton.click();
    return response;
  }

  async dismissErrorPopup() {
    await this.errorPopupConfirm.click();
    await expect(this.errorPopup).toBeHidden();
  }
}
