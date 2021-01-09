import { forwardRef, Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
//import * as firebase from 'firebase-admin';
//import * as serviceAccount from '../firebase/firebaseServiceAccount.json';
import { fireAuthService } from '../../modules/global/firebase/fireauth.service';
import { DEFAULT_APP_NAME } from '../config/env';
import { DbService } from '../../modules/global/db/db.service';
//import { DatabaseException } from '../db/databse.exception';

/*
const firebase_params = {
    type: serviceAccount.type,
    projectId: serviceAccount.project_id,
    privateKeyId: serviceAccount.private_key_id,
    privateKey: serviceAccount.private_key,
    clientEmail: serviceAccount.client_email,
    clientId: serviceAccount.client_id,
    authUri: serviceAccount.auth_uri,
    tokenUri: serviceAccount.token_uri,
    authProviderX509CertUrl: serviceAccount.auth_provider_x509_cert_url,
    clientC509CertUrl: serviceAccount.client_x509_cert_url
}
*/
@Injectable()
export class PreauthMiddleware implements NestMiddleware {

    private defaultApp: any;
    readonly user: any;

    constructor(private db:DbService,                
                private authService: fireAuthService) {
        /*
        this.defaultApp = firebase.initializeApp({
            credential: firebase.credential.cert(firebase_params),
            databaseURL: "https://fir-auth-bd895.firebaseio.com"
        });
        */       
    }

    userMapper = tokens => ({
        id:      tokens.uid,
        name:    tokens.name,
        email:   tokens.email,
        picture: tokens.picture,
        phonenumber: null,
        signInProvider: tokens.firebase.sign_in_provider,
        emailverified: tokens.email_verified,
        token: null,
        session:null,
        siteid:null,        
        });

    use(req: Request, res: Response, next: Function) {
        const token = req.headers.authorization;
        const session = req.headers.session;  
        

        
        //console.log(req.headers);
        console.log("iam inside middleware");

        if (token != null && token != '') {
        //if (true) {
            //this.defaultApp.auth().verifyIdToken(token.replace('Bearer ', ''))
            this.authService.defaultApp.auth().verifyIdToken(token.replace('Bearer ', ''))
                .then(async decodedToken => {
                    
                    let user = this.userMapper(decodedToken);

                    //To add subdomain : START                    
                    console.log(req.header('Referer'));
                    let d = req.header('Referer');                    
                    let ress = d.substr(d.indexOf("//")+2);                    
                    let ress1 = ress.substr(0,ress.indexOf("."));
                    console.log('ress1 :'+ress1);
                    (ress.substr(0,ress.indexOf(".")) === '')? user["siteid"] = DEFAULT_APP_NAME : user["siteid"] = ress1;
                    //To add subdomain : END                    
                    
                    // To get Client Info details: START
                    //let user = this.userMapper(decodedToken);
                    user["token"]=token;
                    user["session"]=session;
                    user["ip"]=req.ip;
                    //user["siteid"]=ress;
                    // To get Client Info details: END

                    //To validate session
                    let isvalid = (session === undefined)? true: await this.chk_valid_session(user);
                    if(!isvalid) this.accessDenied(req.url, res);

                    // Set the Client infor in request so it is available to the entire app
                    req['clntinf'] = user;   

                    next();

                }).catch(error => {
                    console.error(error);
                    this.accessDenied(req.url, res);
                });
        } else {
            console.error("No token or session present where the route expects token");            
            this.accessDenied(req.url, res);
            //next();
        }



    }

    private accessDenied(url: string, res: Response) {
        //This method is called for invalid/No Token and session
        res.status(403).json({
            statusCode: 403,
            timestamp: new Date().toISOString(),
            path: url,
            message: 'Access Denied'
        });
    }


    private async chk_valid_session(user) {

        const qry = `SELECT SESSIONID FROM AC.LOGINH 
                        WHERE USERID = $1
                        AND SESSIONID = $2
                        AND SITEID = $3
                        AND LOGOUTTIME IS NULL`;
        
        let se = await this.db.db_qry_execute(qry,[user.id,user.session,user.siteid]);

        if(se.rows.length <= 0) return false;        
        return true;
    }


}