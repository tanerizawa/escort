import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MatchingService } from './matching.service';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';

@Controller('matching')
@ApiTags('matching')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get()
  @ApiOperation({ summary: 'Find matching escorts based on criteria' })
  async findMatches(
    @Query('serviceType') serviceType: string,
    @Query('date') date: string,
    @Query('duration') duration: number,
    @Query('location') location?: string,
    @Query('tier') tier?: string,
    @Query('languages') languages?: string,
    @Query('limit') limit?: number,
  ) {
    return this.matchingService.findMatches({
      serviceType,
      date,
      duration: Number(duration),
      location,
      preferredTier: tier,
      languages: languages?.split(','),
      limit: limit ? Number(limit) : undefined,
    });
  }
}
