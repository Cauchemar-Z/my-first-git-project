const fs = require('fs').promises;
const path = require('path');
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
    new winston.transports.File({ filename: 'logs/storage-service.log' }),
    new winston.transports.Console()
  ]
});

class StorageService {
  constructor() {
    this.dataDir = 'data';
    this.backupDir = 'backups';
    this.indexFile = path.join(this.dataDir, 'index.json');
    this.backupEnabled = true;
  }
  
  async initialize() {
    try {
      // 创建必要目录
      await fs.mkdir(this.dataDir, { recursive: true });
      await fs.mkdir(this.backupDir, { recursive: true });
      
      // 初始化索引
      await this.initializeIndex();
      
      // 检查Git状态
      await this.checkGitStatus();
      
      logger.info('Storage Service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Storage Service', { error: error.message });
      return false;
    }
  }
  
  async initializeIndex() {
    try {
      await fs.access(this.indexFile);
    } catch (error) {
      // 索引文件不存在，创建新的
      const initialIndex = {
        version: '2.0',
        created: new Date().toISOString(),
        entries: [],
        metadata: {
          total_entries: 0,
          total_size_bytes: 0,
          last_updated: new Date().toISOString()
        }
      };
      
      await fs.writeFile(this.indexFile, JSON.stringify(initialIndex, null, 2), 'utf8');
      logger.info('Index file created');
    }
  }
  
  async checkGitStatus() {
    try {
      const { stdout } = await execAsync('git status --porcelain');
      if (stdout.trim()) {
        logger.info('Git repository has uncommitted changes');
        return true;
      }
      return false;
    } catch (error) {
      logger.warn('Git status check failed', { error: error.message });
      return false;
    }
  }
  
  async saveContent(content, metadata = {}) {
    try {
      const id = this.generateId();
      const timestamp = new Date().toISOString();
      const filename = `${id}.json`;
      const filePath = path.join(this.dataDir, filename);
      
      const entry = {
        id: id,
        timestamp: timestamp,
        content: content,
        metadata: {
          ...metadata,
          size_bytes: JSON.stringify(content).length,
          format: 'json'
        }
      };
      
      // 保存文件
      await fs.writeFile(filePath, JSON.stringify(entry, null, 2), 'utf8');
      
      // 更新索引
      await this.updateIndex(entry);
      
      // 自动备份
      if (this.backupEnabled) {
        await this.createBackup(entry);
      }
      
      logger.info('Content saved successfully', { id, filePath });
      
      return {
        id: id,
        file: filePath,
        size_bytes: entry.metadata.size_bytes,
        timestamp: timestamp
      };
    } catch (error) {
      logger.error('Failed to save content', { error: error.message });
      throw error;
    }
  }
  
  async loadContent(id) {
    try {
      const filename = `${id}.json`;
      const filePath = path.join(this.dataDir, filename);
      
      const content = await fs.readFile(filePath, 'utf8');
      const entry = JSON.parse(content);
      
      logger.info('Content loaded successfully', { id });
      
      return entry;
    } catch (error) {
      logger.error('Failed to load content', { id, error: error.message });
      throw error;
    }
  }
  
  async updateIndex(entry) {
    try {
      const indexContent = await fs.readFile(this.indexFile, 'utf8');
      const index = JSON.parse(indexContent);
      
      // 添加新条目
      index.entries.push({
        id: entry.id,
        timestamp: entry.timestamp,
        metadata: entry.metadata
      });
      
      // 更新统计信息
      index.metadata.total_entries = index.entries.length;
      index.metadata.total_size_bytes += entry.metadata.size_bytes;
      index.metadata.last_updated = new Date().toISOString();
      
      // 按时间排序
      index.entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // 只保留最近1000条记录
      if (index.entries.length > 1000) {
        const removedEntries = index.entries.splice(1000);
        await this.cleanupOldEntries(removedEntries);
      }
      
      // 保存索引
      await fs.writeFile(this.indexFile, JSON.stringify(index, null, 2), 'utf8');
      
      logger.info('Index updated successfully', { 
        totalEntries: index.metadata.total_entries,
        totalSize: index.metadata.total_size_bytes 
      });
    } catch (error) {
      logger.error('Failed to update index', { error: error.message });
      throw error;
    }
  }
  
  async cleanupOldEntries(entries) {
    try {
      for (const entry of entries) {
        const filename = `${entry.id}.json`;
        const filePath = path.join(this.dataDir, filename);
        
        try {
          await fs.unlink(filePath);
          logger.info('Old entry cleaned up', { id: entry.id });
        } catch (error) {
          logger.warn('Failed to cleanup old entry', { id: entry.id, error: error.message });
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup old entries', { error: error.message });
    }
  }
  
  async createBackup(entry) {
    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      const backupDir = path.join(this.backupDir, timestamp);
      await fs.mkdir(backupDir, { recursive: true });
      
      const filename = `${entry.id}.json`;
      const sourcePath = path.join(this.dataDir, filename);
      const backupPath = path.join(backupDir, filename);
      
      await fs.copyFile(sourcePath, backupPath);
      
      logger.info('Backup created successfully', { 
        id: entry.id, 
        backupPath 
      });
    } catch (error) {
      logger.warn('Failed to create backup', { 
        id: entry.id, 
        error: error.message 
      });
    }
  }
  
  async searchContent(query, limit = 20) {
    try {
      const indexContent = await fs.readFile(this.indexFile, 'utf8');
      const index = JSON.parse(indexContent);
      
      const results = [];
      
      for (const entry of index.entries.slice(0, limit)) {
        try {
          const content = await this.loadContent(entry.id);
          const searchText = JSON.stringify(content).toLowerCase();
          
          if (searchText.includes(query.toLowerCase())) {
            results.push({
              id: entry.id,
              timestamp: entry.timestamp,
              metadata: entry.metadata,
              relevance_score: this.calculateRelevanceScore(content, query)
            });
          }
        } catch (error) {
          logger.warn('Failed to load entry for search', { 
            id: entry.id, 
            error: error.message 
          });
        }
      }
      
      // 按相关性排序
      results.sort((a, b) => b.relevance_score - a.relevance_score);
      
      logger.info('Search completed', { 
        query, 
        resultsCount: results.length 
      });
      
      return results;
    } catch (error) {
      logger.error('Search failed', { query, error: error.message });
      return [];
    }
  }
  
  calculateRelevanceScore(content, query) {
    const text = JSON.stringify(content).toLowerCase();
    const queryWords = query.toLowerCase().split(' ');
    
    let score = 0;
    
    queryWords.forEach(word => {
      const matches = (text.match(new RegExp(word, 'g')) || []).length;
      score += matches;
    });
    
    return score;
  }
  
  async getStatistics() {
    try {
      const indexContent = await fs.readFile(this.indexFile, 'utf8');
      const index = JSON.parse(indexContent);
      
      // 计算目录大小
      const dirStats = await this.getDirectoryStats();
      
      return {
        ...index.metadata,
        directory_size_bytes: dirStats.size,
        file_count: dirStats.files,
        backup_count: await this.getBackupCount(),
        last_backup: await this.getLastBackupTime()
      };
    } catch (error) {
      logger.error('Failed to get statistics', { error: error.message });
      return {};
    }
  }
  
  async getDirectoryStats() {
    try {
      const files = await fs.readdir(this.dataDir);
      let totalSize = 0;
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.dataDir, file);
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
        }
      }
      
      return {
        size: totalSize,
        files: files.filter(f => f.endsWith('.json')).length
      };
    } catch (error) {
      logger.error('Failed to get directory stats', { error: error.message });
      return { size: 0, files: 0 };
    }
  }
  
  async getBackupCount() {
    try {
      const backupDirs = await fs.readdir(this.backupDir);
      return backupDirs.length;
    } catch (error) {
      return 0;
    }
  }
  
  async getLastBackupTime() {
    try {
      const backupDirs = await fs.readdir(this.backupDir);
      if (backupDirs.length === 0) return null;
      
      const latestBackup = backupDirs.sort().pop();
      return latestBackup;
    } catch (error) {
      return null;
    }
  }
  
  async commitToGit(message = 'Auto-commit from A2B-MVP') {
    try {
      // 检查是否有变更
      const { stdout } = await execAsync('git status --porcelain');
      if (!stdout.trim()) {
        logger.info('No changes to commit');
        return false;
      }
      
      // 添加所有文件
      await execAsync('git add .');
      
      // 提交
      await execAsync(`git commit -m "${message}"`);
      
      logger.info('Changes committed to Git', { message });
      return true;
    } catch (error) {
      logger.error('Failed to commit to Git', { error: error.message });
      return false;
    }
  }
  
  async pushToGitHub() {
    try {
      await execAsync('git push origin main');
      logger.info('Changes pushed to GitHub');
      return true;
    } catch (error) {
      logger.error('Failed to push to GitHub', { error: error.message });
      return false;
    }
  }
  
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

module.exports = new StorageService();