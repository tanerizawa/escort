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
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TrainingService } from './training.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';

@ApiTags('Training')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('training')
export class TrainingController {
  constructor(private trainingService: TrainingService) {}

  // ── Admin: Module Management ─────────────

  @Post('modules')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create training module' })
  createModule(@Body() body: {
    title: string;
    description: string;
    category: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    durationMins?: number;
    sortOrder?: number;
    isRequired?: boolean;
    passingScore?: number;
  }) {
    return this.trainingService.createModule(body);
  }

  @Get('modules')
  @ApiOperation({ summary: 'List training modules' })
  listModules(
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.trainingService.listModules({
      category,
      isPublished: true,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('modules/:id')
  @ApiOperation({ summary: 'Get training module with user progress' })
  getModule(@Param('id') id: string, @Req() req: any) {
    return this.trainingService.getModuleWithProgress(req.user.id, id);
  }

  @Put('modules/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update training module' })
  updateModule(@Param('id') id: string, @Body() body: any) {
    return this.trainingService.updateModule(id, body);
  }

  @Delete('modules/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete training module' })
  deleteModule(@Param('id') id: string) {
    return this.trainingService.deleteModule(id);
  }

  // ── Escort: Progress ─────────────────────

  @Get('progress')
  @ApiOperation({ summary: 'Get my training progress' })
  getProgress(@Req() req: any) {
    return this.trainingService.getUserProgress(req.user.id);
  }

  @Post('modules/:id/start')
  @ApiOperation({ summary: 'Start a training module' })
  startModule(@Param('id') id: string, @Req() req: any) {
    return this.trainingService.startModule(req.user.id, id);
  }

  @Put('modules/:id/progress')
  @ApiOperation({ summary: 'Update training progress' })
  updateProgress(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: { progressPct: number; score?: number },
  ) {
    return this.trainingService.updateProgress(req.user.id, id, body);
  }

  // ── Admin: Stats ─────────────────────────

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Training stats' })
  getStats() {
    return this.trainingService.getStats();
  }
}
