import { Injectable } from '@nestjs/common';
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
}
