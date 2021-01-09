import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventsConsumer } from './events.consumer';
import { EventsProducer } from './events.producer';

@Global()
@Module({
    imports: [
        EventEmitterModule.forRoot({
          wildcard: true,
        }),
      ],
    providers: [EventsProducer,EventsConsumer],
    exports: [EventsProducer,EventsConsumer]
})
export class TrigersModule {}