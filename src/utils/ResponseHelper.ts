import { ZodError } from 'zod';

export const parseZodError = (error: ZodError) => {
  const formatted: Record<string, string[]> = {};

  error.errors.forEach(err => {
    const field = err.path[0] as string;

    if (!formatted[field]) {
      formatted[field] = [];
    }

    formatted[field].push(err.message);
  });

  return { error: formatted };
};

// {
//   "status": "error",
//   "message": "Validasi gagal",
//   "data": null,
//   "errors": [
//     {
//       "field": "username",
//       "message": "Username tidak boleh kosong"
//     },
//     {
//       "field": "email",
//       "message": "Format email tidak valid"
//     }
//   ]
// }

// {
//   "status": "success",
//   "message": "Data berhasil ditemukan",
//   "data": [
//     {
//       "userId": 12345,
//       "username": "john_doe",
//       "email": "john.doe@example.com"
//     },
//     {
//       "userId": 12346,
//       "username": "jane_doe",
//       "email": "jane.doe@example.com"
//     }
//   ]
// }
