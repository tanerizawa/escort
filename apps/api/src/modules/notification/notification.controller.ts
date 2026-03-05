import {
  Controller,
  Get,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@Controller('notifications')
@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'List my notifications' })
  async listNotifications(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notificationService.findAll(userId, page, limit, unreadOnly === 'true');
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@CurrentUser('id') userId: string) {
    return this.notificationService.getUnreadCount(userId);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  async getPreferences(@CurrentUser('id') userId: string) {
    return this.notificationService.getPreferences(userId);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  async updatePreferences(
    @CurrentUser('id') userId: string,
    @Body() body: Record<string, boolean>,
  ) {
    return this.notificationService.updatePreferences(userId, body);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(
    @CurrentUser('id') userId: string,
    @Param('id') notificationId: string,
  ) {
    return this.notificationService.markAsRead(userId, notificationId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  async deleteNotification(
    @CurrentUser('id') userId: string,
    @Param('id') notificationId: string,
  ) {
    return this.notificationService.deleteNotification(userId, notificationId);
  }
}
