import { Global, Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { fireAuthService } from './fireauth.service';

@Global()
@Module({
  imports: [DbModule],
  controllers: [],
  providers: [fireAuthService],
  exports: [fireAuthService],
})
export class FirebaseModule {}