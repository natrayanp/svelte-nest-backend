import { Module } from '@nestjs/common';
import { EntityController } from './controllers/entity.controller';

@Module({
  controllers: [EntityController]
})
export class EntityModule {}
