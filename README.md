# BildyApp API

API REST para gestión de albaranes entre clientes y proveedores.

## Instalación

```bash
npm install
npm run dev
```

## Con Docker

```bash
docker compose up
```

## Tests

```bash
npm test
npm run test:coverage
```

## Documentación Swagger

```
http://localhost:3000/api-docs
```

## Health Check

```
http://localhost:3000/health
```

## Variables de entorno

Ver `.env.example`.

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/user/register` | Registro |
| POST | `/api/user/login` | Login |
| POST | `/api/client` | Crear cliente |
| GET | `/api/client` | Listar clientes |
| POST | `/api/project` | Crear proyecto |
| GET | `/api/project` | Listar proyectos |
| POST | `/api/deliverynote` | Crear albarán |
| PATCH | `/api/deliverynote/:id/sign` | Firmar albarán |
| GET | `/api/deliverynote/pdf/:id` | Descargar PDF |
