import { test, expect } from '../src/fixtures/test';
import { Messages } from '../src/data/messages';
import { RegisterPage } from '../src/pages/RegisterPage';
import { env } from '../src/config/env';

test.describe('Promo code', () => {
  test('REG-PRM-01 valid promo code is accepted and shown as applied @smoke', async ({ registerPage }) => {
    const response = await registerPage.applyCoupon(env.promoCode);
    const body = await response.json();

    expect(response.ok()).toBeTruthy();
    expect(body.data).toMatchObject({ isValid: true, couponCode: env.promoCode });
    await expect(registerPage.appliedCoupon(env.promoCode)).toBeVisible();
    await expect(registerPage.error(Messages.invalid.coupon)).toBeHidden();
  });

  test('REG-PRM-02 promo code is case-insensitive', async ({ registerPage }) => {
    const code = env.promoCode.toLowerCase();
    const response = await registerPage.applyCoupon(code);

    expect((await response.json()).data).toMatchObject({ isValid: true, couponCode: env.promoCode });
    await expect(registerPage.appliedCoupon(code)).toBeVisible();
  });

  for (const code of ['INVALID99', 'FREE15DAYX']) {
    test(`REG-PRM-03 unknown promo code "${code}" is rejected`, async ({ registerPage }) => {
      const response = await registerPage.applyCoupon(code);

      expect(response.status()).toBe(400);
      await expect(registerPage.error(Messages.invalid.coupon)).toBeVisible();
      await expect(registerPage.couponInput).toBeVisible();
    });
  }

  test('REG-PRM-08 special-character promo code is rejected without applying', async ({ registerPage }) => {
    await registerPage.openCouponInput();
    await registerPage.couponInput.fill('!@#$%');
    await registerPage.couponApplyButton.click();

    await expect(registerPage.appliedCoupon('!@#$%')).toBeHidden();
    await expect(registerPage.couponInput).toBeVisible();
  });

  test('REG-PRM-04 applied promo code can be removed', async ({ registerPage }) => {
    await registerPage.applyCoupon(env.promoCode);
    await expect(registerPage.appliedCoupon(env.promoCode)).toBeVisible();

    await registerPage.removeCoupon();

    await expect(registerPage.appliedCoupon(env.promoCode)).toBeHidden();
    await expect(registerPage.couponInput).toBeVisible();
  });

  test('REG-PRM-05 promo code input is capped at 50 characters', async ({ registerPage }) => {
    await registerPage.openCouponInput();
    await registerPage.couponInput.fill('X'.repeat(80));
    await expect(registerPage.couponInput).toHaveValue('X'.repeat(50));
  });

  test('REG-PRM-06 exhausted / reused promo code is rejected (stubbed API)', async ({ registerPage, page }) => {
    await page.route(RegisterPage.api.couponValidation, (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          status: { code: 4001, customMessage: '', description: 'Business error with  1 errors.' },
          data: { subCode: 'E1104', description: 'Coupon usage limit reached.', metaData: { couponCode: '' }, customMessage: '' },
        }),
      }),
    );

    await registerPage.applyCoupon('USEDCODE01');

    await expect(registerPage.error(Messages.invalid.coupon)).toBeVisible();
    await expect(registerPage.appliedCoupon('USEDCODE01')).toBeHidden();
  });

  test('REG-PRM-07 coupon flagged isValid=false must not be applied (stubbed API)', async ({ registerPage, page }) => {
    test.fail(true, 'Known defect: UI applies the coupon even when API returns isValid=false');
    await page.route(RegisterPage.api.couponValidation, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: { code: 1000, customMessage: '', description: 'Success.' },
          data: { isValid: false, reason: 'Coupon usage limit reached', couponCode: 'USEDCODE02', isLock: false, isReferral: false },
        }),
      }),
    );

    await registerPage.applyCoupon('USEDCODE02');

    await expect(registerPage.appliedCoupon('USEDCODE02')).toBeHidden({ timeout: 3_000 });
  });
});
