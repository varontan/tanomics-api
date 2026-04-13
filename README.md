# Tanomics API - 快速启动

立即可用的AI对话和爬虫API服务。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，添加你的 OpenAI API Key
```

**.env 文件内容：**
```env
OPENAI_API_KEY=sk-your-openai-key-here
PORT=3001
NODE_ENV=development
```

### 3. 启动服务器

```bash
npm run dev
```

服务器将在 http://localhost:3001 启动

---

## API 使用

### AI 对话

```bash
# 通用提问
curl -X POST http://localhost:3001/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "Walk me through a DCF"}'

# 快速回答预设问题
curl -X POST http://localhost:3001/api/ai/quick \
  -H "Content-Type: application/json" \
  -d '{"topic": "dcf"}'
```

### 爬虫

```bash
# 运行所有爬虫
curl -X POST http://localhost:3001/api/scraper/run

# 获取模拟数据（无需实际爬取）
curl http://localhost:3001/api/scraper/mock
```

### Feed

```bash
# 获取市场动态
curl http://localhost:3001/api/feeds
```

---

## 文件结构

```
.
├── server.ts           # 主服务器
├── ai-service.ts       # AI服务
├── scraper-service.ts  # 爬虫服务
├── package.json
└── README.md
```

---

## 部署

### Railway (推荐)

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录和部署
railway login
railway init
railway up
```

### Render

1. 推送代码到 GitHub
2. 在 Render 创建 Web Service
3. 设置 Build Command: `npm install && npm run build`
4. 设置 Start Command: `npm start`
5. 添加环境变量

---

## 下一步

查看完整实现文档：
- `AI_AND_SCRAPER_IMPLEMENTATION.md` - 完整架构和高级功能
