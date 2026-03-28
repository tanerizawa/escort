import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { RefundClaimService } from './refund-claim.service';
import { UpdateRefundClaimDto } from './dto/update-refund-claim.dto';

@Controller('admin/refund-claims')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class RefundClaimController {
  constructor(private readonly refundClaimService: RefundClaimService) {}

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.refundClaimService.findAll(page, limit);
  }

  @Get('stats')
  async getStats() {
    return this.refundClaimService.getStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.refundClaimService.findOne(id);
  }

  @Patch(':id')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateRefundClaimDto: UpdateRefundClaimDto,
    @Request() req: any,
  ) {
    return this.refundClaimService.updateStatus(
      id,
      updateRefundClaimDto,
      req.user.id,
    );
  }
}