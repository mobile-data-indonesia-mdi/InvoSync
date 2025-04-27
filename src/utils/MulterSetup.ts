// Middleware for file upload (multipart/form-data)
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const storage_payment = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    const uploadDir = path.join('uploads', 'payments');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    // Gunakan uniqueSuffix untuk nama file sementara
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = file.mimetype.split('/')[1]; // Ambil ekstensi file
    const filename = `temp-${uniqueSuffix}.${extension}`;
    cb(null, filename);
  }
});
export const upload_payment = multer({ storage: storage_payment });