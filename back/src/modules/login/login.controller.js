const jwt = require('jsonwebtoken');
const loginService = require('./login.service');

const TOKEN_COOKIE_NAME = 'authToken';
const JWT_SECRET = process.env.JWT_SECRET || 'please_set_a_strong_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 8 * 60 * 60 * 1000
};

const createToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const validatePasswordStrength = (password) => {
  if (typeof password !== 'string') return false;
  return /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password) && password.length >= 8;
};

exports.login = async (req, res) => {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son obligatorios.'
      });
    }

    const pool = req.app.locals.pool;
    const user = await loginService.findUserByUsuario(pool, usuario);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario o contraseña incorrectos.'
      });
    }

    const passwordMatches = await loginService.comparePassword(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Usuario o contraseña incorrectos.'
      });
    }

    if (!loginService.isHashedPassword(user.password)) {
      const hashedPassword = await loginService.hashPassword(password);
      await loginService.updateUserPassword(pool, usuario, hashedPassword);
    }

    if (user.actualizarContrasena === 1 || user.actualizarContrasena === true) {
      return res.status(200).json({
        success: true,
        needPasswordUpdate: true,
        message: 'Debes actualizar tu contraseña antes de continuar.',
        data: {
          id: user.id,
          usuario: user.usuario
        }
      });
    }

    const token = createToken({ userId: user.id, usuario: user.usuario });
    // Set cookie (do not log token value)
    res.cookie(TOKEN_COOKIE_NAME, token, COOKIE_OPTIONS);
    try { console.log('[login] cookie set for userId=', user.id, 'sameSite=', COOKIE_OPTIONS.sameSite, 'secure=', COOKIE_OPTIONS.secure); } catch (e) {}

    return res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      data: {
        id: user.id,
        usuario: user.usuario
      },
      token
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno en el inicio de sesión.'
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { usuario, currentPassword, newPassword } = req.body;
    if (!usuario || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Usuario, contraseña actual y nueva contraseña son obligatorios.'
      });
    }

    if (!validatePasswordStrength(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un caracter especial.'
      });
    }

    const pool = req.app.locals.pool;
    const user = await loginService.findUserByUsuario(pool, usuario);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario o contraseña actual incorrectos.'
      });
    }

    const passwordMatches = await loginService.comparePassword(currentPassword, user.password);
    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Usuario o contraseña actual incorrectos.'
      });
    }

    const hashedPassword = await loginService.hashPassword(newPassword);
    await loginService.updateUserPassword(pool, usuario, hashedPassword);

    const token = createToken({ userId: user.id, usuario: user.usuario });
    res.cookie(TOKEN_COOKIE_NAME, token, COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      message: 'Contraseña actualizada correctamente.',
      data: {
        id: user.id,
        usuario: user.usuario
      },
      token
    });
  } catch (error) {
    console.error('Error en cambio de contraseña:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al actualizar la contraseña.'
    });
  }
};

exports.logout = async (req, res) => {
  res.clearCookie(TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  return res.status(200).json({
    success: true,
    message: 'Cierre de sesión exitoso.'
  });
};

exports.check = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Sesión válida.',
      data: {
        userId: req.user.userId,
        usuario: req.user.usuario
      }
    });
  } catch (error) {
    console.error('Error en check de sesión:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al validar sesión.'
    });
  }
};
