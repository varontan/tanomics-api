// 简单测试爬虫 - 使用 CommonJS
const axios = require('axios');
const Parser = require('rss-parser');

const rssParser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
});

async function testScraper() {
  console.log('🧪 测试合规爬虫...\n');
  console.log('⏱️  测试可能需要 10-20 秒...\n');
  
  const results = {
    success: [],
    failed: [],
  };
  
  // 测试 1: Reuters RSS
  console.log('1️⃣ 测试 Reuters RSS...');
  try {
    const response = await axios.get('https://www.reuters.com/rssFeed/business', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/rss+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 10000,
    });
    const feed = await rssParser.parseString(response.data);
    console.log(`   ✅ 成功获取 ${feed.items.length} 条新闻`);
    if (feed.items.length > 0) {
      console.log('   📰', feed.items[0].title.substring(0, 70) + '...');
    }
    results.success.push('Reuters');
  } catch (error) {
    console.log('   ❌ 失败:', error.message);
    results.failed.push('Reuters');
  }
  console.log('');
  
  // 测试 2: CNBC RSS
  console.log('2️⃣ 测试 CNBC RSS...');
  try {
    const feed = await rssParser.parseURL('https://www.cnbc.com/id/10000664/device/rss/rss.html');
    console.log(`   ✅ 成功获取 ${feed.items.length} 条新闻`);
    if (feed.items.length > 0) {
      console.log('   📰', feed.items[0].title.substring(0, 70) + '...');
    }
    results.success.push('CNBC');
  } catch (error) {
    console.log('   ❌ 失败:', error.message);
    results.failed.push('CNBC');
  }
  console.log('');
  
  // 测试 3: MarketWatch RSS
  console.log('3️⃣ 测试 MarketWatch RSS...');
  try {
    const feed = await rssParser.parseURL('https://www.marketwatch.com/rss/topstories');
    console.log(`   ✅ 成功获取 ${feed.items.length} 条新闻`);
    if (feed.items.length > 0) {
      console.log('   📰', feed.items[0].title.substring(0, 70) + '...');
    }
    results.success.push('MarketWatch');
  } catch (error) {
    console.log('   ❌ 失败:', error.message);
    results.failed.push('MarketWatch');
  }
  console.log('');
  
  // 测试 4: BBC Business RSS
  console.log('4️⃣ 测试 BBC Business RSS...');
  try {
    const feed = await rssParser.parseURL('http://feeds.bbci.co.uk/news/business/rss.xml');
    console.log(`   ✅ 成功获取 ${feed.items.length} 条新闻`);
    if (feed.items.length > 0) {
      console.log('   📰', feed.items[0].title.substring(0, 70) + '...');
    }
    results.success.push('BBC Business');
  } catch (error) {
    console.log('   ❌ 失败:', error.message);
    results.failed.push('BBC Business');
  }
  console.log('');
  
  // 测试 5: Yahoo Finance RSS
  console.log('5️⃣ 测试 Yahoo Finance RSS...');
  try {
    const feed = await rssParser.parseURL('https://finance.yahoo.com/news/rssindex');
    console.log(`   ✅ 成功获取 ${feed.items.length} 条新闻`);
    if (feed.items.length > 0) {
      console.log('   📰', feed.items[0].title.substring(0, 70) + '...');
    }
    results.success.push('Yahoo Finance');
  } catch (error) {
    console.log('   ❌ 失败:', error.message);
    results.failed.push('Yahoo Finance');
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ 测试完成!');
  console.log('='.repeat(50));
  console.log(`✅ 成功: ${results.success.length} 个数据源`);
  console.log(`❌ 失败: ${results.failed.length} 个数据源`);
  if (results.success.length > 0) {
    console.log('成功列表:', results.success.join(', '));
  }
  if (results.failed.length > 0) {
    console.log('失败列表:', results.failed.join(', '));
  }
}

testScraper().catch(console.error);
