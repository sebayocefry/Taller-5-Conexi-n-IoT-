import {z} from 'zod';

export const createSensorDataSchema = z.strictObject({
    deviceId : z.string().trim().min(1),
    temperatura : z.number(),
    humedad: z.number().min(0).max(100),
    nivelAgua : z.number().int().min(0).max(4),
});

export type CreateSensorDataDto= z.infer<typeof createSensorDataSchema>;