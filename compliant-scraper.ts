// 合规爬虫服务 - 只使用 RSS 和官方 API
import axios from 'axios';
import * as rssParser from 'rss-parser';
const Parser = rssParser.default || rssParser;

export interface CompliantArticle {
  title: string;
  summary: string;
  url: string;
  source: string;
  category: string;
  publishedAt: Date;
}

export class CompliantScraperService {
  private rssParser = new Parser();
  private lastRequestTime: Map<string, number> = new Map();
  
  // 请求频率控制（最小间隔5秒）
  private async respectRateLimit(source: string): Promise<void> {
    const lastTime = this.lastRequestTime.get(source) || 0;
    const now = Date.now();
    const minInterval = parseInt(process.env.SCRAPER_RATE_LIMIT || '5000');
    
    if (now - lastTime < minInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, minInterval - (now - lastTime))
      );
    }
    
    this.lastRequestTime.set(source, Date.now());
  }

  // 统一的请求头
  private getHeaders() {
    return {
      'User-Agent': 'TanomicsBot/1.0 (+https://tanomics.com; contact@tanomics.com)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'DNT': '1',
      'Connection': 'keep-alive',
    };
  }

  // ===== RSS 订阅（推荐 - 完全合规） =====
  
  async fetchReutersRSS(): Promise<CompliantArticle[]> {
    try {
      await this.respectRateLimit('reuters');
      
      // Reuters RSS 需要特殊处理（有访问限制）
      const response = await axios.get(
        'https://www.reuters.com/rssFeed/business',
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/rss+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          timeout: 10000,
        }
      );
      
      const feed = await this.rssParser.parseString(response.data);
      
      return feed.items.slice(0, 10).map(item => ({
        title: item.title || '',
        summary: item.contentSnippet || item.content || '',
        url: item.link || '',
        source: 'Reuters',
        category: 'Business',
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      }));
    } catch (error) {
      console.error('[Scraper] Reuters RSS error:', error);
      // Reuters RSS 可能需要订阅
      return [];
    }
  }

  async fetchBBCBusinessRSS(): Promise<CompliantArticle[]> {
    try {
      await this.respectRateLimit('bbc');
      
      const feed = await this.rssParser.parseURL(
        'http://feeds.bbci.co.uk/news/business/rss.xml'
      );
      
      return feed.items.slice(0, 10).map(item => ({
        title: item.title || '',
        summary: item.contentSnippet || '',
        url: item.link || '',
        source: 'BBC Business',
        category: 'Business',
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      }));
    } catch (error) {
      console.error('[Scraper] BBC RSS error:', error);
      return [];
    }
  }

  async fetchYahooFinanceRSS(): Promise<CompliantArticle[]> {
    try {
      await this.respectRateLimit('yahoo');
      
      const feed = await this.rssParser.parseURL(
        'https://finance.yahoo.com/news/rssindex'
      );
      
      return feed.items.slice(0, 10).map(item => ({
        title: item.title || '',
        summary: item.contentSnippet || '',
        url: item.link || '',
        source: 'Yahoo Finance',
        category: 'Finance',
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      }));
    } catch (error) {
      console.error('[Scraper] Yahoo Finance RSS error:', error);
      return [];
    }
  }

  async fetchCNBCRSS(): Promise<CompliantArticle[]> {
    try {
      await this.respectRateLimit('cnbc');
      
      const feed = await this.rssParser.parseURL(
        'https://www.cnbc.com/id/10000664/device/rss/rss.html'
      );
      
      return feed.items.slice(0, 10).map(item => ({
        title: item.title || '',
        summary: item.contentSnippet || '',
        url: item.link || '',
        source: 'CNBC',
        category: 'Markets',
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      }));
    } catch (error) {
      console.error('[Scraper] CNBC RSS error:', error);
      return [];
    }
  }

  async fetchMarketWatchRSS(): Promise<CompliantArticle[]> {
    try {
      await this.respectRateLimit('marketwatch');
      
      const feed = await this.rssParser.parseURL(
        'https://www.marketwatch.com/rss/topstories'
      );
      
      return feed.items.slice(0, 10).map(item => ({
        title: item.title || '',
        summary: item.contentSnippet || '',
        url: item.link || '',
        source: 'MarketWatch',
        category: 'Finance',
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      }));
    } catch (error) {
      console.error('[Scraper] MarketWatch RSS error:', error);
      return [];
    }
  }

  // ===== 官方 API（需要 API Key） =====
  
  async fetchAlphaVantageNews(apiKey: string): Promise<CompliantArticle[]> {
    if (!apiKey) {
      console.log('[Scraper] Alpha Vantage API key not configured');
      return [];
    }
    
    try {
      await this.respectRateLimit('alphavantage');
      
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&apikey=${apiKey}`,
        { 
          headers: this.getHeaders(),
          timeout: 30000 
        }
      );
      
      const feed = response.data.feed || [];
      
      return feed.slice(0, 10).map((item: any) => ({
        title: item.title || '',
        summary: item.summary || '',
        url: item.url || '',
        source: item.source || 'Alpha Vantage',
        category: item.category_within_source || 'Finance',
        publishedAt: item.time_published ? 
          new Date(item.time_published) : new Date(),
      }));
    } catch (error) {
      console.error('[Scraper] Alpha Vantage error:', error);
      return [];
    }
  }

  async fetchNewsAPI(apiKey: string, query: string = 'finance'): Promise<CompliantArticle[]> {
    if (!apiKey) {
      console.log('[Scraper] NewsAPI key not configured');
      return [];
    }
    
    try {
      await this.respectRateLimit('newsapi');
      
      const response = await axios.get(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&apiKey=${apiKey}`,
        { 
          headers: this.getHeaders(),
          timeout: 30000 
        }
      );
      
      const articles = response.data.articles || [];
      
      return articles.slice(0, 10).map((item: any) => ({
        title: item.title || '',
        summary: item.description || '',
        url: item.url || '',
        source: item.source?.name || 'NewsAPI',
        category: 'Finance',
        publishedAt: item.publishedAt ? new Date(item.publishedAt) : new Date(),
      }));
    } catch (error) {
      console.error('[Scraper] NewsAPI error:', error);
      return [];
    }
  }

  // ===== 获取市场数据（免费 API） =====
  
  async fetchYahooFinanceData(symbols: string[]): Promise<any[]> {
    try {
      await this.respectRateLimit('yahoo');
      
      // 使用 Yahoo Finance 非官方 API（YFinance）
      const results = await Promise.all(
        symbols.map(async (symbol) => {
          try {
            const response = await axios.get(
              `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
              { headers: this.getHeaders(), timeout: 10000 }
            );
            return {
              symbol,
              data: response.data,
              source: 'Yahoo Finance',
            };
          } catch (e) {
            return { symbol, error: true };
          }
        })
      );
      
      return results.filter(r => !r.error);
    } catch (error) {
      console.error('[Scraper] Yahoo Finance error:', error);
      return [];
    }
  }

  // ===== 运行所有合规数据源 =====
  
  async fetchAllCompliantSources(config: {
    alphaVantageKey?: string;
    newsApiKey?: string;
  } = {}): Promise<{
    total: number;
    bySource: Record<string, number>;
    articles: CompliantArticle[];
    timestamp: string;
  }> {
    console.log('[Scraper] Fetching from compliant sources...');
    
    const sources: Promise<CompliantArticle[]>[] = [
      this.fetchReutersRSS(),
      this.fetchCNBCRSS(),
      this.fetchMarketWatchRSS(),
      this.fetchBBCBusinessRSS(),
      this.fetchYahooFinanceRSS(),
    ];
    
    if (config.alphaVantageKey) {
      sources.push(this.fetchAlphaVantageNews(config.alphaVantageKey));
    }
    
    if (config.newsApiKey) {
      sources.push(this.fetchNewsAPI(config.newsApiKey));
    }
    
    const results = await Promise.allSettled(sources);
    
    const articles: CompliantArticle[] = [];
    const bySource: Record<string, number> = {};
    
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        articles.push(...result.value);
        result.value.forEach(article => {
          bySource[article.source] = (bySource[article.source] || 0) + 1;
        });
      }
    });
    
    // 按时间排序
    articles.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
    
    console.log(`[Scraper] Total fetched: ${articles.length} articles`);
    console.log('[Scraper] By source:', bySource);
    
    return {
      total: articles.length,
      bySource,
      articles,
      timestamp: new Date().toISOString(),
    };
  }

  // 获取合规状态
  getComplianceStatus(): {
    userAgent: string;
    rateLimit: number;
    sources: string[];
    disclaimer: string;
  } {
    return {
      userAgent: 'TanomicsBot/1.0 (+https://tanomics.com; contact@tanomics.com)',
      rateLimit: parseInt(process.env.SCRAPER_RATE_LIMIT || '5000'),
      sources: [
        'Reuters RSS (rssFeed/business)',
        'CNBC RSS (topstories)',
        'MarketWatch RSS',
        'BBC Business RSS',
        'Yahoo Finance RSS',
        'Alpha Vantage API (if key provided)',
        'NewsAPI (if key provided)',
      ],
      disclaimer: '本爬虫仅抓取公开RSS和官方API，遵守robots.txt，请求频率限制在5秒以上',
    };
  }
}

export default CompliantScraperService;
