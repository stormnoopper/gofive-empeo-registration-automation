import { env } from '../config/env';

export type CompanyType = 'thai' | 'others';

export interface Registrant {
  companyType: CompanyType;
  company: string;
  businessType: string;
  userAmount: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  promoCode?: string;
}


export const uniqueId = () => `${Date.now()}${Math.floor(Math.random() * 1_000).toString().padStart(3, '0')}`;

export const uniqueEmail = (id = uniqueId()) => `qa.${id}@empeoqa${id}.com`;

export const toE164 = (phone: string) => `+66${phone.replace(/^0/, '')}`;

export const maskPhone = (phone: string) => `${phone.slice(0, 3)}-XXX-${phone.slice(-4)}`;

export const buildRegistrant = (overrides: Partial<Registrant> = {}): Registrant => {
  const id = uniqueId();
  return {
    companyType: 'others',
    company: `QA Automation ${id}`,
    businessType: 'eCommerce',
    userAmount: '1-20',
    email: uniqueEmail(id),
    firstName: 'Automation',
    lastName: 'Tester',
    phone: env.phone,
    ...overrides,
  };
};
