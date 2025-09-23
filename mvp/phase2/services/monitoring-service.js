const winston = require('winston');
const fs = require('fs').promises;
const path = require('path');
const systeminformation = require('systeminformation');

// 配置日志
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/monitoring-service.log' }),
    new winston.transports.Console()
  ]
});

class MonitoringService {
  constructor() {
    this.metricsFile = 'data/metrics.json';
    this.alertsFile = 'data/alerts.json';
    this.thresholds = {
      cpu: { warning: 70, critical: 90 },
      memory: { warning: 80, critical: 95 },
      disk: { warning: 80, critical: 95 },
      latency: { warning: 1000, critical: 2000 },
      error_rate: { warning: 0.05, critical: 0.10 }
    };
    this.metrics = [];
    this.alerts = [];
  }
  
  async initialize() {
    try {
      // 创建数据目录
      await fs.mkdir('data', { recursive: true });
      
      // 加载现有指标和告警
      await this.loadMetrics();
      await this.loadAlerts();
      
      // 启动监控循环
      this.startMonitoring();
      
      logger.info('Monitoring Service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Monitoring Service', { error: error.message });
      return false;
    }
  }
  
  async loadMetrics() {
    try {
      const content = await fs.readFile(this.metricsFile, 'utf8');
      this.metrics = JSON.parse(content);
    } catch (error) {
      this.metrics = [];
    }
  }
  
  async loadAlerts() {
    try {
      const content = await fs.readFile(this.alertsFile, 'utf8');
      this.alerts = JSON.parse(content);
    } catch (error) {
      this.alerts = [];
    }
  }
  
  async saveMetrics() {
    try {
      await fs.writeFile(this.metricsFile, JSON.stringify(this.metrics, null, 2), 'utf8');
    } catch (error) {
      logger.error('Failed to save metrics', { error: error.message });
    }
  }
  
  async saveAlerts() {
    try {
      await fs.writeFile(this.alertsFile, JSON.stringify(this.alerts, null, 2), 'utf8');
    } catch (error) {
      logger.error('Failed to save alerts', { error: error.message });
    }
  }
  
  startMonitoring() {
    // 每30秒收集一次指标
    setInterval(async () => {
      try {
        await this.collectMetrics();
      } catch (error) {
        logger.error('Failed to collect metrics', { error: error.message });
      }
    }, 30000);
    
    // 每分钟检查告警
    setInterval(async () => {
      try {
        await this.checkAlerts();
      } catch (error) {
        logger.error('Failed to check alerts', { error: error.message });
      }
    }, 60000);
  }
  
  async collectMetrics() {
    try {
      const timestamp = new Date().toISOString();
      
      // 收集系统指标
      const [cpu, memory, disk, network] = await Promise.all([
        systeminformation.currentLoad(),
        systeminformation.mem(),
        systeminformation.fsSize(),
        systeminformation.networkStats()
      ]);
      
      // 收集应用指标
      const appMetrics = await this.collectAppMetrics();
      
      const metric = {
        timestamp: timestamp,
        system: {
          cpu: {
            usage_percent: cpu.currentload,
            load_average: cpu.avgload
          },
          memory: {
            total_mb: Math.round(memory.total / 1024 / 1024),
            used_mb: Math.round(memory.used / 1024 / 1024),
            usage_percent: (memory.used / memory.total) * 100
          },
          disk: {
            total_gb: Math.round(disk[0].size / 1024 / 1024 / 1024),
            used_gb: Math.round(disk[0].used / 1024 / 1024 / 1024),
            usage_percent: (disk[0].used / disk[0].size) * 100
          },
          network: {
            bytes_in: network[0]?.rx_bytes || 0,
            bytes_out: network[0]?.tx_bytes || 0
          }
        },
        application: appMetrics
      };
      
      this.metrics.push(metric);
      
      // 只保留最近24小时的指标
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      this.metrics = this.metrics.filter(m => new Date(m.timestamp) > oneDayAgo);
      
      await this.saveMetrics();
      
      logger.debug('Metrics collected successfully', { timestamp });
    } catch (error) {
      logger.error('Failed to collect metrics', { error: error.message });
    }
  }
  
  async collectAppMetrics() {
    try {
      // 读取应用日志
      const logFile = 'logs/combined.log';
      let errorCount = 0;
      let totalRequests = 0;
      
      try {
        const logContent = await fs.readFile(logFile, 'utf8');
        const lines = logContent.split('\n').filter(line => line.trim());
        
        // 统计最近1小时的日志
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        lines.forEach(line => {
          try {
            const logEntry = JSON.parse(line);
            const logTime = new Date(logEntry.timestamp);
            
            if (logTime > oneHourAgo) {
              totalRequests++;
              if (logEntry.level === 'error') {
                errorCount++;
              }
            }
          } catch (error) {
            // 忽略非JSON日志行
          }
        });
      } catch (error) {
        // 日志文件不存在或无法读取
      }
      
      return {
        error_count: errorCount,
        total_requests: totalRequests,
        error_rate: totalRequests > 0 ? errorCount / totalRequests : 0,
        uptime_seconds: process.uptime()
      };
    } catch (error) {
      logger.error('Failed to collect app metrics', { error: error.message });
      return {
        error_count: 0,
        total_requests: 0,
        error_rate: 0,
        uptime_seconds: process.uptime()
      };
    }
  }
  
  async checkAlerts() {
    try {
      if (this.metrics.length === 0) return;
      
      const latestMetric = this.metrics[this.metrics.length - 1];
      
      // 检查CPU使用率
      await this.checkThreshold('cpu', latestMetric.system.cpu.usage_percent, latestMetric.timestamp);
      
      // 检查内存使用率
      await this.checkThreshold('memory', latestMetric.system.memory.usage_percent, latestMetric.timestamp);
      
      // 检查磁盘使用率
      await this.checkThreshold('disk', latestMetric.system.disk.usage_percent, latestMetric.timestamp);
      
      // 检查错误率
      await this.checkThreshold('error_rate', latestMetric.application.error_rate, latestMetric.timestamp);
      
    } catch (error) {
      logger.error('Failed to check alerts', { error: error.message });
    }
  }
  
  async checkThreshold(metricName, value, timestamp) {
    try {
      const threshold = this.thresholds[metricName];
      if (!threshold) return;
      
      let severity = null;
      if (value >= threshold.critical) {
        severity = 'critical';
      } else if (value >= threshold.warning) {
        severity = 'warning';
      }
      
      if (severity) {
        const alert = {
          id: this.generateAlertId(),
          timestamp: timestamp,
          metric: metricName,
          value: value,
          threshold: threshold[severity],
          severity: severity,
          message: `${metricName} is ${value.toFixed(2)}%, exceeding ${severity} threshold of ${threshold[severity]}%`,
          status: 'active'
        };
        
        // 检查是否已有相同的活跃告警
        const existingAlert = this.alerts.find(a => 
          a.metric === metricName && 
          a.severity === severity && 
          a.status === 'active'
        );
        
        if (!existingAlert) {
          this.alerts.push(alert);
          await this.saveAlerts();
          
          // 发送告警通知
          await this.sendAlert(alert);
          
          logger.warn('Alert triggered', { 
            metric: metricName, 
            value, 
            severity 
          });
        }
      } else {
        // 清除相关告警
        this.alerts = this.alerts.map(alert => {
          if (alert.metric === metricName && alert.status === 'active') {
            return { ...alert, status: 'resolved', resolved_at: timestamp };
          }
          return alert;
        });
        
        await this.saveAlerts();
      }
    } catch (error) {
      logger.error('Failed to check threshold', { metricName, error: error.message });
    }
  }
  
  async sendAlert(alert) {
    try {
      // 发送系统通知
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      const script = `osascript -e 'display notification "${alert.message}" with title "A2B-MVP Alert"'`;
      await execAsync(script);
      
      logger.info('Alert notification sent', { alertId: alert.id });
    } catch (error) {
      logger.warn('Failed to send alert notification', { 
        alertId: alert.id, 
        error: error.message 
      });
    }
  }
  
  async getMetrics(timeRange = '1h') {
    try {
      const now = new Date();
      let startTime;
      
      switch (timeRange) {
        case '1h':
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '6h':
          startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
          break;
        case '24h':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
      }
      
      return this.metrics.filter(m => new Date(m.timestamp) > startTime);
    } catch (error) {
      logger.error('Failed to get metrics', { error: error.message });
      return [];
    }
  }
  
  async getAlerts(status = 'active') {
    try {
      return this.alerts.filter(alert => alert.status === status);
    } catch (error) {
      logger.error('Failed to get alerts', { error: error.message });
      return [];
    }
  }
  
  async getHealthStatus() {
    try {
      if (this.metrics.length === 0) {
        return { status: 'unknown', message: 'No metrics available' };
      }
      
      const latestMetric = this.metrics[this.metrics.length - 1];
      const activeAlerts = await this.getAlerts('active');
      
      if (activeAlerts.some(alert => alert.severity === 'critical')) {
        return { 
          status: 'critical', 
          message: 'System has critical issues',
          alerts: activeAlerts.filter(a => a.severity === 'critical')
        };
      } else if (activeAlerts.some(alert => alert.severity === 'warning')) {
        return { 
          status: 'warning', 
          message: 'System has warnings',
          alerts: activeAlerts.filter(a => a.severity === 'warning')
        };
      } else {
        return { 
          status: 'healthy', 
          message: 'System is running normally',
          metrics: latestMetric
        };
      }
    } catch (error) {
      logger.error('Failed to get health status', { error: error.message });
      return { status: 'error', message: 'Failed to determine health status' };
    }
  }
  
  generateAlertId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

module.exports = new MonitoringService();