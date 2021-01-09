import { Module } from '@nestjs/common';
import { SignupController } from './controllers/signup.controller';
import { AuthService } from './authservice/auth.service';
//import { DbService } from '../db/db.service';
//import { DbModule } from '../db/db.module';
//import { fireAuthService } from '../firebase/fireauth.service';
//import { FirebaseModule } from '../firebase/firebase.module';
import { LoginController } from './controllers/login.controller';
import { LogoutController } from './controllers/logout.controller';
//import { AppModule } from 'src/app.module';
//import { TrigersModule } from '../trigers/trigers.module';
import { SignupEventsConsumer } from './events/signup.events.consumer';

@Module({
  imports: [],
  controllers: [SignupController, LoginController, LogoutController],
  providers: [AuthService,SignupEventsConsumer]
})
export class AuthModule {}