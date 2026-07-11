const bcrypt = require('bcrypt');

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

exports.findUserByUsuario = async (pool, usuario) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT id, usuario, password, actualizarContrasena FROM usuario WHERE usuario = ? LIMIT 1',
      [usuario]
    );
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

exports.updateUserPassword = async (pool, usuario, hashedPassword) => {
  const connection = await pool.getConnection();
  try {
    await connection.execute(
      'UPDATE usuario SET password = ?, actualizarContrasena = 0 WHERE usuario = ?',
      [hashedPassword, usuario]
    );
  } finally {
    connection.release();
  }
};

exports.isHashedPassword = (value) => {
  return typeof value === 'string' && /^\$2[aby]\$\d{2}\$/.test(value);
};

exports.comparePassword = async (plainPassword, hashedPassword) => {
  if (!plainPassword || !hashedPassword) return false;
  if (exports.isHashedPassword(hashedPassword)) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
  return plainPassword === hashedPassword;
};

exports.hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};
