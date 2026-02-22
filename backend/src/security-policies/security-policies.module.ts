import { Module } from '@nestjs/common';
import { SecurityPoliciesController } from './security-policies.controller';
import { SecurityPoliciesService } from './security-policies.service';

@Module({
  controllers: [SecurityPoliciesController],
  providers: [SecurityPoliciesService],
})
export class SecurityPoliciesModule {}
