export type AuthMethod = 'phone' | 'email';

export type CountryCode = 'FR' | 'US';

export interface PhoneCountry {
  code: string;
  flag: string;
  name: string;
  format: string;
  length: number;
  startsWith: string | null;
  toInternational: (phone: string) => string;
}

export const PHONE_COUNTRIES: Record<CountryCode, PhoneCountry> = {
  FR: {
    code: "+33",
    flag: "🇫🇷",
    name: "France",
    format: "06 12 34 56 78",
    length: 10,
    startsWith: "0",
    toInternational: (phone: string) => `+33${phone.substring(1)}`,
  },
  US: {
    code: "+1",
    flag: "🇺🇸",
    name: "USA",
    format: "(555) 123-4567",
    length: 10,
    startsWith: null,
    toInternational: (phone: string) => `+1${phone}`,
  },
};
