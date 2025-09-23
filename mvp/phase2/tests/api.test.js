const request = require('supertest');
const app = require('../server');
const winston = require('winston');

// 配置测试日志
const logger = winston.createLogger({
  level: 'error', // 测试时只显示错误
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console()
  ]
});

describe('A2B-MVP Phase 2 API Tests', () => {
  
  describe('Health Check', () => {
    test('GET /health should return 200', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body.status).toBe('ok');
      expect(response.body.version).toBe('2.0');
      expect(response.body.uptime).toBeGreaterThan(0);
    });
    
    test('GET /metrics should return system metrics', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);
      
      expect(response.body.uptime).toBeGreaterThan(0);
      expect(response.body.version).toBe('2.0');
      expect(response.body.memory).toBeDefined();
    });
  });
  
  describe('Content Generation', () => {
    test('POST /api/v2/content_generation should generate content', async () => {
      const requestData = {
        version: '2.0',
        trace_id: 'test-trace-1',
        timestamp: new Date().toISOString(),
        context: {
          user: 'test-user',
          source: 'cli'
        },
        intent: 'content_generation',
        data: {
          prompt: '测试内容生成',
          style: 'casual',
          length: 'short'
        }
      };
      
      const response = await request(app)
        .post('/api/v2/content_generation')
        .send(requestData)
        .expect(200);
      
      expect(response.body.status).toBe('ok');
      expect(response.body.data.file).toBeDefined();
      expect(response.body.data.content).toBeDefined();
      expect(response.body.data.word_count).toBeGreaterThan(0);
    });
    
    test('POST /api/v2/content_generation should handle invalid input', async () => {
      const requestData = {
        version: '2.0',
        trace_id: 'test-trace-2',
        timestamp: new Date().toISOString(),
        context: {
          user: 'test-user',
          source: 'cli'
        },
        intent: 'content_generation',
        data: {
          // 缺少 prompt
          style: 'casual'
        }
      };
      
      const response = await request(app)
        .post('/api/v2/content_generation')
        .send(requestData)
        .expect(200);
      
      // 应该返回错误状态
      expect(response.body.status).toBe('error');
    });
  });
  
  describe('Data Summarization', () => {
    test('POST /api/v2/summarize should summarize text', async () => {
      const requestData = {
        version: '2.0',
        trace_id: 'test-trace-3',
        timestamp: new Date().toISOString(),
        context: {
          user: 'test-user',
          source: 'cli'
        },
        intent: 'summarize',
        data: {
          text: '这是一段很长的文本，需要被摘要。它包含了很多信息，但是我们需要提取出最重要的部分。摘要应该简洁明了，能够概括原文的主要内容。',
          format: 'bullet',
          length: 'brief'
        }
      };
      
      const response = await request(app)
        .post('/api/v2/summarize')
        .send(requestData)
        .expect(200);
      
      expect(response.body.status).toBe('ok');
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.word_count).toBeGreaterThan(0);
      expect(response.body.data.compression_ratio).toBeLessThan(1);
    });
  });
  
  describe('Health Check Handler', () => {
    test('POST /api/v2/healthcheck should perform health checks', async () => {
      const requestData = {
        version: '2.0',
        trace_id: 'test-trace-4',
        timestamp: new Date().toISOString(),
        context: {
          user: 'test-user',
          source: 'cli'
        },
        intent: 'healthcheck',
        data: {
          checks: ['fs', 'memory'],
          timeout_ms: 5000
        }
      };
      
      const response = await request(app)
        .post('/api/v2/healthcheck')
        .send(requestData)
        .expect(200);
      
      expect(response.body.status).toBeDefined();
      expect(response.body.data.checks).toBeDefined();
      expect(response.body.data.timestamp).toBeDefined();
    });
  });
  
  describe('Notification Handler', () => {
    test('POST /api/v2/notify should send notification', async () => {
      const requestData = {
        version: '2.0',
        trace_id: 'test-trace-5',
        timestamp: new Date().toISOString(),
        context: {
          user: 'test-user',
          source: 'cli'
        },
        intent: 'notify',
        data: {
          message: '测试通知消息',
          title: 'A2B-MVP Test',
          type: 'info',
          channel: 'system'
        }
      };
      
      const response = await request(app)
        .post('/api/v2/notify')
        .send(requestData)
        .expect(200);
      
      expect(response.body.status).toBe('ok');
      expect(response.body.data.status).toBe('sent');
      expect(response.body.data.channel).toBe('system');
    });
  });
  
  describe('Persistence Handler', () => {
    test('POST /api/v2/persist should save content', async () => {
      const requestData = {
        version: '2.0',
        trace_id: 'test-trace-6',
        timestamp: new Date().toISOString(),
        context: {
          user: 'test-user',
          source: 'cli'
        },
        intent: 'persist',
        data: {
          summary: '这是一个测试摘要',
          source: 'test',
          metadata: {
            category: 'test',
            tags: ['test', 'automation'],
            importance: 'medium'
          },
          format: 'markdown'
        }
      };
      
      const response = await request(app)
        .post('/api/v2/persist')
        .send(requestData)
        .expect(200);
      
      expect(response.body.status).toBe('ok');
      expect(response.body.data.file).toBeDefined();
      expect(response.body.data.format).toBe('markdown');
    });
  });
  
  describe('Error Handling', () => {
    test('POST /api/v2/unknown_intent should return error', async () => {
      const requestData = {
        version: '2.0',
        trace_id: 'test-trace-7',
        timestamp: new Date().toISOString(),
        context: {
          user: 'test-user',
          source: 'cli'
        },
        intent: 'unknown_intent',
        data: {}
      };
      
      const response = await request(app)
        .post('/api/v2/unknown_intent')
        .send(requestData)
        .expect(200);
      
      expect(response.body.status).toBe('error');
      expect(response.body.error.code).toBe('HANDLER_ERROR');
    });
    
    test('POST with invalid JSON should return 400', async () => {
      await request(app)
        .post('/api/v2/content_generation')
        .send('invalid json')
        .expect(400);
    });
    
    test('POST with missing required fields should return 400', async () => {
      const requestData = {
        version: '2.0',
        // 缺少 trace_id, timestamp, context, intent, data
      };
      
      const response = await request(app)
        .post('/api/v2/content_generation')
        .send(requestData)
        .expect(400);
      
      expect(response.body.status).toBe('error');
      expect(response.body.error.code).toBe('MISSING_FIELD');
    });
  });
  
  describe('Rate Limiting', () => {
    test('Should respect rate limits', async () => {
      const requestData = {
        version: '2.0',
        trace_id: 'test-trace-8',
        timestamp: new Date().toISOString(),
        context: {
          user: 'test-user',
          source: 'cli'
        },
        intent: 'healthcheck',
        data: {}
      };
      
      // 发送多个请求测试速率限制
      const promises = Array(10).fill().map(() =>
        request(app)
          .post('/api/v2/healthcheck')
          .send(requestData)
      );
      
      const responses = await Promise.all(promises);
      
      // 大部分请求应该成功
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(5);
    });
  });
  
  describe('Performance', () => {
    test('Response time should be reasonable', async () => {
      const requestData = {
        version: '2.0',
        trace_id: 'test-trace-9',
        timestamp: new Date().toISOString(),
        context: {
          user: 'test-user',
          source: 'cli'
        },
        intent: 'healthcheck',
        data: {}
      };
      
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/v2/healthcheck')
        .send(requestData)
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      expect(response.body.latency_ms).toBeLessThan(5000);
      expect(responseTime).toBeLessThan(10000); // 10秒超时
    });
  });
});

// 集成测试
describe('Integration Tests', () => {
  test('Complete workflow: generate -> summarize -> persist -> notify', async () => {
    // 1. 生成内容
    const generateRequest = {
      version: '2.0',
      trace_id: 'integration-test-1',
      timestamp: new Date().toISOString(),
      context: { user: 'test-user', source: 'cli' },
      intent: 'content_generation',
      data: { prompt: '测试完整工作流', style: 'casual', length: 'medium' }
    };
    
    const generateResponse = await request(app)
      .post('/api/v2/content_generation')
      .send(generateRequest)
      .expect(200);
    
    expect(generateResponse.body.status).toBe('ok');
    const generatedContent = generateResponse.body.data.content;
    
    // 2. 摘要内容
    const summarizeRequest = {
      version: '2.0',
      trace_id: 'integration-test-2',
      timestamp: new Date().toISOString(),
      context: { user: 'test-user', source: 'cli' },
      intent: 'summarize',
      data: { text: generatedContent, format: 'bullet', length: 'brief' }
    };
    
    const summarizeResponse = await request(app)
      .post('/api/v2/summarize')
      .send(summarizeRequest)
      .expect(200);
    
    expect(summarizeResponse.body.status).toBe('ok');
    const summary = summarizeResponse.body.data.summary;
    
    // 3. 持久化摘要
    const persistRequest = {
      version: '2.0',
      trace_id: 'integration-test-3',
      timestamp: new Date().toISOString(),
      context: { user: 'test-user', source: 'cli' },
      intent: 'persist',
      data: { 
        summary: summary, 
        source: 'integration-test',
        metadata: { category: 'test', importance: 'high' }
      }
    };
    
    const persistResponse = await request(app)
      .post('/api/v2/persist')
      .send(persistRequest)
      .expect(200);
    
    expect(persistResponse.body.status).toBe('ok');
    
    // 4. 发送通知
    const notifyRequest = {
      version: '2.0',
      trace_id: 'integration-test-4',
      timestamp: new Date().toISOString(),
      context: { user: 'test-user', source: 'cli' },
      intent: 'notify',
      data: { 
        message: '完整工作流测试完成', 
        title: 'A2B-MVP Integration Test',
        type: 'success'
      }
    };
    
    const notifyResponse = await request(app)
      .post('/api/v2/notify')
      .send(notifyRequest)
      .expect(200);
    
    expect(notifyResponse.body.status).toBe('ok');
    
    // 验证整个工作流成功
    expect(generateResponse.body.status).toBe('ok');
    expect(summarizeResponse.body.status).toBe('ok');
    expect(persistResponse.body.status).toBe('ok');
    expect(notifyResponse.body.status).toBe('ok');
  });
});