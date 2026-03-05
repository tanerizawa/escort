import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum ChatMessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
}

export class SendMessageDto {
  @ApiProperty({ description: 'Booking ID (acts as chat room)' })
  @IsString()
  bookingId: string;

  @ApiProperty({ description: 'Message content (will be encrypted)' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ enum: ChatMessageType, default: ChatMessageType.TEXT })
  @IsOptional()
  @IsEnum(ChatMessageType)
  type?: ChatMessageType = ChatMessageType.TEXT;
}

export class MarkReadDto {
  @ApiProperty({ description: 'Booking ID to mark messages as read' })
  @IsString()
  bookingId: string;
}
