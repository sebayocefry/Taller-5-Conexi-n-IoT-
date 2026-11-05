import { Injectable, NotFoundException } from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import type {Model} from 'mongoose';
import {SensorReading} from './schemas/sensor-reading-schema.js'
import type { CreateSensorDataDto } from './dto/create--sensor-data.dto.js';
import { GetHistorySensorDataDto } from './dto/get-history-sensor-data.dto.js';
import type { QueryFilter } from 'mongoose';
@Injectable()
export class SensorDataService {
    constructor(@InjectModel(SensorReading.name) private readonly SensorReadingModel: Model<SensorReading>, ){}
    
    async create(data: CreateSensorDataDto){
        const reading = new this.SensorReadingModel(data);

        return await reading.save();
    }

    async findLatest(deviceId: string){
        const reading = await this.SensorReadingModel
        .findOne({deviceId})
        .sort({receivedAt:-1})
        .exec();

        if(!reading){
            throw new NotFoundException("no se encontraron lecturas para el dispositivo: "+deviceId);
        }

        return reading;

    }

    async findHistory({deviceId,limit,from,to}:GetHistorySensorDataDto){
        
        const filter:QueryFilter<SensorReading>={deviceId,};
        
        if(from || to){
            filter.receivedAt={
                ...(from?{$gte: new Date(from)}:{}),
                ...(to?{$gte: new Date(to)}:{}),
            };
        };
        
        
        return this.SensorReadingModel
            .find({deviceId})
            .sort({receivedAt:-1})
            .limit(limit)
            .exec();                                                                                                                               
    }
}
