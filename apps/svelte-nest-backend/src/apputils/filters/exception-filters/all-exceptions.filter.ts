import { Catch, ArgumentsHost, Inject, HttpServer, HttpStatus, HttpAdapterHost } from '@nestjs/common';
import { BaseExceptionFilter} from '@nestjs/core';
//import { AppLoggerService } from '../modules/shared/services/logger.service';
 
@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  constructor(
   // @Inject(HTTP_SERVER_REF) applicationRef: HttpServer,
   private adapterHost: HttpServer
    //private logger: AppLoggerService
  ) {
    super((adapterHost).getInstance());
  }
 
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    // const request = ctx.getRequest();
    // const status = exception.getStatus();
 
    //this.logger.error(exception);
 
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    
 
    const error = (exception instanceof Error) ? exception.message : exception.message.error;
   
    console.log("$$$$$$");
    console.log(exception);
    console.log("$$$$$$");
    console.log(exception instanceof Error);

    if (exception.status === HttpStatus.NOT_FOUND) {
      status = HttpStatus.NOT_FOUND;
    }
 
    if (exception.status === HttpStatus.SERVICE_UNAVAILABLE) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
    }
 
    if (exception.status === HttpStatus.NOT_ACCEPTABLE) {
      status = HttpStatus.NOT_ACCEPTABLE;
    }
 
    if (exception.status === HttpStatus.EXPECTATION_FAILED) {
      status = HttpStatus.EXPECTATION_FAILED;
    }
 
    if (exception.status === HttpStatus.BAD_REQUEST) {
      status = HttpStatus.BAD_REQUEST;
    }
    console.log('forming respone');
    response
      .status(status)
      .json({
        success: false,
        data: [],
        error: error,
        message: (status === HttpStatus.INTERNAL_SERVER_ERROR) ? 'Sorry we are experiencing technical problems.' : error,
      });
  }
}