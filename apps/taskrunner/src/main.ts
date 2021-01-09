import { NestFactory } from '@nestjs/core';
import { TaskrunnerModule } from './taskrunner.module';

async function bootstrap() {
  const app = await NestFactory.create(TaskrunnerModule);
  await app.listen(3001);
}
bootstrap();
