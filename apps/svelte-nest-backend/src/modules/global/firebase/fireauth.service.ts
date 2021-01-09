import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import * as firebase from 'firebase-admin';
import * as serviceAccount from './firebaseServiceAccount.json';
import { DEFAULT_APP_NAME } from '../../../apputils/config/env';


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

export const userMapper = tokens => ({
    id:      tokens.uid,
    name:    tokens.displayName,
    email:   tokens.email,
    picture: tokens.photoURL,
    phonenumber: tokens.phoneNumber,
    signInProvider: tokens.UserInfo.providerId,
    emailverified: tokens.emailVerified,
    token: null,
    session:null,
    siteid:null,        
    });


@Injectable()
export class fireAuthService {

    defaultApp = null;
    user: any;

    constructor() {
        console.log("starting firebase initialisataion");
        if(this.defaultApp === null) {            
        this.defaultApp = firebase.initializeApp({
            credential: firebase.credential.cert(firebase_params),
            //databaseURL: "https://fir-auth-bd895.firebaseio.com",
        },'mytest');
        }
        console.log(this.defaultApp);
    }


    async get_user_with_email(email) {
        return userMapper(await this.defaultApp.auth().getUserByEmail(email));
    }



}