import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

export interface ScrapedArticle {
  title: string;
  summary: string;
  url: string;
  source: string;
  category: string;
  publishedAt?: Date;
}

// 简单爬虫服务
export class SimpleScraperService {
  
  // 爬取Bloomberg市场新闻
  async scrapeBloomberg(): Promise<ScrapedArticle[]> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      
      // 设置User Agent避免被屏蔽
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      );

      console.log('[Scraper] Fetching Bloomberg Markets...');
      
      await page.goto('https://www.bloomberg.com/markets', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // 等待内容加载
      await page.waitForSelector('article', { timeout: 10000 });

      const html = await page.content();
      const $ = cheerio.load(html);
      const articles: ScrapedArticle[] = [];

      // 提取文章
      $('article').each((index, element) => {
        if (index >= 10) return; // 限制数量

        const titleEl = $(element).find('h3, h2, [data-testid="headline"]').first();
        const title = titleEl.text().trim();
        
        const summaryEl = $(element).find('p, [data-testid="summary"]').first();
        const summary = summaryEl.text().trim();

        const linkEl = $(element).find('a').first();
        const href = linkEl.attr('href') || '';
        const url = href.startsWith('http') ? href : `https://www.bloomberg.com${href}`;

        if (title && url) {
          articles.push({
            title,
            summary: summary || title,
            url,
            source: 'Bloomberg',
            category: 'Markets',
            publishedAt: new Date(),
          });
        }
      });

      console.log(`[Scraper] Found ${articles.length} articles from Bloomberg`);
      return articles;

    } catch (error) {
      console.error('[Scraper] Bloomberg error:', error);
      return [];
    } finally {
      await browser.close();
    }
  }

  // 爬取Reuters交易新闻
  async scrapeReuters(): Promise<ScrapedArticle[]> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      );

      console.log('[Scraper] Fetching Reuters Deals...');

      await page.goto('https://www.reuters.com/business/deals/', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      const html = await page.content();
      const $ = cheerio.load(html);
      const articles: ScrapedArticle[] = [];

      $('[data-testid="story-content"]').each((index, element) => {
        if (index >= 8) return;

        const title = $(element).find('[data-testid="Heading"]').text().trim();
        const summary = $(element).find('[data-testid="paragraph-0"]').text().trim();
        const href = $(element).find('a').attr('href') || '';
        const url = href.startsWith('http') ? href : `https://www.reuters.com${href}`;

        if (title) {
          articles.push({
            title,
            summary: summary || title,
            url,
            source: 'Reuters',
            category: 'M&A',
            publishedAt: new Date(),
          });
        }
      });

      console.log(`[Scraper] Found ${articles.length} articles from Reuters`);
      return articles;

    } catch (error) {
      console.error('[Scraper] Reuters error:', error);
      return [];
    } finally {
      await browser.close();
    }
  }

  // 爬取WSJ金融新闻
  async scrapeWSJ(): Promise<ScrapedArticle[]> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      );

      console.log('[Scraper] Fetching WSJ Finance...');

      await page.goto('https://www.wsj.com/finance', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      const html = await page.content();
      const $ = cheerio.load(html);
      const articles: ScrapedArticle[] = [];

      $('.WSJTheme--story').each((index, element) => {
        if (index >= 8) return;

        const title = $(element).find('.WSJTheme--headline').text().trim();
        const summary = $(element).find('.WSJTheme--summary').text().trim();
        const href = $(element).find('.WSJTheme--headline a').attr('href') || '';
        const url = href.startsWith('http') ? href : `https://www.wsj.com${href}`;

        if (title) {
          articles.push({
            title,
            summary: summary || title,
            url,
            source: 'WSJ',
            category: 'Finance',
            publishedAt: new Date(),
          });
        }
      });

      console.log(`[Scraper] Found ${articles.length} articles from WSJ`);
      return articles;

    } catch (error) {
      console.error('[Scraper] WSJ error:', error);
      return [];
    } finally {
      await browser.close();
    }
  }

  // 运行所有爬虫
  async scrapeAll(): Promise<{
    total: number;
    bySource: Record<string, number>;
    articles: ScrapedArticle[];
  }> {
    console.log('[Scraper] Starting full scrape...');
    
    const [bloomberg, reuters, wsj] = await Promise.allSettled([
      this.scrapeBloomberg(),
      this.scrapeReuters(),
      this.scrapeWSJ(),
    ]);

    const articles: ScrapedArticle[] = [];
    const bySource: Record<string, number> = {};

    if (bloomberg.status === 'fulfilled') {
      articles.push(...bloomberg.value);
      bySource['Bloomberg'] = bloomberg.value.length;
    }

    if (reuters.status === 'fulfilled') {
      articles.push(...reuters.value);
      bySource['Reuters'] = reuters.value.length;
    }

    if (wsj.status === 'fulfilled') {
      articles.push(...wsj.value);
      bySource['WSJ'] = wsj.value.length;
    }

    console.log(`[Scraper] Total scraped: ${articles.length} articles`);
    
    return {
      total: articles.length,
      bySource,
      articles,
    };
  }

  // 模拟数据（用于测试，避免实际爬取）
  getMockData(): ScrapedArticle[] {
    return [
      {
        title: 'ECB holds rates at 4.0%, hints at June cut',
        summary: 'Euro falls 0.6% vs USD. Markets price 75bps easing in 2025.',
        url: 'https://example.com/ecb-rates',
        source: 'Bloomberg',
        category: 'Central Bank',
        publishedAt: new Date(),
      },
      {
        title: 'Blackstone acquires renewable developer for $1.4B',
        summary: '10x EBITDA multiple, European solar expansion. Adds 2.1GW pipeline.',
        url: 'https://example.com/blackstone-deal',
        source: 'Reuters',
        category: 'M&A',
        publishedAt: new Date(),
      },
      {
        title: 'US jobless claims rise to 243k, yields dip',
        summary: '10Y Treasury at 4.21% on softening labor data.',
        url: 'https://example.com/jobless-claims',
        source: 'WSJ',
        category: 'Macro',
        publishedAt: new Date(),
      },
    ];
  }
}

// 使用示例
async function example() {
  const scraper = new SimpleScraperService();
  
  // 爬取单个源
  // const bloomberg = await scraper.scrapeBloomberg();
  
  // 爬取所有源
  const all = await scraper.scrapeAll();
  console.log(`Scraped ${all.total} articles`);
  console.log('By source:', all.bySource);
  
  // 或使用模拟数据
  // const mock = scraper.getMockData();
}

export default SimpleScraperService;
