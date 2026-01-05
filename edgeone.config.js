export default {
  // 环境变量
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    SERVER_URL: process.env.SERVER_URL,
  },

  // 函数配置
  functions: {
    api: {
      handler: 'api/index.js',
      route: '/api/*',
    },
    identity: {
      handler: 'api/index.js',
      route: '/identity/*',
    },
  },

  // 静态文件配置
  static: {
    directory: 'frontend',
    route: '/',
  },

  // 构建配置
  build: {
    outDir: '.edgeone',
  },
};
