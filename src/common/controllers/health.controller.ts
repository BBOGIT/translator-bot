import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation
} from '@nestjs/swagger';

@ApiTags("Здоров'я")
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({
    summary: "Перевірка здоров'я сервера"
  })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  }
}
