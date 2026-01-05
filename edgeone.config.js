export default {
  // 环境变量
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    SERVER_URL: process.env.SERVER_URL,
  },

  // 静态文件配置（优先级最低）
  static: {
    directory: 'frontend',
    route: '/',
  },

  // 函数配置（优先级更高）
  functions: {
    // API 路由
    api: {
      handler: 'api/index.js',
      route: '/api',
    },
    // Identity 路由
    identity: {
      handler: 'api/index.js',
      route: '/identity',
    },
  },

  // 构建配置
  build: {
    outDir: '.edgeone',
  },
};
