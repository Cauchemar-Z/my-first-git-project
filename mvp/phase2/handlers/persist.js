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
    new winston.transports.File({ filename: 'logs/persist.log' }),
    new winston.transports.Console()
  ]
});

class PersistHandler {
  async process(requestData) {
    const { data } = requestData;
    const { 
      summary, 
      source, 
      url, 
      metadata = {},
      format = 'markdown'
    } = data;
    
    logger.info('Processing persist request', { 
      summaryLength: summary.length, 
      source, 
      format 
    });
    
    try {
      // 生成文件路径
      const filePath = await this.generateFilePath();
      
      // 格式化内容
      const content = await this.formatContent(summary, source, url, metadata, format);
      
      // 保存文件
      await this.saveToFile(filePath, content);
      
      // 更新索引
      await this.updateIndex(filePath, metadata);
      
      logger.info('Content persisted successfully', { filePath });
      
      return {
        file: filePath,
        format: format,
        size_bytes: content.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Persist failed', { error: error.message });
      throw new Error(`Persist failed: ${error.message}`);
    }
  }
  
  async generateFilePath() {
    const today = new Date().toISOString().slice(0, 10);
    const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, '');
    const filename = `${timestamp}-entry.md`;
    
    return path.join('out', 'content', 'daily', today, filename);
  }
  
  async formatContent(summary, source, url, metadata, format) {
    const timestamp = new Date().toISOString();
    
    switch (format) {
      case 'markdown':
        return this.formatMarkdown(summary, source, url, metadata, timestamp);
      case 'json':
        return this.formatJSON(summary, source, url, metadata, timestamp);
      case 'plain':
        return this.formatPlain(summary, source, url, metadata, timestamp);
      default:
        return this.formatMarkdown(summary, source, url, metadata, timestamp);
    }
  }
  
  formatMarkdown(summary, source, url, metadata, timestamp) {
    let content = `# 知识条目\n\n`;
    content += `**时间**: ${timestamp}\n`;
    content += `**来源**: ${source}\n`;
    
    if (url) {
      content += `**链接**: [${url}](${url})\n`;
    }
    
    if (metadata.category) {
      content += `**分类**: ${metadata.category}\n`;
    }
    
    if (metadata.tags && metadata.tags.length > 0) {
      content += `**标签**: ${metadata.tags.map(tag => `#${tag}`).join(' ')}\n`;
    }
    
    if (metadata.importance) {
      content += `**重要性**: ${metadata.importance}\n`;
    }
    
    content += `\n---\n\n`;
    content += `## 摘要\n\n${summary}\n\n`;
    content += `---\n\n`;
    content += `*由 A2B-MVP 系统自动生成*\n`;
    
    return content;
  }
  
  formatJSON(summary, source, url, metadata, timestamp) {
    const entry = {
      timestamp: timestamp,
      source: source,
      url: url,
      summary: summary,
      metadata: metadata,
      format: 'json',
      version: '2.0'
    };
    
    return JSON.stringify(entry, null, 2);
  }
  
  formatPlain(summary, source, url, metadata, timestamp) {
    let content = `知识条目\n`;
    content += `时间: ${timestamp}\n`;
    content += `来源: ${source}\n`;
    
    if (url) {
      content += `链接: ${url}\n`;
    }
    
    if (metadata.category) {
      content += `分类: ${metadata.category}\n`;
    }
    
    if (metadata.tags && metadata.tags.length > 0) {
      content += `标签: ${metadata.tags.join(', ')}\n`;
    }
    
    if (metadata.importance) {
      content += `重要性: ${metadata.importance}\n`;
    }
    
    content += `\n摘要:\n${summary}\n\n`;
    content += `由 A2B-MVP 系统自动生成\n`;
    
    return content;
  }
  
  async saveToFile(filePath, content) {
    try {
      // 确保目录存在
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      
      // 写入文件
      await fs.writeFile(filePath, content, 'utf8');
      
      // 设置文件权限
      await fs.chmod(filePath, 0o640);
    } catch (error) {
      logger.error('Failed to save file', { filePath, error: error.message });
      throw error;
    }
  }
  
  async updateIndex(filePath, metadata) {
    try {
      const indexFile = path.join('out', 'content', 'daily', 'index.json');
      
      // 读取现有索引
      let index = [];
      try {
        const indexContent = await fs.readFile(indexFile, 'utf8');
        index = JSON.parse(indexContent);
      } catch (error) {
        // 索引文件不存在，创建新的
        index = [];
      }
      
      // 添加新条目
      const entry = {
        file: filePath,
        timestamp: new Date().toISOString(),
        metadata: metadata,
        size_bytes: (await fs.stat(filePath)).size
      };
      
      index.push(entry);
      
      // 按时间排序
      index.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // 只保留最近1000条记录
      if (index.length > 1000) {
        index = index.slice(0, 1000);
      }
      
      // 保存索引
      await fs.writeFile(indexFile, JSON.stringify(index, null, 2), 'utf8');
      
      logger.info('Index updated successfully', { 
        totalEntries: index.length,
        newEntry: filePath 
      });
    } catch (error) {
      logger.warn('Failed to update index', { error: error.message });
      // 不抛出错误，因为索引更新失败不应该影响主要功能
    }
  }
  
  async getRecentEntries(limit = 10) {
    try {
      const indexFile = path.join('out', 'content', 'daily', 'index.json');
      const indexContent = await fs.readFile(indexFile, 'utf8');
      const index = JSON.parse(indexContent);
      
      return index.slice(0, limit);
    } catch (error) {
      logger.warn('Failed to get recent entries', { error: error.message });
      return [];
    }
  }
  
  async searchEntries(query, limit = 20) {
    try {
      const indexFile = path.join('out', 'content', 'daily', 'index.json');
      const indexContent = await fs.readFile(indexFile, 'utf8');
      const index = JSON.parse(indexContent);
      
      // 简单的文本搜索
      const results = index.filter(entry => {
        const searchText = JSON.stringify(entry).toLowerCase();
        return searchText.includes(query.toLowerCase());
      });
      
      return results.slice(0, limit);
    } catch (error) {
      logger.warn('Failed to search entries', { error: error.message });
      return [];
    }
  }
}

module.exports = new PersistHandler();