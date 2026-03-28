import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SafetyService } from './safety.service';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { TriggerSOSDto, ReportIncidentDto, PingLocationDto, UpdateLocationDto } from '@modules/common-dto';

@Controller('safety')
@ApiTags('safety')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  @Post('sos')
  @ApiOperation({ summary: 'Trigger SOS emergency alert' })
  async triggerSOS(
    @CurrentUser('id') userId: string,
    @Body() dto: TriggerSOSDto,
  ) {
    return this.safetyService.triggerSOS(userId, dto.bookingId, dto.description);
  }

  @Post('incident')
  @UseInterceptors(FilesInterceptor('evidence', 5, { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Report an incident' })
  async reportIncident(
    @CurrentUser('id') userId: string,
    @Body() dto: ReportIncidentDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.safetyService.reportIncident(userId, dto, files);
  }

  @Get('incidents')
  @ApiOperation({ summary: 'List my incident reports' })
  async listMyIncidents(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
  ) {
    return this.safetyService.listIncidents(userId, page);
  }

  @Get('incidents/:id')
  @ApiOperation({ summary: 'Get incident detail' })
  async getIncident(
    @CurrentUser('id') userId: string,
    @Param('id') incidentId: string,
  ) {
    return this.safetyService.getIncident(userId, incidentId);
  }

  // ── Location Tracking ──────────────────────────────

  @Post('location/ping')
  @ApiOperation({ summary: 'Update general GPS location (no booking required)' })
  async pingLocation(
    @CurrentUser('id') userId: string,
    @Body() dto: PingLocationDto,
  ) {
    return this.safetyService.pingUserLocation(userId, {
      lat: dto.lat,
      lng: dto.lng,
      accuracy: dto.accuracy,
    });
  }

  @Post('location')
  @ApiOperation({ summary: 'Update live GPS location during booking' })
  async updateLocation(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.safetyService.updateLocation(userId, dto.bookingId, {
      lat: dto.lat,
      lng: dto.lng,
      accuracy: dto.accuracy,
    });
  }

  @Get('tracking/:bookingId')
  @ApiOperation({ summary: 'Get live tracking data for a booking' })
  async getTracking(
    @CurrentUser('id') userId: string,
    @Param('bookingId') bookingId: string,
  ) {
    return this.safetyService.getTracking(userId, bookingId);
  }

  @Get('tracking/:bookingId/history/:targetUserId')
  @ApiOperation({ summary: 'Get location history for a booking participant' })
  async getLocationHistory(
    @CurrentUser('id') userId: string,
    @Param('bookingId') bookingId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.safetyService.getLocationHistory(userId, bookingId, targetUserId);
  }

  @Get('late-check/:bookingId')
  @ApiOperation({ summary: 'Check late alert status for a booking' })
  async checkLateAlert(
    @CurrentUser('id') userId: string,
    @Param('bookingId') bookingId: string,
  ) {
    return this.safetyService.checkLateAlert(bookingId, userId);
  }
}
