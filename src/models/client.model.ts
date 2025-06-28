import { z } from 'zod';

const postalCodeRegex = new RegExp(
  '^(' +
    '\\d{5}(-\\d{4})?' + // US
    '|\\d{5}' + // ID, Malaysia
    '|\\d{6}' + // SG, China, India
    '|[A-Za-z]\\d[A-Za-z][ -]?\\d[A-Za-z]\\d' + // Canada
    '|[A-Z]{1,2}\\d{1,2}[A-Z]?\\s?\\d[A-Z]{2}' + // UK
    ')$',
);

const phoneRegex = /^(\+?\d{1,4}[\s-]?)?(\(?\d+\)?[\s-]?)*\d{3,}$/;

const allowedCountries = [
  'Indonesia',
  'United States',
  'Singapore',
  'Malaysia',
  'United Kingdom',
  'Japan',
  'China',
  'Australia',
  'Canada',
];

const normalizedCountries = allowedCountries.map(c => c.toLowerCase());

export const clientSchema = z.object({
  client_id: z.string().uuid(),
  client_name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters long' })
    .max(100, { message: 'Name must be less than 100 characters' })
    .regex(/^[a-zA-Z\s.'-]+$/, {
      message: "Name contains invalid characters (only letters, spaces, '. - are allowed)",
    }),
  currency: z
    .string()
    .min(1, { message: 'Currency is required' })
    .length(3, { message: 'Currency code should be 3 characters, e.g., USD' }),
  country: z
    .string()
    .min(2, { message: 'Country is required' })
    .refine(val => normalizedCountries.includes(val.trim().toLowerCase()), {
      message: 'Invalid country selected',
    }),
  client_address: z
    .string()
    .min(5, { message: 'Address must be at least 5 characters' })
    .max(255, { message: 'Address must be less than 255 characters' })
    .regex(/^[a-zA-Z0-9\s,.\-/#()]+$/, {
      message: 'Address contains invalid characters',
    }),
  postal_code: z.string().min(1, { message: 'Postal code is required' }).regex(postalCodeRegex, {
    message:
      'Invalid postal code. Examples: 12345 (US/ID), 123456 (SG), K1A 0B1 (CA), SW1A 1AA (UK)',
  }),
  client_phone: z
    .string()
    .min(7, { message: 'Phone number is too short' })
    .max(20, { message: 'Phone number is too long' })
    .regex(phoneRegex, {
      message: 'Invalid phone number. Example: +6281234567890, 08123456789, (021)1234567',
    }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const clientRequestSchema = clientSchema.pick({
  client_name: true,
  currency: true,
  country: true,
  client_address: true,
  postal_code: true,
  client_phone: true,
});

export type ClientRequest = z.infer<typeof clientRequestSchema>;
