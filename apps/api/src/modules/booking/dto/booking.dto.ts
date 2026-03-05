import { IsString, IsDateString, IsNumber, IsOptional, IsArray, Min, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ description: 'Escort user ID' })
  @IsString()
  escortId: string;

  @ApiProperty({ description: 'Service type (e.g., DINING, EVENT, TRAVEL)' })
  @IsString()
  serviceType: string;

  @ApiProperty({ description: 'Start time ISO string' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ description: 'End time ISO string' })
  @IsDateString()
  endTime: string;

  @ApiProperty({ description: 'Location address' })
  @IsString()
  @MinLength(5)
  location: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  locationLat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  locationLng?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialRequests?: string;
}

export class RescheduleBookingDto {
  @ApiProperty({ description: 'New start time ISO string' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ description: 'New end time ISO string' })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateAvailabilityDto {
  @ApiProperty({
    description: 'Weekly availability schedule (0=Sun...6=Sat)',
    example: { 1: { start: '09:00', end: '21:00' }, 2: { start: '09:00', end: '21:00' } },
  })
  schedule: Record<string, { start: string; end: string }>;

  @ApiPropertyOptional({ description: 'Blocked date ranges' })
  @IsOptional()
  @IsArray()
  blockedDates?: { start: string; end: string; reason?: string }[];
}

export class TipBookingDto {
  @ApiProperty({ description: 'Tip amount', minimum: 10000 })
  @IsNumber()
  @Min(10000)
  amount: number;

  @ApiPropertyOptional({ description: 'Optional message with the tip' })
  @IsOptional()
  @IsString()
  message?: string;
}

export class UpdateBookingStatusDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class BookingQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: ['PENDING', 'CONFIRMED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'DISPUTED'] })
  @IsOptional()
  @IsString()
  status?: string;
}
