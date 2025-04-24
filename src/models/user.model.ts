import { z } from 'zod';

export const userSchema = z.object({
  user_id: z.string().uuid(),
  username: z
    .string({
      required_error: 'Username wajib diisi',
      invalid_type_error: 'Username harus berupa string',
    })
    .min(1, { message: 'Username tidak boleh kosong' })
    .max(50, { message: 'Username maksimal 50 karakter' }),

  password: z
    .string({
      required_error: 'Password wajib diisi',
      invalid_type_error: 'Password harus berupa string',
    })
    .min(8, { message: 'Password minimal 8 karakter' })
    .max(100, { message: 'Password maksimal 100 karakter' }),

  role: z.enum(['management', 'finance', 'it', 'admin'], {
    errorMap: () => ({ message: 'Role harus salah satu dari: management, finance, it, admin' }),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const userRequestSchema = userSchema.pick({
  username: true,
  password: true,
  role: true,
});

export const userLoginSchema = userSchema.pick({
  username: true,
  password: true,
});

export const userPublicSchema = userSchema.omit({
  password: true,
});

export const userChangePassword = userSchema.pick({
  password: true,
});

export type UserRequest = z.infer<typeof userRequestSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type UserPublic = z.infer<typeof userPublicSchema>;
