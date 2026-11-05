# Taller 5 — Conexión IoT

Plataforma de monitoreo de sensores IoT desarrollada para el **Taller 5 de NoSQL**. El sistema está diseñado para recibir mediciones de un **ESP32 cada 10 segundos**, conservar un historial en MongoDB y mostrar la información desde una interfaz web.


## Objetivo

Construir una solución que permita:

- Recibir datos de temperatura, humedad y nivel de agua enviados por un ESP32.
- Almacenar las mediciones en **MongoDB** para mantener su historial.
- Incorporar una segunda base de datos NoSQL, **Redis**, con un propósito distinto: consultar el último dato y gestionar el estado de los dispositivos.
- Visualizar las mediciones actualizadas en un frontend sencillo, utilizando *polling* o WebSocket.
- Publicar la aplicación para permitir su acceso externo.

## Tecnologías

| Componente | Tecnología | Estado |
|---|---|---|
| Backend y API REST | NestJS + TypeScript | Implementado |
| Validación de datos | Zod | Implementado |
| Base de datos histórica | MongoDB Atlas + Mongoose | Implementado |
| Base de datos clave-valor | Redis | Pendiente |
| Interfaz web | React | Pendiente de integración |
| Actualización de datos | Polling o WebSocket | Por definir |
| Despliegue público | Por definir | Pendiente |

## Arquitectura del sistema

La arquitectura objetivo contempla el siguiente flujo:

```mermaid
flowchart LR
    ESP[ESP32] -->|HTTP POST cada 10 s| API[API REST · NestJS]
    API -->|Guardar historial| M[(MongoDB)]
    API -.->|Última medición y actividad| R[(Redis)]
    UI[Frontend · React] -->|Consultas HTTP| API
```

**Líneas continuas:** componentes y comunicaciones considerados en el diseño; no implican que la conexión física con el ESP32 ni el frontend estén terminados. **Línea discontinua:** integración con Redis pendiente.

Actualmente, el flujo **probado** es la recepción de solicitudes HTTP, su validación y almacenamiento en MongoDB, junto con las consultas a través de Postman.

## Datos enviados por el ESP32

El endpoint obligatorio del taller es `POST /sensor-data`. El cuerpo de la solicitud tiene este formato:

```json
{
  "deviceId": "esp32_1",
  "temperatura": 24.56,
  "humedad": 65.32,
  "nivelAgua": 3
}
```

| Campo | Descripción |
|---|---|
| `deviceId` | Identificador del dispositivo |
| `temperatura` | Temperatura expresada como número |
| `humedad` | Humedad entre 0 y 100 |
| `nivelAgua` | Nivel entero entre 0 y 4 |

El nivel de agua representa los valores **0 %, 25 %, 50 %, 75 % y 100 %**, respectivamente. El enunciado indica valores con dos decimales para temperatura y humedad; la validación actual del backend acepta números sin exigir exactamente dos decimales.

## API REST

**Base local:** `http://localhost:3000`

| Método | Endpoint | Descripción | Estado |
|---|---|---|---|
| `POST` | `/sensor-data` | Recibe y almacena una medición | Implementado |
| `GET` | `/sensor-data/latest?deviceId=esp32_1` | Obtiene la última medición del dispositivo | Implementado |
| `GET` | `/sensor-data/history?deviceId=esp32_1` | Consulta el historial del dispositivo | Implementado |
| `GET` | `/analytics/summary` | Resumen estadístico | Propuesto |

El historial admite los parámetros opcionales `limit` (de 1 a 100; predeterminado: 50), `from` y `to` (fechas ISO 8601 con zona horaria). Los resultados se devuelven desde el más reciente al más antiguo.

Para conocer los formatos de respuesta, las validaciones, los errores y los detalles de implementación, consulta la **[documentación del backend](backend/README.md)**.

## Organización del repositorio

La estructura general prevista para el proyecto es:

```text
.
├── backend/            # API REST, validación y persistencia
│   └── README.md       # Documentación técnica del backend
├── frontend/           # Aplicación React (pendiente de integración)
└── README.md           # Visión general del proyecto
```

> La carpeta `frontend/` representa la organización prevista. Ajustar esta sección a la estructura real del repositorio cuando se incorpore el frontend.

### Arquitectura del software

El backend está organizado por módulos de NestJS:

- **`sensor-data`**: controladores, servicios, DTO y esquema de MongoDB para recibir y consultar mediciones.
- **`redis`** *(pendiente)*: almacenamiento clave-valor de la última lectura y actividad del dispositivo.
- **`analytics`** *(pendiente)*: cálculos de promedios, estadísticas y tendencias.
- **`realtime`** *(opcional)*: comunicación mediante WebSocket, si se adopta este mecanismo.

La arquitectura del sistema describe cómo se conectan ESP32, backend, bases de datos y frontend; la arquitectura del software describe la organización interna de las funcionalidades.

## Ejecutar el backend localmente

**Requisitos:** Node.js, npm y acceso a una instancia de MongoDB Atlas.

1. Entrar a la carpeta del backend e instalar dependencias:

   ```bash
   cd backend
   npm install
   ```

2. Crear `backend/.env` con una URI de conexión válida:

   ```dotenv
   MONGODB_URI=mongodb+srv://USUARIO:CONTRASENA@CLUSTER.mongodb.net/
   ```

3. Iniciar el servidor en modo desarrollo:

   ```bash
   npm run start:dev
   ```

La API estará disponible en `http://localhost:3000`. Puedes probar sus endpoints desde Postman. Para comprobar la compilación, ejecuta `npm run build` desde `backend/`.

**Seguridad:** no publiques contraseñas, cadenas de conexión reales ni archivos `.env` en GitHub.

## Estado de avance

- [x] Backend NestJS configurado.
- [x] Validación de las mediciones con Zod.
- [x] Conexión y persistencia en MongoDB Atlas.
- [x] Registro de mediciones con `POST /sensor-data`.
- [x] Consulta de última medición e historial, con límite y filtro de fechas.
- [x] Pruebas de los endpoints mediante Postman.
- [ ] Integración de Redis como segunda base de datos NoSQL.
- [ ] Estadísticas, promedios y tendencias.
- [ ] Interfaz React con actualización de mediciones.
- [ ] Pruebas de extremo a extremo con el ESP32.
- [ ] Despliegue público y verificación de acceso externo.
- [ ] Extras opcionales: gráficos, indicadores visuales y alertas.

## Alcance del taller

La evaluación contempla cinco criterios con la misma ponderación (**20 % cada uno**): backend funcionando, uso de MongoDB, uso de una segunda base de datos, frontend funcional y creatividad o funcionalidades adicionales. También se solicita presentar por separado la **arquitectura del sistema** y la **arquitectura del software**.

Las ideas adicionales propuestas en el enunciado —como gráficos en tiempo real, histórico de las últimas lecturas, caché y alertas por temperatura o nivel de agua— son opciones de ampliación, no funcionalidades ya implementadas.

---

**Proyecto académico — Taller 5: Conexión IoT.**
