import { test, expect } from '../src/fixtures/test';
import { Messages } from '../src/data/messages';
import { buildRegistrant, maskPhone, toE164 } from '../src/data/registrant';
import { OtpDialog } from '../src/pages/OtpDialog';
import { env } from '../src/config/env';

test.describe('Registration end-to-end on UAT @e2e', () => {
  test.describe.configure({ mode: 'default' });

  test('REG-E2E-01 register with promo code, verify OTP and set password @smoke', async ({ registerPage, otpDialog, createPasswordPage }) => {
    test.setTimeout(240_000);
    const registrant = buildRegistrant({ promoCode: env.promoCode });

    await test.step('Fill the registration form', async () => {
      await registerPage.fill(registrant);
      await expect(registerPage.appliedCoupon(env.promoCode)).toBeVisible();
    });

    await test.step('Submit and receive OTP', async () => {
      const registration = await registerPage.submitAndWaitForRegistration();
      expect(registration.ok()).toBeTruthy();
      expect(registration.request().postDataJSON()).toMatchObject({
        isThaiCompany: false,
        companyName: registrant.company,
        email: registrant.email,
        firstName: registrant.firstName,
        lastName: registrant.lastName,
        phone: toE164(registrant.phone),
        couponCode: env.promoCode,
      });
      await otpDialog.expectOpen();
      await expect(otpDialog.root.getByText(Messages.otp.sentTo(maskPhone(registrant.phone)))).toBeVisible();
    });

    await test.step('Verify OTP', async () => {
      const verification = await otpDialog.verify(env.otp);
      expect((await verification.json()).data).toMatchObject({ isValid: true });
      await createPasswordPage.waitForPage();
    });

    await test.step('Password rules gate the submit button', async () => {
      await createPasswordPage.fill('abc');
      await expect(createPasswordPage.submitButton).toBeDisabled();
      await createPasswordPage.fill(env.password.toLowerCase());
      await expect(createPasswordPage.ruleSatisfied('Aa')).toHaveCount(0);
      await expect(createPasswordPage.submitButton).toBeDisabled();
      await createPasswordPage.fill(env.password);
      for (const rule of ['Aa', '123', '8 ตัวอักษรขึ้นไป'] as const) {
        await expect(createPasswordPage.ruleSatisfied(rule)).toBeVisible();
      }
      await expect(createPasswordPage.submitButton).toBeEnabled();
    });

    await test.step('Set password and land on the success page', async () => {
      await createPasswordPage.submit();
      await expect(createPasswordPage.startButton).toBeVisible();
      await test.info().attach('registration-success', { body: await createPasswordPage.page.screenshot(), contentType: 'image/png' });
    });
  });
});

test.describe('OTP verification @e2e', () => {
  test.beforeEach(async ({ registerPage, otpDialog }) => {
    await registerPage.fill(buildRegistrant());
    const registration = await registerPage.submitAndWaitForRegistration();
    expect(registration.ok()).toBeTruthy();
    await otpDialog.expectOpen();
  });

  test('REG-OTP-01 dialog shows masked phone, reference and countdown', async ({ otpDialog }) => {
    await expect(otpDialog.root.getByText(Messages.otp.title)).toBeVisible();
    await expect(otpDialog.root.getByText(Messages.otp.sentTo(maskPhone(env.phone)))).toBeVisible();
    await expect(otpDialog.reference).toBeVisible();
    await expect(otpDialog.countdown).toBeVisible();
    await expect(otpDialog.resendButton).toBeHidden();
  });

  test('REG-OTP-02 verify button stays disabled until all 6 digits are entered', async ({ otpDialog }) => {
    await expect(otpDialog.verifyButton).toBeDisabled();
    await otpDialog.enter('12345');
    await expect(otpDialog.verifyButton).toBeDisabled();
    await otpDialog.page.keyboard.type('6');
    await expect(otpDialog.verifyButton).toBeEnabled();
  });

  test('REG-OTP-03 non-numeric characters are not accepted', async ({ otpDialog }) => {
    await otpDialog.enter('abcdef');
    expect(await otpDialog.value()).toBe('');
    await expect(otpDialog.verifyButton).toBeDisabled();
  });

  test('REG-OTP-04 wrong OTP is rejected and the inputs are cleared', async ({ otpDialog, page }) => {
    const verification = await otpDialog.verify('000000');

    expect((await verification.json()).data?.isValid).not.toBe(true);
    await expect(page.getByText(Messages.otp.invalid)).toBeVisible();
    await expect.poll(() => otpDialog.value()).toBe('');
    await expect(page).toHaveURL(/\/Register\/empeo$/);
  });

  test('REG-OTP-05 resend issues a new reference and restarts the countdown', async ({ otpDialog }) => {
    test.setTimeout(120_000);
    const before = await otpDialog.referenceId();

    const resend = await otpDialog.resend();

    expect(resend.ok()).toBeTruthy();
    await expect.poll(() => otpDialog.referenceId()).not.toBe(before);
    await expect(otpDialog.countdown).toBeVisible();
  });

  test('REG-OTP-06 expired OTP shows an error and keeps the dialog open (stubbed API)', async ({ otpDialog, page }) => {
    await page.route(OtpDialog.api.verifyOtp, (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          status: { code: 4001, customMessage: '', description: 'Business error with  1 errors.' },
          data: { subCode: 'E4002', description: 'OTP has expired.', metaData: {}, customMessage: '' },
        }),
      }),
    );

    await otpDialog.verify(env.otp);

    await expect(otpDialog.errorPopup).toBeVisible();
    await otpDialog.dismissErrorPopup();
    await otpDialog.expectOpen();
    await expect(page).toHaveURL(/\/Register\/empeo$/);
  });
});
