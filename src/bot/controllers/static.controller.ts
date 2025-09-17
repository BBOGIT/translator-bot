import {
  Controller,
  Get,
  Response
} from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

@Controller('bot-test-ui')
export class StaticController {
  @Get()
  serveTestPage(@Response() res) {
    const filePath = path.join(
      __dirname,
      'test-page.html'
    );
    const fileContent = fs.readFileSync(
      filePath,
      'utf8'
    );
    res.type('text/html').send(fileContent);
  }
}
