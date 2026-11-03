import { test, expect } from '../src/fixtures/test';
import { Messages } from '../src/data/messages';
import { buildRegistrant, uniqueId } from '../src/data/registrant';
import { env } from '../src/config/env';

test.describe('Registration form - required fields', () => {
  test('REG-VAL-01 empty submit (Thai company) shows every required-field error @smoke', async ({ registerPage }) => {
    await registerPage.submit();

    for (const message of [
      Messages.required.taxIdOrCompany,
      Messages.required.businessType,
      Messages.required.userAmount,
      Messages.required.email,
      Messages.required.firstName,
      Messages.required.lastName,
      Messages.required.phone,
      Messages.required.consent,
    ]) {
      await expect(registerPage.error(message)).toBeVisible();
    }
    await expect(registerPage.page).toHaveURL(/\/Register\/empeo/);
  });

  test('REG-VAL-02 empty submit (Others) asks for company name', async ({ registerPage }) => {
    await registerPage.chooseCompanyType('others');
    await registerPage.submit();

    await expect(registerPage.error(Messages.required.allRequired)).toBeVisible();
    await expect(registerPage.error(Messages.required.email)).toBeVisible();
  });

  test('REG-VAL-03 all fields valid except consent blocks submission', async ({ registerPage }) => {
    const submissions = registerPage.blockSubmissions();
    await registerPage.fill(buildRegistrant(), { acceptConsent: false });
    await registerPage.submit();

    await expect(registerPage.consentCheckbox).not.toBeChecked();
    await expect(registerPage.page).toHaveURL(/\/Register\/empeo/);
    expect(submissions).toHaveLength(0);
  });

  test('REG-VAL-05 consent error is shown when only consent is missing', async ({ registerPage }) => {
    test.fail(true, 'Known defect: submit is silently ignored, consent message is not displayed');
    registerPage.blockSubmissions();
    await registerPage.fill(buildRegistrant(), { acceptConsent: false });
    await registerPage.submit();

    await expect(registerPage.error(Messages.required.consent)).toBeVisible({ timeout: 3_000 });
  });

  test('REG-VAL-04 required errors clear once valid data is entered', async ({ registerPage }) => {
    await registerPage.submit();
    await expect(registerPage.error(Messages.required.email)).toBeVisible();

    await registerPage.fill(buildRegistrant());

    await expect(registerPage.visibleErrors()).toHaveCount(0);
  });
});

test.describe('Registration form - company type', () => {
  test('REG-CMP-01 switching company type toggles tax search and company name inputs', async ({ registerPage }) => {
    await expect(registerPage.taxSearchInput).toBeVisible();
    await expect(registerPage.companyNameInput).toBeHidden();

    await registerPage.chooseCompanyType('others');
    await expect(registerPage.taxSearchInput).toBeHidden();

    await registerPage.chooseCompanyType('thai');
    await expect(registerPage.companyNameInput).toBeHidden();
  });

  test('REG-CMP-02 tax search by company name returns DBD record and fills tax ID', async ({ registerPage }) => {
    await registerPage.searchTaxId('โกไฟว์');
    await registerPage.selectFirstTaxResult('บริษัท โกไฟว์ จำกัด');

    await expect(registerPage.taxSearchInput).toHaveValue('0745561010054');
  });
});

test.describe('Registration form - email', () => {
  const malformedEmails = [
    { label: 'no at-sign', build: () => 'abc' },
    { label: 'no top-level domain', build: () => 'a@b' },
    { label: 'double at-sign', build: () => `user@@qa${uniqueId()}.com` },
    { label: 'leading space', build: () => ` spaced@qa${uniqueId()}.com` },
  ];

  for (const { label, build } of malformedEmails) {
    test(`REG-VAL-10 rejects malformed email (${label})`, async ({ registerPage }) => {
      await registerPage.fillEmail(build());
      await expect(registerPage.error(Messages.invalid.email)).toBeVisible();
    });
  }

  test('REG-VAL-11 accepts a well-formed, unused email', async ({ registerPage }) => {
    await registerPage.fillEmail(buildRegistrant().email);
    await expect(registerPage.error(Messages.invalid.email)).toBeHidden();
    await expect(registerPage.error(Messages.duplicate.email)).toBeHidden();
  });

  test('REG-VAL-12 rejects an email that already has an account', async ({ registerPage }) => {
    await registerPage.fillEmail(env.registeredEmail);
    await expect(registerPage.error(Messages.duplicate.email)).toBeVisible();
  });

  test('REG-VAL-13 rejects a new email on a company domain that is already registered', async ({ registerPage }) => {
    await registerPage.fillEmail(`qa.${uniqueId()}@${env.registeredDomain}`);
    await expect(registerPage.error(Messages.duplicate.domain)).toBeVisible();
  });

  test('REG-VAL-14 accepts a new email on a public mail provider domain', async ({ registerPage }) => {
    await registerPage.fillEmail(`qa.${uniqueId()}@gmail.com`);
    await expect(registerPage.visibleErrors()).toHaveCount(0);
  });
});

test.describe('Registration form - mobile number', () => {
  for (const phone of ['096769070', '09676907081', '1234567890', 'abcdef']) {
    test(`REG-VAL-20 rejects invalid mobile number "${phone}"`, async ({ registerPage }) => {
      await registerPage.fillPhone(phone);
      await expect(registerPage.error(Messages.invalid.phone)).toBeVisible();
    });
  }

  for (const phone of [env.phone, env.phone.replace(/^0/, '')]) {
    test(`REG-VAL-21 accepts valid Thai mobile number "${phone}"`, async ({ registerPage }) => {
      await registerPage.fillPhone(phone);
      await expect(registerPage.error(Messages.invalid.phone)).toBeHidden();
    });
  }
});

test.describe('Registration form - field length limits', () => {
  const overflow = 'a'.repeat(300);
  const limits = [
    { field: 'email', max: 150 },
    { field: 'firstName', max: 255 },
    { field: 'lastName', max: 255 },
    { field: 'phone', max: 15 },
  ] as const;

  for (const { field, max } of limits) {
    test(`REG-VAL-30 ${field} is capped at ${max} characters`, async ({ registerPage }) => {
      const input = {
        email: registerPage.emailInput,
        firstName: registerPage.firstNameInput,
        lastName: registerPage.lastNameInput,
        phone: registerPage.phoneInput,
      }[field];
      await input.fill(overflow);
      await expect(input).toHaveValue(overflow.slice(0, max));
    });
  }

  test('REG-VAL-31 company name (Others) is capped at 255 characters', async ({ registerPage }) => {
    await registerPage.chooseCompanyType('others');
    await registerPage.companyNameInput.fill(overflow);
    await expect(registerPage.companyNameInput).toHaveValue(overflow.slice(0, 255));
  });
});
