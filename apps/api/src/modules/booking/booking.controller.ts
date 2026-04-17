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
import { ValidatePromoCodeDto } from '@modules/common-dto';
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
  @ApiResponse({ status: 400, description: 'Validation error or escort unavailable' })
  @ApiResponse({ status: 403, description: 'Forbidden — client role required' })
  async createBooking(
    @CurrentUser('id') clientId: string,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingService.create(clientId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List my bookings (client or escort)' })
  @ApiResponse({ status: 200, description: 'Paginated booking list' })
  async listBookings(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Query() query: BookingQueryDto,
  ) {
    return this.bookingService.findAll(userId, role, query);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get currently active booking (CONFIRMED+paid or ONGOING) for transaction lock mode' })
  @ApiResponse({ status: 200, description: 'Active booking details or null' })
  async getActiveBooking(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.bookingService.findActive(userId, role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking detail' })
  @ApiResponse({ status: 200, description: 'Booking detail with relations' })
  @ApiResponse({ status: 403, description: 'Not a participant' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getBooking(
    @CurrentUser('id') userId: string,
    @Param('id') bookingId: string,
  ) {
    return this.bookingService.findOne(userId, bookingId);
  }

  @Patch(':id/accept')
  @Roles('ESCORT')
  @ApiOperation({ summary: 'Accept booking (escort only)' })
  @ApiResponse({ status: 200, description: 'Booking accepted — status CONFIRMED' })
  @ApiResponse({ status: 400, description: 'Booking not in PENDING status' })
  @ApiResponse({ status: 403, description: 'Not your booking' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async acceptBooking(
    @CurrentUser('id') escortId: string,
    @Param('id') bookingId: string,
  ) {
    return this.bookingService.accept(escortId, bookingId);
  }

  @Patch(':id/reject')
  @Roles('ESCORT')
  @ApiOperation({ summary: 'Reject booking (escort only)' })
  @ApiResponse({ status: 200, description: 'Booking rejected — status CANCELLED' })
  @ApiResponse({ status: 400, description: 'Booking not in PENDING status' })
  @ApiResponse({ status: 403, description: 'Not your booking' })
  async rejectBooking(
    @CurrentUser('id') escortId: string,
    @Param('id') bookingId: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingService.reject(escortId, bookingId, dto.reason);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel booking' })
  @ApiResponse({ status: 200, description: 'Booking cancelled (may include cancellation fee)' })
  @ApiResponse({ status: 400, description: 'Cannot cancel at current status' })
  @ApiResponse({ status: 403, description: 'Escort cannot cancel — use replacement' })
  async cancelBooking(
    @CurrentUser('id') userId: string,
    @Param('id') bookingId: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingService.cancel(userId, bookingId, dto.reason);
  }

  @Patch(':id/recommend-replacement')
  @Roles('ESCORT')
  @ApiOperation({ summary: 'Escort recommends a replacement for the booking' })
  @ApiResponse({ status: 200, description: 'Replacement requested' })
  @ApiResponse({ status: 400, description: 'Only CONFIRMED bookings allowed' })
  async recommendReplacement(
    @CurrentUser('id') escortId: string,
    @Param('id') bookingId: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingService.recommendReplacement(escortId, bookingId, dto.reason);
  }

  @Patch(':id/checkin')
  @ApiOperation({ summary: 'Check-in at location (GPS verified)' })
  @ApiResponse({ status: 200, description: 'Checked in — status ONGOING' })
  @ApiResponse({ status: 400, description: 'Payment required before check-in' })
  async checkin(
    @CurrentUser('id') userId: string,
    @Param('id') bookingId: string,
  ) {
    return this.bookingService.checkin(userId, bookingId);
  }

  @Patch(':id/checkout')
  @ApiOperation({ summary: 'Check-out (end booking)' })
  @ApiResponse({ status: 200, description: 'Checked out — status COMPLETED' })
  @ApiResponse({ status: 400, description: 'Must be ONGOING to checkout' })
  async checkout(
    @CurrentUser('id') userId: string,
    @Param('id') bookingId: string,
  ) {
    return this.bookingService.checkout(userId, bookingId);
  }

  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule booking (new times, re-check availability)' })
  @ApiResponse({ status: 200, description: 'Booking rescheduled — status reset to PENDING' })
  @ApiResponse({ status: 400, description: 'Cannot reschedule at current status or overlap' })
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
  @ApiResponse({ status: 400, description: 'Booking not completed or tip already given' })
  async tipEscort(
    @CurrentUser('id') clientId: string,
    @Param('id') bookingId: string,
    @Body() dto: TipBookingDto,
  ) {
    return this.bookingService.addTip(clientId, bookingId, dto);
  }

  @Post('promo/validate')
  @ApiOperation({ summary: 'Validate a promo code' })
  @ApiResponse({ status: 200, description: 'Promo code valid — discount returned' })
  @ApiResponse({ status: 400, description: 'Invalid or expired promo code' })
  async validatePromoCode(
    @Body() dto: ValidatePromoCodeDto,
  ) {
    return this.adminService.validatePromoCode(dto.code, dto.orderAmount);
  }
}
