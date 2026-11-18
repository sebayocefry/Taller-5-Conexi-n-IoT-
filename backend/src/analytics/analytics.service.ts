import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { SensorReading } from '../sensor-data/schemas/sensor-reading-schema.js';
import { inject } from 'vitest';

@Injectable()
export class AnalyticsService{
    constructor(@InjectModel(SensorReading.name) private readonly sensorModel: Model<SensorReading>,){}

    async getSummary(deviceId: string){
        const result = await this.sensorModel.aggregate([
            {
                 $match : {deviceId}
            },
            {
                $group:{
                    _id: null,
                    totalLecturas: { $sum: 1 },
                    temperaturaPromedio: { $avg: '$temperatura' },
                    temperaturaMaxima: { $max: '$temperatura' },
                    temperaturaMinima: { $min: '$temperatura' },
                    humedadPromedio: { $avg: '$humedad' },
                    humedadMaxima: { $max: '$humedad' },
                    humedadMinima: { $min: '$humedad' }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalLecturas: 1,
                    temperaturaPromedio: {$round:['$temperaturaPromedio',2]},
                    temperaturaMaxima: 1,
                    temperaturaMinima: 1,
                    humedadPromedio: {$round:['$humedadPromedio',2]},
                    humedadMaxima: 1,
                    humedadMinima: 1
                }
            }
        ]).exec();

        if (result.length === 0){
            throw new NotFoundException(`No hay lecturas para el dispositivo ${deviceId}`);
        }

        return {
            deviceId,
            ...result[0]
        };
    }


    async getHourly(deviceId: string, from?: Date, to?: Date) {

        const dateFilter: { $gte?: Date; $lte?: Date } = {};

        if (from) dateFilter.$gte = from;
        if (to) dateFilter.$lte = to;

        const filter = {
            deviceId,
            ...(from || to ? { receivedAt: dateFilter } : {}),
        };

        return this.sensorModel.aggregate([
            {
                $match: filter
            },
            {
                $group: {
                    _id: {
                        $dateTrunc: {
                            date: '$receivedAt',
                            unit: 'hour',
                            timezone: 'UTC'
                        }
                    },
                    totalLecturas: { $sum: 1 },
                    temperaturaPromedio: { $avg: '$temperatura' },
                    humedadPromedio: { $avg: '$humedad' }
                }
            },
            {
                $sort: { _id: 1 }
            },
            {
                $project: {
                    _id: 0,
                    hora: '$_id',
                    totalLecturas: 1,
                    temperaturaPromedio: {
                        $round: ['$temperaturaPromedio', 2]
                    },
                    humedadPromedio: {
                        $round: ['$humedadPromedio', 2]
                    }
                }
            }
        ]).exec();
    }

}