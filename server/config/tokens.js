const jwt = require('jsonwebtoken')
const redis = require('./redis');

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

   const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

const saveRefreshToken = async (userId, refreshToken) => {
  await redis.set(
    `refreshToken:${userId}`,
    refreshToken,
    'EX',
    7 * 24 * 60 * 60  
  );
};

const deleteRefreshToken = async (userId) => {
  await redis.del(`refreshToken:${userId}`);
};

const getRefreshToken = async (userId) => {
  return redis.get(`refreshToken:${userId}`);
};

module.exports = {
  generateTokens,
  saveRefreshToken,
  deleteRefreshToken,
  getRefreshToken
};