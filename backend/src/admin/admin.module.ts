import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SwapModule } from '../swap/swap.module';
import { SignerModule } from '../signer/signer.module';

@Module({
  imports: [SwapModule, SignerModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
