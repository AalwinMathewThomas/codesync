const Redis = require('ioredis');

const getRedisConfig = () => {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  return new Redis(url);
};

const redis = getRedisConfig();

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err.message));

module.exports = redis;