const MVP = require('../src/main');
const assert = require('assert');

describe('MVP Class', () => {
  let mvp;

  beforeEach(() => {
    mvp = new MVP();
  });

  it('应该正确初始化', () => {
    assert.ok(mvp);
    assert.equal(typeof mvp.version, 'string');
  });

  it('应该有基础方法', () => {
    assert.equal(typeof mvp.start, 'function');
    assert.equal(typeof mvp.showMenu, 'function');
    assert.equal(typeof mvp.processCommand, 'function');
  });

  it('应该处理version命令', () => {
    // 捕获console.log输出
    const originalLog = console.log;
    let logOutput = '';
    console.log = (message) => {
      logOutput += message + '\n';
    };

    mvp.processCommand('version');

    console.log = originalLog;
    assert.ok(logOutput.includes('当前版本'));
  });

  it('应该处理status命令', () => {
    const originalLog = console.log;
    let logOutput = '';
    console.log = (message) => {
      logOutput += message + '\n';
    };

    mvp.processCommand('status');

    console.log = originalLog;
    assert.ok(logOutput.includes('系统状态'));
  });
});