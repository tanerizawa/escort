import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SafetyService } from './safety.service';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

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
    @Body() body: { bookingId: string; description?: string },
  ) {
    return this.safetyService.triggerSOS(userId, body.bookingId, body.description);
  }

  @Post('incident')
  @ApiOperation({ summary: 'Report an incident' })
  async reportIncident(
    @CurrentUser('id') userId: string,
    @Body() body: {
      bookingId: string;
      type: string;
      description: string;
      severity: number;
    },
  ) {
    return this.safetyService.reportIncident(userId, body);
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

  @Post('location')
  @ApiOperation({ summary: 'Update live GPS location during booking' })
  async updateLocation(
    @CurrentUser('id') userId: string,
    @Body() body: {
      bookingId: string;
      lat: number;
      lng: number;
      accuracy?: number;
    },
  ) {
    return this.safetyService.updateLocation(userId, body.bookingId, {
      lat: body.lat,
      lng: body.lng,
      accuracy: body.accuracy,
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
    @Param('bookingId') bookingId: string,
  ) {
    return this.safetyService.checkLateAlert(bookingId);
  }
}
