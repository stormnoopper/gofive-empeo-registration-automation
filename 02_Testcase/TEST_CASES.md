# empeo Registration – Test Case Design

**System under test:** https://portal.uat.gofive.co.th/Register/empeo (UAT)
**Fixed test data:** Phone `0967690708` · OTP `123456` · Promo `FREE15DAY`
**Dynamic test data:** company name and email are unique per run (`QA Automation <id>`, `qa.<id>@empeoqa<id>.com`). The backend rejects an email whose **domain** already belongs to a registered company, so each run uses a fresh domain. This keeps the daily run repeatable.

Legend: **Type** P = Positive, N = Negative, E = Edge · **Mode** Real = live UAT API, Stub = API response stubbed with `page.route` (the condition cannot be reproduced on demand).

## 1. Required fields & form behaviour (`tests/form-validation.spec.ts`)

| ID | Type | Scenario | Steps | Expected result | Mode |
|---|---|---|---|---|---|
| REG-VAL-01 | N | Empty submit (Thai company) | Open page → click **ทดลองใช้ฟรี** | Required messages for tax ID/company, business type, users, email, first name, last name, mobile, consent; stays on page | Real |
| REG-VAL-02 | N | Empty submit (Others) | Select **อื่นๆ** → submit | "กรุณากรอกข้อมูลที่จำเป็นทั้งหมด" + field errors | Real |
| REG-VAL-03 | N | Consent not accepted | Fill all valid fields, leave consent unchecked → submit | No registration request is sent; stays on page | Real (submit guarded) |
| REG-VAL-04 | P | Errors clear after correction | Empty submit → fill valid data | No visible validation errors | Real |
| REG-VAL-05 | N | Consent message shown | Same as VAL-03 | Consent error should be displayed. **Known defect**, marked `test.fail` | Real (submit guarded) |
| REG-CMP-01 | P | Company type toggle | Switch Thai ↔ Others | Thai shows tax search; Others shows company name input | Real |
| REG-CMP-02 | P | Tax ID search | Search "โกไฟว์" → pick result | Tax ID `0745561010054` filled in | Real |

## 2. Email (`tests/form-validation.spec.ts`)

| ID | Type | Scenario | Data | Expected result | Mode |
|---|---|---|---|---|---|
| REG-VAL-10 | N | Malformed email | `abc`, `a@b`, `user@@<domain>`, `␠spaced@<domain>` | "กรุณาใส่อีเมลที่ถูกต้อง" | Real |
| REG-VAL-11 | P | Valid, unused email | unique corporate email | No error | Real |
| REG-VAL-12 | N | Email already registered | `admin@gofive.co.th` | "อีเมลนี้มีบัญชีใช้งานแล้ว ลองล็อกอินหรือทำเรื่องลืมรหัสผ่าน" | Real |
| REG-VAL-13 | N | Company domain already registered | `qa.<id>@mailinator.com` | "โดเมนนี้มีบัญชีใช้งานแล้ว" | Real |
| REG-VAL-14 | P | Public mail provider | `qa.<id>@gmail.com` | No error (public domains are allowed) | Real |

## 3. Mobile number (`tests/form-validation.spec.ts`)

| ID | Type | Scenario | Data | Expected result | Mode |
|---|---|---|---|---|---|
| REG-VAL-20 | N | Invalid mobile | `096769070` (9), `09676907081` (11), `1234567890`, `abcdef` | "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง" | Real |
| REG-VAL-21 | P | Valid mobile | `0967690708`, `967690708` | No error | Real |

## 4. Field length limits – boundary (`tests/form-validation.spec.ts`)

| ID | Type | Field | Max | Expected result | Mode |
|---|---|---|---|---|---|
| REG-VAL-30 | E | Email / First name / Last name / Mobile | 150 / 255 / 255 / 15 | Input truncated at the max length | Real |
| REG-VAL-31 | E | Company name (Others) | 255 | Input truncated at 255 | Real |
| REG-PRM-05 | E | Promo code | 50 | Input truncated at 50 | Real |

## 5. Promo code (`tests/promo-code.spec.ts`)

| ID | Type | Scenario | Data | Expected result | Mode |
|---|---|---|---|---|---|
| REG-PRM-01 | P | Valid code | `FREE15DAY` | API `isValid: true`; code shown as applied | Real |
| REG-PRM-02 | P | Case-insensitive | `free15day` | Accepted, normalised to `FREE15DAY` | Real |
| REG-PRM-03 | N | Unknown code | `INVALID99`, `FREE15DAYX` | HTTP 400; "คูปองโค้ดไม่ถูกต้อง" | Real |
| REG-PRM-08 | N | Special characters | `!@#$%` | Not applied | Real |
| REG-PRM-04 | P | Remove applied code | Apply → click ✕ | Code removed, input shown again | Real |
| REG-PRM-06 | N | Exhausted / reused code | `USEDCODE01` | "คูปองโค้ดไม่ถูกต้อง", not applied | Stub (HTTP 400) |
| REG-PRM-07 | N | API returns `isValid: false` | `USEDCODE02` | Code must not be applied. **Known defect**, marked `test.fail` | Stub |

## 6. Submission, OTP & account activation (`tests/registration-e2e.spec.ts`, tag `@e2e`)

| ID | Type | Scenario | Steps | Expected result | Mode |
|---|---|---|---|---|---|
| REG-E2E-01 | P | Successful registration (happy path) | Others + valid data + `FREE15DAY` → submit → OTP `123456` → set password | Register payload correct; OTP `isValid: true`; create-password rules (Aa / 123 / 8+) gate the button; "empeo พร้อมใช้งานแล้ว!" shown | Real |
| REG-OTP-01 | P | OTP dialog content | Submit valid form | Title, masked phone `096-XXX-0708`, `ref`, resend countdown | Real |
| REG-OTP-02 | N | Incomplete OTP | Enter 5 digits, then 6 | Verify disabled at 5, enabled at 6 | Real |
| REG-OTP-03 | N | Non-numeric OTP | `abcdef` | Nothing accepted; verify disabled | Real |
| REG-OTP-04 | N | Wrong OTP | `000000` | "OTP ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง"; inputs cleared; stays on dialog | Real |
| REG-OTP-05 | P | Resend OTP | Wait for countdown → **ส่งใหม่อีกครั้ง** | New `ref`, countdown restarts | Real |
| REG-OTP-06 | N | Expired OTP | Verify with stubbed `E4002 OTP has expired` | Error popup; dialog stays open after dismissal | Stub |

## 7. Defects / observations found during design

| # | Severity | Finding | Evidence |
|---|---|---|---|
| D-01 | Medium | Submitting with only the consent checkbox missing does nothing: no message, no request. The consent error appears only when other fields are also invalid. | REG-VAL-05 (`test.fail`) |
| D-02 | Medium | The coupon UI ignores `isValid: false` in a 200 response and still shows the code as applied. | REG-PRM-07 (`test.fail`, stubbed contract) |
| D-03 | Low | Expired/other OTP business errors show a generic "Error! Business error with 1 errors." popup instead of a user-facing message. | REG-OTP-06 |
| D-04 | Low | The create-password button becomes enabled when password and confirmation do not match (not submitted during automation). | Manual exploration |
| D-05 | Info | Correct-OTP verification on UAT sometimes takes ~40 s; the suite allows 90 s for it. | Network timing |

## 8. Out of scope / not automated

- **Thai-company end-to-end submit:** every real tax ID can be registered only once, so this cannot be repeated daily. The Thai path is covered up to tax-ID selection (REG-CMP-02).
- **Real OTP expiry:** the expiry window is not configurable from the UI, so it is covered by a stub (REG-OTP-06).
- **Real reused promo code:** no exhausted code is available as test data, so it is covered by a stub (REG-PRM-06/07).
