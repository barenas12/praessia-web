const express = require('express');
const mysql = require('mysql2/promise');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3008;

/* Middlewares */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use((req, res, next) => {
  const origin = process.env.ALLOWED_ORIGIN || req.headers.origin;
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Max-Age', '86400');
  if (origin) {
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'praessia'
};

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/* Servir archivos estáticos del frontend (carpeta padre) para pruebas locales */
const path = require('path');
app.use(express.static(path.join(__dirname, '..')));

async function testConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}

app.get('/db-test', async (req, res) => {
  try {
    await testConnection();
    res.json({ success: true, message: 'Conexión MySQL exitosa' });
  } catch (error) {
    console.error('Error de conexión MySQL:', error);
    res.status(500).json({ success: false, message: 'No se pudo conectar a MySQL', error: error.message });
  }
});

/* Rutas */
const loginRoutes = require('./src/modules/login/login.routes.js');
const recordSaleRoutes = require('./src/modules/record-sale/record-sale.routes.js');
const authMiddleware = require('./src/modules/login/auth.middleware.js');
const supplyRechargeRoutes = require('./src/modules/supply-recharge/supply-recharge.routes.js');

app.use('/login', loginRoutes);
app.use('/record-sale', authMiddleware.authenticate, recordSaleRoutes);
app.use('/supply-recharge', supplyRechargeRoutes);

/* Pool disponible globalmente para rutas */
app.locals.pool = pool;

async function tryListen(startPort, maxAttempts = 10) {
  let current = startPort;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const server = await new Promise((resolve, reject) => {
        const s = app.listen(current)
          .once('listening', () => resolve(s))
          .once('error', (err) => reject(err));
      });

      console.log(`Servidor iniciado en http://localhost:${current}`);
      console.log('Prueba la conexión MySQL en http://localhost:' + current + '/db-test');
      return { server, port: current };
    } catch (err) {
      if (err.code === 'EADDRINUSE') {
        console.warn(`Puerto ${current} en uso, intentando ${current + 1}...`);
        current += 1;
        continue;
      }
      console.error('Error al iniciar el servidor:', err);
      process.exit(1);
    }
  }

  console.error(`No fue posible encontrar un puerto libre en el rango ${startPort}-${current}`);
  process.exit(1);
}

(async () => {
  await tryListen(Number(process.env.PORT) || port, 10);
})();
