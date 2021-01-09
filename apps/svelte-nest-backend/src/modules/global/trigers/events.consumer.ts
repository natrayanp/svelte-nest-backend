import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';



@Injectable()
export class EventsConsumer {
    public eventPayload = {};
    constructor( ) { }

    /*
    @OnEvent('**')
    async onTestEvent(payload: Record<string, any>) {
        // handle and process "OrderCreatedEvent" event
        console.log(payload);
        console.log("order creation event");
        await setTimeout(function () { console.log("Hello inside settimeout"); }, 3000);
        console.log("after timeout");
    }
*/

    @OnEvent('login.*')
    async onSignupComplete(payload: Record<string, any>) {
        // handle and process "OrderCreatedEvent" event
        console.log(payload);
        console.log("signup creation event");
       // this.authService.assign_role_after_domain_regis(payload);
        ///await setTimeout(function () { console.log("Hello inside settimeout"); }, 3000);
        console.log("Post sign up role assigned");
    }

}
