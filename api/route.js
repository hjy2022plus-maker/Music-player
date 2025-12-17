import { createClient } from 'redis';
import { NextResponse } from 'next/server';

const redis = createClient({
  url: process.env.REDIS_URL,
});

redis.on('error', (err) => console.error('Redis Error', err));

await redis.connect();

export const POST = async () => {
  // 测试：先存一个值
  await redis.set('item', 'hello redis');

  // 再取出来
  const result = await redis.get('item');

  return NextResponse.json({ result });
};
