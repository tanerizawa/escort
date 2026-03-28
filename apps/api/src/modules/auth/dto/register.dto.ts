import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsNumber, IsArray, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongP@ss123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiPropertyOptional({ example: '+6281234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: ['CLIENT', 'ESCORT'], default: 'CLIENT' })
  @IsOptional()
  @IsEnum(['CLIENT', 'ESCORT'])
  role?: 'CLIENT' | 'ESCORT';

  // ── Escort-specific fields (only used when role = ESCORT) ──

  @ApiPropertyOptional({ description: 'Escort bio text' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'Languages spoken', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({ description: 'Professional skills', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ description: 'Hourly rate in IDR', minimum: 100000 })
  @IsOptional()
  @IsNumber()
  @Min(100000)
  hourlyRate?: number;

  @ApiPropertyOptional({ description: 'Escort tier' })
  @IsOptional()
  @IsString()
  tier?: string;

  @ApiPropertyOptional({ description: 'Certification names', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certificationNames?: string[];

  @ApiPropertyOptional({ description: 'Portfolio URLs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  portfolioUrls?: string[];
}
