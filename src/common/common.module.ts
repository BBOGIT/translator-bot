import { Module } from '@nestjs/common';
import { HealthController } from './controllers/health.controller';
import { RandomService } from './services/random.service';
import { AdminGuard } from './guards/admin.guard';
import { ConfigModule } from '@nestjs/config';
import { MonitoringController } from './controllers/monitoring.controller';

@Module({
  imports: [ConfigModule],
  controllers: [
    HealthController,
    MonitoringController
  ],
  providers: [RandomService, AdminGuard],
  exports: [RandomService]
})
export class CommonModule {}
