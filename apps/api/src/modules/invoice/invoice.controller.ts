import { Controller, Get, Param, Res, UseGuards, Request, Header } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { InvoiceService } from './invoice.service';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get(':paymentId')
  async getInvoice(@Param('paymentId') paymentId: string, @Request() req: any) {
    return this.invoiceService.generateInvoice(paymentId, req.user.id);
  }

  @Get(':paymentId/html')
  async getInvoiceHTML(
    @Param('paymentId') paymentId: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const html = await this.invoiceService.generateInvoiceHTML(paymentId, req.user.id);
    res.set({ 'Content-Type': 'text/html; charset=utf-8' });
    res.send(html);
  }
}
