# Oracle Cloud 部署指南

## 一、创建 Oracle Cloud 账户

1. 访问 [Oracle Cloud](https://www.oracle.com/cloud/)
2. 点击 "Sign In" 或 "Try Oracle Cloud Free Tier"
3. 使用邮箱注册账户，需要信用卡验证（不会扣费）
4. 完成身份验证后，进入控制台

## 二、创建免费云服务器

### 步骤1：创建实例

1. 在控制台左侧菜单中，点击 **"Compute"** → **"Instances"**
2. 点击 **"Create Instance"**
3. 填写实例名称，例如：`weibo-lottery-watcher`
4. 选择 **"Always Free Eligible"** 区域

### 步骤2：配置实例

| 配置项 | 选择 |
|--------|------|
| 操作系统 | Oracle Linux 8 或 Ubuntu 22.04 |
| 形状 | VM.Standard.E2.1.Micro（免费） |
| CPU | 1核 |
| 内存 | 1GB |
| 存储 | 460GB |
| 网络 | 默认虚拟云网络 |

### 步骤3：设置SSH密钥

1. 在 "Add SSH Keys" 部分，选择 **"Generate a key pair for me"**
2. 下载私钥文件（`ssh-key-2026-xx-xx.key`）
3. 保存好私钥文件，后续连接服务器需要

### 步骤4：启动实例

1. 点击 **"Create"** 创建实例
2. 等待几分钟，直到实例状态变为 **"Running"**
3. 记录实例的 **Public IP Address**

## 三、配置安全组

1. 在实例详情页面，点击 **"Virtual Cloud Network"**
2. 点击 **"Security Lists"**
3. 点击默认安全列表
4. 添加入站规则：

| 协议 | 源 | 端口范围 | 说明 |
|------|----|----------|------|
| TCP | 0.0.0.0/0 | 22 | SSH连接 |
| TCP | 0.0.0.0/0 | 3000 | 应用服务 |

## 四、连接服务器

### Windows 用户（使用 PowerShell）

```powershell
# 设置私钥权限
chmod 600 C:\path\to\ssh-key-2026-xx-xx.key

# 连接服务器
ssh -i C:\path\to\ssh-key-2026-xx-xx.key opc@<你的公网IP>
```

### macOS/Linux 用户

```bash
# 设置私钥权限
chmod 600 ~/Downloads/ssh-key-2026-xx-xx.key

# 连接服务器
ssh -i ~/Downloads/ssh-key-2026-xx-xx.key opc@<你的公网IP>
```

## 五、手动部署（推荐）

### 方式1：使用部署脚本（一键部署）

```bash
# 下载部署脚本
curl -O https://raw.githubusercontent.com/yourusername/weibo-lottery-watcher/main/deploy/install.sh

# 赋予执行权限
chmod +x install.sh

# 执行部署
./install.sh
```

### 方式2：手动部署步骤

```bash
# 1. 更新系统
sudo yum update -y

# 2. 安装 Node.js 20.x
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# 3. 安装 Git
sudo yum install -y git

# 4. 安装 PM2
npm install -g pm2

# 5. 克隆项目
git clone https://github.com/yourusername/weibo-lottery-watcher.git
cd weibo-lottery-watcher

# 6. 安装依赖
npm install

# 7. 构建项目
npm run build

# 8. 创建数据目录
mkdir -p data
echo '{"monitoredBloggers":[],"lotteryPosts":[],"notifications":[],"cookie":""}' > data/db.json

# 9. 创建日志目录
mkdir -p logs

# 10. 配置环境变量
cp .env.local.example .env.local

# 编辑配置文件（按实际情况修改）
vim .env.local
```

## 六、配置环境变量

编辑 `.env.local` 文件：

```env
# 微博Cookie（必须）
WEIBO_COOKIE=你的微博Cookie

# 飞书Webhook（必须）
FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/xxx

# 监控间隔（秒）
MONITOR_INTERVAL=60

# OpenAI API（可选，用于LLM识别）
OPENAI_API_KEY=你的API Key
OPENAI_API_BASE=https://api.openai.com/v1
```

## 七、启动服务

```bash
# 启动服务
pm2 start ecosystem.config.js

# 设置开机自启
pm2 startup
pm2 save
```

## 八、验证服务

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs

# 访问服务
curl http://localhost:3000
```

## 九、管理命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs

# 重启服务
pm2 restart all

# 停止服务
pm2 stop all

# 重新部署
cd weibo-lottery-watcher
git pull
npm install
npm run build
pm2 restart all
```

## 十、访问服务

在浏览器中访问：

```
http://<你的公网IP>:3000
```

## 十一、常见问题

### Q1: 无法访问服务？

1. 检查安全组是否开放了 3000 端口
2. 检查服务是否启动：`pm2 status`
3. 检查防火墙：`sudo firewall-cmd --list-ports`

### Q2: PM2 开机自启失效？

```bash
pm2 startup
pm2 save
```

### Q3: 微博Cookie过期？

在浏览器中重新获取Cookie，更新 `.env.local`，然后重启服务：

```bash
pm2 restart all
```

### Q4: 飞书通知收不到？

1. 检查飞书Webhook URL是否正确
2. 在飞书机器人设置中关闭关键词拦截
3. 查看日志：`pm2 logs`

## 十二、注意事项

1. **Oracle Cloud 免费实例**：可能会被回收，建议定期备份数据
2. **数据备份**：定期备份 `data/db.json` 文件
3. **Cookie更新**：微博Cookie有效期较短，需要定期更新
4. **网络延迟**：Oracle Cloud 在海外，访问可能有延迟，但不影响功能
