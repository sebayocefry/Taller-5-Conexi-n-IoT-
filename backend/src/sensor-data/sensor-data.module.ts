import { Module } from '@nestjs/common';
import { SensorDataService } from './sensor-data.service.js';
import { SensorDataController } from './sensor-data.controller.js';

@Module({
  controllers: [SensorDataController],
  providers: [SensorDataService],
})
export class SensorDataModule {}
