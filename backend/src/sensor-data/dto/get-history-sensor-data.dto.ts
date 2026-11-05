import {z} from 'zod';

export const getHistorySensorDataSchema= z.strictObject({
    deviceId: z.string().trim().min(1),
    limit: z.coerce.number().int().min(1).max(100).default(100),

    // esto nos sirve para poder buscar por fechas de forma mas detallada
    // pero no es obligasstorio como los primeros dos campos
    from:z.iso.datetime({offset:true}).optional(),
    to: z.iso.datetime({offset:true}).optional(),
}).refine(
    (data)=>!data.from||!data.to||
    new Date(data.from)<= new Date(data.to),
    {
        message: 'La fecha final debe ser posterior o igual a la inicial',
        path: ['to'],
    },
);

export type GetHistorySensorDataDto = z.infer<typeof getHistorySensorDataSchema>;
