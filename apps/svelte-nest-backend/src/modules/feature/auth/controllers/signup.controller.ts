import { Body, Controller, Get, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { DbService } from '../../../global/db/db.service';
import { Request } from 'express';
import { AuthService } from '../authservice/auth.service';
import { DEFAULT_APP_NAME } from '../../../../apputils/config/env';
import { useremaildto } from '../dto/auth.dto';
import { ValidationPipe } from '../../../../apputils/pipes/validation.pipe';
import { fireAuthService } from '../../../global/firebase/fireauth.service';




@Controller()
export class SignupController {

    constructor(private authService:AuthService, 
                public fireAuth:fireAuthService,    
                
                ){}

    @Post('/signuptoken')
    async thirparty_singup( @Req() request: Request){        
        console.log("-------------------\n signuptoken \n-------------------");
        
        let ed = '';
        let clntinf = request["clntinf"];
        clntinf["method"] = 'signuptoken';

        let regist_det = (await this.authService.chk_user_registered((clntinf)));
        
        if(regist_det.isregistered) {
            ed = regist_det.message;            
        } else {
            await this.authService.register_user(clntinf);
        }        
        
        let tt: any;
        (ed==='') ?
            tt =  'Registration successful for ' + clntinf["email"] + '. Verify your email before login.'
            :tt = ed
        console.log(tt)
        console.log("sending response back");
        return {'error':false,'message': tt};
    }


    @Post('/signupemail')
    async signupemail( @Req() req: Request, @Body(new ValidationPipe()) useremail: useremaildto){       
        let ed = '';
        let clntinf = {};
        clntinf["method"] = 'signupemail';
        clntinf["email"] = useremail;
        //To add subdomain : START                       
        console.log(req.header('Referer'));
        let d = req.header('Referer');                    
        let ress = d.substr(d.indexOf("//")+2);                    
        let ress1 = ress.substr(0,ress.indexOf("."));
        console.log('ress1 :'+ress1);
        let siteid;
        (ress.substr(0,ress.indexOf(".")) === '')? clntinf["siteid"] = DEFAULT_APP_NAME : clntinf["siteid"] = ress1;
        //To add subdomain : END                         
        
        let regist_det = await this.authService.chk_user_registered(clntinf);
        
        if(regist_det.isregistered) {
            ed = regist_det.message;
        }else {
            let usr = await this.fireAuth.get_user_with_email(useremail);
            await this.authService.register_user(usr);
        } 

        let tt: any;
        (ed==='') ?
        tt =  'Registration successful for ' + clntinf["email"] + '. Verify your email before login.'
        :tt = ed
        console.log(tt)
        return {'error':false,'message': tt};

    }

    @Get() 
    async test(){
        return 'this is get test'
    }



}
