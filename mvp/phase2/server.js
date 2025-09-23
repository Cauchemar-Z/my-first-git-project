const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const config = require('./configs/server.json');

// 配置日志
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const app = express();

// 中间件配置
app.use(helmet(config.middleware.helmet));
app.use(cors(config.middleware.cors));
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: config.server.maxRequestSize }));

// 速率限制
const limiter = rateLimit(config.middleware.rateLimit);
app.use(limiter);

// 请求验证中间件
const validateRequest = (req, res, next) => {
  const { version, trace_id, timestamp, context, intent, data } = req.body;
  
  if (!version || !trace_id || !timestamp || !context || !intent || !data) {
    return res.status(400).json({
      version: '2.0',
      trace_id: trace_id || 'unknown',
      timestamp: new Date().toISOString(),
      status: 'error',
      error: {
        code: 'MISSING_FIELD',
        message: 'Missing required fields',
        details: { required: ['version', 'trace_id', 'timestamp', 'context', 'intent', 'data'] }
      }
    });
  }
  
  next();
};

// 处理器路由
app.post('/api/v2/:intent', validateRequest, async (req, res) => {
  const { intent } = req.params;
  const requestData = req.body;
  const startTime = Date.now();
  
  logger.info('Processing request', { intent, trace_id: requestData.trace_id });
  
  try {
    const handler = require(`./handlers/${intent}.js`);
    const result = await handler.process(requestData);
    
    const response = {
      version: '2.0',
      trace_id: requestData.trace_id,
      timestamp: new Date().toISOString(),
      status: 'ok',
      latency_ms: Date.now() - startTime,
      data: result,
      metadata: {
        handler_version: '1.0.0',
        processing_time_ms: Date.now() - startTime,
        cache_hit: false,
        retry_count: 0
      }
    };
    
    logger.info('Request completed successfully', { 
      intent, 
      trace_id: requestData.trace_id,
      latency_ms: response.latency_ms 
    });
    
    res.json(response);
  } catch (error) {
    logger.error('Request failed', { 
      intent, 
      trace_id: requestData.trace_id, 
      error: error.message 
    });
    
    res.status(500).json({
      version: '2.0',
      trace_id: requestData.trace_id,
      timestamp: new Date().toISOString(),
      status: 'error',
      latency_ms: Date.now() - startTime,
      error: {
        code: 'HANDLER_ERROR',
        message: error.message,
        details: { stack: error.stack }
      }
    });
  }
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 指标端点
app.get('/metrics', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    version: '2.0'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  
  res.status(500).json({
    version: '2.0',
    trace_id: req.body?.trace_id || 'unknown',
    timestamp: new Date().toISOString(),
    status: 'error',
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: { stack: err.stack }
    }
  });
});

// 启动服务器
const PORT = process.env.PORT || config.server.port;
const HOST = process.env.HOST || config.server.host;

app.listen(PORT, HOST, () => {
  logger.info(`A2B-MVP Phase 2 server running on ${HOST}:${PORT}`);
  console.log(`🚀 A2B-MVP Phase 2 server running on ${HOST}:${PORT}`);
});

module.exports = app;
