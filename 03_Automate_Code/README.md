# empeo Registration – Playwright Automation

Automation suite for the empeo registration flow (Gofive Automation Tester Exam 1.0).
Stack: **Playwright Test + TypeScript**, Page Object Model, Chromium.

- Test case design: [`../02_Testcase/TEST_CASES.xlsx`](../02_Testcase/TEST_CASES.xlsx) · [`../02_Testcase/TEST_CASES.md`](../02_Testcase/TEST_CASES.md)
- Demo video: [`../01_Demo/REG-E2E-01-happy-path.mp4`](../01_Demo/REG-E2E-01-happy-path.mp4)
- How to use + conclusion: [`../How_to_use_and_Conclusion.pdf`](../How_to_use_and_Conclusion.pdf)
- Target: https://portal.uat.gofive.co.th/Register/empeo

## Quick start

```bash
cd 03_Automate_Code
npm ci
npx playwright install chromium
npm test
npm run report
```

| Command | What it runs |
|---|---|
| `npm test` | Full suite (form validation, promo code, OTP, end-to-end) |
| `npm run test:ui-only` | Everything except live submissions (`@e2e` excluded). Creates no UAT data |
| `npm run test:e2e` | Live registration, OTP and create-password tests |
| `npm run test:smoke` | Critical path only (`@smoke`) |
| `npm run test:headed` | Full suite in a visible browser, one worker |
| `npm run test:demo` | Smoke tests headed with video recorded for every test (`test-results/**/video.webm`) |
| `npm run typecheck` | TypeScript check |

## Project structure

```
src/
  config/env.ts            environment + fixed test data (overridable by env vars)
  data/messages.ts         expected UI messages (text as constants)
  data/registrant.ts       unique registrant factory, phone helpers
  fixtures/test.ts         custom fixtures, third-party traffic blocking
  pages/RegisterPage.ts    registration form page object
  pages/OtpDialog.ts       OTP dialog page object
  pages/CreatePasswordPage.ts
tests/
  form-validation.spec.ts  required fields, email, phone, length limits, company type
  promo-code.spec.ts       valid / invalid / case / remove / reused (stubbed)
  registration-e2e.spec.ts happy path + OTP scenarios on UAT (@e2e)
```

## Configuration

All values have defaults. Override them with environment variables:

| Variable | Default |
|---|---|
| `BASE_URL` | `https://portal.uat.gofive.co.th` |
| `API_BASE_URL` | `https://portal-uat-api.gofive.co.th` |
| `TEST_PHONE` | `0967690708` |
| `TEST_OTP` | `123456` |
| `TEST_PROMO` | `FREE15DAY` |
| `TEST_PASSWORD` | `EmpeoQa2026` |
| `REGISTERED_EMAIL` | `admin@gofive.co.th` |
| `REGISTERED_DOMAIN` | `mailinator.com` |
| `RECORD_VIDEO` | unset (video kept on failure only), `1` = always |

## Design decisions for a stable daily run

- **Unique data per run:** the backend rejects reused emails *and* reused company email domains, so each registrant gets a fresh company name and domain.
- **Stable locators:** the suite uses the app's `data-testid` attributes, with no index or CSS-path locators. Expected messages live in one constants file.
- **No fixed sleeps:** it waits on real signals (master-data response, duplicate-check responses, form not `ng-pending`, URL change) and uses web-first assertions.
- **No accidental submissions:** negative-submit tests intercept and abort any non-validation backend call, so a client-side bug cannot silently create UAT data.
- **Third-party noise blocked:** analytics, ads and heatmap scripts are aborted at context level, which makes the suite faster and removes a source of flakiness.
- **Stubs only where reality can't be reproduced:** expired OTP and exhausted coupon. Everything else hits the live UAT API.
- **Known defects stay visible without breaking CI:** confirmed defects are written as `test.fail` with a reason. If a defect gets fixed, that test turns red so the annotation gets removed.
- **Failure diagnostics:** trace, screenshot and video are kept on failure. CI retries twice and publishes HTML + JUnit reports.
- **CI (`.github/workflows/registration-tests.yml` at repo root):** push and PR run `test:ui-only`, which creates no UAT data. The full suite runs via manual *Run workflow* → `full`. Add a `schedule` trigger for a nightly run.

## Results

Latest local run: see `playwright-report/index.html` after `npm test`.
