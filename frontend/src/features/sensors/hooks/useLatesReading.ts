import {useEffect, useState} from 'react';
import {obtenerUltimaMedicion} from '../api/sensors.service';
import type {SensorReading} from '../types'

interface EstadoLectura{
    deviceId: string;
    lectura: SensorReading | null;
    error: string | null;
}

const INTERVALO_MS = 10_000;

export function useLatesReading(deviceId: string){
    const [estado, setEstado] = useState<EstadoLectura|null>(null);

    useEffect(()=>{
        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout >| undefined;

        async function actualizar() {
            try{
                const lectura = await obtenerUltimaMedicion(deviceId, controller.signal);
                if(!controller.signal.aborted){
                    setEstado({deviceId,lectura,error:null});
                }
            }catch{
                if(!controller.signal.aborted){
                    setEstado((anterior) => ({
                        deviceId,
                        lectura: anterior?.deviceId === deviceId
                            ? anterior.lectura
                            : null,
                        error: 'No se pudo consultar el backend',
                    }));
                }
            }finally{
                if(!controller.signal.aborted){
                    timer = setTimeout(()=>{
                        void actualizar();
                    }, INTERVALO_MS);
                }
            }
            
        }
        void actualizar();
        return()=>{
            controller.abort();
            if (timer !== undefined){
                clearTimeout(timer);
            }
        };
    },[deviceId]);

    const estadoActual = estado?.deviceId === deviceId? estado:null;
    return{
        lectura: estadoActual?.lectura ?? null,
        cargando: estadoActual === null,
        error: estadoActual?.error ?? null,
    };
}