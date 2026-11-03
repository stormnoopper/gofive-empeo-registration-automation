# Gofive Automation Tester Exam 1.0 – empeo Registration

Playwright + TypeScript automation for https://portal.uat.gofive.co.th/Register/empeo

## Demo – REG-E2E-01 happy path

[![REG-E2E-01 happy path: form → promo FREE15DAY → OTP 123456 → set password → success](01_Demo/REG-E2E-01-happy-path.gif)](01_Demo/REG-E2E-01-happy-path.mp4)

Registration form → promo `FREE15DAY` → OTP `123456` → password rules → "empeo พร้อมใช้งานแล้ว!" · [Full-quality MP4](01_Demo/REG-E2E-01-happy-path.mp4)

## Contents

| Path | Content |
|---|---|
| [`01_Demo/`](01_Demo/) | Demo video (MP4) and inline preview (GIF) |
| [`02_Testcase/TEST_CASES.xlsx`](02_Testcase/TEST_CASES.xlsx) | 42 test cases, summary and defects ([Markdown version](02_Testcase/TEST_CASES.md)) |
| [`03_Automate_Code/`](03_Automate_Code/) | Automation project ([README](03_Automate_Code/README.md)) |
| [`Gofive_Automation_Exam_Submission.pdf`](Gofive_Automation_Exam_Submission.pdf) | All-in-one: demo storyboard, test cases, defects, how to use, conclusion, source code |

```bash
cd 03_Automate_Code
npm ci
npx playwright install chromium
npm test
```

Latest result: 42 automated · 40 pass · 2 fail (confirmed defects tracked as `test.fail`) · 0 flaky.
