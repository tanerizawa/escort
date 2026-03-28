import { Injectable, BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs';
import { join, extname } from 'path';
import { v4 as uuid } from 'uuid';

export interface UploadResult {
  filename: string;
  path: string;
  url: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class UploadService {
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor() {
    this.uploadDir = join(process.cwd(), 'uploads');
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:4000';

    // Create upload directories
    const dirs = ['avatars', 'chat-images', 'documents', 'portfolio', 'certifications', 'videos'];
    for (const dir of dirs) {
      const fullPath = join(this.uploadDir, dir);
      if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true });
      }
    }
  }

  async saveFile(
    file: Express.Multer.File,
    folder: 'avatars' | 'chat-images' | 'documents' | 'portfolio' | 'certifications' | 'videos' | 'incident-evidence',
    options?: { maxSizeMB?: number; allowedTypes?: string[] },
  ): Promise<UploadResult> {
    const maxSize = (options?.maxSizeMB || 5) * 1024 * 1024;
    const allowedTypes = options?.allowedTypes || [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];

    // Validate file size
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File terlalu besar. Maks ${options?.maxSizeMB || 5}MB`,
      );
    }

    // Validate mime type
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipe file tidak didukung. Gunakan: ${allowedTypes.join(', ')}`,
      );
    }

    const ext = extname(file.originalname) || '.jpg';
    const filename = `${uuid()}${ext}`;
    const filePath = join(this.uploadDir, folder, filename);

    writeFileSync(filePath, file.buffer);

    return {
      filename,
      path: filePath,
      url: `${this.baseUrl}/uploads/${folder}/${filename}`,
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  deleteFile(folder: string, filename: string): void {
    const filePath = join(this.uploadDir, folder, filename);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }
}
