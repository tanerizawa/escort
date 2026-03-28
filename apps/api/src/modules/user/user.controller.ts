import {
  Controller, Get, Put, Patch, Post, Delete,
  Body, Param, UseGuards, Query,
  UseInterceptors, UploadedFile, UploadedFiles, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UploadService } from '@/common/services/upload.service';
import { UpdateProfileDto, UpdateEscortProfileDto, EscortQueryDto } from './dto/user.dto';
import { CreateCertificationDto } from './dto/certification.dto';
import { UpdateAvailabilityDto } from '../booking/dto/booking.dto';

@Controller()
@ApiTags('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly uploadService: UploadService,
  ) {}

  @Get('users/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.userService.getProfile(userId);
  }

  @Patch('users/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(userId, dto);
  }

  @Post('users/me/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload profile photo / avatar' })
  @ApiResponse({ status: 200, description: 'Avatar uploaded and profile updated' })
  @ApiResponse({ status: 400, description: 'File required or invalid type' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('avatar', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('File avatar wajib diupload');

    const upload = await this.uploadService.saveFile(file, 'avatars', {
      maxSizeMB: 5,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });

    return this.userService.updateProfile(userId, { profilePhoto: upload.url } as any);
  }

  @Put('escorts/me/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ESCORT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update escort extended profile' })
  @ApiResponse({ status: 200, description: 'Escort profile updated' })
  @ApiResponse({ status: 403, description: 'Escort role required' })
  async updateEscortProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateEscortProfileDto) {
    return this.userService.updateEscortProfile(userId, dto);
  }

  @Post('escorts/me/portfolio')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ESCORT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload portfolio images (max 10 files)' })
  @ApiResponse({ status: 200, description: 'Portfolio images uploaded' })
  @ApiResponse({ status: 400, description: 'At least 1 file required' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10, { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadPortfolio(
    @CurrentUser('id') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) throw new BadRequestException('Minimal 1 file harus diupload');

    const uploadResults = [];
    for (const file of files) {
      const result = await this.uploadService.saveFile(file, 'portfolio', {
        maxSizeMB: 5,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });
      uploadResults.push(result);
    }

    // Get existing portfolio URLs, append new ones
    const profile = await this.userService.getProfile(userId);
    const escortProfile = (profile as any)?.escortProfile;
    const existingUrls: string[] = escortProfile?.portfolioUrls || [];
    const newUrls = uploadResults.map((r) => r.url);
    const allUrls = [...existingUrls, ...newUrls];

    await this.userService.updateEscortProfile(userId, { portfolioUrls: allUrls } as any);

    return { urls: newUrls, allUrls, uploaded: uploadResults.length };
  }

  @Delete('escorts/me/portfolio')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ESCORT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a portfolio image by URL' })
  @ApiResponse({ status: 200, description: 'Portfolio image removed' })
  @ApiResponse({ status: 400, description: 'URL required' })
  async removePortfolioImage(
    @CurrentUser('id') userId: string,
    @Body('url') url: string,
  ) {
    if (!url) throw new BadRequestException('URL wajib diisi');

    const profile = await this.userService.getProfile(userId);
    const escortProfile = (profile as any)?.escortProfile;
    const existingUrls: string[] = escortProfile?.portfolioUrls || [];
    const filteredUrls = existingUrls.filter((u) => u !== url);

    // Delete the physical file
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    if (filename) {
      this.uploadService.deleteFile('portfolio', filename);
    }

    await this.userService.updateEscortProfile(userId, { portfolioUrls: filteredUrls } as any);
    return { portfolioUrls: filteredUrls };
  }

  @Post('escorts/me/video-intro')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ESCORT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload video intro for escort profile' })
  @ApiResponse({ status: 200, description: 'Video intro uploaded' })
  @ApiResponse({ status: 400, description: 'Video file required' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        video: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('video', { limits: { fileSize: 50 * 1024 * 1024 } }))
  async uploadVideoIntro(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('File video wajib diupload');

    // Delete old video if exists
    const profile = await this.userService.getProfile(userId);
    const escortProfile = (profile as any)?.escortProfile;
    if (escortProfile?.videoIntroUrl) {
      const parts = escortProfile.videoIntroUrl.split('/');
      const filename = parts[parts.length - 1];
      if (filename) {
        this.uploadService.deleteFile('videos', filename);
      }
    }

    const upload = await this.uploadService.saveFile(file, 'videos', {
      maxSizeMB: 50,
      allowedTypes: ['video/mp4', 'video/quicktime', 'video/webm', 'video/mpeg'],
    });

    await this.userService.updateEscortProfile(userId, { videoIntroUrl: upload.url } as any);
    return { url: upload.url };
  }

  @Delete('escorts/me/video-intro')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ESCORT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove video intro' })
  @ApiResponse({ status: 200, description: 'Video intro removed' })
  async removeVideoIntro(@CurrentUser('id') userId: string) {
    const profile = await this.userService.getProfile(userId);
    const escortProfile = (profile as any)?.escortProfile;
    if (escortProfile?.videoIntroUrl) {
      const parts = escortProfile.videoIntroUrl.split('/');
      const filename = parts[parts.length - 1];
      if (filename) {
        this.uploadService.deleteFile('videos', filename);
      }
    }
    await this.userService.updateEscortProfile(userId, { videoIntroUrl: null } as any);
    return { success: true };
  }

  @Post('escorts/me/certifications/upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ESCORT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload certification document then create certification' })
  @ApiResponse({ status: 201, description: 'Certification created with uploaded document' })
  @ApiResponse({ status: 400, description: 'Document file required' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('document', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadCertificationDoc(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { certName: string; issuer: string; validUntil?: string },
  ) {
    if (!file) throw new BadRequestException('File dokumen wajib diupload');

    const upload = await this.uploadService.saveFile(file, 'certifications', {
      maxSizeMB: 10,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    });

    return this.userService.addCertification(userId, {
      certType: 'DOCUMENT',
      certName: body.certName,
      issuer: body.issuer,
      validUntil: body.validUntil,
      documentUrl: upload.url,
    });
  }

  @Post('escorts/me/certifications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ESCORT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a certification' })
  @ApiResponse({ status: 201, description: 'Certification added' })
  async addCertification(@CurrentUser('id') userId: string, @Body() dto: CreateCertificationDto) {
    return this.userService.addCertification(userId, dto);
  }

  @Delete('escorts/me/certifications/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ESCORT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a certification' })
  @ApiResponse({ status: 200, description: 'Certification deleted' })
  @ApiResponse({ status: 404, description: 'Certification not found' })
  async deleteCertification(@CurrentUser('id') userId: string, @Param('id') certId: string) {
    return this.userService.deleteCertification(userId, certId);
  }

  @Get('escorts')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'List and search escorts (full-text search with PostgreSQL ts_vector/ts_query)' })
  @ApiResponse({ status: 200, description: 'Paginated escort list' })
  async listEscorts(@Query() query: EscortQueryDto, @CurrentUser() user: any) {
    return this.userService.listEscorts(query, !!user);
  }

  @Get('escorts/search/suggestions')
  @ApiOperation({ summary: 'Get search autocomplete suggestions' })
  @ApiResponse({ status: 200, description: 'Search suggestions returned' })
  async searchSuggestions(@Query('q') q: string) {
    return this.userService.getSearchSuggestions(q);
  }

  @Get('escorts/:id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get escort detail profile' })
  @ApiResponse({ status: 200, description: 'Escort profile with reviews and stats' })
  @ApiResponse({ status: 404, description: 'Escort not found' })
  async getEscortDetail(@Param('id') id: string, @CurrentUser() user: any) {
    return this.userService.getEscortDetail(id, !!user);
  }

  @Put('escorts/me/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ESCORT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update weekly availability schedule' })
  @ApiResponse({ status: 200, description: 'Availability updated' })
  async updateAvailability(@CurrentUser('id') userId: string, @Body() dto: UpdateAvailabilityDto) {
    return this.userService.updateAvailability(userId, dto);
  }

  @Get('escorts/me/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ESCORT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my availability schedule' })
  @ApiResponse({ status: 200, description: 'Availability schedule returned' })
  async getAvailability(@CurrentUser('id') userId: string) {
    return this.userService.getAvailability(userId);
  }

  @Get('escorts/me/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ESCORT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get escort performance analytics' })
  @ApiResponse({ status: 200, description: 'Analytics data returned' })
  async getAnalytics(
    @CurrentUser('id') userId: string,
    @Query('period') period?: string,
  ) {
    return this.userService.getEscortAnalytics(userId, period || 'month');
  }

  // ---- Favorites ----

  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my favorite escorts' })
  @ApiResponse({ status: 200, description: 'Paginated favorites list' })
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
  @ApiResponse({ status: 201, description: 'Escort added to favorites' })
  @ApiResponse({ status: 400, description: 'Already in favorites' })
  async addFavorite(@CurrentUser('id') userId: string, @Param('escortId') escortId: string) {
    return this.userService.addFavorite(userId, escortId);
  }

  @Delete('favorites/:escortId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove escort from favorites' })
  @ApiResponse({ status: 200, description: 'Escort removed from favorites' })
  async removeFavorite(@CurrentUser('id') userId: string, @Param('escortId') escortId: string) {
    return this.userService.removeFavorite(userId, escortId);
  }

  @Get('favorites/:escortId/check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if escort is favorited' })
  @ApiResponse({ status: 200, description: 'Favorite status returned' })
  async checkFavorite(@CurrentUser('id') userId: string, @Param('escortId') escortId: string) {
    return this.userService.isFavorited(userId, escortId);
  }

  // ---- Quick Re-book ----

  @Get('bookings/recent-escorts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recent escorts for quick re-booking' })
  @ApiResponse({ status: 200, description: 'Recent escorts returned' })
  async getRecentEscorts(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.userService.getRecentEscorts(userId, limit);
  }
}
