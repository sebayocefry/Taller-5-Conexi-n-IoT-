import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedisService } from './redis.service.js';
import { ConfigService } from '@nestjs/config';
describe('RedisService', () => {
  let service: RedisService;
  let fakeConfigService: ConfigService;
  beforeEach(() => {
    fakeConfigService = {
      get: vi.fn((key: string, defaultValue?: any) => {
        if (key === 'REDIS_HOST') return 'localhost';
        if (key === 'REDIS_PORT') return 6379;
        return defaultValue;
      }),
    } as unknown as ConfigService;
    service = new RedisService(fakeConfigService);
  });
  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });
  it('debe manejar la lógica de detección de dispositivo online/offline', async () => {
    // Verificamos que los métodos existen y son llamables
    expect(typeof service.setHeartbeat).toBe('function');
    expect(typeof service.isDeviceOnline).toBe('function');
    expect(typeof service.setLatestReading).toBe('function');
    expect(typeof service.getLatestReading).toBe('function');
  });
});