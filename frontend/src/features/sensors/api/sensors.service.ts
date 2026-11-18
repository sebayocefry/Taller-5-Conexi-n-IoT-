import type {SensorReading} from '../types';
import {httpGet} from '../../../shared/api/http';

export function obtenerUltimaMedicion(
    deviceId:string,
    signal?: AbortSignal
): Promise<SensorReading>{
    return httpGet<SensorReading>(
        '/sensor-data/latest',
        {deviceId},
        signal
    )
}