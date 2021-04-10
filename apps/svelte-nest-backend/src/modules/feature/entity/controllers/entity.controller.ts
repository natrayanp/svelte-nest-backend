import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller()
export class EntityController {
    @Post('/upload')
    @UseInterceptors(FileInterceptor('file'))
    uploadSingleFileWithPost(@UploadedFile() file, @Body() body) {
      console.log(file);
      console.log(body);
      console.log(body.myjson);
    }
  }