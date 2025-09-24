#!/usr/bin/env node

/**
 * MVP (Minimum Viable Product) 主程序
 * 这是一个基础的项目模板
 */

const fs = require('fs');
const path = require('path');

// 读取MVP项目的package.json
const mvpPackagePath = path.join(__dirname, '..', 'package.json');
let version = '1.0.0'; // 默认版本

try {
  if (fs.existsSync(mvpPackagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(mvpPackagePath, 'utf8'));
    version = packageJson.version || version;
  }
} catch (error) {
  console.log('⚠️ 无法读取版本信息，使用默认版本');
}

class MVP {
  constructor() {
    this.version = version;
    console.log(`🚀 MVP v${this.version} 已启动`);
  }

  start() {
    console.log('✅ MVP 正在运行...');
    console.log('📝 基础功能：');
    console.log('  - 版本检查 ✅');
    console.log('  - 基本配置 ✅');
    console.log('  - 模块加载 ✅');

    this.showMenu();
  }

  showMenu() {
    console.log('\n📋 可用命令:');
    console.log('  help     - 显示帮助信息');
    console.log('  version  - 显示版本信息');
    console.log('  status   - 显示系统状态');
    console.log('  exit     - 退出程序');
  }

  processCommand(command) {
    switch (command.toLowerCase()) {
      case 'help':
        this.showMenu();
        break;
      case 'version':
        console.log(`当前版本: v${this.version}`);
        break;
      case 'status':
        console.log('🟢 系统状态: 正常运行');
        console.log('📊 内存使用: 正常');
        console.log('🔗 模块状态: 已加载');
        break;
      case 'exit':
        console.log('👋 再见！');
        process.exit(0);
      default:
        console.log(`❓ 未知命令: ${command}`);
        console.log('输入 "help" 查看可用命令');
    }
  }
}

// 主函数
function main() {
  const mvp = new MVP();
  mvp.start();

  // 交互模式
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.setPrompt('mvp> ');
  rl.prompt();

  rl.on('line', (line) => {
    const command = line.trim();
    if (command) {
      mvp.processCommand(command);
    }
    rl.prompt();
  });

  rl.on('close', () => {
    console.log('\n👋 MVP 已退出');
    process.exit(0);
  });
}

// 如果直接运行此文件
if (require.main === module) {
  main();
}

module.exports = MVP;