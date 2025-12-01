# 智能动力学系统分析器

一个基于 Flask 的智能动力学系统分析 Web 应用，支持 2D/3D 线性和非线性动力学系统的分析、可视化、混沌分析和离散系统应用。

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)
![Python](https://img.shields.io/badge/python-3.9-blue.svg)
![Flask](https://img.shields.io/badge/flask-3.0.3-green.svg)
![License](https://img.shields.io/badge/license-MIT-orange.svg)

## 功能特性

### 核心分析功能
- **2D 线性系统分析** - 特征值/特征向量计算、相图生成、轨迹动画
- **非线性系统分析** - 平衡点检测、雅可比线性化、稳定性分类
- **3D 混沌系统** - Lorenz、Rössler、Chua、Thomas 吸引子可视化
- **离散系统分析** - 分岔图、蛛网图、回归映射、Lyapunov 指数

### 智能功能
- **文本转矩阵生成器** - 自然语言描述自动生成系统矩阵
- **实时轨迹动画** - Canvas 动画播放
- **Poincaré 截面** - 混沌吸引子降维分析
- **分形维数计算** - 盒计数维数和关联维数

### 实际应用模型
- 人口动态模型（Ricker 模型）
- 流行病模型（离散 SIR）
- 经济周期模型（蛛网模型）
- 捕食者-猎物模型（离散 Lotka-Volterra）

## 技术栈

**后端:**
- Flask 3.0.3 - Web 框架
- NumPy 1.22.1 - 数值计算
- SciPy 1.10.1 - 科学计算和 ODE 求解
- SymPy 1.12 - 符号数学
- Matplotlib 3.7.2 - 数据可视化
- Gunicorn 21.2.0 - 生产服务器

**前端:**
- Vanilla JavaScript
- Chart.js - 图表绘制
- Three.js/Plotly - 3D 可视化
- Neobrutalism 主题设计

## 本地开发

### 环境要求
- Python 3.11+
- pip

### 安装步骤

1. 克隆仓库
```bash
git clone https://github.com/yunshenwuchuxun/dynamical-system-analyzer.git
cd dynamical-system-analyzer
```

2. 安装依赖
```bash
pip install -r requirements.txt
```

3. 运行应用
```bash
python app.py
```

4. 访问应用
打开浏览器访问 `http://localhost:5001`

## Render 一键部署

### 方法 1: 使用部署按钮（推荐）

点击下方按钮直接部署到 Render：

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)
![Python](https://img.shields.io/badge/python-3.9-blue.svg)
![Flask](https://img.shields.io/badge/flask-3.0.3-green.svg)
![License](https://img.shields.io/badge/license-MIT-orange.svg)

### 方法 2: 从 GitHub 手动部署

1. 访问 [Render.com](https://render.com/)
2. 使用 GitHub 账号登录
3. 点击 "New +" → "Web Service"
4. 选择 "Connect a repository"
5. 选择本仓库
6. Render 会自动检测配置并开始部署
7. 部署完成后，点击生成的域名访问应用

### 环境变量配置

Render 会自动设置以下环境变量：
- `PORT` - 应用监听端口（自动分配）
- `RENDER` - 标识为 Render 生产环境

无需手动配置任何环境变量。

### 部署配置文件

项目包含以下部署配置文件：

- **`Procfile`** - 定义启动命令
  ```
  web: gunicorn app:app
  ```

- **`runtime.txt`** - Python 版本
  ```
  python-3.9.23
  ```

## 项目结构

```
.
├── app.py                          # Flask 主应用
├── requirements.txt                # Python 依赖
├── Procfile                        # Render 启动配置
├── runtime.txt                     # Python 版本
├── CLAUDE.md                       # 项目文档
├── templates/                      # HTML 模板
│   ├── index.html                  # 首页
│   ├── phase_portrait.html         # 相图页面
│   ├── trajectory.html             # 轨迹动画页面
│   ├── nonlinear_analysis.html     # 非线性分析页面
│   ├── chaos_analysis.html         # 混沌分析页面
│   ├── discrete_analysis.html      # 离散系统分析页面
│   └── discrete_applications.html  # 离散系统应用页面
└── static/                         # 静态资源
    ├── css/
    │   └── theme.css               # Neobrutalism 主题
    └── js/
        ├── phase_portrait.js       # 相图控制
        ├── trajectory.js           # 轨迹动画
        ├── chaos_analysis.js       # 混沌分析
        ├── discrete_analysis.js    # 离散系统分析
        ├── discrete_applications.js # 离散系统应用
        └── theme-toggle.js         # 主题切换
```

## API 端点

### 线性系统
- `POST /api/analyze_system` - 分析特征值、迹、行列式
- `POST /api/generate_phase_portrait` - 生成相图
- `POST /api/compute_trajectory` - 计算轨迹
- `POST /api/text_to_matrix` - 文本转矩阵

### 非线性系统
- `POST /api/analyze_nonlinear` - 分析平衡点
- `POST /api/generate_nonlinear_portrait` - 生成非线性相图
- `POST /api/compute_nonlinear_trajectory` - 计算非线性轨迹

### 混沌系统
- `POST /api/generate_attractor` - 生成 3D 吸引子
- `POST /api/calculate_lyapunov` - 计算 Lyapunov 指数
- `POST /api/poincare_section` - 计算 Poincaré 截面
- `POST /api/fractal_dimension` - 计算分形维数

### 离散系统
- `POST /api/analyze_discrete_system` - 分析不动点和稳定性
- `POST /api/generate_bifurcation_diagram` - 生成分岔图
- `POST /api/generate_cobweb_plot` - 生成蛛网图
- `POST /api/generate_return_map` - 生成回归映射
- `POST /api/discrete_phase_portrait` - 生成 2D 映射相图

## 使用示例

### 分析线性系统

1. 访问首页输入矩阵元素
2. 查看特征值和系统分类
3. 生成相图查看向量场
4. 绘制轨迹观察动态行为

### 使用文本生成器

1. 访问"文本生成器"页面
2. 输入中文描述，例如："一个逆时针旋转的稳定螺旋"
3. 点击生成获得对应的系统矩阵
4. 查看相图验证系统行为

### 混沌分析

1. 访问"混沌分析"页面
2. 选择吸引子类型（Lorenz、Rössler 等）
3. 调整参数观察不同行为
4. 计算 Lyapunov 指数判断混沌性
5. 生成 Poincaré 截面观察结构

### 离散系统应用

1. 访问"离散应用"页面
2. 选择应用模型（人口、流行病等）
3. 调整模型参数
4. 观察时间序列和相图
5. 分析系统长期行为

## 部署问题排查

### 常见问题

**问题: 部署后无法访问**
- 检查 Render 日志确认应用已启动
- 确认域名已正确生成
- 检查防火墙设置

**问题: 图片无法显示**
- 确认 Matplotlib 后端设置为 'Agg'
- 检查 base64 编码是否正确
- 查看浏览器控制台错误信息

**问题: 中文显示为方框**
- Render 环境已包含中文字体支持
- 如仍有问题，检查 `plt.rcParams['font.sans-serif']` 设置

### 查看日志

Render 平台：
1. 进入 Web Service 页面
2. 点击 "Logs"
3. 查看实时日志输出

## 性能优化

- 使用 Gunicorn 多进程模式提升并发能力
- Matplotlib 使用 Agg 后端避免内存泄漏
- 轨迹计算设置发散检测防止无限循环
- 前端使用防抖优化频繁 API 调用

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 致谢

- Flask - Web 框架
- NumPy/SciPy - 科学计算
- Matplotlib - 数据可视化
- Render - 部署平台

## 联系方式

- GitHub: [@yunshenwuchuxun](https://github.com/yunshenwuchuxun)
- Email: 2060979047@qq.com

---

**注意**: 本项目用于教育和学习目的，动力学系统分析结果仅供参考。

## 详细文档

- [Render 部署指南](RENDER_DEPLOYMENT.md) - 完整的 Render 部署文档
- [开发文档](CLAUDE.md) - 项目架构和开发指南
- [主题指南](THEME_GUIDE.md) - Neobrutalism 主题系统
