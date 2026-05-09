const fastify = require('fastify')({ logger: true });
const Redis = require('ioredis');
require('dotenv').config();

const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379
});

fastify.post('/trace', async (request, reply) => {
  const { source, target, status } = request.body;
  
  if (!source || !target) {
    return reply.status(400).send({ error: 'Source and target are required' });
  }

  const trace = {
    source,
    target,
    status: status || 'OK',
    timestamp: new Date().toISOString()
  };

  // Push to Redis queue for Engine to process
  await redis.lpush('atlas_traces', JSON.stringify(trace));
  
  return { success: true };
});

const start = async () => {
  try {
    await fastify.listen({ port: process.env.COLLECTOR_PORT || 5002, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
