import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { CreateReviewDto, ReplyReviewDto } from './dto/review.dto';

@Controller('reviews')
@ApiTags('reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a review for a completed booking' })
  async createReview(
    @CurrentUser('id') reviewerId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewService.create(reviewerId, dto);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Get reviews written by the current user' })
  async getMyReviews(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reviewService.findByReviewer(userId, page, limit);
  }

  @Get('escort/:escortId')
  @ApiOperation({ summary: 'Get reviews for an escort' })
  async getEscortReviews(
    @Param('escortId') escortId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reviewService.findByEscort(escortId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review detail' })
  async getReview(@Param('id') reviewId: string) {
    return this.reviewService.findOne(reviewId);
  }

  @Patch(':id/reply')
  @ApiOperation({ summary: 'Reply to a review (escort only)' })
  async replyToReview(
    @CurrentUser('id') userId: string,
    @Param('id') reviewId: string,
    @Body() dto: ReplyReviewDto,
  ) {
    return this.reviewService.reply(userId, reviewId, dto);
  }

  @Patch(':id/flag')
  @ApiOperation({ summary: 'Flag inappropriate review' })
  async flagReview(
    @CurrentUser('id') userId: string,
    @Param('id') reviewId: string,
  ) {
    return this.reviewService.flag(userId, reviewId);
  }
}
