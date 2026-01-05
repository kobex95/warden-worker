import { handler as mainHandler } from './index.js';

// 专门处理 /api/* 路由
export async function handler(request, context) {
  const url = new URL(request.url);
  const path = url.pathname;

  console.log('API Handler called:', path);

  // 将请求传递给主处理器
  return mainHandler(request, context);
}
