import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/auth/decorators';
import { PrismaService } from '../common/prisma/prisma.service';

@Controller('v1/public')
export class PublicController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get('faq')
  faq() {
    return this.prisma.cMSFAQEntry.findMany({
      where: { visible: true },
      orderBy: { sort_order: 'asc' },
    });
  }

  @Public()
  @Get('blog')
  blog() {
    return this.prisma.cMSBlogPost.findMany({
      where: { status: 'published' },
      orderBy: { published_at: 'desc' },
    });
  }
}
