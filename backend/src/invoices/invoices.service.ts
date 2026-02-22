import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async list(merchantId: string, query: any) {
    const page = parseInt(query.page) || 1;
    const perPage = parseInt(query.per_page) || 20;
    const where: any = { merchant_id: merchantId };
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({ where, skip: (page - 1) * perPage, take: perPage, orderBy: { created_at: 'desc' } }),
      this.prisma.invoice.count({ where }),
    ]);

    return { data, total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) };
  }

  async findOne(merchantId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({ where: { id, merchant_id: merchantId } });
    if (!invoice) throw new NotFoundException();
    return invoice;
  }

  async create(merchantId: string, data: any) {
    const items = data.items.map((item: any) => ({
      ...item,
      amount: (parseFloat(item.unit_price) * item.quantity).toFixed(2),
    }));
    const subtotal = items.reduce((sum: number, i: any) => sum + parseFloat(i.amount), 0);
    const taxRate = data.tax_rate || 0;
    const taxAmount = (subtotal * taxRate / 100).toFixed(2);
    const total = (subtotal + parseFloat(taxAmount)).toFixed(2);

    const count = await this.prisma.invoice.count({ where: { merchant_id: merchantId } });
    const number = `INV-${String(count + 1).padStart(5, '0')}`;

    return this.prisma.invoice.create({
      data: {
        merchant_id: merchantId,
        number,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        items,
        subtotal: subtotal.toFixed(2),
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        currency: data.currency,
        chains: data.chains,
        due_date: new Date(data.due_date),
        notes: data.notes,
      },
    });
  }

  async update(merchantId: string, id: string, data: any) {
    const invoice = await this.prisma.invoice.findFirst({ where: { id, merchant_id: merchantId } });
    if (!invoice) throw new NotFoundException();
    return this.prisma.invoice.update({ where: { id }, data });
  }

  async send(merchantId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({ where: { id, merchant_id: merchantId } });
    if (!invoice) throw new NotFoundException();
    // TODO: Send email to customer
    return this.prisma.invoice.update({ where: { id }, data: { status: 'sent', sent_at: new Date() } });
  }

  async cancel(merchantId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({ where: { id, merchant_id: merchantId } });
    if (!invoice) throw new NotFoundException();
    await this.prisma.invoice.update({ where: { id }, data: { status: 'cancelled' } });
  }

  async remove(merchantId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({ where: { id, merchant_id: merchantId } });
    if (!invoice) throw new NotFoundException();
    await this.prisma.invoice.delete({ where: { id } });
  }

  async generatePdf(_merchantId: string, _id: string) {
    // TODO: Generate PDF
    return Buffer.from('PDF placeholder');
  }
}
