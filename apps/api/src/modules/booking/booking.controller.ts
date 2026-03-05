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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { CreateBookingDto, UpdateBookingStatusDto, BookingQueryDto, RescheduleBookingDto, TipBookingDto } from './dto/booking.dto';
import { AdminService } from '@modules/admin/admin.service';

@Controller('bookings')
@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly adminService: AdminService,
  ) {}

  @Post()
  @Roles('CLIENT')
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  async createBooking(
    @CurrentUser('id') clientId: string,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingService.create(clientId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List my bookings (client or escort)' })
  async listBookings(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Query() query: BookingQueryDto,
  ) {
    return this.bookingService.findAll(userId, role, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking detail' })
  async getBooking(
    @CurrentUser('id') userId: string,
    @Param('id') bookingId: string,
  ) {
    return this.bookingService.findOne(userId, bookingId);
  }

  @Patch(':id/accept')
  @Roles('ESCORT')
  @ApiOperation({ summary: 'Accept booking (escort only)' })
  async acceptBooking(
    @CurrentUser('id') escortId: string,
    @Param('id') bookingId: string,
  ) {
    return this.bookingService.accept(escortId, bookingId);
  }

  @Patch(':id/reject')
  @Roles('ESCORT')
  @ApiOperation({ summary: 'Reject booking (escort only)' })
  async rejectBooking(
    @CurrentUser('id') escortId: string,
    @Param('id') bookingId: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingService.reject(escortId, bookingId, dto.reason);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel booking' })
  async cancelBooking(
    @CurrentUser('id') userId: string,
    @Param('id') bookingId: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingService.cancel(userId, bookingId, dto.reason);
  }

  @Patch(':id/checkin')
  @ApiOperation({ summary: 'Check-in at location (GPS verified)' })
  async checkin(
    @CurrentUser('id') userId: string,
    @Param('id') bookingId: string,
  ) {
    return this.bookingService.checkin(userId, bookingId);
  }

  @Patch(':id/checkout')
  @ApiOperation({ summary: 'Check-out (end booking)' })
  async checkout(
    @CurrentUser('id') userId: string,
    @Param('id') bookingId: string,
  ) {
    return this.bookingService.checkout(userId, bookingId);
  }

  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule booking (new times, re-check availability)' })
  async reschedule(
    @CurrentUser('id') userId: string,
    @Param('id') bookingId: string,
    @Body() dto: RescheduleBookingDto,
  ) {
    return this.bookingService.reschedule(userId, bookingId, dto);
  }

  @Post(':id/tip')
  @Roles('CLIENT')
  @ApiOperation({ summary: 'Give a tip to the escort for a completed booking' })
  @ApiResponse({ status: 200, description: 'Tip added successfully' })
  async tipEscort(
    @CurrentUser('id') clientId: string,
    @Param('id') bookingId: string,
    @Body() dto: TipBookingDto,
  ) {
    return this.bookingService.addTip(clientId, bookingId, dto);
  }

  @Post('promo/validate')
  @ApiOperation({ summary: 'Validate a promo code' })
  async validatePromoCode(
    @Body() body: { code: string; orderAmount: number },
  ) {
    return this.adminService.validatePromoCode(body.code, body.orderAmount);
  }
}
