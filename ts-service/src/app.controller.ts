import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): { service: string; status: string } {
    return {
      service: 'TalentFlow API',
      status: 'online',
    };
  }
}
