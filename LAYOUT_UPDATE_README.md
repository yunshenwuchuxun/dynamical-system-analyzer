# 水平布局更新文档

## 更新日期
2025年11月26日

## 更新概述
所有HTML页面已成功升级为统一的水平布局(Horizontal Layout)架构,提供更现代化和一致的用户界面体验。

## 新布局架构

### 核心结构
```html
<div class="layout-horizontal">
    <!-- 顶部导航栏 -->
    <nav class="top-navigation">
        <div class="top-nav-left">
            <button class="sidebar-toggle-btn">菜单</button>
            <div class="app-logo">动力学分析器</div>
            <div class="top-nav-tabs">
                <!-- 主要页面标签 -->
            </div>
        </div>
        <div class="top-nav-right">
            <!-- 主题切换、通知等 -->
        </div>
    </nav>

    <!-- 可折叠侧边栏 -->
    <aside class="collapsible-sidebar">
        <nav class="sidebar-nav">
            <!-- 分组导航项 -->
        </nav>
        <div class="sidebar-user">
            <!-- 用户信息 -->
        </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content-horizontal">
        <!-- 页面内容 -->
    </main>
</div>
```

### CSS加载顺序
1. `theme.css` - 主题变量和基础样式
2. `layout-horizontal.css` - 水平布局专用样式
3. `style.css` - 页面特定样式

### JavaScript脚本
- `theme-toggle.js` - 深色/浅色主题切换
- `layout-horizontal.js` - 侧边栏折叠和响应式布局控制

## 已更新页面列表

| 序号 | 页面文件 | 路由 | 功能 | 状态 |
|------|---------|------|------|------|
| 1 | index.html | / | 主页 | ✅ |
| 2 | text_generator.html | /text_generator | 智能生成 | ✅ |
| 3 | phase_portrait.html | /phase_portrait | 线性系统 | ✅ |
| 4 | nonlinear_analysis.html | /nonlinear_analysis | 非线性系统 | ✅ |
| 5 | trajectory.html | /trajectory | 轨迹分析 | ✅ |
| 6 | chaos_analysis.html | /chaos_analysis | 混沌分析 | ✅ |
| 7 | discrete_analysis.html | /discrete_analysis | 离散系统 | ✅ |
| 8 | enhanced_phase_portrait.html | /enhanced_phase_portrait | 增强相图 | ✅ |

## 导航结构

### 顶部导航标签(横向)
- 首页
- 智能生成
- 非线性
- 混沌分析
- 离散系统

### 侧边栏导航(纵向分组)

**快速操作**
- 主页
- 智能生成

**系统分析**
- 线性系统
- 非线性系统
- 轨迹分析
- 增强相图

**高级功能**
- 混沌分析
- 离散系统
- 实际应用

**文档**
- 数据库
- 报告
- 帮助

## 响应式设计
- **桌面端**: 完整的顶部导航 + 侧边栏
- **平板**: 折叠侧边栏,保留顶部导航
- **移动端**: 汉堡菜单 + 完全折叠的侧边栏

## 新增功能
1. **主题切换**: 支持深色/浅色模式
2. **侧边栏折叠**: 点击按钮展开/收起侧边栏
3. **Active状态**: 当前页面在导航中自动高亮
4. **Tooltip提示**: 鼠标悬停显示功能说明

## 技术细节

### 修复的问题
1. **Jinja2模板语法错误**: 修复了批量脚本生成的转义引号问题
2. **CSS加载顺序**: 确保layout-horizontal.css在style.css之前加载
3. **Active状态管理**: 每个页面正确标记当前导航项

### 文件变更
- 新增: `static/css/layout-horizontal.css`
- 新增: `static/js/layout-horizontal.js`
- 修改: 8个HTML模板文件
- 备份: `index_horizontal.html.bak`

## 开发工具
- `batch_layout_update.py` - 批量更新HTML模板的Python脚本
- 支持参数化的active状态配置
- 自动替换旧布局为新布局

## 浏览器兼容性
- Chrome/Edge: ✅ 完全支持
- Firefox: ✅ 完全支持
- Safari: ✅ 完全支持
- IE11: ⚠️ 部分功能可能不支持

## 维护说明
- 新增页面时,请参考现有页面的布局结构
- 确保CSS加载顺序正确
- 在侧边栏导航中添加对应的链接和active状态
- 测试主题切换和响应式布局功能

## 联系信息
如有问题或建议,请在项目仓库提交Issue。
