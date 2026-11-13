# Backend — Taller 5: Conexión IoT

Backend de una plataforma de monitoreo IoT desarrollada con **NestJS y TypeScript**.

Su objetivo es recibir mediciones enviadas por un **ESP32 cada 10 segundos**, almacenarlas en MongoDB y exponerlas mediante una API REST para su visualización y análisis desde un frontend React.

**Estado actual:** recepción, validación, persistencia y consultas históricas implementadas y probadas con Postman y MongoDB Atlas. La integración con Redis, Analytics, frontend y despliegue continúa pendiente.

## 1. Requisitos del taller

- Implementar obligatoriamente `POST /sensor-data`, compatible con el JSON enviado por el ESP32.
- Utilizar **MongoDB** como base de datos obligatoria.
- Incorporar una segunda base de datos NoSQL de otro modelo: **Redis (clave-valor)**.
- Permitir la visualización de mediciones actualizadas desde el frontend.
- Desplegar la aplicación para permitir el acceso del profesor.
- Documentar la arquitectura del sistema y la arquitectura del software.

## 2. Tecnologías

| Tecnología | Uso | Estado |
|---|---|---|
| NestJS + TypeScript (ESM) | API HTTP y lógica de negocio | Implementado |
| Zod | Validación de entradas | Implementado |
| MongoDB Atlas + Mongoose | Persistencia del historial | Implementado |
| HTTP REST | Recepción y consulta de mediciones | Implementado |
| Redis | Última medición, estado y caché | Pendiente |
| WebSocket | Actualización push en tiempo real | Opcional |

## 3. Organización del backend

Estructura principal de `src/`:

```text
src/
├── main.ts
├── app.module.ts
├── sensor-data/
│   ├── sensor-data.module.ts
│   ├── sensor-data.controller.ts
│   ├── sensor-data.service.ts
│   ├── dto/
│   │   ├── create-sensor-data.dto.ts
│   │   ├── get-latest-sensor-data.dto.ts
│   │   └── get-history-sensor-data.dto.ts
│   └── schemas/
│       └── sensor-reading.schema.ts
├── redis/
│   └── redis.module.ts
|   └─── redis.service.ts
├── analytics/
│   └── ...
└── realtime/
    └── ...
```

Los tres últimos módulos forman parte de la arquitectura planificada, pero sus funcionalidades todavía no están integradas.

### Responsabilidad de cada módulo

| Módulo | Responsabilidad |
|---|---|
| `sensor-data` | Validar, registrar y consultar mediciones |
| `redis` | Gestionar la conexión y operaciones clave-valor |
| `analytics` | Calcular estadísticas, promedios y tendencias |
| `realtime` | Notificar nuevas mediciones, si se implementa WebSocket |

**Convención:** los controladores reciben solicitudes HTTP, los servicios implementan la lógica de negocio, los DTO validan las entradas y los schemas definen los documentos de MongoDB. `AppModule` compone los módulos.

## 4. Contrato de entrada del ESP32

### `POST /sensor-data`

El ESP32 debe enviar un JSON con estos nombres exactos:

```json
{
  "deviceId": "esp32_1",
  "temperatura": 24.56,
  "humedad": 65.32,
  "nivelAgua": 3
}
```

| Campo | Tipo | Validación |
|---|---|---|
| `deviceId` | string | No vacío después de eliminar espacios exteriores |
| `temperatura` | number | Número válido |
| `humedad` | number | Entre 0 y 100 |
| `nivelAgua` | integer | Entre 0 y 4 |

Correspondencia del nivel de agua:

| Valor | Porcentaje |
|---|---|
| 0 | 0 % |
| 1 | 25 % |
| 2 | 50 % |
| 3 | 75 % |
| 4 | 100 % |

La validación se realiza mediante Zod. Actualmente no se exige que la temperatura y la humedad tengan exactamente dos decimales.

Las solicitudes que no cumplen el esquema son rechazadas antes de guardar la medición.

## 5. Persistencia en MongoDB

La base de datos configurada es `taller5iot` y la colección de mediciones es `sensor_readings`.

Cada medición se almacena como un documento independiente para conservar su historial.

Ejemplo de documento:

```json
{
  "_id": "6aebd03a6c01b9b893705e3b",
  "deviceId": "esp32_1",
  "temperatura": 28.6,
  "humedad": 53.8,
  "nivelAgua": 0,
  "receivedAt": "2026-11-05T00:39:22.340Z",
  "__v": 0
}
```

- `_id`: identificador generado por MongoDB.
- `receivedAt`: fecha y hora asignadas automáticamente por el backend, almacenadas en UTC.
- `__v`: campo de versionado administrado por Mongoose.

El ESP32 no necesita enviar `receivedAt`.

### Índice de consulta

```typescript
SensorReadingSchema.index({
  deviceId: 1,
  receivedAt: -1,
});
```

Este índice compuesto favorece las consultas de mediciones por dispositivo, ordenadas desde la más reciente.

## 6. Documentación de Redis (Segunda Base de Datos NoSQL)

Redis se implementó como la segunda base de datos del sistema, operando bajo el modelo **Clave-Valor en memoria (RAM)**. Su propósito es garantizar lecturas de ultra baja latencia (<1 ms) para el frontend y supervisar la actividad en tiempo real del microcontrolador ESP32.

### 6.1. Claves Utilizadas y Políticas de Expiración (TTL)

| Clave en Redis | Tipo de Dato | Política de Expiración (TTL) | Propósito y Justificación Técnica |
|---|---|---|---|
| `device:last:{deviceId}` | `String` (JSON serializado) | **Sin expiración (Persistente en memoria)** | Almacena la última medición recibida del sensor. Permite responder al endpoint `GET /sensor-data/latest` sin consultar el disco en MongoDB, reduciendo el consumo de recursos. |
| `device:heartbeat:{deviceId}` | `String` (`"online"`) | **30 segundos** | Funciona como señal de vida (*Heartbeat*). El ESP32 transmite cada 10 s; si transcurren 30 s sin recibir paquetes (3 intentos fallidos), Redis elimina automáticamente la clave, detectando que el sensor está `OFFLINE`. |

### 6.2. Estrategia de Caché y Resiliencia (Cache-Aside & Fallback)

1. **Recepción (`POST /sensor-data`):**
   - El dato se guarda obligatoriamente en **MongoDB** (persistencia histórica).
   - Inmediatamente se actualiza `device:last:{deviceId}` y se renueva el TTL de `device:heartbeat:{deviceId}` en **Redis**.
   - Si Redis estuviera caído o fuera de línea, la excepción se captura en un bloque `try/catch` para **no interrumpir** el almacenamiento en MongoDB.

2. **Consulta rápida (`GET /sensor-data/latest`):**
   - **Cache Hit:** Si la clave existe en Redis, se devuelve de inmediato desde la memoria RAM.
   - **Cache Miss:** Si Redis se reinició o no tiene la clave, el backend consulta a MongoDB, devuelve el dato y repuebla Redis de forma transparente.

3. **Monitoreo de estado (`GET /sensor-data/status`):**
   - Consulta la existencia (`EXISTS`) de la clave `device:heartbeat:{deviceId}`.
   - Retorna `{ "status": "ONLINE" }` si la clave sigue viva, o `{ "status": "OFFLINE" }` si el TTL expiró.


## 7. Documentación de la API REST

**URL base en desarrollo:** `http://localhost:3000`

Los endpoints siguientes están implementados y han sido probados mediante Postman.

### 7.1. Registrar una medición

**`POST /sensor-data`**

Guarda una nueva medición en MongoDB Atlas.

**Body (JSON):**

```json
{
  "deviceId": "esp32_1",
  "temperatura": 24.56,
  "humedad": 65.32,
  "nivelAgua": 3
}
```

**Respuesta exitosa: HTTP 201 Created**

Devuelve el documento guardado, incluyendo su `_id` y `receivedAt`.

**Errores:**

- `400 Bad Request`: cuerpo JSON inválido o campos que no cumplen las validaciones.
- Los errores de almacenamiento se gestionan mediante el manejo de excepciones de NestJS y Mongoose.

### 7.2. Obtener la última medición

**`GET /sensor-data/latest`**

Devuelve la medición más reciente de un dispositivo.

**Parámetros:**

| Parámetro | Tipo | Obligatorio |
|---|---|---|
| `deviceId` | string | Sí |

**Ejemplo:**

```http
GET /sensor-data/latest?deviceId=esp32_1
```

**Respuesta exitosa: HTTP 200 OK**

```json
{
  "_id": "6aebd03a6c01b9b893705e3b",
  "deviceId": "esp32_1",
  "temperatura": 28.6,
  "humedad": 53.8,
  "nivelAgua": 0,
  "receivedAt": "2026-11-05T00:39:22.340Z",
  "__v": 0
}
```

**Errores:**

- `400 Bad Request`: falta `deviceId` o es inválido.
- `404 Not Found`: no existen mediciones para ese dispositivo.

**Nota:** actualmente la consulta obtiene la última medición desde MongoDB. La integración con Redis queda pendiente.

### 7.3. Consultar historial de mediciones

**`GET /sensor-data/history`**

Obtiene el historial de un dispositivo con filtros opcionales por cantidad y fechas.

**Parámetros:**

| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `deviceId` | string | Sí | Dispositivo a consultar |
| `limit` | integer | No | Máximo de resultados, entre 1 y 100. Predeterminado: 50 |
| `from` | ISO datetime | No | Fecha inicial inclusiva |
| `to` | ISO datetime | No | Fecha final inclusiva |

Las fechas deben utilizar el formato ISO 8601 con zona horaria, por ejemplo `2026-11-05T00:00:00Z`.

**Ejemplo 1: últimas tres mediciones**

```http
GET /sensor-data/history?deviceId=esp32_1&limit=3
```

**Ejemplo 2: historial entre dos fechas**

```http
GET /sensor-data/history?deviceId=esp32_1&from=2026-11-04T00:00:00Z&to=2026-11-05T23:59:59Z
```

**Respuesta exitosa: HTTP 200 OK**

Devuelve un arreglo de documentos:

```json
[
  {
    "_id": "6aebd03a6c01b9b893705e3b",
    "deviceId": "esp32_1",
    "temperatura": 28.6,
    "humedad": 53.8,
    "nivelAgua": 0,
    "receivedAt": "2026-11-05T00:39:22.340Z",
    "__v": 0
  },
  {
    "_id": "6aebd0336c01b9b893705e3a",
    "deviceId": "esp32_1",
    "temperatura": 27.1,
    "humedad": 55.3,
    "nivelAgua": 1,
    "receivedAt": "2026-11-05T00:39:15.886Z",
    "__v": 0
  }
]
```

**Comportamiento:**

- Los resultados se ordenan por `receivedAt`, desde el más reciente al más antiguo.
- `limit` restringe la cantidad máxima de documentos.
- `from` y `to` filtran el historial por fecha.
- Si no existen mediciones coincidentes, devuelve `[]`.

**Errores:**

- `400 Bad Request`: falta `deviceId`, `limit` es inválido, las fechas tienen un formato incorrecto o `from` es posterior a `to`.

### 7.4. Consultar Estado de Conexión del Dispositivo

**`GET /sensor-data/status?deviceId=esp32_1`**
Determina en tiempo real si el ESP32 está transmitiendo activamente utilizando el TTL en Redis.
**Parámetros Query:**
- `deviceId` (string, obligatorio): Identificador del dispositivo.
**Respuesta exitosa: HTTP 200 OK**
```json
{
  "deviceId": "esp32_1",
  "status": "ONLINE"
}
```
*(Si el sensor no ha enviado datos en los últimos 30 segundos, `status` cambiará automáticamente a `"OFFLINE"`).*

### 7.5. Resumen de endpoints

| Método | Ruta | Estado |
|---|---|---|
| POST | `/sensor-data` | Implementado |
| GET | `/sensor-data/latest` | Implementado |
| GET | `/sensor-data/history` | Implementado |
| GET | `/analytics/summary` | Propuesto |
| GET | `/sensor-data/status?deviceId=esp32_1` | Implementado |

La respuesta de `history` es un **arreglo JSON**, mientras que `latest` devuelve un **objeto JSON**. Esta diferencia debe considerarse al consumir los endpoints desde React.

## 8. Configuración y ejecución local

### Requisitos

- Node.js compatible con el proyecto.
- npm.
- Acceso a MongoDB Atlas.
- Variables de entorno configuradas.

### Instalación

Desde la carpeta `backend/`:

```bash
npm install
```

Crear el archivo `.env` a partir del ejemplo y configurar la conexión:

```dotenv
MONGODB_URI=mongodb+srv://USUARIO:CONTRASENA@CLUSTER.mongodb.net/
```

La URI anterior es ilustrativa. Deben utilizarse las credenciales y la dirección reales de Atlas.

El archivo `.env` está excluido mediante `.gitignore` y **no debe subirse a GitHub**.

### Ejecutar en desarrollo

```bash
npm run start:dev
```

La API queda disponible en:

```text
http://localhost:3000
```

### Comprobar compilación

```bash
npm run build
```

Para realizar pruebas manuales de los endpoints se utiliza Postman.

## 9. Estado de implementación

- [x] Proyecto NestJS creado y ejecutándose.
- [x] Módulos iniciales generados.
- [x] DTO y validación de mediciones mediante Zod.
- [x] Schema de Mongoose y conexión con MongoDB Atlas.
- [x] `POST /sensor-data` funcionando y probado.
- [x] `GET /sensor-data/latest` funcionando y probado.
- [x] `GET /sensor-data/history` con límite funcionando y probado.
- [x] Filtro del historial por fechas implementado y consulta válida probada.
- [x] Documentación inicial de la API.
- [ ] Integración de Redis para último dato y actividad.
- [ ] Estadísticas y tendencias.
- [ ] Integración de la API con React.
- [ ] Pruebas integrales con ESP32.
- [ ] Despliegue accesible desde Internet.
- [ ] WebSocket y alertas, si el alcance y el tiempo lo permiten.

## 10. Documentación de arquitectura

La entrega contempla dos perspectivas:

**Arquitectura del sistema**

Describe la comunicación entre los componentes:

```text
ESP32
  |
  | HTTP POST
  v
Backend NestJS
  |         |
  v         v
MongoDB   Redis
  |
  | Consultas REST
  v
Frontend React
```

Este diagrama representa la arquitectura objetivo. Redis y la integración con React todavía están pendientes.

**Arquitectura del software**

Describe la organización interna del backend:

- `AppModule`: composición de módulos y configuración general.
- `SensorDataController`: rutas HTTP y recepción de solicitudes.
- DTO de Zod: validación y transformación de entradas.
- `SensorDataService`: operaciones de persistencia y consultas.
- `SensorReadingSchema`: estructura e índices de MongoDB.
- `RedisModule`: operaciones clave-valor pendientes.
- `AnalyticsModule`: estadísticas pendientes.
- `RealtimeModule`: comunicaciones WebSocket opcionales.

La documentación será ampliada a medida que se completen las siguientes etapas del proyecto.