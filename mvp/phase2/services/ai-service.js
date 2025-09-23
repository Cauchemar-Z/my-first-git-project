const winston = require('winston');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// 配置日志
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/ai-service.log' }),
    new winston.transports.Console()
  ]
});

class AIService {
  constructor() {
    this.openai = null;
    this.fallbackEnabled = true;
    this.rateLimitDelay = 1000; // 1秒延迟
    this.lastRequestTime = 0;
  }
  
  async initialize() {
    try {
      // 使用1Password CLI获取API密钥
      const apiKey = await this.getAPIKeyFrom1Password();
      
      if (apiKey) {
        const OpenAI = require('openai');
        this.openai = new OpenAI({
          apiKey: apiKey
        });
        
        logger.info('AI Service initialized with OpenAI API');
        return true;
      } else {
        logger.warn('No API key found, using fallback mode');
        return false;
      }
    } catch (error) {
      logger.error('Failed to initialize AI Service', { error: error.message });
      return false;
    }
  }
  
  async getAPIKeyFrom1Password() {
    try {
      // 从1Password获取OpenAI API密钥
      const { stdout } = await execAsync('op item get "OpenAI API Key" --fields label=api_key --format json');
      const data = JSON.parse(stdout);
      
      if (data && data.api_key) {
        return data.api_key;
      }
    } catch (error) {
      logger.warn('Failed to get API key from 1Password', { error: error.message });
      
      // 尝试从环境变量获取
      if (process.env.OPENAI_API_KEY) {
        return process.env.OPENAI_API_KEY;
      }
    }
    
    return null;
  }
  
  async generateContent(prompt, options = {}) {
    const {
      model = 'gpt-3.5-turbo',
      maxTokens = 1000,
      temperature = 0.7,
      style = 'casual',
      length = 'medium'
    } = options;
    
    // 速率限制
    await this.enforceRateLimit();
    
    try {
      if (this.openai) {
        return await this.generateWithOpenAI(prompt, model, maxTokens, temperature, style, length);
      } else {
        return await this.generateFallback(prompt, style, length);
      }
    } catch (error) {
      logger.error('AI generation failed', { error: error.message });
      
      if (this.fallbackEnabled) {
        logger.info('Using fallback generation');
        return await this.generateFallback(prompt, style, length);
      } else {
        throw error;
      }
    }
  }
  
  async generateWithOpenAI(prompt, model, maxTokens, temperature, style, length) {
    const systemPrompt = this.buildSystemPrompt(style, length);
    
    const response = await this.openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: maxTokens,
      temperature: temperature
    });
    
    return {
      content: response.choices[0].message.content,
      model: model,
      usage: response.usage,
      finish_reason: response.choices[0].finish_reason
    };
  }
  
  async generateFallback(prompt, style, length) {
    // 使用模板和规则生成内容
    const templates = this.getTemplates(style);
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    let content = template.replace('{prompt}', prompt);
    
    // 根据长度调整内容
    content = this.adjustLength(content, length);
    
    return {
      content: content,
      model: 'fallback-template',
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      finish_reason: 'template'
    };
  }
  
  buildSystemPrompt(style, length) {
    const styleMap = {
      'formal': '使用正式、专业的语调，适合商务场合',
      'casual': '使用轻松、友好的语调，适合日常交流',
      'technical': '使用技术性、精确的语言，适合专业领域',
      'creative': '使用富有创意、生动的语言，适合创意写作'
    };
    
    const lengthMap = {
      'short': '保持简洁，控制在200字以内',
      'medium': '保持适中长度，控制在500字左右',
      'long': '可以详细展开，控制在1000字以上'
    };
    
    return `你是一个专业的内容生成助手。${styleMap[style]}。${lengthMap[length]}。请用中文回复。`;
  }
  
  getTemplates(style) {
    const templates = {
      'formal': [
        '基于您的要求"{prompt}"，我为您提供以下内容：\n\n[正式内容]\n\n以上内容仅供参考，如需进一步调整请告知。',
        '针对"{prompt}"这个主题，我建议采用以下方案：\n\n[正式方案]\n\n此方案经过验证，具有较高的可行性。'
      ],
      'casual': [
        '关于"{prompt}"这个话题，我觉得可以这样写：\n\n[轻松内容]\n\n希望这个想法对您有帮助！',
        '"{prompt}"这个主题挺有意思的，我想到了这样的表达：\n\n[轻松表达]\n\n你觉得怎么样？'
      ],
      'technical': [
        '针对"{prompt}"的技术要求，建议采用以下方案：\n\n[技术方案]\n\n此方案经过验证，具有较高的可行性。',
        '关于"{prompt}"的技术实现，我推荐以下方法：\n\n[技术方法]\n\n这种方法在业界有广泛应用。'
      ],
      'creative': [
        '关于"{prompt}"这个创意主题，我想到了这样的表达：\n\n[创意表达]\n\n这个想法很有潜力，值得进一步探索。',
        '"{prompt}"这个主题激发了我的灵感：\n\n[创意灵感]\n\n让我们一起创造更多可能性！'
      ]
    };
    
    return templates[style] || templates['casual'];
  }
  
  adjustLength(content, length) {
    const wordCount = content.split(' ').length;
    
    switch (length) {
      case 'short':
        if (wordCount > 200) {
          return content.substring(0, 200) + '...';
        }
        break;
      case 'long':
        if (wordCount < 500) {
          return content + '\n\n[更多详细内容可以在这里展开...]';
        }
        break;
    }
    
    return content;
  }
  
  async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const delay = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }
  
  async summarizeText(text, options = {}) {
    const {
      maxLength = 200,
      format = 'paragraph'
    } = options;
    
    try {
      if (this.openai) {
        return await this.summarizeWithOpenAI(text, maxLength, format);
      } else {
        return await this.summarizeFallback(text, maxLength, format);
      }
    } catch (error) {
      logger.error('Summarization failed', { error: error.message });
      return await this.summarizeFallback(text, maxLength, format);
    }
  }
  
  async summarizeWithOpenAI(text, maxLength, format) {
    const prompt = `请将以下文本摘要为${maxLength}字以内的${format === 'bullet' ? '要点列表' : '段落'}：\n\n${text}`;
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: Math.min(maxLength * 2, 1000),
      temperature: 0.3
    });
    
    return {
      summary: response.choices[0].message.content,
      model: 'gpt-3.5-turbo',
      original_length: text.length,
      summary_length: response.choices[0].message.content.length
    };
  }
  
  async summarizeFallback(text, maxLength, format) {
    const sentences = text.split(/[。！？]/).filter(s => s.trim().length > 0);
    const targetSentences = Math.max(1, Math.floor(sentences.length * 0.3));
    
    // 简单的句子评分
    const scoredSentences = sentences.map((sentence, index) => ({
      text: sentence,
      score: this.scoreSentence(sentence, index, sentences.length)
    }));
    
    const selectedSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, targetSentences)
      .map(s => s.text);
    
    let summary = selectedSentences.join(' ');
    
    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength) + '...';
    }
    
    return {
      summary: summary,
      model: 'fallback',
      original_length: text.length,
      summary_length: summary.length
    };
  }
  
  scoreSentence(sentence, index, totalSentences) {
    let score = 0;
    
    // 位置权重
    if (index < totalSentences * 0.1 || index > totalSentences * 0.9) {
      score += 2;
    }
    
    // 长度权重
    const wordCount = sentence.split(' ').length;
    if (wordCount > 10 && wordCount < 30) {
      score += 1;
    }
    
    // 关键词权重
    const keywords = ['重要', '关键', '主要', '核心', '重点', '总结', '结论'];
    keywords.forEach(keyword => {
      if (sentence.includes(keyword)) {
        score += 1;
      }
    });
    
    return score;
  }
}

module.exports = new AIService();