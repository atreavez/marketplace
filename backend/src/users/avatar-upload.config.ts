import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';

// Local disk storage — fine for a single-instance dev/staging deployment,
// but won't survive a container restart or work across multiple app
// instances behind a load balancer. The architecture doc calls for S3-
// compatible object storage in production; swapping this `storage` option
// for a multer-s3 (or similar) storage engine is the entire migration —
// UsersController/UsersService don't need to change, they only deal with
// the resulting URL.
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export const avatarUploadOptions = {
  storage: diskStorage({
    destination: join(process.cwd(), 'uploads', 'avatars'),
    filename: (_req, file, cb) => {
      cb(null, `${randomUUID()}${extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req: unknown, file: Express.Multer.File, cb: (err: Error | null, accept: boolean) => void) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(new BadRequestException('Only JPEG, PNG, or WebP images are allowed'), false);
      return;
    }
    cb(null, true);
  },
};
