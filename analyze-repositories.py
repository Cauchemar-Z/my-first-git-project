#!/usr/bin/env python3
"""
GitHub仓库整合分析工具
查询所有仓库，按新人友好的方式分类整合
"""

import os
import json
import csv
import datetime as dt
from collections import defaultdict, Counter
from pathlib import Path
import re

# 如果有GitHub token，使用PyGithub
try:
    from github import Github
    HAS_GITHUB = True
except ImportError:
    HAS_GITHUB = False
    print("警告: 未安装PyGithub，将使用模拟数据")

class RepositoryAnalyzer:
    def __init__(self):
        self.repos_data = []
        self.categories = defaultdict(list)
        self.stats = {}
        
    def fetch_repositories(self):
        """获取所有仓库信息"""
        token = os.getenv("GH_TOKEN") or os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN_VALUE")
        
        if not token or not HAS_GITHUB:
            print("使用模拟数据进行演示...")
            self._create_mock_data()
            return
            
        try:
            gh = Github(token)
            user = gh.get_user()
            print(f"正在分析用户 {user.login} 的所有仓库...")
            
            repos = user.get_repos(visibility="all", sort="updated", direction="desc")
            
            for repo in repos:
                repo_info = {
                    'name': repo.name,
                    'full_name': repo.full_name,
                    'description': repo.description or "",
                    'language': repo.language or "Unknown",
                    'private': repo.private,
                    'archived': repo.archived,
                    'fork': repo.fork,
                    'disabled': repo.disabled,
                    'size': repo.size,
                    'stargazers_count': repo.stargazers_count,
                    'forks_count': repo.forks_count,
                    'open_issues_count': repo.open_issues_count,
                    'default_branch': repo.default_branch,
                    'created_at': repo.created_at.isoformat() if repo.created_at else None,
                    'updated_at': repo.updated_at.isoformat() if repo.updated_at else None,
                    'pushed_at': repo.pushed_at.isoformat() if repo.pushed_at else None,
                    'topics': list(repo.get_topics()) if hasattr(repo, 'get_topics') else [],
                    'has_issues': repo.has_issues,
                    'has_projects': repo.has_projects,
                    'has_wiki': repo.has_wiki,
                    'has_pages': repo.has_pages,
                    'license': repo.license.name if repo.license else None,
                    'clone_url': repo.clone_url,
                    'ssh_url': repo.ssh_url,
                    'html_url': repo.html_url
                }
                
                # 计算仓库活跃度
                if repo.pushed_at:
                    days_since_push = (dt.datetime.utcnow() - repo.pushed_at.replace(tzinfo=None)).days
                    repo_info['stale_days'] = days_since_push
                    repo_info['activity_level'] = self._get_activity_level(days_since_push)
                else:
                    repo_info['stale_days'] = 999999
                    repo_info['activity_level'] = 'inactive'
                
                self.repos_data.append(repo_info)
                
            print(f"成功获取 {len(self.repos_data)} 个仓库信息")
            
        except Exception as e:
            print(f"获取仓库信息失败: {e}")
            self._create_mock_data()
    
    def _create_mock_data(self):
        """创建模拟数据用于演示"""
        mock_repos = [
            {'name': 'my-website', 'language': 'HTML', 'description': '个人网站', 'size': 1200, 'stale_days': 30, 'private': False, 'archived': False, 'fork': False},
            {'name': 'python-scripts', 'language': 'Python', 'description': '常用Python脚本', 'size': 800, 'stale_days': 15, 'private': True, 'archived': False, 'fork': False},
            {'name': 'test-repo', 'language': 'JavaScript', 'description': '测试仓库', 'size': 100, 'stale_days': 200, 'private': True, 'archived': False, 'fork': False},
            {'name': 'forked-project', 'language': 'Go', 'description': 'Fork的开源项目', 'size': 5000, 'stale_days': 100, 'private': False, 'archived': False, 'fork': True},
            {'name': 'old-project', 'language': 'Java', 'description': '旧项目', 'size': 2000, 'stale_days': 400, 'private': True, 'archived': True, 'fork': False},
            {'name': 'ai-experiments', 'language': 'Python', 'description': 'AI实验代码', 'size': 1500, 'stale_days': 45, 'private': True, 'archived': False, 'fork': False},
            {'name': 'config-files', 'language': 'Shell', 'description': '配置文件集合', 'size': 300, 'stale_days': 60, 'private': True, 'archived': False, 'fork': False},
            {'name': 'empty-repo', 'language': None, 'description': '', 'size': 0, 'stale_days': 300, 'private': True, 'archived': False, 'fork': False},
        ]
        
        for repo in mock_repos:
            repo.update({
                'full_name': f'user/{repo["name"]}',
                'language': repo.get('language') or 'Unknown',
                'stargazers_count': 0,
                'forks_count': 0,
                'open_issues_count': 0,
                'default_branch': 'main',
                'topics': [],
                'activity_level': self._get_activity_level(repo['stale_days']),
                'clone_url': f'https://github.com/user/{repo["name"]}.git',
                'html_url': f'https://github.com/user/{repo["name"]}'
            })
        
        self.repos_data = mock_repos
        print(f"使用 {len(self.repos_data)} 个模拟仓库进行演示")
    
    def _get_activity_level(self, days):
        """根据天数判断活跃度"""
        if days <= 30:
            return 'active'
        elif days <= 90:
            return 'recent'
        elif days <= 180:
            return 'moderate'
        else:
            return 'inactive'
    
    def categorize_repositories(self):
        """按新人友好的方式分类仓库"""
        print("\n正在分析和分类仓库...")
        
        for repo in self.repos_data:
            # 1. 按状态分类（最重要）
            if repo.get('archived'):
                self.categories['🗄️ 已归档'].append(repo)
            elif repo.get('fork'):
                self.categories['🍴 Fork项目'].append(repo)
            elif repo.get('size', 0) == 0:
                self.categories['📭 空仓库'].append(repo)
            elif repo.get('stale_days', 0) > 365:
                self.categories['⏰ 长期未更新'].append(repo)
            else:
                # 2. 按用途和技术栈分类（活跃仓库）
                self._categorize_by_purpose_and_tech(repo)
    
    def _categorize_by_purpose_and_tech(self, repo):
        """按用途和技术栈分类活跃仓库"""
        name = repo['name'].lower()
        desc = repo.get('description', '').lower()
        language = repo.get('language', '').lower()
        
        # 网站和前端项目
        if any(keyword in name + desc for keyword in ['website', 'site', 'blog', 'portfolio', 'landing']):
            self.categories['🌐 网站项目'].append(repo)
        elif language in ['html', 'css', 'javascript', 'typescript', 'vue', 'react', 'angular']:
            self.categories['🎨 前端开发'].append(repo)
        
        # 后端和API
        elif any(keyword in name + desc for keyword in ['api', 'server', 'backend', 'service']):
            self.categories['⚙️ 后端服务'].append(repo)
        elif language in ['python', 'java', 'go', 'rust', 'php', 'ruby', 'c#', 'kotlin']:
            self.categories['💻 后端开发'].append(repo)
        
        # 数据和AI
        elif any(keyword in name + desc for keyword in ['data', 'ml', 'ai', 'machine', 'learning', 'analysis', 'jupyter']):
            self.categories['🤖 AI与数据'].append(repo)
        
        # 工具和脚本
        elif any(keyword in name + desc for keyword in ['script', 'tool', 'util', 'helper', 'automation']):
            self.categories['🔧 工具脚本'].append(repo)
        elif language in ['shell', 'bash', 'powershell']:
            self.categories['🔧 工具脚本'].append(repo)
        
        # 配置和文档
        elif any(keyword in name + desc for keyword in ['config', 'dotfiles', 'settings', 'setup']):
            self.categories['⚙️ 配置文件'].append(repo)
        elif any(keyword in name + desc for keyword in ['doc', 'readme', 'guide', 'tutorial', 'notes']):
            self.categories['📚 文档笔记'].append(repo)
        
        # 学习和实验
        elif any(keyword in name + desc for keyword in ['learn', 'study', 'practice', 'tutorial', 'example', 'demo']):
            self.categories['🎓 学习实验'].append(repo)
        elif any(keyword in name + desc for keyword in ['test', 'experiment', 'playground', 'sandbox']):
            self.categories['🧪 测试实验'].append(repo)
        
        # 移动应用
        elif language in ['swift', 'kotlin', 'dart', 'objective-c']:
            self.categories['📱 移动应用'].append(repo)
        
        # 默认分类
        else:
            self.categories['📦 其他项目'].append(repo)
    
    def generate_statistics(self):
        """生成统计信息"""
        total_repos = len(self.repos_data)
        
        # 基础统计
        self.stats = {
            'total_repositories': total_repos,
            'private_repos': sum(1 for r in self.repos_data if r.get('private')),
            'public_repos': sum(1 for r in self.repos_data if not r.get('private')),
            'archived_repos': sum(1 for r in self.repos_data if r.get('archived')),
            'fork_repos': sum(1 for r in self.repos_data if r.get('fork')),
            'empty_repos': sum(1 for r in self.repos_data if r.get('size', 0) == 0),
            'stale_repos': sum(1 for r in self.repos_data if r.get('stale_days', 0) > 180),
        }
        
        # 语言统计
        languages = Counter(r.get('language', 'Unknown') for r in self.repos_data if r.get('language'))
        self.stats['top_languages'] = dict(languages.most_common(10))
        
        # 活跃度统计
        activity_levels = Counter(r.get('activity_level', 'unknown') for r in self.repos_data)
        self.stats['activity_distribution'] = dict(activity_levels)
        
        # 分类统计
        self.stats['category_distribution'] = {cat: len(repos) for cat, repos in self.categories.items()}
    
    def create_integration_plan(self):
        """创建整合计划"""
        print("\n生成整合计划...")
        
        plan = {
            'timestamp': dt.datetime.utcnow().isoformat(),
            'total_repositories': len(self.repos_data),
            'integration_strategy': {},
            'recommended_actions': []
        }
        
        for category, repos in self.categories.items():
            if not repos:
                continue
                
            strategy = self._get_integration_strategy(category, repos)
            plan['integration_strategy'][category] = strategy
        
        # 生成推荐操作
        plan['recommended_actions'] = self._generate_recommendations()
        
        return plan
    
    def _get_integration_strategy(self, category, repos):
        """为每个分类生成整合策略"""
        repo_count = len(repos)
        
        if '已归档' in category or '空仓库' in category:
            return {
                'action': 'cleanup',
                'description': '建议删除或保持归档状态',
                'repos_count': repo_count,
                'priority': 'low'
            }
        elif 'Fork' in category:
            return {
                'action': 'review',
                'description': '检查是否有自定义修改，决定保留或删除',
                'repos_count': repo_count,
                'priority': 'medium'
            }
        elif '长期未更新' in category:
            return {
                'action': 'archive_or_cleanup',
                'description': '评估价值后归档或删除',
                'repos_count': repo_count,
                'priority': 'medium'
            }
        else:
            return {
                'action': 'integrate',
                'description': f'整合到统一仓库的 {category.split()[1] if len(category.split()) > 1 else category} 目录',
                'repos_count': repo_count,
                'priority': 'high'
            }
    
    def _generate_recommendations(self):
        """生成整合建议"""
        recommendations = []
        
        # 清理建议
        cleanup_count = len(self.categories.get('📭 空仓库', [])) + len(self.categories.get('🗄️ 已归档', []))
        if cleanup_count > 0:
            recommendations.append(f"清理 {cleanup_count} 个空仓库和已归档仓库，释放账户空间")
        
        # Fork仓库建议
        fork_count = len(self.categories.get('🍴 Fork项目', []))
        if fork_count > 0:
            recommendations.append(f"审查 {fork_count} 个Fork仓库，保留有价值的修改")
        
        # 整合建议
        active_categories = [cat for cat, repos in self.categories.items() 
                           if repos and not any(keyword in cat for keyword in ['已归档', '空仓库', 'Fork', '长期未更新'])]
        
        if active_categories:
            recommendations.append(f"将 {len(active_categories)} 个活跃分类整合到统一仓库")
            recommendations.append("按技术栈和用途创建清晰的目录结构")
            recommendations.append("保留项目历史记录和重要文档")
        
        return recommendations
    
    def save_analysis_results(self):
        """保存分析结果"""
        timestamp = dt.datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        
        # 保存详细数据
        with open(f'repository_analysis_{timestamp}.json', 'w', encoding='utf-8') as f:
            json.dump({
                'repositories': self.repos_data,
                'categories': {k: v for k, v in self.categories.items()},
                'statistics': self.stats,
                'analysis_date': dt.datetime.utcnow().isoformat()
            }, f, indent=2, ensure_ascii=False)
        
        # 保存CSV报告
        with open(f'repository_summary_{timestamp}.csv', 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['name', 'language', 'description', 'category', 'size', 'stale_days', 
                         'activity_level', 'private', 'archived', 'fork', 'action_needed']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            
            for category, repos in self.categories.items():
                for repo in repos:
                    writer.writerow({
                        'name': repo['name'],
                        'language': repo.get('language', 'Unknown'),
                        'description': repo.get('description', ''),
                        'category': category,
                        'size': repo.get('size', 0),
                        'stale_days': repo.get('stale_days', 0),
                        'activity_level': repo.get('activity_level', 'unknown'),
                        'private': repo.get('private', False),
                        'archived': repo.get('archived', False),
                        'fork': repo.get('fork', False),
                        'action_needed': self._get_action_for_repo(category)
                    })
        
        print(f"\n分析结果已保存:")
        print(f"- repository_analysis_{timestamp}.json")
        print(f"- repository_summary_{timestamp}.csv")
        
        return timestamp
    
    def _get_action_for_repo(self, category):
        """根据分类确定仓库需要的操作"""
        if '已归档' in category or '空仓库' in category:
            return 'DELETE'
        elif 'Fork' in category:
            return 'REVIEW'
        elif '长期未更新' in category:
            return 'ARCHIVE'
        else:
            return 'INTEGRATE'
    
    def print_analysis_summary(self):
        """打印分析摘要"""
        print("\n" + "="*60)
        print("📊 仓库分析摘要")
        print("="*60)
        
        print(f"\n📈 基础统计:")
        print(f"  总仓库数: {self.stats['total_repositories']}")
        print(f"  私有仓库: {self.stats['private_repos']}")
        print(f"  公开仓库: {self.stats['public_repos']}")
        print(f"  已归档: {self.stats['archived_repos']}")
        print(f"  Fork仓库: {self.stats['fork_repos']}")
        print(f"  空仓库: {self.stats['empty_repos']}")
        print(f"  长期未更新: {self.stats['stale_repos']}")
        
        print(f"\n🏷️ 分类结果:")
        for category, repos in sorted(self.categories.items()):
            if repos:
                print(f"  {category}: {len(repos)} 个")
        
        print(f"\n💻 主要编程语言:")
        for lang, count in list(self.stats['top_languages'].items())[:5]:
            print(f"  {lang}: {count} 个")
        
        print(f"\n📊 活跃度分布:")
        for level, count in self.stats['activity_distribution'].items():
            level_name = {'active': '活跃', 'recent': '最近', 'moderate': '一般', 'inactive': '不活跃'}.get(level, level)
            print(f"  {level_name}: {count} 个")

def main():
    analyzer = RepositoryAnalyzer()
    
    print("🔍 开始分析GitHub仓库...")
    analyzer.fetch_repositories()
    
    print("\n📂 开始分类整理...")
    analyzer.categorize_repositories()
    
    print("\n📊 生成统计信息...")
    analyzer.generate_statistics()
    
    analyzer.print_analysis_summary()
    
    print("\n💾 保存分析结果...")
    timestamp = analyzer.save_analysis_results()
    
    print("\n📋 生成整合计划...")
    integration_plan = analyzer.create_integration_plan()
    
    with open(f'integration_plan_{timestamp}.json', 'w', encoding='utf-8') as f:
        json.dump(integration_plan, f, indent=2, ensure_ascii=False)
    
    print(f"整合计划已保存: integration_plan_{timestamp}.json")
    
    print("\n✅ 分析完成！请查看生成的文件了解详细结果。")

if __name__ == '__main__':
    main()