import { Controller, Get } from '@nestjs/common';
import { TaskrunnerService } from './taskrunner.service';

@Controller()
export class TaskrunnerController {
  constructor(private readonly taskrunnerService: TaskrunnerService) {}

  @Get()
  getHello(): string {
    return this.taskrunnerService.getHello();
  }
}
