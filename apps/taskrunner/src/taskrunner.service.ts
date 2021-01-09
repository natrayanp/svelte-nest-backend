import { Injectable } from '@nestjs/common';

@Injectable()
export class TaskrunnerService {
  getHello(): string {
    return 'Hello World!';
  }
}
