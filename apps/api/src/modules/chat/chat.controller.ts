import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { SendMessageDto, MarkReadDto } from './dto/chat.dto';

@Controller('chats')
@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @ApiOperation({ summary: 'List my chat rooms (active bookings)' })
  async listRooms(@CurrentUser('id') userId: string) {
    return this.chatService.listRooms(userId);
  }

  @Get(':bookingId/messages')
  @ApiOperation({ summary: 'Get messages for a booking' })
  async getMessages(
    @CurrentUser('id') userId: string,
    @Param('bookingId') bookingId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.chatService.getMessages(userId, bookingId, page, limit);
  }

  @Post(':bookingId/messages')
  @ApiOperation({ summary: 'Send a message to a booking chat' })
  async sendMessage(
    @CurrentUser('id') senderId: string,
    @Param('bookingId') bookingId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(senderId, { ...dto, bookingId });
  }

  @Patch(':bookingId/read')
  @ApiOperation({ summary: 'Mark messages as read' })
  async markRead(
    @CurrentUser('id') userId: string,
    @Param('bookingId') bookingId: string,
  ) {
    return this.chatService.markAsRead(userId, bookingId);
  }
}
