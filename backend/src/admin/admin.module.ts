import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SwapModule } from '../swap/swap.module';

@Module({
  imports: [SwapModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
