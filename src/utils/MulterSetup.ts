// Middleware for file upload (multipart/form-data)
import { type Request } from 'express';
import { type FileFilterCallback } from 'multer';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const storage_payment = multer.diskStorage({
  destination: function (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void,
  ) {
    const uploadDir = path.join('uploads', 'payments');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: function (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void,
  ) {
    // uniqueSuffix untuk nama file sementara
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = file.mimetype.split('/')[1]; // Ambil ekstensi file
    const filename = `temp-${uniqueSuffix}.${extension}`;
    cb(null, filename);
  },
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, JPG, and PDF are allowed.'));
  }
};

export const upload_payment = multer({
  storage: storage_payment,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Max 5 MB
  },
});
