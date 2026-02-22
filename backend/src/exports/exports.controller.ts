import { Controller, Get, Post, Param, Query, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { ExportsService } from './exports.service';
import { CurrentUser } from '../common/auth/decorators';

@Controller('v1/exports')
export class ExportsController {
  constructor(private exportsService: ExportsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.exportsService.create(user.sub, user.merchant_id, body);
  }

  @Get()
  list(@CurrentUser() user: any, @Query() query: any) {
    return this.exportsService.list(user.sub, query);
  }

  @Get(':id')
  get(@CurrentUser() user: any, @Param('id') id: string) {
    return this.exportsService.get(user.sub, id);
  }

  @Get(':id/download')
  async download(@CurrentUser() user: any, @Param('id') id: string, @Res() res: Response) {
    const stream = await this.exportsService.download(user.sub, id);
    res.setHeader('Content-Type', 'application/octet-stream');
    stream.pipe(res);
  }
}
