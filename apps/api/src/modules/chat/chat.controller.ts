import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UploadService } from '@common/services/upload.service';
import { SendMessageDto, MarkReadDto } from './dto/chat.dto';

@Controller('chats')
@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly uploadService: UploadService,
  ) {}

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

  @Post(':bookingId/image')
  @ApiOperation({ summary: 'Send an image message to a booking chat' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async sendImage(
    @CurrentUser('id') senderId: string,
    @Param('bookingId') bookingId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('File gambar wajib diupload');

    const upload = await this.uploadService.saveFile(file, 'chat-images', {
      maxSizeMB: 5,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    });

    return this.chatService.sendMessage(senderId, {
      bookingId,
      content: upload.url,
      type: 'IMAGE' as any,
    });
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
