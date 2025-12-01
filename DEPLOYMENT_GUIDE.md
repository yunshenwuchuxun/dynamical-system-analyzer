# GitHub 和 Render 部署指南

## 第一步：创建 GitHub 仓库

### 方法 1: 使用 GitHub CLI (gh)

如果你已安装 GitHub CLI，运行：

```bash
# 登录 GitHub
gh auth login

# 创建公开仓库并推送
gh repo create dynamical-system-analyzer --public --source=. --remote=origin --push

# 或创建私有仓库
gh repo create dynamical-system-analyzer --private --source=. --remote=origin --push
```

### 方法 2: 使用 GitHub 网页界面（推荐）

1. **访问 GitHub 并创建新仓库**
   - 登录 https://github.com
   - 点击右上角的 "+" → "New repository"
   
2. **配置仓库信息**
   - Repository name: `dynamical-system-analyzer`
   - Description: `智能动力学系统分析器 - Flask Web 应用`
   - 选择 Public（公开）或 Private（私有）
   - ⚠️ **不要**勾选 "Initialize this repository with a README"
   - ⚠️ **不要**添加 .gitignore 或 license（我们已经有了）
   
3. **点击 "Create repository"**

4. **推送本地代码到 GitHub**

   复制以下命令到终端运行（替换 `your-username` 为你的 GitHub 用户名）：

   ```bash
   # 添加远程仓库
   git remote add origin https://github.com/your-username/dynamical-system-analyzer.git
   
   # 推送代码到 main 分支
   git push -u origin main
   ```

   如果推送失败，可能需要使用 SSH：
   ```bash
   git remote set-url origin git@github.com:your-username/dynamical-system-analyzer.git
   git push -u origin main
   ```

5. **验证推送成功**
   
   访问 `https://github.com/your-username/dynamical-system-analyzer` 
   确认所有文件已上传

## 第二步：部署到 Render

### 方法 1: 从 GitHub 部署（推荐）

1. **访问 Render**
   - 打开 https://render.com
   - 使用 GitHub 账号登录

2. **创建新项目**
   - 点击 "New +"
   - 选择 "Web Service"
   - 授权 Render 访问你的 GitHub 账号
   - 选择 `dynamical-system-analyzer` 仓库

3. **配置 Web Service**
   - Name: `dynamical-system-analyzer`
   - Environment: `Python 3`
   - Region: 选择最近的区域
   - Branch: `main`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app --bind 0.0.0.0:$PORT`

4. **自动部署**
   - Render 会自动检测到：
     - `Procfile` - 启动命令
     - `requirements.txt` - Python 依赖
     - `runtime.txt` - Python 版本
   - 部署过程会自动开始

5. **等待部署完成**
   - 查看实时日志了解部署进度
   - 部署成功后会显示绿色勾号

6. **生成公开域名**
   - Render 会自动生成一个 `.onrender.com` 域名
   - 或者在 Settings 中添加自定义域名

7. **访问应用**
   - 点击生成的域名
   - 你的动力学系统分析器现在已在线运行！

## 第三步：验证部署

### 测试核心功能

1. **访问首页**
   - 确认页面正常加载
   - 输入矩阵值，检查特征值计算

2. **测试相图生成**
   - 访问 "相图分析" 页面
   - 生成相图，确认图像显示

3. **测试文本生成器**
   - 访问 "文本生成器" 页面
   - 输入描述，生成矩阵

4. **测试混沌分析**
   - 访问 "混沌分析" 页面
   - 生成 Lorenz 吸引子

5. **测试离散系统**
   - 访问 "离散分析" 页面
   - 生成分岔图

## 常见问题排查

### 问题 1: 推送到 GitHub 时要求认证

**解决方案 1: 使用 Personal Access Token**

1. 访问 GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 点击 "Generate new token (classic)"
3. 选择 `repo` 权限
4. 生成 token 并保存
5. 推送时使用 token 作为密码：
   ```bash
   Username: your-username
   Password: ghp_xxxxxxxxxxxx (你的 token)
   ```

**解决方案 2: 使用 SSH**

```bash
# 生成 SSH 密钥
ssh-keygen -t ed25519 -C "2060979047@qq.com"

# 添加到 ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# 复制公钥
cat ~/.ssh/id_ed25519.pub

# 添加到 GitHub: Settings → SSH and GPG keys → New SSH key
# 然后使用 SSH URL
git remote set-url origin git@github.com:your-username/dynamical-system-analyzer.git
```

### 问题 2: Render 部署失败

**检查清单:**

1. **查看构建日志**
   - Render 面板 → Logs → 查看失败的部署
   - 查看详细错误信息

2. **确认文件存在**
   ```bash
   ls -la Procfile requirements.txt runtime.txt
   ```

3. **验证 requirements.txt**
   - 确保包含 `gunicorn==21.2.0`
   - 所有依赖版本号正确

4. **检查 Python 版本**
   - `runtime.txt` 中的版本是否支持

5. **手动触发重新部署**
   - Render 面板 → Manual Deploy → "Deploy latest commit"

### 问题 3: 部署成功但无法访问

**检查步骤:**

1. **确认域名已生成**
   - Settings → Networking → 应该有域名

2. **检查应用日志**
   - Deployments → View Logs
   - 查找启动错误

3. **验证端口绑定**
   - 应用应该使用 `$PORT` 环境变量
   - 查看 app.py:2398 确认配置正确

**问题: 中文显示为方框**

Render 环境已包含基本中文字体，但如果仍有问题：

```python
# app.py 中确认已设置
plt.rcParams['font.sans-serif'] = ['SimHei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False
```

## 更新部署的应用

### 推送更新到 GitHub

```bash
# 修改代码后
git add .
git commit -m "描述你的修改"
git push
```

### 自动部署

Render 会自动检测 GitHub 仓库的更新并重新部署：
- 推送到 `main` 分支后
- Render 自动拉取新代码
- 自动重新构建和部署
- 通常 2-5 分钟内完成

### 手动触发部署

如果自动部署未触发：
1. Render 面板 → Manual Deploy
2. 点击 "Deploy latest commit"
3. 选择最新的提交

## 监控和日志

### 查看实时日志

在 Render 网页面板：
- Web Service → Logs → View Logs

### 查看指标

Render 面板 → Metrics 标签：
- CPU 使用率
- 内存使用
- 网络流量
- 响应时间

## 成本估算

Render 提供：
- **免费计划**: 750 小时/月免费
- **付费计划**: Starter ($7/月), Standard ($25/月)

本应用预估资源使用：
- 内存: ~300MB
- CPU: 轻度使用
- 预计可在免费额度内运行（低流量情况）

## 下一步

### 可选增强功能

1. **自定义域名**
   - Render Settings → Custom Domain
   - 添加你自己的域名

2. **环境变量**
   - Render Settings → Environment
   - 添加配置（如需要）

3. **数据库（如需要）**
   - Render 支持 PostgreSQL, MySQL, Redis
   - 从 "New +" 菜单添加数据库服务

4. **持续集成**
   - 添加 GitHub Actions 进行测试
   - 自动化部署流程

### 分享你的应用

部署完成后，你可以分享：
- 直接分享 Render 生成的域名
- 在 GitHub 仓库添加在线演示链接
- 更新 README.md 中的部署按钮

## 需要帮助？

- Render 文档: https://render.com/docs
- GitHub 文档: https://docs.github.com
- 项目问题: 在 GitHub 仓库创建 Issue

---

**准备好了吗？开始部署吧！** 🚀
