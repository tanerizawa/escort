import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync, unlinkSync, readFileSync } from 'fs';
import { join, extname, resolve, basename } from 'path';
import { v4 as uuid } from 'uuid';

export interface UploadResult {
  filename: string;
  path: string;
  url: string;
  mimetype: string;
  size: number;
}

// Magic byte signatures for file type validation
const MAGIC_BYTES: Record<string, Buffer[]> = {
  'image/jpeg': [Buffer.from([0xff, 0xd8, 0xff])],
  'image/png': [Buffer.from([0x89, 0x50, 0x4e, 0x47])],
  'image/gif': [Buffer.from('GIF87a'), Buffer.from('GIF89a')],
  'image/webp': [Buffer.from('RIFF')], // RIFF....WEBP
};

const ALLOWED_FOLDERS = ['avatars', 'chat-images', 'documents', 'portfolio', 'certifications', 'videos', 'incident-evidence'] as const;
type UploadFolder = typeof ALLOWED_FOLDERS[number];

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor() {
    this.uploadDir = join(process.cwd(), 'uploads');
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:4000';

    // Create upload directories
    for (const dir of ALLOWED_FOLDERS) {
      const fullPath = join(this.uploadDir, dir);
      if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true });
      }
    }
  }

  private validateFolder(folder: string): asserts folder is UploadFolder {
    if (!(ALLOWED_FOLDERS as readonly string[]).includes(folder)) {
      throw new BadRequestException(`Folder upload tidak valid: ${folder}`);
    }
  }

  private validateMagicBytes(buffer: Buffer, mimetype: string): boolean {
    const signatures = MAGIC_BYTES[mimetype];
    if (!signatures) return true; // No magic bytes check for non-image types (e.g. PDF, video)
    return signatures.some((sig) => buffer.subarray(0, sig.length).equals(sig));
  }

  async saveFile(
    file: Express.Multer.File,
    folder: UploadFolder,
    options?: { maxSizeMB?: number; allowedTypes?: string[] },
  ): Promise<UploadResult> {
    this.validateFolder(folder);

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

    // Validate mime type (client-reported)
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipe file tidak didukung. Gunakan: ${allowedTypes.join(', ')}`,
      );
    }

    // Validate actual file content via magic bytes
    if (file.buffer && file.buffer.length >= 4) {
      if (!this.validateMagicBytes(file.buffer, file.mimetype)) {
        this.logger.warn(`Magic bytes mismatch: claimed ${file.mimetype}, file: ${file.originalname}`);
        throw new BadRequestException('Konten file tidak sesuai dengan tipe yang diklaim');
      }
    }

    // Use only safe characters in extension, generate UUID filename
    const rawExt = extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    const ext = rawExt || '.jpg';
    const filename = `${uuid()}${ext}`;
    const filePath = join(this.uploadDir, folder, filename);

    // Ensure resolved path is still within upload directory (defense in depth)
    const resolvedPath = resolve(filePath);
    if (!resolvedPath.startsWith(resolve(this.uploadDir))) {
      throw new BadRequestException('Path file tidak valid');
    }

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
    // Validate folder is in allowed list
    this.validateFolder(folder);

    // Sanitize filename — only allow UUID-style names with safe extensions
    const safeFilename = basename(filename);
    if (safeFilename !== filename || filename.includes('..')) {
      this.logger.warn(`Blocked path traversal attempt in deleteFile: ${filename}`);
      return;
    }

    const filePath = join(this.uploadDir, folder, safeFilename);

    // Ensure resolved path is within upload directory
    const resolvedPath = resolve(filePath);
    if (!resolvedPath.startsWith(resolve(this.uploadDir))) {
      this.logger.warn(`Blocked path traversal in deleteFile: ${resolvedPath}`);
      return;
    }

    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }
}
