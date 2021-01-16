import { Injectable } from '@nestjs/common';
import { run, quickAddJob } from 'graphile-worker';
import { CON_STR,ENV } from './apputils/config/env';

@Injectable()
export class TaskrunnerService {

    constructor() {
      this.start_runner();
    }

    async start_runner() {
          // Run a worker to execute jobs:
          const runner = await run({
            connectionString: CON_STR[ENV],
            concurrency: 5,
            // Install signal handlers for graceful shutdown on SIGINT, SIGTERM, etc
            noHandleSignals: false,
            pollInterval: 1000,
            // you can set the taskList or taskDirectory but not both
            /*
            taskList: {
              hello: async (payload, helpers) => {
                const { name } = payload;
                helpers.logger.info(`Hello, ${name}`);
              },
            },
            */
            // or:
            //   taskDirectory: `${__dirname}/tasks`,
            taskDirectory: `/home/nirudhi/projects/svelte-nest-backend/apps/taskrunner/src/tasks`,
          });

          // Or add a job to be executed:
          await quickAddJob(
            // makeWorkerUtils options
            { connectionString: CON_STR[ENV]},

            // Task identifier
            "hello",

            // Payload
            { name: "Bobby Tables" },
          );

          // If the worker exits (whether through fatal error or otherwise), this
          // promise will resolve/reject:
          await runner.promise;
        }

          getHello(): string {
            return 'Hello World!';
          }
}
