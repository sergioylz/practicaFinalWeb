# EXAMEN — [Tu nombre Sergio]

## Reto
F1 — REST + códigos HTTP correctos + sanitización activa

## Tarea técnica

### Qué problema detecté
En `src/controllers/deliverynote.controller.js` líneas 98 y 133 usaba códigos HTTP semánticamente incorrectos:
- Línea 98: `throw new AppError('El albarán ya está firmado', 400)` — 400 sugiere body malformado, pero es conflicto de estado
- Línea 133: `throw new AppError('No se puede borrar...', 403)` — 403 sugiere falta de permiso, pero el usuario SÍ tiene permiso, el estado lo impide
- Además, `mongoSanitize()` estaba importado pero comentado en `src/app.js:46`, dejando vulnerable a NoSQL injection

### Cómo lo arreglé
1. Cambié línea 98 en `deliverynote.controller.js`: `AppError(..., 400)` → `AppError(..., 409)`
2. Cambié línea 133 en `deliverynote.controller.js`: `AppError(..., 403)` → `AppError(..., 409)`
3. Descomente línea 46 en `src/app.js`: activé `app.use(mongoSanitize())`
4. Añadí 3 tests que validan estos comportamientos y la sanitización

### Por qué mi solución es correcta
- **400 Bad Request** = el body de la petición está mal hecho (ej: falta campo, tipo incorrecto)
- **403 Forbidden** = el usuario no tiene permiso para hacer esa acción (autorización)
- **409 Conflict** = la petición es válida, pero hay un conflicto con el estado del recurso
- Un albarán ya firmado es un conflicto de estado, no un problema de permiso ni de formato
- `mongoSanitize()` convierte `{ "$gt": "" }` en `{ "\$gt": "" }`, escapando el operador MongoDB

## Respuestas socráticas

**1. ¿Por qué projectCode duplicado es 409 y no 400?**

Un 400 significa que el cliente envió datos mal formados (body inválido). 
Un 409 significa que los datos son válidos, pero hay un conflicto con el estado actual. 
Si envío `{ "projectCode": "ABC" }` y ese código ya existe, el body es perfectamente válido, 
el problema es que entra en conflicto con los datos existentes. 
Lo mismo ocurre con un albarán firmado: el estado del recurso impide la acción, no es que la petición esté malformada.

**2. ¿Cómo distingue el cliente entre 403 (auth) y 409 (estado)?**

Un 403 Forbidden enviado por `authMiddleware` significa "este usuario no tiene permiso para esta acción" (problema de autorización). 
Un 409 Conflict significa "el recurso está en un estado que impide esta acción" (problema de lógica negocio). 
Si siempre devuelvo 403 para ambos, el cliente no puede diferenciar entre "no tengo permisos" y "el albarán está firmado". 
El código HTTP correcto ayuda al cliente a tomar decisiones diferentes.

**3. ¿Qué pasa sin mongoSanitize con email: { "$gt": "" }?**

Sin `mongoSanitize()`, ese objeto con el operador `$gt` llega intacto a Mongoose. 
Entonces la consulta `User.findOne({ email: { "$gt": "" } })` se interpreta como "buscar cualquier usuario cuyo email sea mayor que vacío", 
lo que en MongoDB devuelve posiblemente todos los usuarios (porque cualquier string es > ""). 
Es una NoSQL injection. Con `mongoSanitize()`, el `$` se escapa a `\$`, y Zod rechaza la petición porque espera un string, no un objeto.

**4. ¿Cómo mockear Cloudinary en tests para no depender de él?**

En 'tests/setup.js' o al inicio de 'tests/deliverynote.test.js', uso 'jest.mock()'' para reemplazar 'src/services/storage.service.js' con un mock que devuelve URLs falsas. 
Ejemplo:
```javascript
jest.mock('../src/services/storage.service', () => ({
  uploadToCloud: jest.fn(() => Promise.resolve('https://mock.cloudinary.com/image.jpg')),
  optimizeImage: jest.fn((buffer) => Promise.resolve(buffer)),
}));
```
Así los tests no llaman a Cloudinary real, usan el mock y son más rápidos.

**5. ¿Por qué importa el orden de cierre en graceful shutdown?**

En `src/index.js` el orden es correcto: primero cerramos el servidor HTTP (dejamos de aceptar requests nuevas), luego esperamos a que terminen las peticiones en vuelo,
 luego cerramos Mongoose, finalmente cerramos Socket.IO. Si cerrásemos Mongoose primero, las peticiones que aún están ejecutándose y hacen queries a la BD fallarían 
 con "connection closed". El servidor HTTP debe cerrar último o penúltimo, nunca primero.
 