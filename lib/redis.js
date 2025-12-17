import { createClient } from 'redis';

let redisClient = null;

/**
 * 获取 Redis 客户端单例
 * 自动从环境变量读取连接配置
 */
export async function getRedisClient() {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  try {
    // 从环境变量读取 Redis 连接信息
    const redisUrl = process.env.KV_REST_API_URL || process.env.REDIS_URL;

    if (!redisUrl) {
      throw new Error('Redis URL not configured. Set KV_REST_API_URL or REDIS_URL environment variable.');
    }

    redisClient = createClient({
      url: redisUrl,
      password: process.env.KV_REST_API_TOKEN || process.env.REDIS_PASSWORD,
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    await redisClient.connect();
    console.log('Redis client connected successfully');

    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
}

/**
 * 关闭 Redis 连接
 */
export async function closeRedisClient() {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
    console.log('Redis client disconnected');
  }
}

/**
 * Redis 操作辅助函数
 */
export const redisHelpers = {
  /**
   * 获取 JSON 数据
   */
  async getJSON(key) {
    const client = await getRedisClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  },

  /**
   * 设置 JSON 数据
   */
  async setJSON(key, value) {
    const client = await getRedisClient();
    await client.set(key, JSON.stringify(value));
  },

  /**
   * 删除键
   */
  async delete(key) {
    const client = await getRedisClient();
    await client.del(key);
  },

  /**
   * 检查键是否存在
   */
  async exists(key) {
    const client = await getRedisClient();
    return await client.exists(key);
  },
};
