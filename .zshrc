# ~/.zshrc - Zsh配置文件 (修复版)
# 创建时间: $(date)

# 启用颜色支持
export CLICOLOR=1
export LSCOLORS=ExFxBxDxCxegedabagacad

# 设置默认编辑器
export EDITOR='code'

# NVM配置
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# Homebrew配置
export HOMEBREW_PREFIX="$HOME/.homebrew"
export PATH="$HOMEBREW_PREFIX/bin:$PATH"

# 清理重复的PATH
export PATH=$(echo $PATH | tr ':' '\n' | awk '!seen[$0]++' | tr '\n' ':' | sed 's/:$//')

# 自定义别名
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'
alias ..='cd ..'
alias ...='cd ../..'
alias grep='grep --color=auto'
alias fgrep='fgrep --color=auto'
alias egrep='egrep --color=auto'

# Git别名
alias gs='git status'
alias ga='git add'
alias gc='git commit'
alias gp='git push'
alias gl='git pull'
alias gd='git diff'
alias gb='git branch'
alias gco='git checkout'

# 开发工具别名
alias code='open -a "Visual Studio Code"'
alias cursor='open -a "Cursor"'
alias iterm='open -a "Terminal"'

# 历史配置
HISTSIZE=10000
SAVEHIST=10000
HISTFILE=~/.zsh_history

# 自动补全
autoload -U compinit && compinit

# 函数定义
# 创建目录并进入
mkcd() {
    mkdir -p "$1" && cd "$1"
}

# 查找文件
ff() {
    find . -type f -name "*$1*"
}

# 查找目录
fd() {
    find . -type d -name "*$1*"
}

# 快速打开项目
open_project() {
    if [ -d "$1" ]; then
        code "$1"
    else
        echo "目录不存在: $1"
    fi
}

# 环境检查函数
check_env() {
    echo "=== 环境检查 ==="
    echo "Git版本: $(git --version)"
    echo "Node.js版本: $(node --version 2>/dev/null || echo '未安装')"
    echo "NPM版本: $(npm --version 2>/dev/null || echo '未安装')"
    echo "Python版本: $(python3 --version)"
    echo "Homebrew: $(brew --version 2>/dev/null | head -1 || echo '未安装')"
    echo "VS Code: $(code --version 2>/dev/null | head -1 || echo '未安装')"
}

# 快速启动开发工具
start_dev() {
    echo "🚀 启动开发环境..."
    echo "1. 打开Cursor编辑器"
    cursor
    echo "2. 打开终端"
    open -a "Terminal"
    echo "✅ 开发环境已启动"
}

# 欢迎信息
echo "🚀 开发环境已加载完成！"
echo "💡 使用 'check_env' 命令检查环境状态"
echo "💡 使用 'start_dev' 命令快速启动开发工具"export HISTSIZE=10000
export SAVEHIST=10000
setopt HIST_IGNORE_DUPS
setopt HIST_IGNORE_ALL_DUPS
export HISTSIZE=5000
export SAVEHIST=5000
export HISTSIZE=5000
export SAVEHIST=5000

# AI工具环境变量配置
# 添加时间: $(date)

# OpenAI API配置
export OPENAI_API_KEY="your-openai-api-key-here"
export OPENAI_ORG_ID="your-org-id-here"

# GitHub配置
export GITHUB_TOKEN="ghp_请设置真实令牌"
export GITHUB_USERNAME="yaxuzhao"

# Cursor AI配置
export CURSOR_API_KEY="请设置真实密钥"

# 其他AI工具配置
export ANTHROPIC_API_KEY="your-anthropic-api-key-here"
export PERPLEXITY_API_KEY="your-perplexity-api-key-here"

# 开发环境配置
export NODE_ENV="development"
export EDITOR="cursor"


# AI工具环境变量配置
# 添加时间: $(date)

# OpenAI API配置
export OPENAI_API_KEY="your-openai-api-key-here"
export OPENAI_ORG_ID="your-org-id-here"

# GitHub配置
export GITHUB_TOKEN="ghp_请设置真实令牌"
export GITHUB_USERNAME="yaxuzhao"

# Cursor AI配置
export CURSOR_API_KEY="请设置真实密钥"

# 其他AI工具配置
export ANTHROPIC_API_KEY="your-anthropic-api-key-here"
export PERPLEXITY_API_KEY="your-perplexity-api-key-here"

# 开发环境配置
export NODE_ENV="development"
export EDITOR="cursor"


# OpenAI邮箱配置
export OPENAI_EMAIL="303915601@qq.com"

# OpenAI域名验证配置
export OPENAI_DOMAIN_VERIFICATION="dv-02fRznbdN3shnmjHVxAHsaeW"

# ===== AI工具API配置 =====
# 请将下面的占位符替换为真实的API密钥

# OpenAI配置
export OPENAI_API_KEY="your-openai-api-key-here"
export OPENAI_EMAIL="303915601@qq.com"
export OPENAI_DOMAIN_VERIFICATION="dv-02fRznbdN3shnmjHVxAHsaeW"

# GitHub配置
export GITHUB_TOKEN="ghp_请设置真实令牌"
export GITHUB_USERNAME="Cauchemar-Z"

# Cursor配置
export CURSOR_API_KEY="请设置真实密钥"

# Claude配置 (可选)
export CLAUDE_API_KEY="请设置真实密钥"

# 其他AI工具配置 (可选)
export PERPLEXITY_API_KEY="请设置真实密钥"
export NOTION_API_KEY="请设置真实密钥"

echo "✅ AI工具环境变量已加载"
