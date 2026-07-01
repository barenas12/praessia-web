const jwt = require('jsonwebtoken');

const TOKEN_COOKIE_NAME = 'authToken';
const JWT_SECRET = process.env.JWT_SECRET || 'please_set_a_strong_secret';

exports.authenticate = (req, res, next) => {
  // Try cookie first, then Authorization header (Bearer) as fallback
  let token = req.cookies?.[TOKEN_COOKIE_NAME];
  const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  // Debug: log whether token source is cookie or header (do not log token value)
  try {
    console.log('[auth] incoming', req.method, req.originalUrl, 'cookiePresent=', !!req.cookies?.[TOKEN_COOKIE_NAME], 'authHeaderPresent=', !!authHeader);
  } catch (e) {}

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de autenticación requerido.'
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (error) {
    // If token came from cookie, clear it
    if (req.cookies?.[TOKEN_COOKIE_NAME]) {
      res.clearCookie(TOKEN_COOKIE_NAME, {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production'
      });
    }
    console.warn('[auth] token verify failed:', error && error.message);
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado. Debes iniciar sesión de nuevo.'
    });
  }
};
