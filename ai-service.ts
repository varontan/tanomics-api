import OpenAI from 'openai';

// 简单AI服务 - 支持 OpenAI 和 DeepSeek
export class SimpleAIService {
  private openai: OpenAI | null = null;
  private deepseek: OpenAI | null = null;
  private provider: 'openai' | 'deepseek';

  constructor(preferredProvider: 'openai' | 'deepseek' = 'openai') {
    this.provider = preferredProvider;

    // 初始化 OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    // 初始化 DeepSeek (使用 OpenAI SDK，因为 DeepSeek API 兼容 OpenAI 格式)
    if (process.env.DEEPSEEK_API_KEY) {
      this.deepseek = new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com/v1', // DeepSeek API 端点
      });
    }
  }

  async ask(question: string, forceProvider?: 'openai' | 'deepseek'): Promise<{
    answer: string;
    provider: string;
    model: string;
  }> {
    const provider = forceProvider || this.provider;
    
    const systemPrompt = `You are Tanomics AI, an expert investment banking interview coach.

Your expertise includes:
- Investment banking technical questions (DCF, LBO, M&A, valuation)
- Behavioral interview preparation  
- Market analysis and macro trends
- Deal structures and transaction types

Guidelines:
1. Provide structured, interview-ready answers
2. Include frameworks and methodologies
3. Keep responses concise but comprehensive
4. For technical questions, show step-by-step approaches

Current date: ${new Date().toISOString().split('T')[0]}`;

    if (provider === 'deepseek' && this.deepseek) {
      // 使用 DeepSeek
      const response = await this.deepseek.chat.completions.create({
        model: 'deepseek-chat', // DeepSeek V3 模型
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      return {
        answer: response.choices[0]?.message?.content || 'No response',
        provider: 'deepseek',
        model: response.model || 'deepseek-chat',
      };
    } else if (this.openai) {
      // 使用 OpenAI
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      return {
        answer: response.choices[0]?.message?.content || 'No response',
        provider: 'openai',
        model: response.model,
      };
    } else {
      throw new Error('No AI provider configured. Please set OPENAI_API_KEY or DEEPSEEK_API_KEY');
    }
  }

  // 快速回答常见问题
  async quickAnswer(topic: string): Promise<string> {
    const quickResponses: Record<string, string> = {
      'dcf': `📘 DCF Analysis Framework:

1. Project Unlevered FCF (5-10 years)
   - Revenue growth, margins, working capital, CapEx

2. Calculate WACC
   - Cost of Equity: Risk-free rate + Beta × Market risk premium
   - Cost of Debt: Yield × (1 - Tax rate)
   - WACC = (E/V × Re) + (D/V × Rd × (1-T))

3. Calculate Terminal Value
   - Gordon Growth: FCF × (1+g) / (WACC - g)
   - Exit Multiple: EBITDA × Multiple

4. Discount to Present Value
   - Use mid-year convention
   - Sum PV of explicit period + terminal value

Key Interview Tip: Always mention sensitivity analysis!`,

      'lbo': `💰 LBO Returns Framework:

1. Entry Assumptions
   - Purchase price / EBITDA multiple
   - Debt financing mix (senior, subordinated)
   - Equity contribution (~20-40%)

2. Cash Flow Projection
   - Revenue growth, EBITDA margins
   - Less: Interest expense, taxes
   - Less: CapEx, working capital
   = Free Cash Flow available for debt paydown

3. Exit Assumptions (Year 5)
   - Exit multiple (usually = entry multiple)
   - Calculate enterprise value

4. Returns Calculation
   - Money-on-money multiple: Exit Equity / Entry Equity
   - IRR: Based on hold period

Key Drivers: Entry/exit multiples, leverage, debt paydown, revenue growth`,

      'wacc': `📊 WACC Formula & Components:

WACC = (E/V × Re) + (D/V × Rd × (1-T))

Where:
• E = Market value of equity
• D = Market value of debt  
• V = E + D (Total value)
• Re = Cost of equity (CAPM)
• Rd = Cost of debt
• T = Tax rate

Cost of Equity (CAPM):
Re = Rf + β × (Rm - Rf)
• Rf = Risk-free rate (10-year Treasury)
• β = Beta (systematic risk)
• (Rm - Rf) = Equity risk premium (~5-6%)

Cost of Debt:
Rd = Average interest rate on debt
After-tax: Rd × (1 - T)

Interview Tip: WACC is used for unlevered FCF valuation. Cost of equity is used for levered FCF/ equity value.`,

      'why banking': `💼 Answering "Why Investment Banking?":

Structure your answer around 3 pillars:

1. Intellectual Curiosity
   - "I'm fascinated by how capital markets allocate resources"
   - "I enjoy analyzing businesses and industries"
   - Mention specific deal or market event that sparked interest

2. Transaction Impact
   - "I want to work on deals that shape industries"
   - "Helping companies grow, merge, or restructure is meaningful"
   - Reference a specific deal the bank worked on

3. Professional Development
   - "The apprenticeship model accelerates learning"
   - "Exposure to C-suite clients and complex situations"
   - "Building analytical and interpersonal skills"

Avoid: Money, prestige, "exit opportunities"
Emphasize: Learning, impact, long-term career fit

Sample: "I've always been fascinated by how M&A shapes industries. When I read about [Bank's] work on [Deal], I realized investment banking combines my love of analysis with tangible business impact. I'm excited about the learning curve and working with experienced professionals who can mentor me."`,
    };

    const key = Object.keys(quickResponses).find(k => 
      topic.toLowerCase().includes(k.toLowerCase())
    );

    if (key) {
      return quickResponses[key];
    }

    // 如果没有预设答案，调用API
    const response = await this.ask(topic);
    return response.answer;
  }
}

// 使用示例
async function example() {
  const ai = new SimpleAIService();
  
  // 通用提问
  const response = await ai.ask('How do you calculate enterprise value?');
  console.log(response.answer);
  
  // 快速回答
  const dcf = await ai.quickAnswer('dcf');
  console.log(dcf);
}

export default SimpleAIService;
