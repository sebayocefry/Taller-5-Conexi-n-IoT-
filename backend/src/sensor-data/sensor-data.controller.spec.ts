import { Test, TestingModule } from '@nestjs/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SensorDataController } from './sensor-data.controller.js';
import { SensorDataService } from './sensor-data.service.js';

describe('SensorDataController', () => {
  let controller: SensorDataController;

  // Simulamos el SensorDataService
  const mockSensorDataService = {
    create: vi.fn(),
    findLatest: vi.fn(),
    findHistory: vi.fn(),
    getDeviceStatus: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SensorDataController],
      providers: [
        {
          provide: SensorDataService,
          useValue: mockSensorDataService,
        },
      ],
    }).compile();

    controller = module.get<SensorDataController>(SensorDataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});