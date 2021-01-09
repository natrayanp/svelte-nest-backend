import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from 'eventemitter2';

@Injectable()
export class EventsProducer  {
    constructor(private readonly eventEmitter: EventEmitter2) {}

trigger_test() {
    console.log("inside service emitter")
    this.eventEmitter.emit(
        'test.event', { test: 'event' }
      );
      console.log("inside service emitter end")
}
}