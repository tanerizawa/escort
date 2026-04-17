import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidatePromoCodeDto {
  @ApiProperty({ description: 'Promo code to validate' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Order amount in IDR' })
  @IsNumber()
  @Min(0)
  orderAmount: number;
}

export class TriggerSOSDto {
  @ApiProperty({ description: 'Booking ID for SOS alert' })
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @ApiPropertyOptional({ description: 'SOS description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Incident type (defaults to SOS)' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Severity 1-5 (defaults to 5 for SOS)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  severity?: number;

  @ApiPropertyOptional({ description: 'Latitude at time of SOS (-90..90)' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitude at time of SOS (-180..180)' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;
}

export class ReportIncidentDto {
  @ApiProperty({ description: 'Booking ID' })
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @ApiProperty({ description: 'Incident type (e.g., HARASSMENT, SAFETY, OTHER)' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Incident description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Severity level (1-5)' })
  @IsNumber()
  @Min(1)
  @Max(5)
  severity: number;
}

export class PingLocationDto {
  @ApiProperty({ description: 'Latitude (-90..90)' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ description: 'Longitude (-180..180)' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiPropertyOptional({ description: 'GPS accuracy in meters' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy?: number;
}

export class UpdateLocationDto {
  @ApiProperty({ description: 'Booking ID' })
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @ApiProperty({ description: 'Latitude (-90..90)' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ description: 'Longitude (-180..180)' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiPropertyOptional({ description: 'GPS accuracy in meters' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy?: number;
}

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() inApp?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() email?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() push?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() whatsapp?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() booking?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() chat?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() payment?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() promotion?: boolean;
}

export class RegisterPushTokenDto {
  @ApiProperty({ description: 'FCM device token' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiPropertyOptional({ description: 'Platform type', enum: ['web', 'android', 'ios'] })
  @IsOptional()
  @IsEnum(['web', 'android', 'ios'])
  platform?: 'web' | 'android' | 'ios';
}
