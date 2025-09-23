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
    new winston.transports.File({ filename: 'logs/notify.log' }),
    new winston.transports.Console()
  ]
});

class NotifyHandler {
  async process(requestData) {
    const { data } = requestData;
    const { 
      message, 
      title = 'A2B-MVP', 
      type = 'info', 
      channel = 'system',
      priority = 'normal',
      actions = []
    } = data;
    
    logger.info('Processing notification request', { 
      message: message.substring(0, 100), 
      title, 
      type, 
      channel 
    });
    
    try {
      const result = await this.sendNotification(message, title, type, channel, priority, actions);
      
      logger.info('Notification sent successfully', { channel, type });
      
      return {
        status: 'sent',
        channel: channel,
        message_id: result.messageId || Date.now().toString(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Notification failed', { error: error.message });
      throw new Error(`Notification failed: ${error.message}`);
    }
  }
  
  async sendNotification(message, title, type, channel, priority, actions) {
    switch (channel) {
      case 'system':
        return await this.sendSystemNotification(message, title, type);
      case 'email':
        return await this.sendEmailNotification(message, title, type);
      case 'push':
        return await this.sendPushNotification(message, title, type);
      case 'webhook':
        return await this.sendWebhookNotification(message, title, type, actions);
      default:
        return await this.sendSystemNotification(message, title, type);
    }
  }
  
  async sendSystemNotification(message, title, type) {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      // macOS系统通知
      const script = `osascript -e 'display notification "${message}" with title "${title}"'`;
      await execAsync(script);
      
      return { messageId: Date.now().toString() };
    } catch (error) {
      logger.warn('System notification failed, trying alternative', { error: error.message });
      
      // 备用方案：写入日志文件
      await this.writeToLogFile(message, title, type);
      return { messageId: Date.now().toString() };
    }
  }
  
  async sendEmailNotification(message, title, type) {
    try {
      // 使用nodemailer发送邮件
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_TO || process.env.EMAIL_USER,
        subject: `${title} - ${type.toUpperCase()}`,
        text: message,
        html: `<h2>${title}</h2><p>${message}</p>`
      };
      
      const result = await transporter.sendMail(mailOptions);
      
      return { messageId: result.messageId };
    } catch (error) {
      logger.warn('Email notification failed', { error: error.message });
      throw error;
    }
  }
  
  async sendPushNotification(message, title, type) {
    try {
      // 使用web-push发送推送通知
      const webpush = require('web-push');
      
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
      
      const payload = JSON.stringify({
        title: title,
        body: message,
        icon: '/icon.png',
        badge: '/badge.png'
      });
      
      const result = await webpush.sendNotification(
        process.env.PUSH_SUBSCRIPTION,
        payload
      );
      
      return { messageId: result.headers['location'] };
    } catch (error) {
      logger.warn('Push notification failed', { error: error.message });
      throw error;
    }
  }
  
  async sendWebhookNotification(message, title, type, actions) {
    try {
      const axios = require('axios');
      
      const webhookData = {
        text: `${title}: ${message}`,
        channel: '#alerts',
        username: 'A2B-MVP',
        icon_emoji: this.getIconForType(type),
        attachments: actions.map(action => ({
          color: this.getColorForType(type),
          fields: [{
            title: action.label,
            value: action.action,
            short: false
          }]
        }))
      };
      
      const response = await axios.post(
        process.env.SLACK_WEBHOOK_URL || process.env.WEBHOOK_URL,
        webhookData,
        { timeout: 10000 }
      );
      
      return { messageId: response.data.ts };
    } catch (error) {
      logger.warn('Webhook notification failed', { error: error.message });
      throw error;
    }
  }
  
  getIconForType(type) {
    const icons = {
      'info': ':information_source:',
      'warning': ':warning:',
      'error': ':x:',
      'success': ':white_check_mark:'
    };
    return icons[type] || icons['info'];
  }
  
  getColorForType(type) {
    const colors = {
      'info': 'good',
      'warning': 'warning',
      'error': 'danger',
      'success': 'good'
    };
    return colors[type] || colors['info'];
  }
  
  async writeToLogFile(message, title, type) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        type: type,
        title: title,
        message: message
      };
      
      const logFile = path.join('logs', 'notifications.log');
      await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      logger.error('Failed to write to log file', { error: error.message });
    }
  }
}

module.exports = new NotifyHandler();