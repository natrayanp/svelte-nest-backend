import { HttpException, HttpStatus } from "@nestjs/common";

export class DatabaseException extends HttpException {
    
    constructor(tt:string|null = null) {
      let errmsg = "Technical error [DB].  Please contact support";
      //{'error':true,'message': (tt)? tt: errmsg }
      let response= {
        statusCode: 500,
        message:  "Technical error [DB].  Please contact support",
        error: 'Not Found'
      };
      console.log('inside database');
      super(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }