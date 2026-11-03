import { expect, type Locator, type Page, type Response } from '@playwright/test';
import type { CompanyType, Registrant } from '../data/registrant';
import { env } from '../config/env';

const Api = {
  masterData: /\/api\/register\/additional-information/i,
  register: /\/api\/v2\/register$/i,
  duplicateEmail: /\/api\/v2\/register\/DuplicateEmail/i,
  couponValidation: /\/api\/Register\/coupon-validation/i,
  taxSearch: /\/api\/register\/tax-search/i,
  backend: `${env.apiBaseUrl}/api/**`,
  validators: /coupon-validation|DuplicateEmail|duplicateInfo/i,
} as const;

export class RegisterPage {
  static readonly path = '/Register/empeo';
  static readonly api = Api;

  readonly form: Locator;
  readonly thaiCompanyRadio: Locator;
  readonly otherCompanyRadio: Locator;
  readonly taxSearchInput: Locator;
  readonly companyNameInput: Locator;
  readonly businessTypeDropdown: Locator;
  readonly userAmountDropdown: Locator;
  readonly emailInput: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly phoneInput: Locator;
  readonly couponToggle: Locator;
  readonly couponInput: Locator;
  readonly couponApplyButton: Locator;
  readonly couponBox: Locator;
  readonly couponRemoveButton: Locator;
  readonly consentCheckbox: Locator;
  readonly submitButton: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator('form');
    this.thaiCompanyRadio = page.getByTestId('input_radio_registration_company_thai');
    this.otherCompanyRadio = page.getByTestId('input_radio_registration_company_others');
    this.taxSearchInput = page.getByTestId('input_textfield_input_registration_tax_id');
    this.companyNameInput = page.getByTestId('input_textfield_input_register_company_name');
    this.businessTypeDropdown = page.getByTestId('dropdown_selection_registration_company_type');
    this.userAmountDropdown = page.getByTestId('dropdown_selection_registration_user_amount');
    this.emailInput = page.getByTestId('input_textfield_input_registration_email');
    this.firstNameInput = page.getByTestId('input_textfield_input_register_first_name');
    this.lastNameInput = page.getByTestId('input_textfield_input_register_last_name');
    this.phoneInput = page.locator('input#phone');
    this.couponToggle = page.getByTestId('input_button_registration_register_ticket_got_coupon');
    this.couponInput = page.getByTestId('input_text_registration_coupon_code');
    this.couponApplyButton = page.getByTestId('input_button_registration_btn_apply');
    this.couponBox = page.locator('.form-coupon-code');
    this.couponRemoveButton = this.couponBox.locator('.gf-icon-close');
    this.consentCheckbox = page.getByTestId('input_checkbox_registration_checkbox');
    this.submitButton = page.getByTestId('button_submit_registration_try_for_free');
  }

  async open() {
    const masterData = this.page.waitForResponse((r) => Api.masterData.test(r.url()) && r.ok());
    await this.page.goto(RegisterPage.path);
    await masterData;
    await expect(this.emailInput).toBeEditable();
  }

  error(message: string): Locator {
    return this.form.getByText(message, { exact: true }).filter({ visible: true });
  }

  visibleErrors(): Locator {
    return this.form.locator('.e-error, [data-testid="error_message_text"]').filter({ visible: true });
  }

  dropdownOption(text: string): Locator {
    return this.page.locator('go5-dropdown-item').filter({ visible: true }).getByText(text, { exact: true });
  }

  appliedCoupon(code: string): Locator {
    return this.couponBox.getByText(code, { exact: true });
  }

  async chooseCompanyType(type: CompanyType) {
    if (type === 'others') {
      await this.otherCompanyRadio.click();
      await expect(this.companyNameInput).toBeVisible();
    } else {
      await this.thaiCompanyRadio.click();
      await expect(this.taxSearchInput).toBeVisible();
    }
  }

  async searchTaxId(keyword: string) {
    const search = this.page.waitForResponse((r) => Api.taxSearch.test(r.url()));
    await this.taxSearchInput.fill(keyword);
    await search;
  }

  async selectFirstTaxResult(companyName: string) {
    await this.page.locator('go5-dropdown-item').filter({ hasText: companyName }).first().click();
  }

  async selectBusinessType(text: string) {
    await this.businessTypeDropdown.click();
    await this.dropdownOption(text).click();
    await expect(this.businessTypeDropdown).toContainText(text);
  }

  async selectUserAmount(text: string) {
    await this.userAmountDropdown.click();
    await this.dropdownOption(text).click();
    await expect(this.userAmountDropdown).toContainText(text);
  }

  async fillEmail(email: string) {
    const check = this.page.waitForResponse((r) => Api.duplicateEmail.test(r.url()));
    await this.emailInput.fill(email);
    await this.emailInput.blur();
    await check;
  }

  async fillPhone(phone: string) {
    await this.phoneInput.fill(phone);
    await this.phoneInput.blur();
  }

  async openCouponInput() {
    if (await this.couponToggle.isVisible()) await this.couponToggle.click();
    await expect(this.couponInput).toBeVisible();
  }

  async applyCoupon(code: string) {
    await this.openCouponInput();
    await this.couponInput.fill(code);
    const validation = this.page.waitForResponse((r) => Api.couponValidation.test(r.url()));
    await this.couponApplyButton.click();
    return validation;
  }

  async removeCoupon() {
    await this.couponRemoveButton.click();
  }

  async acceptConsent() {
    await this.consentCheckbox.check();
  }

  async fill(registrant: Registrant, { acceptConsent = true } = {}) {
    await this.chooseCompanyType(registrant.companyType);
    if (registrant.companyType === 'others') {
      await this.companyNameInput.fill(registrant.company);
    } else {
      await this.searchTaxId(registrant.company);
      await this.selectFirstTaxResult(registrant.company);
    }
    await this.selectBusinessType(registrant.businessType);
    await this.selectUserAmount(registrant.userAmount);
    await this.fillEmail(registrant.email);
    await this.firstNameInput.fill(registrant.firstName);
    await this.lastNameInput.fill(registrant.lastName);
    await this.fillPhone(registrant.phone);
    if (registrant.promoCode) await this.applyCoupon(registrant.promoCode);
    if (acceptConsent) await this.acceptConsent();
  }

  blockSubmissions(): string[] {
    const blocked: string[] = [];
    void this.page.route(Api.backend, (route) => {
      const request = route.request();
      if (request.method() === 'GET' || Api.validators.test(request.url())) return route.continue();
      blocked.push(`${request.method()} ${request.url()}`);
      return route.abort();
    });
    return blocked;
  }

  async submit() {
    await expect(this.form).not.toHaveClass(/ng-pending/);
    await this.submitButton.click();
  }

  async submitAndWaitForRegistration(): Promise<Response> {
    const registration = this.page.waitForResponse((r) => Api.register.test(r.url()) && r.request().method() === 'POST');
    await this.submit();
    return registration;
  }
}
