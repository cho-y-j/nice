import { FastifyInstance } from 'fastify';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

export async function guidePageRoutes(app: FastifyInstance) {
  app.get('/guide', { schema: { hide: true } }, async (request, reply) => {
    // Read the markdown file
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const mdPath = join(__dirname, '../../docs/USAGE_GUIDE.md');
    let markdown = '';
    try {
      markdown = readFileSync(mdPath, 'utf-8');
    } catch {
      markdown = '# 문서를 찾을 수 없습니다\n\n`docs/USAGE_GUIDE.md` 파일이 없습니다.';
    }

    // Escape for embedding in HTML
    const escaped = markdown
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return reply
      .header('Content-Type', 'text/html; charset=utf-8')
      .header('Content-Security-Policy', "default-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data:; font-src 'self' https://cdn.jsdelivr.net;")
      .send(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NicePay Gateway - 사용 가이드</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5/github-markdown-light.min.css">
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f6f8fa;
    }
    .header {
      background: #24292f;
      color: white;
      padding: 16px 32px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .header h1 {
      font-size: 18px;
      margin: 0;
      font-weight: 600;
    }
    .header nav a {
      color: #8b949e;
      text-decoration: none;
      font-size: 14px;
      margin-left: 16px;
    }
    .header nav a:hover { color: white; }
    .markdown-body {
      max-width: 980px;
      margin: 32px auto;
      padding: 32px 48px;
      background: white;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      font-size: 15px;
      line-height: 1.7;
    }
    .markdown-body pre {
      background: #1e1e1e !important;
      color: #d4d4d4 !important;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 13px;
      line-height: 1.5;
    }
    .markdown-body code {
      font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
      font-size: 13px;
    }
    .markdown-body table {
      width: 100%;
    }
    .markdown-body h2 {
      margin-top: 48px;
      padding-bottom: 8px;
      border-bottom: 1px solid #d0d7de;
    }
    @media (max-width: 768px) {
      .markdown-body { margin: 0; padding: 16px; border: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>NicePay Gateway</h1>
    <nav>
      <a href="/test">테스트 결제</a>
      <a href="/docs">API 문서</a>
      <a href="/health">상태 확인</a>
    </nav>
  </div>
  <div id="content" class="markdown-body"></div>

  <script src="https://cdn.jsdelivr.net/npm/marked@14/marked.min.js"></script>
  <script>
    var md = decodeURIComponent("${encodeURIComponent(markdown)}");
    document.getElementById('content').innerHTML = marked.parse(md);
  </script>
</body>
</html>`);
  });
}
