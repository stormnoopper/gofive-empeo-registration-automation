import { test as base, expect } from '@playwright/test';
import { RegisterPage } from '../pages/RegisterPage';
import { OtpDialog } from '../pages/OtpDialog';
import { CreatePasswordPage } from '../pages/CreatePasswordPage';
import { env } from '../config/env';

const THIRD_PARTY =
  /google-analytics\.com|googletagmanager\.com|googlesyndication\.com|doubleclick\.net|googleadservices\.com|facebook\.(com|net)|heapanalytics\.com|hotjar|clarity\.ms|tiktok|zdassets|zopim|youtube\.com/i;

type Fixtures = {
  registerPage: RegisterPage;
  otpDialog: OtpDialog;
  createPasswordPage: CreatePasswordPage;
};

export const test = base.extend<Fixtures>({
  context: async ({ context }, use) => {
    await context.route(THIRD_PARTY, (route) => route.abort());
    await use(context);
  },
  page: async ({ page }, use) => {
    await use(page);
    if (env.recordVideo) await page.waitForTimeout(2_500);
  },
  registerPage: async ({ page }, use) => {
    const registerPage = new RegisterPage(page);
    await registerPage.open();
    await use(registerPage);
  },
  otpDialog: async ({ page }, use) => {
    await use(new OtpDialog(page));
  },
  createPasswordPage: async ({ page }, use) => {
    await use(new CreatePasswordPage(page));
  },
});

export { expect };
