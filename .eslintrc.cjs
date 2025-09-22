module.exports = {
  root: true,
  env: { 
    browser: true, 
    es2020: true,
    node: true 
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: [
    'dist', 
    '.eslintrc.cjs',
    'node_modules',
    '*.config.js',
    '*.config.ts'
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    'react-refresh',
    '@typescript-eslint'
  ],
  rules: {
    // ARM64 架构优化规则
    'react-refresh/only-export-components': [
      'warn', 
      { allowConstantExport: true }
    ],
    
    // TypeScript 规则
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/prefer-const': 'error',
    
    // 通用规则
    'no-console': 'warn',
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    
    // ARM64 架构性能优化规则
    'no-unused-expressions': 'error',
    'no-duplicate-imports': 'error',
    'no-useless-return': 'error',
    
    // 代码风格规则
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'never'],
    'comma-dangle': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    
    // ARM64 架构特定规则
    'no-restricted-globals': [
      'error',
      {
        name: 'event',
        message: 'Use event parameter instead of global event'
      }
    ]
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
}
