import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query,
  UseGuards, Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { ArticleService } from './article.service';

@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  // ── Public endpoints ──

  @Public()
  @Get()
  async listPublished(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
  ) {
    return this.articleService.listPublished(
      Number(page) || 1,
      Number(limit) || 10,
      category,
    );
  }

  @Public()
  @Get('categories')
  async getCategories() {
    return this.articleService.getCategories();
  }

  @Public()
  @Get('slug/:slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.articleService.getBySlug(slug);
  }

  // ── Authenticated endpoints ──

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  async getMyArticles(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.articleService.getMyArticles(req.user.id, Number(page) || 1, Number(limit) || 10);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req: any, @Body() body: {
    title: string;
    content: string;
    excerpt?: string;
    category?: string;
    tags?: string[];
    coverImage?: string;
  }) {
    return this.articleService.create(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.articleService.update(id, req.user.id, req.user.role, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.articleService.delete(id, req.user.id, req.user.role);
  }

  // ── Admin endpoints ──

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get('admin/all')
  async adminList(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.articleService.adminList(Number(page) || 1, Number(limit) || 20, status);
  }
}
