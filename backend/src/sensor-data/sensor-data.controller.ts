import { Controller, Body,Post } from '@nestjs/common';
import { SensorDataService } from './sensor-data.service.js';
import { createSensorDataSchema, type CreateSensorDataDto} from './dto/create--sensor-data.dto.js'
@Controller('sensor-data')
export class SensorDataController {
  constructor(private readonly sensorDataService: SensorDataService) {}
  @Post()
  create(
    @Body({schema:createSensorDataSchema})
    data: CreateSensorDataDto,
  ){
    return this.sensorDataService.create(data);
  }
}
