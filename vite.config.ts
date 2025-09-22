import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // ARM64 优化配置
  build: {
    // 针对 ARM64 架构优化
    target: 'esnext',
    minify: 'esbuild',
    
    // 优化构建输出
    rollupOptions: {
      output: {
        // ARM64 优化的代码分割
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    },
    
    // 启用压缩
    cssCodeSplit: true,
    sourcemap: false,
    
    // ARM64 架构特定的优化
    esbuild: {
      target: 'es2022',
      platform: 'neutral'
    }
  },
  
  // 开发服务器配置
  server: {
    port: 3000,
    host: true,
    // ARM64 架构下的快速热重载
    hmr: {
      overlay: true
    }
  },
  
  // 预览服务器配置
  preview: {
    port: 4173,
    host: true
  },
  
  // 依赖优化
  optimizeDeps: {
    // ARM64 原生依赖预构建
    include: ['react', 'react-dom']
  },
  
  // 路径别名
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@styles': '/src/styles',
      '@utils': '/src/utils',
      '@types': '/src/types'
    }
  }
})
