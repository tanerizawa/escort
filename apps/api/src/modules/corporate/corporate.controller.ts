import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CorporateService } from './corporate.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';

@ApiTags('Corporate')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('corporate')
export class CorporateController {
  constructor(private corporateService: CorporateService) {}

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create corporate subscription' })
  create(@Body() body: {
    companyName: string;
    contactPerson: string;
    contactEmail: string;
    contactPhone?: string;
    plan: string;
    maxUsers?: number;
    monthlyBudget: number;
    discountPercent?: number;
    features?: Record<string, boolean>;
    startDate: string;
    endDate: string;
  }) {
    return this.corporateService.createSubscription({
      ...body,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    });
  }

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List corporate subscriptions' })
  list(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.corporateService.listSubscriptions({
      status,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('stats')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Corporate subscription stats' })
  stats() {
    return this.corporateService.getStats();
  }

  @Get(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get corporate subscription details' })
  findOne(@Param('id') id: string) {
    return this.corporateService.getSubscription(id);
  }

  @Put(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update corporate subscription' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.corporateService.updateSubscription(id, body);
  }

  @Post(':id/members')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Add member to corporate subscription' })
  addMember(
    @Param('id') id: string,
    @Body() body: { userId: string; role?: string },
  ) {
    return this.corporateService.addMember(id, body.userId, body.role);
  }

  @Delete(':id/members/:userId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Remove member from corporate subscription' })
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.corporateService.removeMember(id, userId);
  }
}
