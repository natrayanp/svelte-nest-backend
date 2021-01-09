import { Injectable } from '@nestjs/common';
import { makeWorkerUtils, WorkerUtils } from "graphile-worker";
import { DbService } from '../../db/db.service';

@Injectable()
export class QueuesService {

    workerUtils:WorkerUtils;
     constructor(private db:DbService,) {
        const dd = async() => await this.createworkutils();
    }

    async createworkutils(){
        this.workerUtils = await makeWorkerUtils({
            //connectionString: "postgres:///my_db",
            pgPool:this.db.pool,
          });
    }

    addJob(){

    }

    /*

    async startRunner() {
        const runner = await run({
            connectionString: "postgres:///my_db",
            concurrency: 5,
            // Install signal handlers for graceful shutdown on SIGINT, SIGTERM, etc
            noHandleSignals: false,
            pollInterval: 1000,
            // you can set the taskList or taskDirectory but not both
            taskList: {
              hello: async (payload, helpers) => {
                const { name } = payload;
                helpers.logger.info(`Hello, ${name}`);
              },
            },
            // or:
            //   taskDirectory: `${__dirname}/tasks`,
          });
    }
*/

}
