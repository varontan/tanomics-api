// 快速测试合规爬虫
import { CompliantScraperService } from './compliant-scraper';

async function testScraper() {
  console.log('🧪 测试合规爬虫...\n');
  
  const scraper = new CompliantScraperService();
  
  // 测试 1: 合规状态
  console.log('1️⃣ 合规状态:');
  const status = scraper.getComplianceStatus();
  console.log('User-Agent:', status.userAgent);
  console.log('Rate Limit:', status.rateLimit + 'ms');
  console.log('Sources:', status.sources.length);
  console.log('Disclaimer:', status.disclaimer);
  console.log('');
  
  // 测试 2: Reuters RSS
  console.log('2️⃣ 测试 Reuters RSS...');
  try {
    const reuters = await scraper.fetchReutersRSS();
    console.log(`✅ 成功获取 ${reuters.length} 条 Reuters 新闻`);
    if (reuters.length > 0) {
      console.log('   示例:', reuters[0].title.substring(0, 60) + '...');
    }
  } catch (error) {
    console.log('❌ Reuters RSS 失败:', (error as Error).message);
  }
  console.log('');
  
  // 测试 3: CNBC RSS
  console.log('3️⃣ 测试 CNBC RSS...');
  try {
    const cnbc = await scraper.fetchCNBCRSS();
    console.log(`✅ 成功获取 ${cnbc.length} 条 CNBC 新闻`);
    if (cnbc.length > 0) {
      console.log('   示例:', cnbc[0].title.substring(0, 60) + '...');
    }
  } catch (error) {
    console.log('❌ CNBC RSS 失败:', (error as Error).message);
  }
  console.log('');
  
  // 测试 4: MarketWatch RSS
  console.log('4️⃣ 测试 MarketWatch RSS...');
  try {
    const mw = await scraper.fetchMarketWatchRSS();
    console.log(`✅ 成功获取 ${mw.length} 条 MarketWatch 新闻`);
    if (mw.length > 0) {
      console.log('   示例:', mw[0].title.substring(0, 60) + '...');
    }
  } catch (error) {
    console.log('❌ MarketWatch RSS 失败:', (error as Error).message);
  }
  console.log('');
  
  // 测试 5: 获取所有合规源
  console.log('5️⃣ 测试获取所有合规源（不带API Key）...');
  try {
    const all = await scraper.fetchAllCompliantSources();
    console.log(`✅ 总计获取 ${all.total} 条新闻`);
    console.log('   来源分布:', all.bySource);
    console.log('   时间戳:', all.timestamp);
  } catch (error) {
    console.log('❌ 失败:', (error as Error).message);
  }
  
  console.log('\n✨ 测试完成!');
}

testScraper().catch(console.error);
