// DeepSeek API 测试脚本
import OpenAI from 'openai';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

async function testDeepSeek() {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    console.error('❌ 错误: 未设置 DEEPSEEK_API_KEY 环境变量');
    console.log('请确保 .env 文件中包含: DEEPSEEK_API_KEY=sk-xxx');
    process.exit(1);
  }

  console.log('🧪 测试 DeepSeek API 连接...\n');

  try {
    const deepseek = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.deepseek.com/v1',
    });

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello, can you help me with investment banking interview prep?' },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    console.log('✅ DeepSeek API 连接成功!\n');
    console.log('回答:', response.choices[0]?.message?.content);
    console.log('\n模型:', response.model);
    console.log('Tokens 使用:', response.usage?.total_tokens);

  } catch (error: any) {
    console.error('❌ DeepSeek API 连接失败:\n');
    console.error('错误信息:', error.message);

    if (error.message.includes('401')) {
      console.log('\n💡 提示: API Key 无效，请检查:');
      console.log('1. 是否已注册 https://platform.deepseek.com/');
      console.log('2. API Key 是否以 sk- 开头');
      console.log('3. API Key 是否已复制完整');
    }
  }
}

testDeepSeek();
