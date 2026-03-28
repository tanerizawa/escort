import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PremiumService } from './premium.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';

@ApiTags('Premium Listings')
@Controller('premium')
export class PremiumController {
  constructor(private premiumService: PremiumService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create premium listing' })
  create(@Body() body: {
    escortId: string;
    type: string;
    startDate: string;
    endDate: string;
    amount: number;
  }) {
    return this.premiumService.createListing({
      ...body,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    });
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List all premium listings' })
  list(
    @Query('type') type?: string,
    @Query('isActive') isActive?: string,
    @Query('escortId') escortId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.premiumService.listListings({
      type,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      escortId,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured escorts (public)' })
  featured(
    @Query('type') type?: string,
    @Query('limit') limit?: string,
  ) {
    return this.premiumService.getFeaturedEscorts(type || 'FEATURED', limit ? parseInt(limit) : 10);
  }

  @Get('stats')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Premium listing stats' })
  stats() {
    return this.premiumService.getStats();
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get listing details' })
  findOne(@Param('id') id: string) {
    return this.premiumService.getListing(id);
  }

  @Patch(':id/deactivate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Deactivate premium listing' })
  deactivate(@Param('id') id: string) {
    return this.premiumService.deactivateListing(id);
  }

  @Patch(':id/impression')
  @ApiOperation({ summary: 'Track listing impression' })
  impression(@Param('id') id: string) {
    return this.premiumService.trackImpression(id);
  }

  @Patch(':id/click')
  @ApiOperation({ summary: 'Track listing click' })
  click(@Param('id') id: string) {
    return this.premiumService.trackClick(id);
  }

  @Post('expire')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Expire old listings' })
  expire() {
    return this.premiumService.expireListings();
  }
}
