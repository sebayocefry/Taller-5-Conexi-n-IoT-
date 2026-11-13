import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;
  constructor(private readonly configService: ConfigService) {}
  // 1. Ciclo de vida: Conectarse a Redis al arrancar el backend
  async onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD') || undefined;
    this.client = new Redis({
      host,
      port,
      password,
      retryStrategy: (times) => {
        // Reintento exponencial si se cae la conexión
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
    });
    this.client.on('connect', () => {
      this.logger.log(`Conectado exitosamente a Redis en ${host}:${port}`);
    });
    this.client.on('error', (err) => {
      this.logger.error(`Error en cliente Redis: ${err.message}`);
    });
  }
  // 2. Ciclo de vida: Cerrar la conexión limpiamente al apagar el backend
  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Conexión con Redis cerrada.');
    }
  }
  // --- MÉTODOS DE NEGOCIO IOT ---
  /**
   * Almacena la última medición del ESP32 en formato JSON.
   * Clave: device:last:<deviceId>
   */
  async setLatestReading(deviceId: string, data: unknown): Promise<void> {
    try {
      const key = `device:last:${deviceId}`;
      await this.client.set(key, JSON.stringify(data));
    } catch (error) {
      this.logger.error(`No se pudo guardar la última lectura en Redis: ${error}`);
    }
  }
  /**
   * Obtiene la última medición desde la memoria RAM.
   */
  async getLatestReading<T = unknown>(deviceId: string): Promise<T | null> {
    try {
      const key = `device:last:${deviceId}`;
      const raw = await this.client.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (error) {
      this.logger.error(`Error al leer última lectura desde Redis: ${error}`);
      return null;
    }
  }
  /**
   * Registra el Heartbeat (latido) con un TTL de expiración automática.
   * Clave: device:heartbeat:<deviceId>
   * TTL sugerido: 30 segundos (3 intervalos de 10s del ESP32).
   */
  async setHeartbeat(deviceId: string, ttlSeconds = 30): Promise<void> {
    try {
      const key = `device:heartbeat:${deviceId}`;
      // 'EX' le indica a Redis que expire en ttlSeconds
      await this.client.set(key, 'online', 'EX', ttlSeconds);
    } catch (error) {
      this.logger.error(`Error al registrar heartbeat en Redis: ${error}`);
    }
  }
  /**
   * Detecta si el dispositivo está vivo o inactivo.
   * Si la clave expiró o no existe, retorna false (offline).
   */
  async isDeviceOnline(deviceId: string): Promise<boolean> {
    try {
      const key = `device:heartbeat:${deviceId}`;
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      this.logger.error(`Error al verificar estado del dispositivo en Redis: ${error}`);
      return false;
    }
  }
}