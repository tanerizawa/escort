import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query,
  UseGuards, Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { TestimonialService } from './testimonial.service';

@Controller('testimonials')
export class TestimonialController {
  constructor(private readonly testimonialService: TestimonialService) {}

  @Public()
  @Get()
  async listApproved(
    @Query('limit') limit?: string,
    @Query('featured') featured?: string,
  ) {
    return this.testimonialService.listApproved(
      Number(limit) || 10,
      featured === 'true',
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Request() req: any,
    @Body() body: { content: string; rating: number },
  ) {
    return this.testimonialService.create(req.user.id, body.content, body.rating);
  }

  // ── Admin endpoints ──

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get('admin/all')
  async adminList(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.testimonialService.adminList(Number(page) || 1, Number(limit) || 20);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Patch('admin/:id')
  async adminUpdate(
    @Param('id') id: string,
    @Body() body: { isApproved?: boolean; isFeatured?: boolean },
  ) {
    return this.testimonialService.adminUpdate(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Delete('admin/:id')
  async adminDelete(@Param('id') id: string) {
    return this.testimonialService.adminDelete(id);
  }
}
