import { Module } from '@nestjs/common';
import { RedisService } from './redis.service.js';
@Module({
  providers: [RedisService],
  exports: [RedisService], // <- IMPORTANTE: Exportar para que SensorDataModule pueda usarlo
})
export class RedisModule {}