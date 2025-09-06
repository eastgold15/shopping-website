import { EnvLoader } from '@shopping/utils';

// 在应用启动时加载环境变量
EnvLoader.loadByEnv();

import { env } from '@shopping/core';
import { createServer } from 'http';

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    message: 'Shopping Backend API',
    environment: env.NODE_ENV,
    port: env.PORT,
    timestamp: new Date().toISOString(),
  }));
});

server.listen(env.PORT, () => {
  console.log(`🚀 Server running on port ${env.PORT}`);
  console.log(`📊 Environment: ${env.NODE_ENV}`);
  console.log(`🔗 Frontend URL: ${env.FRONTEND_URL}`);
});