# Backend — Taller 5: Conexión IoT

Backend de una plataforma de monitoreo IoT desarrollada con **NestJS y TypeScript**. Su objetivo es recibir mediciones enviadas por un **ESP32 cada 10 segundos**, guardarlas y exponerlas al frontend para visualización y análisis.

> **Estado:** arquitectura y estructura inicial definidas. Los módulos y funcionalidades descritos a continuación son una **propuesta de implementación**; su aparición en este documento no significa que ya estén terminados.

## 1. Requisitos del taller

- Implementar obligatoriamente **`POST /sensor-data`**, compatible con el JSON enviado por el ESP32.
- Utilizar **MongoDB** como base de datos obligatoria.
- Incorporar una **segunda base de datos** de otro modelo. Elegimos **Redis (clave-valor)**.
- Facilitar la visualización de datos actualizados desde el frontend (polling inicialmente; WebSocket como mejora opcional).
- Desplegar la aplicación para permitir el acceso del profesor.
- Documentar tanto la **arquitectura del sistema** como la **arquitectura del software**.

## 2. Tecnologías previstas

| Tecnología | Uso |
|---|---|
| NestJS + TypeScript (ESM) | API HTTP y lógica de negocio |
| MongoDB + Mongoose | Historial persistente de mediciones |
| Redis | Última medición, estado del dispositivo y caché |
| HTTP REST | Recepción y consulta de datos |
| WebSocket | Actualización push en tiempo real (opcional, fase posterior) |

## 3. Organización propuesta de `src/`

```text
src/
├── main.ts
├── app.module.ts
├── sensor-data/
│   ├── sensor-data.module.ts
│   ├── sensor-data.controller.ts
│   ├── sensor-data.service.ts
│   ├── dto/
│   │   └── create-sensor-reading.dto.ts       # A definir/ajustar
│   └── schemas/
│       └── sensor-reading.schema.ts           # Por implementar
├── redis/
│   ├── redis.module.ts
│   └── redis.service.ts                       # Por implementar
├── analytics/
│   ├── analytics.module.ts
│   ├── analytics.controller.ts                # Cuando se necesite
│   └── analytics.service.ts                   # Por implementar
└── realtime/
    ├── realtime.module.ts
    └── realtime.gateway.ts                   # Opcional
```


### Responsabilidad de cada módulo

| Módulo | Responsabilidad | Fuera de su responsabilidad |
|---|---|---|
| `sensor-data` | Validar el JSON, registrar mediciones y ofrecer consultas de historial | Renderizar gráficos |
| `redis` | Centralizar la conexión y operaciones de clave-valor | Decidir reglas de negocio de sensores |
| `analytics` | Calcular promedios, tendencias y resúmenes | Recibir directamente datos del ESP32 |
| `realtime` | Notificar nuevas mediciones a clientes conectados, si se implementa WebSocket | Persistir mediciones |

**Convención:** los controladores reciben las solicitudes; los servicios concentran la lógica; los DTO validan la entrada; los schemas definen documentos de MongoDB. `AppModule` compone los módulos. Un módulo solo debe exportar los servicios que otros necesiten; se deben evitar dependencias circulares.

## 4. Contrato de entrada obligatorio

### `POST /sensor-data`

El profesor enviará un cuerpo JSON con **estos nombres exactos**:

```json
{
  "deviceId": "esp32_1",
  "temperatura": 24.56,
  "humedad": 65.32,
  "nivelAgua": 3
}
```

| Campo | Tipo esperado | Significado |
|---|---|---|
| `deviceId` | string no vacío | Identificador del dispositivo |
| `temperatura` | number | Temperatura, con dos decimales según el enunciado |
| `humedad` | number | Humedad, con dos decimales según el enunciado |
| `nivelAgua` | integer, 0 a 4 | Nivel de agua por tramos |

Correspondencia de `nivelAgua`: **0 = 0%, 1 = 25%, 2 = 50%, 3 = 75%, 4 = 100%**.

**Validaciones propuestas:** verificar tipos, valores numéricos finitos, rango de `nivelAgua` y que `deviceId` no sea vacío. Si la humedad corresponde a humedad relativa porcentual, validar además que esté entre 0 y 100. Definiremos antes de implementar si se exige estrictamente la precisión de dos decimales.

**Importante:** no cambiar los nombres de las propiedades del JSON de entrada. Los datos inválidos deben recibir una respuesta HTTP de error clara, sin guardar una medición incompleta.

## 5. Persistencia en MongoDB

Colección propuesta: `sensor_readings`. Cada medición se guarda como un **documento independiente**, para conservar el historial completo.

```json
{
  "deviceId": "esp32_1",
  "temperatura": 24.56,
  "humedad": 65.32,
  "nivelAgua": 3,
  "receivedAt": "2026-11-01T20:00:00.000Z"
}
```

`receivedAt` lo establece el backend, ya que el ESP32 no envía una marca temporal. MongoDB generará también su identificador `_id`.

**Índice previsto:** `{ deviceId: 1, receivedAt: -1 }`, útil para obtener las mediciones más recientes de un dispositivo.

## 6. Uso de Redis (segunda base de datos)

Redis tendrá un propósito explícito y distinto de MongoDB:

| Clave sugerida | Contenido | Política |
|---|---|---|
| `device:{deviceId}:latest` | Última medición conocida | Se actualiza en cada recepción |
| `device:{deviceId}:heartbeat` | Señal reciente del dispositivo | TTL propuesto de 40 segundos |
| `stats:{deviceId}:hourly:*` | Resultados estadísticos cacheados | TTL por definir |

La **fuente de verdad del historial es MongoDB**. Redis acelera las consultas recientes y permite detectar cuando un dispositivo deja de enviar datos.

Flujo previsto de una medición válida:

1. `SensorDataController` recibe el JSON.
2. El DTO valida los datos.
3. `SensorDataService` guarda la medición en MongoDB.
4. El servicio actualiza la última medición y el estado en Redis.
5. Se confirma la recepción; en una fase posterior puede emitirse un evento WebSocket.

Si falla Redis **después** de guardar en MongoDB, la medición no debe perderse. Se registrará el error y podrá consultarse el dato persistido en MongoDB. El comportamiento HTTP exacto se acordará al implementar y documentar el endpoint.

## 7. Endpoints previstos

> Solo `POST /sensor-data` es obligatorio según el taller. Las demás rutas son propuestas para el dashboard y pueden ajustarse **antes** de que el frontend dependa de ellas.

| Método | Ruta | Objetivo |
|---|---|---|
| `POST` | `/sensor-data` | Registrar nueva medición |
| `GET` | `/sensor-data/latest?deviceId=esp32_1` | Obtener la última medición |
| `GET` | `/sensor-data/history?deviceId=esp32_1&limit=10` | Obtener últimas mediciones |
| `GET` | `/analytics/summary?deviceId=esp32_1` | Obtener estadísticas/resumen |

Los parámetros, respuestas y códigos HTTP definitivos se documentarán en `docs/api-contract.md` **antes de integrar React**. Hasta entonces, no asumir que estas rutas GET ya existen.




## 9. Orden de implementación acordado

- [ ] Proyecto NestJS creado y ejecutándose.
- [ ] Módulos iniciales generados y registrados.
- [ ] DTO para las mediciones y validación de entrada.
- [ ] Schema y conexión con MongoDB.
- [ ] `POST /sensor-data` funcionando y probado.
- [ ] Consultas `latest` e `history`.
- [ ] Integración de Redis para último dato y actividad.
- [ ] Estadísticas y tendencias.
- [ ] Contrato de API revisado con el equipo frontend.
- [ ] Pruebas de integración y despliegue accesible desde Internet.
- [ ] WebSocket y alertas, si el alcance y el tiempo lo permiten.


##  Documentación de arquitectura

La entrega requiere dos vistas diferentes:

- **Arquitectura del sistema:** ESP32 → API desplegada → MongoDB/Redis → navegador con React; incluye las comunicaciones entre componentes y el hosting.
- **Arquitectura del software:** módulos internos de NestJS, responsabilidades, controladores, servicios, DTO, schemas y dependencias.
