import { Injectable } from '@nestjs/common';
import { Console } from 'console';
import { Pool, Client } from 'pg';
import { CON_STR,ENV } from '../../../apputils/config/env';
import { DatabaseException as dbexception } from './databse.exception';

//let CON_STR = ['postgresql://postgres:password123@127.0.0.1:5332/postgres'];


@Injectable()
export class DbService {
   
    pool:any ;
    constructor(){        
        if (!this.pool) {
            this.createpool();
        }        
    }

    async createpool(){
        this.pool = new Pool({        
            connectionString: CON_STR[ENV],
          });
    }

    async get_connection_from_Pool() {
        console.log('inside get_conn pool');

        if(!this.pool) {
            await this.createpool();
        }
        console.log(this.pool);
        let cl;
        try{
            cl = await this.pool.connect();
        } catch(e) {
            console.log(e);
            throw new dbexception();
        }
        console.log("printing client");
        return cl;
        //return await this.pool.connect();
    }
        
    async db_tran_start() {        
        let client = await this.get_connection_from_Pool();
        try {
            let dd =  await this.db_tran_execute(client,'BEGIN');
            return client;
        } catch(e) {
            console.log("transtart error");
            console.log(e);
            throw new dbexception();
        }        
    }

    async db_tran_end(client) {               
        try {
            return await this.db_tran_execute(client,'COMMIT');
        } catch(e) {            
            console.log("tran end error");
            console.log(e);
            throw new dbexception();
        } finally {
            client.release();
        }     
    }

    async db_tran_execute(client,query:string,data:any[]=[]) {                    
        
        let querystr = {text: query}        
        if(data.length) querystr["values"] = data;
        console.log(querystr);     
        try{
            return await client.query(querystr);
        } catch (e) {
            await client.query('ROLLBACK');
            client.release();
            console.log(e);
            throw new dbexception();           
        } 
    }
   
    async db_qry_execute(query:string,data:any[]=[]) {
        let client = null;          
        let querystr = {text: query}
        
        if(data.length) querystr["values"] = data;
        console.log(querystr);
        
        try{
            console.log('inside qry ex');
            client = await this.get_connection_from_Pool();
            console.log("---$$$$$$$$$------");
            let tt = await client.query(querystr);
            console.log("get the result");
            console.log(tt);
            return tt;
        } catch (e) {                
            console.log(e);
            throw new dbexception();
        } finally {
            console.log('inside finally');
            console.log(client);
            if(client) client.release();
        }
    }       

}