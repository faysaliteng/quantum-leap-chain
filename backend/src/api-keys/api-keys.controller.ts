import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { CurrentUser } from '../common/auth/decorators';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Controller('v1/api-keys')
export class ApiKeysController {
  constructor(private apiKeysService: ApiKeysService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.apiKeysService.list(user.merchant_id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: CreateApiKeyDto) {
    return this.apiKeysService.create(user.merchant_id, body);
  }

  @Delete(':id')
  revoke(@CurrentUser() user: any, @Param('id') id: string) {
    return this.apiKeysService.revoke(user.merchant_id, id);
  }
}
