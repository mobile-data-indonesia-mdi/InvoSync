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

  role: z.enum(['management', 'finance'], {
    errorMap: () => ({ message: 'Role harus salah satu dari: management, finance, it' }),
  }),
  created_at: z.date(),
  updated_at: z.date(),
});

export const userRegisterSchema = userSchema.pick({
  username: true,
  password: true,
  role: true,
});

export const userLoginSchema = userSchema.pick({
  username: true,
  password: true,
});

export const userUpdateSchema = userSchema.pick({
  username: true,
  role: true,
});

export const UserUpdatePasswordSchema = userSchema.pick({
  password: true,
});

export const userPublicSchema = userSchema.omit({
  password: true,
});

export type UserRegister = z.infer<typeof userRegisterSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type UserUpdatePassword = z.infer<typeof UserUpdatePasswordSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type UserPublic = z.infer<typeof userPublicSchema>;
