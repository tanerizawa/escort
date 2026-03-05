import { IsString, IsNumber, IsOptional, Min, Max, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ description: 'Booking ID' })
  @IsString()
  bookingId: string;

  @ApiProperty({ description: 'Reviewee user ID' })
  @IsString()
  revieweeId: string;

  @ApiProperty({ description: 'Overall rating (1-5)', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(10)
  comment?: string;

  @ApiPropertyOptional({ description: 'Attitude score 1-5' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  attitudeScore?: number;

  @ApiPropertyOptional({ description: 'Punctuality score 1-5' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  punctualityScore?: number;

  @ApiPropertyOptional({ description: 'Professionalism score 1-5' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  professionalismScore?: number;
}

export class ReplyReviewDto {
  @ApiProperty()
  @IsString()
  @MinLength(5)
  replyComment: string;
}
