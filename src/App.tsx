import React, { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [architecture, setArchitecture] = useState<string>('')

  useEffect(() => {
    // 检测系统架构
    const userAgent = navigator.userAgent
    if (userAgent.includes('Mac') && !userAgent.includes('Intel')) {
      setArchitecture('ARM64 (Apple Silicon)')
    } else if (userAgent.includes('Intel')) {
      setArchitecture('x64 (Intel)')
    } else {
      setArchitecture('未知架构')
    }
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 Node.js 前端项目</h1>
        <p>一个现代化的 Node.js/前端项目模板，针对ARM64架构优化</p>
        
        <div className="info-card">
          <h2>系统信息</h2>
          <p><strong>架构:</strong> {architecture}</p>
          <p><strong>用户代理:</strong> {navigator.userAgent}</p>
          <p><strong>时间:</strong> {new Date().toLocaleString('zh-CN')}</p>
        </div>

        <div className="counter-section">
          <h2>交互测试</h2>
          <button 
            className="counter-button"
            onClick={() => setCount((count) => count + 1)}
          >
            点击次数: {count}
          </button>
        </div>

        <div className="features">
          <h2>✨ 项目特性</h2>
          <ul>
            <li>✅ ARM64架构优化</li>
            <li>✅ TypeScript支持</li>
            <li>✅ Vite构建工具</li>
            <li>✅ React 18</li>
            <li>✅ 现代化CSS</li>
            <li>✅ ESLint代码检查</li>
            <li>✅ 自动部署到Cloudflare Pages</li>
          </ul>
        </div>

        <div className="links">
          <a
            className="App-link"
            href="https://github.com/Cauchemar-Z/my-first-git-project"
            target="_blank"
            rel="noopener noreferrer"
          >
            📚 GitHub 仓库
          </a>
          <a
            className="App-link"
            href="https://my-first-git-project.pages.dev"
            target="_blank"
            rel="noopener noreferrer"
          >
            🌐 在线演示
          </a>
        </div>
      </header>
    </div>
  )
}

export default App
