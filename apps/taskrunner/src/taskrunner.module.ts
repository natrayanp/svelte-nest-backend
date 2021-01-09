import { Module } from '@nestjs/common';
import { TaskrunnerController } from './taskrunner.controller';
import { TaskrunnerService } from './taskrunner.service';

@Module({
  imports: [],
  controllers: [TaskrunnerController],
  providers: [TaskrunnerService],
})
export class TaskrunnerModule {}
