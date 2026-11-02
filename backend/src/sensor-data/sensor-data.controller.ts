import { Controller } from '@nestjs/common';
import { SensorDataService } from './sensor-data.service.js';

@Controller('sensor-data')
export class SensorDataController {
  constructor(private readonly sensorDataService: SensorDataService) {}
}
