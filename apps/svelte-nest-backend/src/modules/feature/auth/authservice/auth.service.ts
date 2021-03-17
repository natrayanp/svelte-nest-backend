import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { userInfo } from 'os';
import { DatabaseException } from '../../../global/db/databse.exception';
import { DbService } from '../../../global/db/db.service';
import { DEFAULT_APP_NAME } from '../../../../apputils/config/env';
//import sjcl = require("sjcl"); 
import * as sjcl from 'sjcl';
//import { EventEmitter2 } from '@nestjs/event-emitter';


@Injectable()
export class AuthService {

    constructor(
                //@Inject(forwardRef(() => DbService))
                private db:DbService,
               // private eventEmitter: EventEmitter2 
                ){}
    
    User = {
        userdet: null,        
        //accessor property(setter)
        set User(newvalue) {
            this.userdet = newvalue;
        },
        get User() {
            return this.userdet;
        }
    };    


    async chk_user_registered(clntinf) {
        
        let qry = 'SELECT userid,username,useremail,userpassword,userstatus,emailverified FROM ac.userlogin'
        if (['signupemail'].includes(clntinf.loginmethod)) {
            qry = qry + ' WHERE useremail = $1'
        } else {
            qry = qry + ' WHERE userid = $1'
        }        
        qry = qry + ' AND  siteid = $2;';

        let myuser;
        console.log(clntinf);
        let myus = await this.db.db_qry_execute(qry,[clntinf.id,clntinf.siteid]);
        console.log("myus ---");
        console.log(myus);
        if(myus.rowCount === 0) {
            return {isregistered:false,message: clntinf["email"] + ' is not a registered user or Using wrong URL'};    
        } else if(myus.rowCount=== 1) {
            myuser = myus.rows[0];
            console.log(myuser.userstatus);
            let msg = 'Already a Registered User: ' + clntinf["email"] + '.  \n';
            if (!myuser.emailverified) msg = msg+ 'Verify your email before login. ';
            if (myuser.userstatus === 'D' && (myuser.emailverified))  msg = msg+ 'User is Disabled, please contact us.';
            if (myuser.userstatus === 'I' && (myuser.emailverified))  msg = msg+ 'User is Inactive, please contact us.';            
            return {isregistered:true,message: msg,userdetails:myuser};    
        } else if(myus.rowCount > 1) {
            return {isregistered:true,message:'Already a Registered User: ' + clntinf["email"] + '. [TD: Multiple entries found]. Verify your email before login.',userdetails:myuser};
        }
    }

    async register_user(clntinf) {

        const qry = `INSERT INTO ac.userlogin (userid, username, useremail, userpassword, userstatus, emailverified, siteid, userstatlstupdt, octime, lmtime) 
        VALUES ($1, $2, $3, $4, $5,FALSE,$6, CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);`;

        let myuser = await this.db.db_qry_execute(qry,[clntinf.id,clntinf.name,clntinf.email,'','D',clntinf.siteid]);

        return {success:true}
    }

    async session_operation(clntinf) {        
        let trn = await this.db.db_tran_start();
        let invalidate = await this.invalidate_user_sessions(trn,clntinf);
        let session = await this.create_user_session(trn,clntinf);
        let trnc = await this.db.db_tran_end(trn);
        return session;        
    }

    async invalidate_user_sessions(trn,clntinf){
        const qry = `UPDATE ac.loginh SET logoutime = CURRENT_TIMESTAMP
                        WHERE userid = $1
                        AND siteid = $2
                        AND logoutime IS NULL`;

        let myuser = await this.db.db_tran_execute(trn,qry,[clntinf.id,clntinf.siteid]);        
    }

    async create_user_session(trn,clntinf){
        const qry =  `INSERT INTO ac.loginh (userid, ipaddress, sessionid, siteid, logintime) 
                     VALUES ($1, $2, $3,$4 ,CURRENT_TIMESTAMP) RETURNING *;`
                     
        let sh = this.session_hash( clntinf.id + Date.now());
        console.log(sh);
        let myuser = await this.db.db_tran_execute(trn,qry,[clntinf.id,clntinf.ip,sh,clntinf.siteid]);
        if(myuser.rowCount>0) {
            return sh;
        } else {
            throw new DatabaseException();
        }

    }

    session_hash(password,salt = 'sesstkn'){
        console.log("inside session hash");        
        let myString = salt + password;   
        let myBitArray = sjcl.hash.sha256.hash(myString);        
        let myHash = sjcl.codec.hex.fromBits(myBitArray);        
        return myHash;   
    }


    async chk_subdomain_exists(clntinf) {
        const qry = `SELECT row_to_json(X) AS data FROM ( SELECT 
                            (SELECT json_agg(item) AS matching
                            FROM (
                                   SELECT siteid 
                                   FROM ac.userlogin WHERE userid = $1 AND siteid = $2
                              ) item),
                            (SELECT json_agg(item) as notmatching
                            FROM (
                                   SELECT siteid 
                                   FROM ac.userlogin WHERE userid = $1 AND siteid != $2
                              ) item)
                                ) X;`

        let subd = await this.db.db_qry_execute(qry,[clntinf.id,clntinf.siteid]);
        console.log(subd);
        let siteidexist = false;
        let subddetails = {};        
        if(subd.rows.length > 0) {
            subddetails = subd.rows[0].data;           
            if(subd.rows[0].data.matching.length >0) {
                subd.rows[0].data.matching.forEach(x => {
                    if(x.siteid != DEFAULT_APP_NAME) siteidexist = true;
                });
            }
        };
        //console.log({siteidexist:siteidexist,subddetails:subddetails});
        return {siteidexist:siteidexist,subddetails:subddetails};
    }


    async update_subdomain(clntinf){
        console.log("#######################################");
        console.log(clntinf);
        console.log("#######################################");

        // Don't store siteid in the userlogin
        //@depricated
        const qry = `UPDATE ac.userlogin SET siteid = $1, lmtime = CURRENT_TIMESTAMP
                        WHERE userid = $2`; 

        const qry1 = `INSERT INTO ac.domainmap (hostname,siteid,status,octime,lmtime) VALUES ($1,$2,'A',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
                        ON CONFLICT (hostname) 
                        DO UPDATE SET hostname = $1, lmtime = CURRENT_TIMESTAMP`;

        if(clntinf.method === 'subdupdate'){
            let subd = await this.db.db_qry_execute(qry,[clntinf.siteid,clntinf.id]);
        } else if (clntinf.method === 'subwmapdupdate') {
            let trn = await this.db.db_tran_start();            
            let subd = await this.db.db_tran_execute(trn,qry,[clntinf.siteid,clntinf.id]);
            let subd1 = await this.db.db_tran_execute(trn,qry1,[clntinf.hostname,clntinf.siteid]);
            let trnc = await this.db.db_tran_end(trn);
        }
    }

  
    async assign_role_after_domain_regis(clntinf){

        //Apply "SignupAdmin" = 'ROLMA1' role to the user after domain registration
        const qry = `INSERT INTO ac.userrole VALUES ($1,'ROLMA1','PUBLIC','PUBLIC','A','Y',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`;
        let subd = this.db.db_qry_execute(qry,[clntinf.id])
                    .then((e) => console.log('DB update success'))
                    .catch((e)=> console.error('update error table -> signup failure~default roleassgingment failed~userid ${clntinf.id}'));
                    //Implement logger here
    
        const qry1 = `INSERT INTO ac.domainmap (hostname,siteid,status,octime,lmtime) VALUES ($1,$2,'A',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
                        ON CONFLICT (hostname) 
                        DO UPDATE SET hostname = $1, lmtime = CURRENT_TIMESTAMP`;
                        let subd1 = this.db.db_qry_execute(qry1,[clntinf.hostname,clntinf.siteid])
                        .then((e) => console.log('DB update success'))
                        .catch((e)=> console.error('update error table -> signup failure~default roleassgingment failed~userid ${clntinf.id}'));
    
        

    
    
    }


    async get_packs_menu(clntinf){

        const qry = `WITH RECURSIVE MyTree AS (
            SELECT *,false as open FROM ac.packs WHERE id IN(
            SELECT packid FROM ac.roledetails WHERE rolemasterid IN (SELECT DISTINCT rolemasterid FROM ac.userrole WHERE userid = $1
                                                                        AND status NOT IN ('D','I') 
                                                                        AND companyid IN ('PUBLIC',$2) 
                                                                        AND branchid IN('PUBLIC',$3)                                                                        
                                                                    ) AND STATUS ='A'                                                                      
                                                )
            UNION
            SELECT m.*,false as open FROM ac.packs AS m JOIN MyTree AS t ON m.Id = ANY(t.parent) 
        )
        SELECT json_agg(X) AS data FROM(SELECT * FROM MyTree) X;`
        
        let branchid;
        //if(clntinf.companyid) companyid ='';
        if(clntinf.branchid) branchid ='';

        let menus = await this.db.db_qry_execute(qry,[clntinf.id,clntinf.companyid,branchid]);
        //console.log(menus.rows[0]);

        //create the tree
        let mytree = this.createDataTree(menus.rows[0].data);
        console.log(JSON.stringify(mytree));


        //Check for Package already purchased and allow only the active menus

        const qry1 = `SELECT array_agg(packid::varchar(20)) FROM ac.companypacks WHERE companyid = $1;`

        let pcks = await this.db.db_qry_execute(qry1,[clntinf.companyid]);
        console.log(pcks.rows[0].array_agg);
        let pckidarray = pcks.rows[0].array_agg;
        console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%");
        if (pckidarray === null) {
            //For this MVP add only shopping product
            this.add_packs(clntinf);
            //TODO: Redirect to package purchase page
        }
        let mytreefinal = [];
        if(pckidarray.length > 0) {
            mytree.forEach (x => {
                if(pckidarray.includes(x.id)) {
                    mytreefinal.push(x);
                }
            });
            return {menus:mytreefinal};
        }

        return {menus:mytree};

    }

    
    createDataTree(dataset) {
        //https://stackoverflow.com/questions/18017869/build-tree-array-from-flat-array-in-javascript
        const hashTable = Object.create(null);
        dataset.forEach(aData => hashTable[aData.id] = {...aData, subMenu: []});
        const dataTree = [];
        dataset.forEach(Datae => {  
            if (Datae.parent  && Datae.parent.length > 0) {    
                Datae.parent.forEach( aData => {    
                hashTable[aData].subMenu.push(hashTable[Datae.id])
                });
            }
            else{
                dataTree.push(hashTable[Datae.id])
            }            
        });
        return dataTree;
        }


    async add_packs(clntinf,planid="DEFAULT"){
        console.log("going inside add_packs");
        //Add packs at the company level
        const qry2 = `SELECT *  FROM ac.planpacks where planid = $1`;
        let se2 = await this.db.db_qry_execute(qry2,[planid]);
        if(se2.rows.length <= 0) return {success:false,companyid:''};
        console.log("*****&&&&(((*****")    ;
        console.log(se2.rows)   ;
        console.log(clntinf);
        console.log("*****&&&&(((*****")    ;
        let trn = await this.db.db_tran_start();            
        let subd, qry3;     
        
        se2.rows.forEach(async x =>  {
            let ds = {};                
            ds["companyid"] = clntinf.companyid;
            ds["packid"] = x.packid;
            ds["duration"] = x.durationmonth;
            qry3 = `INSERT INTO ac.companypacks (companyid, packid,startdate,expirydate,userrolelimit,userlimit,branchlimit,status,octime,lmtime)
                    VALUES($1,$2,CURRENT_TIMESTAMP,current_date + make_interval(months => $3),99999,99999,99999,'A',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) `
            subd = await this.db.db_tran_execute(trn,qry3,[ ds["companyid"],ds["packid"],ds["duration"]]);
        });
        let trnc = await this.db.db_tran_end(trn);

        //Add default roles of the packs to SUPERADMIN



    }

    /*

    TREE DATA

        WITH RECURSIVE MyTree AS (
        select * from ac.packs where id in(
        SELECT packid FROM ac.roledetails WHERE rolemasterid in (select rolemasterid from ac.userrole where userid = 'bQPmqQPcVVWS6paQYQ4eN6eReI83'))
        UNION
        SELECT m.* FROM ac.packs AS m JOIN MyTree AS t ON m.Id = ANY(t.parent)
    )
    SELECT json_agg(X) AS data FROM(SELECT * FROM MyTree) X;

            const dataSet = [{
            "ID": 1,    
            "Phone": "(403) 125-2552",
            "City": "Coevorden",
            "Name": "Grady"
        }, 
            {"ID": 3,
            "parentID": [],
            "Phone": "(403) 125-2552",
            "City": "Coevorden",
            "Name": "Grady"
        },
        {
            "ID": 2,
            "parentID": [1,3],
            "Phone": "(979) 486-1932",
            "City": "Chełm",
            "Name": "Scarlet"
        }];

        const expectedDataTree = [{
            "ID": 1,
            "Phone": "(403) 125-2552",
            "City": "Coevorden",
            "Name": "Grady",
            childNodes: [{
            "ID": 2,
            "parentID": 1,
            "Phone": "(979) 486-1932",
            "City": "Chełm",
            "Name": "Scarlet",
            childNodes : []
            }]
        }];
        
        
        const createDataTree = dataset => {
        const hashTable = Object.create(null);
        dataset.forEach(aData => hashTable[aData.ID] = {...aData, childNodes: []});
        const dataTree = [];
        dataset.forEach(Datae => {  
            if (Datae.parentID  && Datae.parentID.length > 0) {    
            Datae.parentID.forEach( aData => {    
            hashTable[aData].childNodes.push(hashTable[Datae.ID])
            });
            }
            else{
            dataTree.push(hashTable[Datae.ID])
            }
            
        });
        return dataTree;
        };

*/

}
