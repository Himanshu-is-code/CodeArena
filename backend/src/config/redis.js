const { createClient } = require('redis');

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: 'money-curve-control-35757.db.redis.io',
        port: 14459
    }
});

module.exports = redisClient;