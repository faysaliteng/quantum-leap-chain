import { Controller, Get, Put, Body } from '@nestjs/common';
import { SecurityPoliciesService } from './security-policies.service';
import { Roles, CurrentUser } from '../common/auth/decorators';

@Controller('v1/admin/security-policies')
@Roles('admin')
export class SecurityPoliciesController {
  constructor(private securityPoliciesService: SecurityPoliciesService) {}

  @Get()
  get() { return this.securityPoliciesService.get(); }

  @Put()
  update(@CurrentUser() user: any, @Body() body: any) {
    return this.securityPoliciesService.update(user.sub, body);
  }
}
