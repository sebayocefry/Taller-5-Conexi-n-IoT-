import {z} from 'zod';

export const getLatestSensorDataSchema = z.strictObject({
    deviceId: z.string().min(1).trim()
})

export type GetLatestSensorDataDto = z.infer<typeof getLatestSensorDataSchema>;