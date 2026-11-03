# Gofive Automation Tester Exam 1.0 – empeo Registration

Playwright + TypeScript automation for https://portal.uat.gofive.co.th/Register/empeo

| Path | Content |
|---|---|
| [`01_Demo/REG-E2E-01-happy-path.mp4`](01_Demo/REG-E2E-01-happy-path.mp4) | Automated happy path: form → promo → OTP → password → success |
| [`02_Testcase/TEST_CASES.xlsx`](02_Testcase/TEST_CASES.xlsx) | 42 test cases, summary and defects ([Markdown version](02_Testcase/TEST_CASES.md)) |
| [`03_Automate_Code/`](03_Automate_Code/) | Automation project ([README](03_Automate_Code/README.md)) |
| [`How_to_use_and_Conclusion.pdf`](How_to_use_and_Conclusion.pdf) | How to run, results and conclusion |

```bash
cd 03_Automate_Code
npm ci
npx playwright install chromium
npm test
```

Latest result: 42 automated · 40 pass · 2 fail (confirmed defects tracked as `test.fail`) · 0 flaky.
