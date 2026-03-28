import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/config/prisma.service';
import { UpdateRefundClaimDto } from './dto/update-refund-claim.dto';
import { PaymentService } from '@modules/payment/payment.service';
import { NotificationService } from '@modules/notification/notification.service';

@Injectable()
export class RefundClaimService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly notificationService: NotificationService,
  ) {}

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [claims, total] = await Promise.all([
      this.prisma.refundClaim.findMany({
        skip,
        take: limit,
        include: {
          requester: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          booking: {
            select: {
              id: true,
              serviceType: true,
              totalAmount: true,
              startTime: true,
              cancelledAt: true,
              cancelReason: true,
            },
          },
          payment: {
            select: {
              id: true,
              amount: true,
              status: true,
              forfeited: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.refundClaim.count(),
    ]);

    return {
      claims,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const claim = await this.prisma.refundClaim.findUnique({
      where: { id },
      include: {
        requester: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
          },
        },
        booking: {
          select: {
            id: true,
            serviceType: true,
            totalAmount: true,
            startTime: true,
            endTime: true,
            location: true,
            specialRequests: true,
            cancelledAt: true,
            cancelReason: true,
            cancelledBy: true,
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            forfeited: true,
            paymentGatewayRef: true,
            paidAt: true,
          },
        },
      },
    });

    if (!claim) {
      throw new NotFoundException('Refund claim not found');
    }

    return claim;
  }

  async updateStatus(id: string, dto: UpdateRefundClaimDto, adminId: string) {
    const claim = await this.findOne(id);
    
    if (claim.status !== 'PENDING') {
      throw new BadRequestException('Only pending claims can be updated');
    }

    // Start transaction
    const updatedClaim = await this.prisma.$transaction(async (tx) => {
      // Update claim status
      const result = await tx.refundClaim.update({
        where: { id },
        data: {
          status: dto.status,
          handledBy: adminId,
          handledAt: new Date(),
        },
      });

      // If approved, process the refund
      if (dto.status === 'APPROVED') {
        await this.paymentService.processRefund(claim.paymentId, {
          reason: 'Admin approved refund claim',
          adminId,
        });
      }

      return result;
    });

    // Notify the requester about the result
    const amount = claim.payment?.amount?.toNumber?.() || 0;
    await this.notificationService.create(
      claim.requesterId,
      dto.status === 'APPROVED' ? 'Refund Disetujui' : 'Refund Ditolak',
      dto.status === 'APPROVED'
        ? `Refund Rp ${amount.toLocaleString('id-ID')} telah disetujui dan akan diproses.`
        : `Refund Rp ${amount.toLocaleString('id-ID')} telah ditolak oleh admin.`,
      'PAYMENT',
      { claimId: id, bookingId: claim.bookingId, status: dto.status },
    );

    return updatedClaim;
  }

  /**
   * Called after a refund claim is auto-created (e.g. from booking cancellation)
   */
  async notifyNewClaim(claimId: string, bookingId: string, requesterName: string, amount: number) {
    await this.notificationService.notifyAdmins(
      'Refund Claim Baru',
      `${requesterName} mengajukan refund Rp ${amount.toLocaleString('id-ID')} untuk booking ${bookingId.substring(0, 8).toUpperCase()}`,
      'PAYMENT',
      { claimId, bookingId, link: `/finance` },
    );
  }

  async getStats() {
    const [pending, approved, rejected] = await Promise.all([
      this.prisma.refundClaim.count({ where: { status: 'PENDING' } }),
      this.prisma.refundClaim.count({ where: { status: 'APPROVED' } }),
      this.prisma.refundClaim.count({ where: { status: 'REJECTED' } }),
    ]);

    // Get total pending amount by summing related payment amounts
    const pendingClaims = await this.prisma.refundClaim.findMany({
      where: { status: 'PENDING' },
      include: { payment: { select: { amount: true } } },
    });

    const totalPendingValue = pendingClaims.reduce((sum, claim) => 
      sum + claim.payment.amount.toNumber(), 0);

    return {
      pending,
      approved,
      rejected,
      totalPendingValue,
    };
  }
}