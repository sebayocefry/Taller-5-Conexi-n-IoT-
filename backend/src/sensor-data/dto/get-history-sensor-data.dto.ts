import {z} from 'zod';

export const getHistorySensorDataSchema= z.strictObject({
    deviceId: z.string().trim().min(1),
    limit: z.coerce.number().int().min(1).max(100).default(100),
});

export type GetHistorySensorDataDto = z.infer<typeof getHistorySensorDataSchema>;
