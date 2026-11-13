import { Module } from '@nestjs/common';
import { SensorDataService } from './sensor-data.service.js';
import { SensorDataController } from './sensor-data.controller.js';
import{SensorReading,SensorReadingSchema} from './schemas/sensor-reading-schema.js'
import { MongooseModule } from '@nestjs/mongoose';
import { RedisModule } from '../redis/redis.module.js'; // Importacion de RedisModule

@Module({
  imports:[MongooseModule.forFeature([
    {
      name:SensorReading.name,
      schema:SensorReadingSchema,
    },
  ]),
  RedisModule, //agrega imports de Redis
],
  controllers: [SensorDataController],
  providers: [SensorDataService],
  exports: [SensorDataService],
})
export class SensorDataModule {}
