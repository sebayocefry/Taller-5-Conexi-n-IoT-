import { Injectable } from '@nestjs/common';
import type { CreateSensorDataDto } from './dto/create--sensor-data.dto.js';

@Injectable()
export class SensorDataService {
    create(data: CreateSensorDataDto){
        return{
            message: 'medicion validada correctamente',
            data,
        };
    }
}
