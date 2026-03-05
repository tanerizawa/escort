import { IsString, IsOptional, IsArray, IsNumber, Min, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  profilePhoto?: string;
}

export class UpdateEscortProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(100000)
  hourlyRate?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  portfolioUrls?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  videoIntroUrl?: string;

  @ApiPropertyOptional({ description: 'Availability schedule as JSON' })
  @IsOptional()
  availabilitySchedule?: Record<string, any>;
}

export class EscortQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 12 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 12;

  @ApiPropertyOptional({ enum: ['SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'] })
  @IsOptional()
  @IsString()
  tier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ enum: ['rating', 'price_asc', 'price_desc', 'newest'] })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  available?: boolean;
}
