import { z } from 'zod';

export const clientSchema = z.object({
  client_id: z.string().uuid(),
  client_name: z
    .string()
    .min(1, { message: 'Client name is required' })
    .max(100, { message: 'Client name cannot exceed 100 characters' }),
  currency: z
    .string()
    .min(1, { message: 'Currency is required' })
    .length(3, { message: 'Currency code should be 3 characters, e.g., USD' }),
  country: z.string().min(1, { message: 'Country is required' }),
  client_address: z.string().min(1, { message: 'Client address is required' }),
  postal_code: z
    .string()
    .min(1, { message: 'Postal code is required' })
    .regex(/^\d{5}$/, { message: 'Postal code should be 5 digits, e.g., 12345' }),
  client_phone: z
    .string()
    .min(1, { message: 'Client phone is required' })
    .regex(/^\+?\d{10,15}$/, {
      message: 'Phone number must be between 10 and 15 digits, e.g., +08123456789',
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
