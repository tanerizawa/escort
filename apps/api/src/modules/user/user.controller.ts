import { Controller, Get, Put, Patch, Post, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UpdateProfileDto, UpdateEscortProfileDto } from './dto/user.dto';
import { CreateCertificationDto } from './dto/certification.dto';
import { UpdateAvailabilityDto } from '../booking/dto/booking.dto';

@Controller()
@ApiTags('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('users/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.userService.getProfile(userId);
  }

  @Patch('users/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(userId, dto);
  }

  @Put('escorts/me/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ESCORT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update escort extended profile' })
  async updateEscortProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateEscortProfileDto) {
    return this.userService.updateEscortProfile(userId, dto);
  }

  @Post('escorts/me/certifications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ESCORT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a certification' })
  async addCertification(@CurrentUser('id') userId: string, @Body() dto: CreateCertificationDto) {
    return this.userService.addCertification(userId, dto);
  }

  @Delete('escorts/me/certifications/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ESCORT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a certification' })
  async deleteCertification(@CurrentUser('id') userId: string, @Param('id') certId: string) {
    return this.userService.deleteCertification(userId, certId);
  }

  @Get('escorts')
  @ApiOperation({ summary: 'List and search escorts' })
  async listEscorts(@Query() query: any) {
    return this.userService.listEscorts(query);
  }

  @Get('escorts/:id')
  @ApiOperation({ summary: 'Get escort detail profile' })
  async getEscortDetail(@Param('id') id: string) {
    return this.userService.getEscortDetail(id);
  }

  @Put('escorts/me/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ESCORT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update weekly availability schedule' })
  async updateAvailability(@CurrentUser('id') userId: string, @Body() dto: UpdateAvailabilityDto) {
    return this.userService.updateAvailability(userId, dto);
  }

  @Get('escorts/me/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ESCORT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my availability schedule' })
  async getAvailability(@CurrentUser('id') userId: string) {
    return this.userService.getAvailability(userId);
  }

  // ---- Favorites ----

  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my favorite escorts' })
  async getFavorites(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.userService.getFavorites(userId, page, limit);
  }

  @Post('favorites/:escortId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add escort to favorites' })
  async addFavorite(@CurrentUser('id') userId: string, @Param('escortId') escortId: string) {
    return this.userService.addFavorite(userId, escortId);
  }

  @Delete('favorites/:escortId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove escort from favorites' })
  async removeFavorite(@CurrentUser('id') userId: string, @Param('escortId') escortId: string) {
    return this.userService.removeFavorite(userId, escortId);
  }

  @Get('favorites/:escortId/check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if escort is favorited' })
  async checkFavorite(@CurrentUser('id') userId: string, @Param('escortId') escortId: string) {
    return this.userService.isFavorited(userId, escortId);
  }

  // ---- Quick Re-book ----

  @Get('bookings/recent-escorts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recent escorts for quick re-booking' })
  async getRecentEscorts(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.userService.getRecentEscorts(userId, limit);
  }
}
