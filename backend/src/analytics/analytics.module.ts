import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsService } from './analytics.service.js';

import {SensorReading, SensorReadingSchema,} from '../sensor-data/schemas/sensor-reading-schema.js'
@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name:SensorReading.name,
                schema: SensorReadingSchema,
            },
        ]),
    ],
    controllers : [AnalyticsController],
    providers: [AnalyticsService]
})
export class AnalyticsModule {}
