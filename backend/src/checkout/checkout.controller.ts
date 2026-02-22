import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { Public } from '../common/auth/decorators';
import { PrismaService } from '../common/prisma/prisma.service';

@Controller('v1/checkout')
export class CheckoutController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get(':id')
  async getCharge(@Param('id') id: string) {
    const charge = await this.prisma.charge.findUnique({
      where: { id },
      include: { payment_addresses: true },
    });
    if (!charge) throw new NotFoundException('Charge not found');
    return charge;
  }
}
