const systeminformation = require('systeminformation');
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
    new winston.transports.File({ filename: 'logs/healthcheck.log' }),
    new winston.transports.Console()
  ]
});

class HealthCheckHandler {
  async process(requestData) {
    const { data } = requestData;
    const { 
      checks = ['op', 'fs', 'raycast', 'network', 'storage', 'memory'],
      timeout_ms = 5000,
      include_metrics = true,
      include_dependencies = true
    } = data;
    
    logger.info('Processing health check request', { checks, timeout_ms });
    
    try {
      const results = {};
      let overallStatus = 'ok';
      
      // 执行各项检查
      for (const check of checks) {
        try {
          const checkResult = await this.performCheck(check, timeout_ms);
          results[check] = checkResult;
          
          if (checkResult.status !== 'ok') {
            overallStatus = 'warning';
          }
        } catch (error) {
          results[check] = {
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
          };
          overallStatus = 'error';
        }
      }
      
      // 收集系统指标
      let metrics = {};
      if (include_metrics) {
        metrics = await this.collectSystemMetrics();
      }
      
      // 检查依赖服务
      let dependencies = {};
      if (include_dependencies) {
        dependencies = await this.checkDependencies();
      }
      
      const result = {
        status: overallStatus,
        checks: results,
        metrics: metrics,
        dependencies: dependencies,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      };
      
      logger.info('Health check completed', { 
        status: overallStatus, 
        checksCount: Object.keys(results).length 
      });
      
      return result;
    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      throw new Error(`Health check failed: ${error.message}`);
    }
  }
  
  async performCheck(checkType, timeoutMs) {
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Check timeout')), timeoutMs)
    );
    
    const checkPromise = this.executeCheck(checkType);
    
    try {
      return await Promise.race([checkPromise, timeout]);
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  async executeCheck(checkType) {
    switch (checkType) {
      case 'op':
        return await this.check1Password();
      case 'fs':
        return await this.checkFileSystem();
      case 'raycast':
        return await this.checkRaycast();
      case 'network':
        return await this.checkNetwork();
      case 'storage':
        return await this.checkStorage();
      case 'memory':
        return await this.checkMemory();
      case 'cpu':
        return await this.checkCPU();
      default:
        throw new Error(`Unknown check type: ${checkType}`);
    }
  }
  
  async check1Password() {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      await execAsync('op --version');
      
      return {
        status: 'ok',
        message: '1Password CLI is available',
        version: await this.get1PasswordVersion(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        message: '1Password CLI not available',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  async get1PasswordVersion() {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      const { stdout } = await execAsync('op --version');
      return stdout.trim();
    } catch (error) {
      return 'unknown';
    }
  }
  
  async checkFileSystem() {
    try {
      const requiredDirs = ['out', 'logs', 'data'];
      const results = {};
      
      for (const dir of requiredDirs) {
        try {
          await fs.access(dir);
          results[dir] = 'exists';
        } catch (error) {
          results[dir] = 'missing';
        }
      }
      
      const missingDirs = Object.entries(results)
        .filter(([_, status]) => status === 'missing')
        .map(([dir, _]) => dir);
      
      if (missingDirs.length > 0) {
        return {
          status: 'warning',
          message: `Missing directories: ${missingDirs.join(', ')}`,
          details: results,
          timestamp: new Date().toISOString()
        };
      }
      
      return {
        status: 'ok',
        message: 'All required directories exist',
        details: results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'File system check failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  async checkRaycast() {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      await execAsync('which raycast');
      
      return {
        status: 'ok',
        message: 'Raycast CLI is available',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'warning',
        message: 'Raycast CLI not available',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  async checkNetwork() {
    try {
      const axios = require('axios');
      
      // 测试多个端点
      const endpoints = [
        'https://api.openai.com/v1/models',
        'https://github.com',
        'https://google.com'
      ];
      
      const results = {};
      
      for (const endpoint of endpoints) {
        try {
          const start = Date.now();
          await axios.get(endpoint, { timeout: 5000 });
          const latency = Date.now() - start;
          
          results[endpoint] = {
            status: 'ok',
            latency_ms: latency
          };
        } catch (error) {
          results[endpoint] = {
            status: 'error',
            error: error.message
          };
        }
      }
      
      const failedEndpoints = Object.entries(results)
        .filter(([_, result]) => result.status === 'error')
        .map(([endpoint, _]) => endpoint);
      
      if (failedEndpoints.length === endpoints.length) {
        return {
          status: 'error',
          message: 'All network endpoints failed',
          details: results,
          timestamp: new Date().toISOString()
        };
      } else if (failedEndpoints.length > 0) {
        return {
          status: 'warning',
          message: `Some endpoints failed: ${failedEndpoints.join(', ')}`,
          details: results,
          timestamp: new Date().toISOString()
        };
      }
      
      return {
        status: 'ok',
        message: 'Network connectivity is good',
        details: results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Network check failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  async checkStorage() {
    try {
      const stats = await systeminformation.fsSize();
      
      const systemDrive = stats.find(drive => drive.mount === '/') || stats[0];
      const usagePercent = (systemDrive.used / systemDrive.size) * 100;
      
      let status = 'ok';
      if (usagePercent > 90) {
        status = 'error';
      } else if (usagePercent > 80) {
        status = 'warning';
      }
      
      return {
        status: status,
        message: `Storage usage: ${usagePercent.toFixed(1)}%`,
        details: {
          total_gb: (systemDrive.size / 1024 / 1024 / 1024).toFixed(2),
          used_gb: (systemDrive.used / 1024 / 1024 / 1024).toFixed(2),
          available_gb: (systemDrive.available / 1024 / 1024 / 1024).toFixed(2),
          usage_percent: usagePercent.toFixed(1)
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Storage check failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  async checkMemory() {
    try {
      const memInfo = await systeminformation.mem();
      const usagePercent = (memInfo.used / memInfo.total) * 100;
      
      let status = 'ok';
      if (usagePercent > 90) {
        status = 'error';
      } else if (usagePercent > 80) {
        status = 'warning';
      }
      
      return {
        status: status,
        message: `Memory usage: ${usagePercent.toFixed(1)}%`,
        details: {
          total_mb: Math.round(memInfo.total / 1024 / 1024),
          used_mb: Math.round(memInfo.used / 1024 / 1024),
          available_mb: Math.round(memInfo.available / 1024 / 1024),
          usage_percent: usagePercent.toFixed(1)
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Memory check failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  async checkCPU() {
    try {
      const cpuInfo = await systeminformation.currentLoad();
      
      let status = 'ok';
      if (cpuInfo.currentload > 90) {
        status = 'error';
      } else if (cpuInfo.currentload > 80) {
        status = 'warning';
      }
      
      return {
        status: status,
        message: `CPU usage: ${cpuInfo.currentload.toFixed(1)}%`,
        details: {
          usage_percent: cpuInfo.currentload.toFixed(1),
          load_average: cpuInfo.avgload
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'CPU check failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  async collectSystemMetrics() {
    try {
      const [cpu, memory, storage] = await Promise.all([
        systeminformation.currentLoad(),
        systeminformation.mem(),
        systeminformation.fsSize()
      ]);
      
      return {
        cpu: {
          usage_percent: cpu.currentload,
          load_average: cpu.avgload
        },
        memory: {
          total_mb: Math.round(memory.total / 1024 / 1024),
          used_mb: Math.round(memory.used / 1024 / 1024),
          usage_percent: (memory.used / memory.total) * 100
        },
        storage: {
          total_gb: Math.round(storage[0].size / 1024 / 1024 / 1024),
          used_gb: Math.round(storage[0].used / 1024 / 1024 / 1024),
          usage_percent: (storage[0].used / storage[0].size) * 100
        }
      };
    } catch (error) {
      logger.warn('Failed to collect system metrics', { error: error.message });
      return {};
    }
  }
  
  async checkDependencies() {
    try {
      const dependencies = {};
      
      // 检查Node.js版本
      dependencies.nodejs = {
        version: process.version,
        status: 'ok'
      };
      
      // 检查关键模块
      const modules = ['express', 'winston', 'openai'];
      for (const module of modules) {
        try {
          require(module);
          dependencies[module] = { status: 'ok' };
        } catch (error) {
          dependencies[module] = { status: 'error', error: error.message };
        }
      }
      
      return dependencies;
    } catch (error) {
      logger.warn('Failed to check dependencies', { error: error.message });
      return {};
    }
  }
}

module.exports = new HealthCheckHandler();