const jwt = require('jsonwebtoken');

const jwtConfig = {
  secretKey: '?',
  algorithm: 'HS256',
  expiresIn: '24h'
};

const setToken = (payload) => {
  return jwt.sign(payload, jwtConfig.secretKey, {
    expiresIn: jwtConfig.expiresIn,
    algorithm: jwtConfig.algorithm
  });
}

const decodeJwt = (req) => {
  const [authPrefix, token] = req.headers.authorization?.split(' ') || [];
  if (authPrefix === 'Bearer') {
    return jwt.verify(token, jwtConfig.secretKey);
  }
}

const auth = (req, res, next) => {
  const token = decodeJwt(req);
  if (!token) {
    res.status(401).send('Unauthorized');
  } else {
    res.locals.token = token.id;
    next();
  }
}

module.exports = {
  setToken,
  auth
};