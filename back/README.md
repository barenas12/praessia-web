# API de Recargas de Insumos - Praessia

## 📋 Configuración

### 1. Crear la tabla en MySQL

Abre MySQL y ejecuta el contenido de `schema.sql`:

```bash
mysql -u root -p praessia < schema.sql
```

O cópialo y pégalo directamente en tu cliente MySQL (MySQL Workbench, phpMyAdmin, etc.)

### 2. Configurar variables de entorno

Copia `.env.example` a `.env` y configura tus datos de base de datos:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=praessia
PORT=3001
```

### 3. Instalar dependencias

```bash
npm install
```

### 4. Iniciar el servidor

**Modo producción:**
```bash
npm start
```

**Modo desarrollo (con auto-reload):**
```bash
npm run dev
```

---

## 🔗 Endpoints

### POST /supply-recharge
Guardar una nueva recarga de insumos.

**Request:**
```json
{
  "fecha": "2024-05-30",
  "insumo": "esencia_accord",
  "cantidad": 500,
  "unidad": "g",
  "costo": 45000,
  "proveedor": "perfuquimicos",
  "notas": "Lote #12, excelente calidad"
}
```

**Response (exitoso):**
```json
{
  "success": true,
  "message": "Recarga guardada correctamente",
  "id": 1
}
```

**Response (error):**
```json
{
  "success": false,
  "message": "Faltan campos requeridos: fecha, insumo, cantidad, unidad, proveedor"
}
```

---

### GET /supply-recharge
Obtener todas las recargas (últimas 100).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "fecha": "2024-05-30",
      "insumo": "esencia_accord",
      "cantidad": 500,
      "unidad": "g",
      "costo": 45000,
      "proveedor": "perfuquimicos",
      "notas": "Lote #12",
      "created_at": "2024-05-30T14:23:45.000Z"
    }
  ],
  "count": 1
}
```

---

## 🧪 Pruebas

### Con curl:

```bash
curl -X POST http://localhost:3001/supply-recharge \
  -H "Content-Type: application/json" \
  -d '{
    "fecha": "2024-05-30",
    "insumo": "esencia_accord",
    "cantidad": 500,
    "unidad": "g",
    "costo": 45000,
    "proveedor": "perfuquimicos",
    "notas": "Prueba"
  }'
```

### Con Postman:
1. Crea una request POST a `http://localhost:3001/supply-recharge`
2. Configura el Body como JSON raw
3. Pega el JSON de ejemplo
4. Click en Send

---

## 📂 Estructura de archivos

```
back/
├── server.js                                    # Servidor principal
├── package.json                                 # Dependencias
├── .env.example                                 # Variables de entorno (template)
├── .env                                         # Variables locales (NO commitear)
├── schema.sql                                   # Script para crear tabla
└── src/
    └── modules/
        └── supply-recharge/
            ├── supply-recharge.routes.js        # Definición de rutas
            └── supply-recharge.controller.js    # Lógica de negocio
```

---

## 🐛 Troubleshooting

**Error: "Error al conectar a la base de datos"**
- Verifica que MySQL está corriendo
- Comprueba las credenciales en `.env`
- Asegúrate de que la base de datos `praessia` existe

**Error: "Table doesn't exist"**
- Ejecuta `schema.sql` para crear la tabla

**Error: "CORS policy"**
- Los CORS ya están habilitados en `server.js`

**El servidor no inicia**
- Verifica que el puerto 3001 está disponible
- O cambia el puerto en `.env`: `PORT=3000` (o cualquier otro puerto libre)
