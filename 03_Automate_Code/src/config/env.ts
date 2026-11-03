export const env = {
  baseUrl: process.env.BASE_URL ?? 'https://portal.uat.gofive.co.th',
  apiBaseUrl: process.env.API_BASE_URL ?? 'https://portal-uat-api.gofive.co.th',
  phone: process.env.TEST_PHONE ?? '0967690708',
  otp: process.env.TEST_OTP ?? '123456',
  password: process.env.TEST_PASSWORD ?? 'EmpeoQa2026',
  promoCode: process.env.TEST_PROMO ?? 'FREE15DAY',
  registeredDomain: process.env.REGISTERED_DOMAIN ?? 'mailinator.com',
  registeredEmail: process.env.REGISTERED_EMAIL ?? 'admin@gofive.co.th',
  recordVideo: process.env.RECORD_VIDEO === '1',
} as const;
