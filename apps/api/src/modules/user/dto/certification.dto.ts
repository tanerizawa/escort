import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCertificationDto {
  @ApiProperty({ example: 'LANGUAGE' })
  @IsString()
  certType: string;

  @ApiProperty({ example: 'First Aid Certificate' })
  @IsString()
  certName: string;

  @ApiProperty({ example: 'Red Cross' })
  @IsString()
  issuer: string;

  @ApiPropertyOptional({ example: '2025-01-15' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiProperty({ example: 'https://s3.amazonaws.com/certs/doc.pdf' })
  @IsString()
  documentUrl: string;
}
