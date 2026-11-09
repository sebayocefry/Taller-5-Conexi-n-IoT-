export interface SensorReading{
    _id: string;
    deviceId: string;
    temperatura: number;
    humedad: number;
    nivelAgua: number;
    receivedAt: string;
    __v: number;
}