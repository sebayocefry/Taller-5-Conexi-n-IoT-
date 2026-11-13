import { Injectable, NotFoundException, Logger } from '@nestjs/common'; //agregado Logger
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { SensorReading } from './schemas/sensor-reading-schema.js'
import type { CreateSensorDataDto } from './dto/create--sensor-data.dto.js';
import { GetHistorySensorDataDto } from './dto/get-history-sensor-data.dto.js';
import type { QueryFilter } from 'mongoose';
import { RedisService } from '../redis/redis.service.js'; //Inyecta servicio REDIS


@Injectable()
export class SensorDataService {
    private readonly logger = new Logger(SensorDataService.name); //para no romper la app si falla redis

    constructor(
        @InjectModel(SensorReading.name)
        private readonly SensorReadingModel: Model<SensorReading>,
        private readonly redisService: RedisService, //inyeccion REDIS
    ) { }

    async create(data: CreateSensorDataDto) {
        const reading = new this.SensorReadingModel(data);
        const savedReading = await reading.save(); //cambio a const en vez de return

        // 2. LO NUEVO: Actualizamos Redis en un bloque try/catch
        // Si Redis llegara a fallar, el try/catch evita que la función lance un error,
        // garantizando que el guardado en Mongo que hizo tu compañero NUNCA se vea afectado.
        try {
            await Promise.all([
                this.redisService.setLatestReading(data.deviceId, savedReading),
                this.redisService.setHeartbeat(data.deviceId, 30),
            ]);
        } catch (error) {
            this.logger.warn(`Error al actualizar Redis: ${error}`);
        }
        return savedReading;
    }

    async findLatest(deviceId: string) {

        // 1. LO NUEVO: Preguntar a Redis primero (lectura en RAM, ultra rápida)
        const cached = await this.redisService.getLatestReading<SensorReading>(deviceId);
        if (cached) {
            return cached; // Si está en Redis, lo entregamos de inmediato
        }

        const reading = await this.SensorReadingModel
            .findOne({ deviceId })
            .sort({ receivedAt: -1 })
            .exec();

        if (!reading) {
            throw new NotFoundException("no se encontraron lecturas para el dispositivo: " + deviceId);
        }
        // nuevo, guardado en redis para guardar en REDIS
        await this.redisService.setLatestReading(deviceId, reading);

        return reading;

    }

    //nuevo metodo para saber estado de conexion del ESP32
    async getDeviceStatus(deviceId: string) {
        const isOnline = await this.redisService.isDeviceOnline(deviceId);
        return {
            deviceId,
            status: isOnline ? 'ONLINE' : 'OFFLINE',
            checkedAt: new Date(),
        };
    }


    async findHistory({ deviceId, limit, from, to }: GetHistorySensorDataDto) {

        const filter: QueryFilter<SensorReading> = { deviceId, };

        if (from || to) {
            filter.receivedAt = {
                ...(from ? { $gte: new Date(from) } : {}),
                ...(to ? { $gte: new Date(to) } : {}),
            };
        };


        return this.SensorReadingModel
            .find({ deviceId })
            .sort({ receivedAt: -1 })
            .limit(limit)
            .exec();
    }
}
