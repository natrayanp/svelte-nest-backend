import { Body, Controller, Get, HttpStatus, Ip, Post, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { DbService } from '../../../global/db/db.service';
import { Request } from 'express';
import { AuthService } from '../authservice/auth.service';
import { DEFAULT_APP_URL } from '../../../../apputils/config/env';
import { domainregisdto, useremaildto } from '../dto/auth.dto';
import { ValidationPipe } from '../../../../apputils/pipes/validation.pipe';
import { fireAuthService } from '../../../global/firebase/fireauth.service';
import { EventEmitter2 } from '@nestjs/event-emitter';


@Controller()
export class LoginController {

    constructor(private authService:AuthService, 
                public fireAuth:fireAuthService,
                private eventEmitter: EventEmitter2
                ){}

    @Post('/logintoken')
    async thirparty_login( @Req() request: Request, @Ip() ipadd:string){    
        console.log("-------------------\n logintoken \n-------------------");
        let ed= '';
        let clntinf = request["clntinf"];
        clntinf["method"] = 'logintoken';

        let regist_det = (await this.authService.chk_user_registered((clntinf)));
        let sessionid;
        let sund;
        let d;
        let success;
        if(regist_det.isregistered) {
            sessionid = await this.authService.session_operation(clntinf);
            sund = await this.authService.chk_subdomain_exists(clntinf);            
            d = {sessionid:sessionid,isurlcreated:sund.siteidexist,siteid:clntinf.siteid};
            success = true;
        } else {
            ed = regist_det.message;
            success = false; 
        }
        
        return {
            success: success,
            data: [d],
            error: '',
            message: ed
          }     

    }


    @Post('/regisdomain')
    async regisdomain(@Req() request: Request, @Body() dmreg:domainregisdto){    

        console.log("-------------------\n regisdomain \n-------------------");        
        let clntinf = request["clntinf"];
        console.log(dmreg.siteid);
        
        if(dmreg.registype === 'mydomain') {
            clntinf["siteid"] = this.authService.session_hash(dmreg.siteid,'siteid');
            clntinf["hostname"] = dmreg.siteid;
            clntinf["method"] = 'subwmapdupdate';
        } else if (dmreg.registype === 'subdomain'){
            clntinf["siteid"] = dmreg.siteid;
            clntinf["method"] = 'subdupdate';
        }

        
        let regist_det = (await this.authService.update_subdomain(clntinf));        

                
        console.log("before event");
        this.eventEmitter.emit(
            'domain.regis.completed',clntinf);
        console.log("after event");
        let mm;
        console.log(dmreg.registype);
        if(dmreg.registype === 'mydomain'){
            mm = 'Registration successful.  Please login with your URL: https://'+ clntinf["hostname"];
        }else if (dmreg.registype === 'subdomain'){
            mm = 'Registration successful.  Please login with your URL: https://'+ clntinf["siteid"] + '.' + DEFAULT_APP_URL;
        }
        
        return {
            success: true,
            data: [],
            error: '',
            message: mm,
          }  
    }



    @Post('/getmenus') 
    async getmenus(@Req() request: Request){ 

        console.log("-------------------\n getmenus \n-------------------");        
        let clntinf = request["clntinf"];
        clntinf["method"] = 'subdupdate';  
        let regist_det = await this.authService.get_packs_menu(clntinf);        

        return {
            success: true,
            data: [regist_det],
            error: '',
            message: '',
          }  


    }

}
