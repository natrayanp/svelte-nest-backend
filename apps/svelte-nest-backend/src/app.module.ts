import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
//import { AppController } from './app.controller';
import { PreauthMiddleware } from './apputils/middleware/preauth.middleware';
import { FirebaseModule } from './modules/global/firebase/firebase.module';
import { DbModule } from './modules/global/db/db.module';
import { RouterModule } from 'nest-router';
import { routes } from './app.router';
import { AuthModule } from "./modules/feature/auth/auth.module";
import { TrigersModule } from './modules/global/trigers/trigers.module';
import { QueuesModule } from './modules/global/queues/queues.module';

@Module({
  imports: [
    RouterModule.forRoutes(routes), // setup the routes    
    /*EventEmitterModule.forRoot({
      wildcard: true,
    }),*/
    AuthModule,
    FirebaseModule,
    DbModule,
    TrigersModule,
    QueuesModule,
  ],
  controllers: [],
  providers: [],
  exports: []  
})


export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(PreauthMiddleware)
    .exclude(
      { path: 'getHellos', method: RequestMethod.ALL },
      { path: 'auth', method: RequestMethod.ALL },
      //{ path: 'auth/signuptoken', method: RequestMethod.ALL },
    )
    .forRoutes(
      {path: '*', method: RequestMethod.ALL}
      );
  }
}