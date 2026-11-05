import { Injectable, NotFoundException } from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import type {Model} from 'mongoose';
import {SensorReading} from './schemas/sensor-reading-schema.js'
import type { CreateSensorDataDto } from './dto/create--sensor-data.dto.js';

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

    async findHistory(deviceId: string, limit:number){
        return this.SensorReadingModel
            .find({deviceId})
            .sort({receivedAt:-1})
            .limit(limit)
            .exec();                                                                                                                               
    }
}
