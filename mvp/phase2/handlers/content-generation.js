const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');
const winston = require('winston');

// 配置日志
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/content-generation.log' }),
    new winston.transports.Console()
  ]
});

// 初始化OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
});

class ContentGenerationHandler {
  async process(requestData) {
    const { data } = requestData;
    const { prompt, style = 'casual', length = 'medium', language = 'auto' } = data;
    
    logger.info('Processing content generation request', { 
      prompt: prompt.substring(0, 100), 
      style, 
      length, 
      language 
    });
    
    try {
      // 生成内容
      const content = await this.generateContent(prompt, style, length, language);
      
      // 保存文件
      const filePath = await this.saveContent(content, prompt);
      
      // 发送通知
      await this.sendNotification('内容生成完成', filePath);
      
      const result = {
        file: filePath,
        content: content,
        word_count: content.split(' ').length,
        quality_score: await this.assessQuality(content),
        generation_time_ms: Date.now() - new Date(requestData.timestamp).getTime()
      };
      
      logger.info('Content generation completed successfully', { 
        filePath, 
        wordCount: result.word_count,
        qualityScore: result.quality_score 
      });
      
      return result;
    } catch (error) {
      logger.error('Content generation failed', { error: error.message });
      throw new Error(`Content generation failed: ${error.message}`);
    }
  }
  
  async generateContent(prompt, style, length, language) {
    const systemPrompt = this.buildSystemPrompt(style, length, language);
    
    try {
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: this.getMaxTokens(length),
        temperature: 0.7
      });
      
      return response.choices[0].message.content;
    } catch (error) {
      // 如果API调用失败，使用模板生成
      logger.warn('OpenAI API failed, using template fallback', { error: error.message });
      return this.generateTemplateContent(prompt, style, length);
    }
  }
  
  buildSystemPrompt(style, length, language) {
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
  
  getMaxTokens(length) {
    const tokenMap = {
      'short': 500,
      'medium': 1000,
      'long': 2000
    };
    return tokenMap[length];
  }
  
  generateTemplateContent(prompt, style, length) {
    // 模板生成作为fallback
    const templates = {
      'formal': `基于您的要求"${prompt}"，我为您提供以下内容：\n\n[正式内容模板]\n\n以上内容仅供参考，如需进一步调整请告知。`,
      'casual': `关于"${prompt}"这个话题，我觉得可以这样写：\n\n[轻松内容模板]\n\n希望这个想法对您有帮助！`,
      'technical': `针对"${prompt}"的技术要求，建议采用以下方案：\n\n[技术内容模板]\n\n此方案经过验证，具有较高的可行性。`,
      'creative': `关于"${prompt}"这个创意主题，我想到了这样的表达：\n\n[创意内容模板]\n\n这个想法很有潜力，值得进一步探索。`
    };
    
    return templates[style] || templates['casual'];
  }
  
  async saveContent(content, prompt) {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '');
    const filename = `${timestamp}-${prompt.slice(0, 20).replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')}.md`;
    const filePath = path.join('out', 'content', new Date().toISOString().slice(0, 10), filename);
    
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf8');
    
    return filePath;
  }
  
  async assessQuality(content) {
    // 简单的质量评估算法
    const wordCount = content.split(' ').length;
    const sentenceCount = content.split(/[。！？]/).length;
    const avgWordsPerSentence = wordCount / sentenceCount;
    
    // 基于句子长度和词汇丰富度的评分
    let score = 5;
    if (avgWordsPerSentence > 10 && avgWordsPerSentence < 25) score += 2;
    if (wordCount > 100) score += 1;
    if (content.includes('。') || content.includes('！') || content.includes('？')) score += 1;
    if (content.length > 200) score += 1;
    
    return Math.min(10, score);
  }
  
  async sendNotification(message, filePath) {
    try {
      // 发送系统通知
      const { exec } = require('child_process');
      exec(`osascript -e 'display notification "${message}: ${filePath}" with title "A2B-MVP"'`);
    } catch (error) {
      logger.warn('Failed to send notification', { error: error.message });
    }
  }
}

module.exports = new ContentGenerationHandler();