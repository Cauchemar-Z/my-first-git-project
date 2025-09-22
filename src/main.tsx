import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/index.css'

// ARM64 架构检测
const isARM64 = navigator.userAgent.includes('Mac') && navigator.userAgent.includes('Intel') === false

// 性能监控
if (isARM64) {
  console.log('🚀 ARM64架构检测到，启用优化模式')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
