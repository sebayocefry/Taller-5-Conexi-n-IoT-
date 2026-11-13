import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SensorDataService } from './sensor-data.service.js';
import { SensorReading } from './schemas/sensor-reading-schema.js';
import { RedisService } from '../redis/redis.service.js';

describe('SensorDataService', () => {
  let service: SensorDataService;

  // Simulador de MongoDB (no necesita base de datos real)
  const mockSensorReadingModel = {
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
  };

  // Simulador de Redis
  const mockRedisService = {
    setLatestReading: vi.fn(),
    getLatestReading: vi.fn(),
    setHeartbeat: vi.fn(),
    isDeviceOnline: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SensorDataService,
        {
          provide: getModelToken(SensorReading.name),
          useValue: mockSensorReadingModel,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<SensorDataService>(SensorDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});