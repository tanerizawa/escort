import { Controller, Get, Param, Res, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { EncryptionService } from '@/common/services/encryption.service';
import { join } from 'path';
import { existsSync } from 'fs';
import sharp = require('sharp');

@Controller('images')
export class ImageController {
  constructor(private readonly encryption: EncryptionService) {}

  @Get('preview/:token')
  async preview(@Param('token') token: string, @Res() res: Response) {
    let payload: { path: string; exp: number };

    try {
      const decoded = this.encryption.decrypt(decodeURIComponent(token));
      payload = JSON.parse(decoded);
    } catch {
      throw new BadRequestException('Invalid token');
    }

    if (!payload?.path || !payload?.exp || Date.now() > payload.exp) {
      throw new BadRequestException('Token expired');
    }

    // Sanitize path to prevent directory traversal
    const safePath = payload.path.replace(/\.\./g, '').replace(/^\/+/, '');
    const filePath = join(process.cwd(), 'uploads', safePath);

    if (!filePath.startsWith(join(process.cwd(), 'uploads')) || !existsSync(filePath)) {
      throw new BadRequestException('File not found');
    }

    try {
      const blurred = await sharp(filePath)
        .resize(400, 500, { fit: 'cover' })
        .blur(8)
        .jpeg({ quality: 70 })
        .toBuffer();

      res.set({
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'private, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      });
      res.send(blurred);
    } catch {
      throw new BadRequestException('Processing failed');
    }
  }
}
