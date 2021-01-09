import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { AuthService } from '../authservice/auth.service';


@Injectable()
export class SignupEventsConsumer {
    public eventPayload = {};
    constructor(private authService:AuthService,) { }

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

    @OnEvent('domain.regis.completed')
    async onSignupComplete(payload: Record<string, any>) {
        // handle and process "OrderCreatedEvent" event        
        console.log("why signup creation event");
        console.log(payload);
        this.authService.assign_role_after_domain_regis(payload);
        ///await setTimeout(function () { console.log("Hello inside settimeout"); }, 3000);
        console.log("why after signup");
    }


    

}
