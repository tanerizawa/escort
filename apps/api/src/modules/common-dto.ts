import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidatePromoCodeDto {
  @ApiProperty({ description: 'Promo code to validate' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Order amount in IDR' })
  @IsNumber()
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
  severity: number;
}

export class PingLocationDto {
  @ApiProperty({ description: 'Latitude' })
  @IsNumber()
  lat: number;

  @ApiProperty({ description: 'Longitude' })
  @IsNumber()
  lng: number;

  @ApiPropertyOptional({ description: 'GPS accuracy in meters' })
  @IsOptional()
  @IsNumber()
  accuracy?: number;
}

export class UpdateLocationDto {
  @ApiProperty({ description: 'Booking ID' })
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @ApiProperty({ description: 'Latitude' })
  @IsNumber()
  lat: number;

  @ApiProperty({ description: 'Longitude' })
  @IsNumber()
  lng: number;

  @ApiPropertyOptional({ description: 'GPS accuracy in meters' })
  @IsOptional()
  @IsNumber()
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
