import { Module, Global } from '@nestjs/common';
import { SignerService } from './signer.service';
import { KeyManagerService } from './key-manager.service';

@Global()
@Module({
  providers: [SignerService, KeyManagerService],
  exports: [SignerService, KeyManagerService],
})
export class SignerModule {}
