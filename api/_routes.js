// 路由映射 - 将所有 API 和 identity 请求路由到主处理器
export const routes = {
  '/api/*': 'index.js',
  '/identity/*': 'index.js',
};
