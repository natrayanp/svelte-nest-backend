import { forwardRef, Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { parse } from 'tldts';

//import * as firebase from 'firebase-admin';
//import * as serviceAccount from '../firebase/firebaseServiceAccount.json';
import { fireAuthService } from '../../modules/global/firebase/fireauth.service';
import { DEFAULT_APP_NAME,ENV, DEFAULT_APP_DOMAINS } from '../config/env';

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
                    console.log("$$$$$$$$$$$$$$$$$$$$");
                    console.log(req.header('Referer'));
                    let fullurl = req.header('Referer');  
                    //fullurl = 'https://nat.my-m.assetscube.co.in';
                    let {hostname,subdeomaindet} = await this.parsemyurl(fullurl);
                    user["hostname"]=hostname
                    console.log('subdeomaindet :'+subdeomaindet);

                    //(ress.substr(0,ress.indexOf(".")) === '')? user["siteid"] = DEFAULT_APP_NAME : user["siteid"] = subdeomaindet;
                    if (!subdeomaindet) {
                        user["siteid"] = DEFAULT_APP_NAME;                        
                    } else {
                        user["siteid"] = subdeomaindet;
                        user["companyid"] ='';
                        console.log("going to call");
                        let cpid = await this.get_companyid(user);
                        (cpid["success"])? user["companyid"]=cpid["companyid"] : user["companyid"]="";
                    }   
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


    private async get_companyid(user) {
        console.log("inside get company");
        const qry = `SELECT COMPANYID FROM ac.domainmap 
                        WHERE SITEID = $1
                        AND STATUS = 'A'`;
        console.log("nanananananananananannan");
        let se = await this.db.db_qry_execute(qry,[user.siteid]);
        console.log("nanananananananananannan");
        console.log(se.rows.length);
        console.log(se.rows[0].companyid);
        console.log("nanananananananananannan");
        if(se.rows.length <= 0) return {success:false,companyid:''};
        return {success:true,companyid:se.rows[0].companyid};                
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


    async parsemyurl(url) {
        let detss;
        if (ENV <3 || ENV > 3) {
            let {publicSuffix,domainWithoutSuffix,hostname} =  parse(url);
             //detss={domain:domainWithoutSuffix, subdeomaindet:subdomain, hostname: hostname};             
             detss= {domain:publicSuffix, subdeomaindet:domainWithoutSuffix, hostname: hostname};
        } else  {
            let {domainWithoutSuffix,subdomain,hostname} =  parse(url);
            //detss= {domain:publicSuffix, subdeomaindet:domainWithoutSuffix, hostname: hostname};     
            detss={domain:domainWithoutSuffix, subdeomaindet:subdomain, hostname: hostname};          
        }
        console.log('parsemyurl');
        console.log(detss);
        if(!DEFAULT_APP_DOMAINS.includes(detss.domain)) {            
            const qry = `SELECT siteid FROM ac.domainmap
                            WHERE hostname = $1
                            AND STATUS = 'A'`;

            let se = await this.db.db_qry_execute(qry,[detss.hostname]);

            if(se.rows.length > 0) {
                detss['subdeomaindet']=se[0];
            }
        }

        return detss;



                /*
                    const domAndSubdom_prd = /([\w]+\.)+([^\:\/]+)/gm;
                    const domAndSubdom_test = /([\w]+\:)+([^\:\/]+)/gm;
                    const subdom =  /.*(?=\.)/gm;
                    const dom =  /([^\.]+$)/gm;



                    let subdeomaindet = null;
                    
                    const parseResult = parseDomain(
                        // This should be a string with basic latin characters only.
                        // More information below.
                        //"www.some.example.co.uk",
                        fullurl
                    );
                     
                    // Check if the domain is listed in the public suffix list
                    if (parseResult.type === ParseResultType.Listed) {
                        const {subDomains, domain, topLevelDomains} = parseResult;
                        console.log("------------------$$$$$$$$$$$$$$$$$$$$------------------");
                        console.log(subDomains); // ["www", "some"]
                        subdeomaindet = subDomains[0];
                        console.log(domain); // "example"
                        console.log(topLevelDomains); // ["co", "uk"]
                        console.log("------------------$$$$$$$$$$$$$$$$$$$$------------------");
                    } else {
                        // Read more about other parseResult types below...
                    }







                    
                    let domAndSubdom_str = null;
                    let domAndSubdom_str_wocom = null;
                    if(fullurl.match(domAndSubdom_prd) !== null) {
                        console.log('inside prd');
                        domAndSubdom_str = (fullurl.match(domAndSubdom_prd))[0];
                        domAndSubdom_str_wocom = domAndSubdom_str.substr(0,domAndSubdom_str.lastIndexOf("."));
                    } else if (fullurl.match(domAndSubdom_test) !== null) {
                        console.log('inside test');
                        console.log((fullurl.match(domAndSubdom_test))[0]);
                        domAndSubdom_str = (fullurl.match(domAndSubdom_test))[0];
                        domAndSubdom_str_wocom = domAndSubdom_str.substr(0,domAndSubdom_str.lastIndexOf(":"));
                    }
                    //let domAndSubdom_str_wocom = domAndSubdom_str.substr(0,domAndSubdom_str.lastIndexOf("."));
                    console.log(domAndSubdom_str_wocom);
                    let subdom_str = null;
                    if(domAndSubdom_str_wocom.match(subdom) !== null) {
                        subdom_str = (domAndSubdom_str_wocom.match(subdom))[0];
                    }
                    
                    let dom_str = (domAndSubdom_str_wocom.match(dom))[0];

                    
                    console.log(domAndSubdom_str);
                    console.log(domAndSubdom_str_wocom);
                    console.log(subdom_str);
                    console.log(dom_str);
                    console.log("------------------$$$$$$$$$$$$$$$$$$$$------------------");

                    let ress = fullurl.substr(fullurl.indexOf("//")+2);      
                    
                    let subdeomaindet = ress.substr(0,ress.lastIndexOf("."));
                    let domaindet = ress.substr(ress.lastIndexOf(".")+1);
                    
                    console.log("$$$$$$$$$$$$$$$$$$$$");
                    
                */
    }


}