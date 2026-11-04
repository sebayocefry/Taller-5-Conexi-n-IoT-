import { Module } from '@nestjs/common';
import { SensorDataService } from './sensor-data.service.js';
import { SensorDataController } from './sensor-data.controller.js';
import{SensorReading,SensorReadingSchema} from './schemas/sensor-reading-schema.js'
import { MongooseModule } from '@nestjs/mongoose';


@Module({
  imports:[MongooseModule.forFeature([
    {
      name:SensorReading.name,
      schema:SensorReadingSchema,
    },
  ]),
],
  controllers: [SensorDataController],
  providers: [SensorDataService],
})
export class SensorDataModule {}
