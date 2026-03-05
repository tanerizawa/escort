import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsPhoneNumber } from 'class-validator';
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
}
