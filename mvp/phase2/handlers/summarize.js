const natural = require('natural');
const cheerio = require('cheerio');
const winston = require('winston');

// 配置日志
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/summarize.log' }),
    new winston.transports.Console()
  ]
});

class SummarizeHandler {
  async process(requestData) {
    const { data } = requestData;
    const { 
      text, 
      url, 
      format = 'bullet', 
      length = 'medium', 
      language = 'auto',
      extract_keywords = true,
      extract_entities = true
    } = data;
    
    logger.info('Processing summarize request', { 
      textLength: text.length, 
      url, 
      format, 
      length 
    });
    
    try {
      // 处理文本
      let processedText = text;
      if (url) {
        processedText = await this.extractTextFromUrl(url);
      }
      
      // 生成摘要
      const summary = await this.generateSummary(processedText, format, length);
      
      // 提取关键词
      const keywords = extract_keywords ? await this.extractKeywords(processedText) : [];
      
      // 提取实体
      const entities = extract_entities ? await this.extractEntities(processedText) : [];
      
      const result = {
        summary: summary,
        keywords: keywords,
        entities: entities,
        word_count: processedText.split(' ').length,
        summary_word_count: summary.split(' ').length,
        compression_ratio: summary.split(' ').length / processedText.split(' ').length
      };
      
      logger.info('Summarize completed successfully', { 
        originalWords: result.word_count,
        summaryWords: result.summary_word_count,
        compressionRatio: result.compression_ratio.toFixed(2)
      });
      
      return result;
    } catch (error) {
      logger.error('Summarize failed', { error: error.message });
      throw new Error(`Summarize failed: ${error.message}`);
    }
  }
  
  async extractTextFromUrl(url) {
    try {
      const axios = require('axios');
      const response = await axios.get(url, { timeout: 10000 });
      const $ = cheerio.load(response.data);
      
      // 移除脚本和样式标签
      $('script, style').remove();
      
      // 提取文本内容
      const text = $('body').text().replace(/\s+/g, ' ').trim();
      
      return text;
    } catch (error) {
      logger.warn('Failed to extract text from URL', { url, error: error.message });
      return `无法从URL提取内容: ${url}`;
    }
  }
  
  async generateSummary(text, format, length) {
    const sentences = this.splitIntoSentences(text);
    const wordCount = text.split(' ').length;
    
    // 根据长度确定摘要比例
    const summaryRatio = this.getSummaryRatio(length);
    const targetSentences = Math.max(1, Math.floor(sentences.length * summaryRatio));
    
    // 简单的句子评分算法
    const scoredSentences = sentences.map((sentence, index) => ({
      text: sentence,
      score: this.scoreSentence(sentence, index, sentences.length)
    }));
    
    // 选择高分句子
    const selectedSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, targetSentences)
      .sort((a, b) => a.index - b.index)
      .map(s => s.text);
    
    // 格式化输出
    return this.formatSummary(selectedSentences, format);
  }
  
  splitIntoSentences(text) {
    return text.split(/[。！？.!?]/)
      .map(s => s.trim())
      .filter(s => s.length > 10);
  }
  
  getSummaryRatio(length) {
    const ratioMap = {
      'brief': 0.2,
      'medium': 0.3,
      'detailed': 0.5
    };
    return ratioMap[length] || 0.3;
  }
  
  scoreSentence(sentence, index, totalSentences) {
    let score = 0;
    
    // 位置权重（开头和结尾的句子更重要）
    if (index < totalSentences * 0.1 || index > totalSentences * 0.9) {
      score += 2;
    }
    
    // 长度权重（中等长度的句子更好）
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
  
  formatSummary(sentences, format) {
    switch (format) {
      case 'bullet':
        return sentences.map(s => `• ${s}`).join('\n');
      case 'paragraph':
        return sentences.join(' ');
      case 'outline':
        return sentences.map((s, i) => `${i + 1}. ${s}`).join('\n');
      default:
        return sentences.join(' ');
    }
  }
  
  async extractKeywords(text) {
    try {
      // 使用自然语言处理提取关键词
      const words = text.toLowerCase()
        .replace(/[^\u4e00-\u9fa5a-zA-Z\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 1);
      
      // 简单的词频统计
      const wordFreq = {};
      words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      });
      
      // 返回高频词
      return Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word, freq]) => ({ word, frequency: freq }));
    } catch (error) {
      logger.warn('Failed to extract keywords', { error: error.message });
      return [];
    }
  }
  
  async extractEntities(text) {
    try {
      // 简单的实体提取（人名、地名、机构名等）
      const entities = [];
      
      // 提取可能的实体（这里使用简单的正则表达式）
      const patterns = {
        'PERSON': /[A-Z][a-z]+ [A-Z][a-z]+/g,
        'ORG': /[A-Z][a-z]+ (公司|集团|机构|组织)/g,
        'LOCATION': /[A-Z][a-z]+ (市|省|国|州)/g
      };
      
      Object.entries(patterns).forEach(([type, pattern]) => {
        const matches = text.match(pattern);
        if (matches) {
          matches.forEach(match => {
            entities.push({
              text: match,
              type: type,
              confidence: 0.7
            });
          });
        }
      });
      
      return entities;
    } catch (error) {
      logger.warn('Failed to extract entities', { error: error.message });
      return [];
    }
  }
}

module.exports = new SummarizeHandler();