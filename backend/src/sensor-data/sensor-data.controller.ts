import { Controller, Body,Post, Get, Query } from '@nestjs/common';
import { SensorDataService } from './sensor-data.service.js';
import { createSensorDataSchema, type CreateSensorDataDto} from './dto/create--sensor-data.dto.js';
import {getLatestSensorDataSchema, type GetLatestSensorDataDto,} from  './dto/get-latest-sensor-data.dto.js';
import {getHistorySensorDataSchema, type GetHistorySensorDataDto,} from './dto/get-history-sensor-data.dto.js';

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

  @Get('latest')
  findLatest(
    @Query({schema:getLatestSensorDataSchema})
    query: GetLatestSensorDataDto,
  ){return this.sensorDataService.findLatest(query.deviceId)}

  @Get('history')
  findHistory(
    @Query({schema:getHistorySensorDataSchema})
    query: GetHistorySensorDataDto,
  ){return this.sensorDataService.findHistory(query)};
};

