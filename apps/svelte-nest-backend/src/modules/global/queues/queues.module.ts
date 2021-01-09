import { Global, Module } from '@nestjs/common';
import { QueuesService } from './services/queues.service';

@Global()
@Module({
  imports:[],
  providers: [QueuesService],
  exports:[QueuesService],
})
export class QueuesModule {}
