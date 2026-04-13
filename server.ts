import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { SimpleAIService } from './ai-service';
import { SimpleScraperService } from './scraper-service';
import { CompliantScraperService } from './compliant-scraper';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 初始化服务
const aiService = new SimpleAIService();
const scraperService = new SimpleScraperService();
const compliantScraper = new CompliantScraperService();

// ========== AI 路由 ==========

// 主AI对话端点
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { question, provider, sessionId } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    console.log(`[AI] Question: ${question.substring(0, 50)}...`);
    if (provider) {
      console.log(`[AI] Provider: ${provider}`);
    }

    const response = await aiService.ask(question, provider);

    // 保存到数据库（可选）
    // await saveConversation({ sessionId, question, ...response });

    res.json({
      success: true,
      answer: response.answer,
      provider: response.provider,
      model: response.model,
      sessionId: sessionId || generateSessionId(),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[AI] Error:', error);
    res.status(500).json({
      error: 'AI service error',
      message: (error as Error).message,
    });
  }
});

// 快速回答端点
app.post('/api/ai/quick', async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    console.log(`[AI] Quick answer for: ${topic}`);

    const answer = await aiService.quickAnswer(topic);

    res.json({
      success: true,
      topic,
      answer,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 预设问题列表
app.get('/api/ai/suggestions', (req, res) => {
  res.json({
    suggestions: [
      { id: 1, text: 'Walk me through a DCF', category: 'Technical' },
      { id: 2, text: 'Explain LBO returns', category: 'Technical' },
      { id: 3, text: 'How to calculate WACC', category: 'Technical' },
      { id: 4, text: 'Why investment banking?', category: 'Behavioral' },
      { id: 5, text: 'Current M&A market trends', category: 'Markets' },
    ],
  });
});

// ========== 爬虫路由 ==========

// 运行所有爬虫
app.post('/api/scraper/run', async (req, res) => {
  try {
    console.log('[Scraper] Starting scrape job...');

    const result = await scraperService.scrapeAll();

    // 保存到数据库（可选）
    // for (const article of result.articles) {
    //   await saveArticle(article);
    // }

    res.json({
      success: true,
      total: result.total,
      bySource: result.bySource,
      articles: result.articles,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Scraper] Error:', error);
    res.status(500).json({
      error: 'Scraper error',
      message: (error as Error).message,
    });
  }
});

// 爬取单个源
app.post('/api/scraper/:source', async (req, res) => {
  try {
    const { source } = req.params;
    console.log(`[Scraper] Scraping ${source}...`);

    let articles;
    switch (source.toLowerCase()) {
      case 'bloomberg':
        articles = await scraperService.scrapeBloomberg();
        break;
      case 'reuters':
        articles = await scraperService.scrapeReuters();
        break;
      case 'wsj':
        articles = await scraperService.scrapeWSJ();
        break;
      default:
        return res.status(400).json({ error: 'Unknown source' });
    }

    res.json({
      success: true,
      source,
      count: articles.length,
      articles,
    });

  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 获取模拟数据（用于测试）
app.get('/api/scraper/mock', (req, res) => {
  const mockData = scraperService.getMockData();
  res.json({
    success: true,
    count: mockData.length,
    articles: mockData,
  });
});

// ========== Feed API ==========

// 获取市场动态
app.get('/api/feeds', async (req, res) => {
  // 从数据库获取或使用爬虫
  // const feeds = await prisma.marketFeed.findMany({ orderBy: { publishedAt: 'desc' } });
  
  // 临时使用模拟数据
  const mockData = scraperService.getMockData();
  
  res.json({
    success: true,
    count: mockData.length,
    feeds: mockData,
  });
});

// ========== 健康检查 ==========

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      ai: !!process.env.OPENAI_API_KEY,
      scraper: true,
    },
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    name: 'Tanomics API',
    version: '1.0.0',
    endpoints: {
      ai: {
        'POST /api/ai/chat': 'AI对话',
        'POST /api/ai/quick': '快速回答',
        'GET /api/ai/suggestions': '建议问题',
      },
      scraper: {
        'POST /api/scraper/run': '运行所有爬虫',
        'POST /api/scraper/:source': '运行单个爬虫',
        'GET /api/scraper/mock': '获取模拟数据',
      },
      feeds: {
        'GET /api/feeds': '获取市场动态',
      },
    },
  });
});

// 工具函数
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 启动服务器
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 Tanomics API Server Running');
  console.log('');
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
  console.log('');
  console.log('AI Providers:');
  console.log(`  OpenAI:  ${process.env.OPENAI_API_KEY ? '✅' : '❌'}`);
  console.log(`  DeepSeek: ${process.env.DEEPSEEK_API_KEY ? '✅' : '❌'}`);
  console.log('');
  console.log('AI Endpoints:');
  console.log(`  POST http://localhost:${PORT}/api/ai/chat`);
  console.log(`  POST http://localhost:${PORT}/api/ai/quick`);
  console.log('');
  console.log('Scraper Endpoints:');
  console.log(`  POST http://localhost:${PORT}/api/scraper/run`);
  console.log(`  GET  http://localhost:${PORT}/api/scraper/mock`);
  console.log(`  GET  http://localhost:${PORT}/api/scraper/compliance (合规状态)`);
  console.log(`  GET  http://localhost:${PORT}/api/scraper/compliant (合规抓取)`);
  console.log(`  GET  http://localhost:${PORT}/api/scraper/rss (RSS订阅)`);
  console.log('');
  console.log('Feed Endpoints:');
  console.log(`  GET  http://localhost:${PORT}/api/feeds`);
  console.log('');
});

export default app;
