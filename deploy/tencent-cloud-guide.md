# 腾讯云 Lighthouse 部署指南

## 一、创建腾讯云账户

1. 访问 [腾讯云官网](https://cloud.tencent.com/)
2. 点击 "免费注册"，使用邮箱或手机号注册
3. 完成实名认证（需要身份证）

## 二、领取免费试用

### 方式1：个人免费试用（推荐）

1. 访问 [腾讯云免费试用页面](https://cloud.tencent.com/act/pro/free)
2. 选择 "轻量应用服务器" → "个人专享"
3. 配置：2核2G / 3M带宽 / 40G SSD / 免费1个月
4. 点击 "立即领取"

### 方式2：秒杀特惠（长期使用）

1. 访问 [腾讯云秒杀页面](https://cloud.tencent.com/act/pro/lightbuy)
2. 选择 4核4G / 3M / 40G SSD / 38元/年
3. 点击 "立即抢购"

## 三、创建实例

### 步骤1：选择配置

| 配置项 | 选择 |
|--------|------|
| 地域 | 选择离你最近的区域（如上海、广州、北京） |
| 镜像 | Ubuntu 22.04 LTS 或 CentOS 8 |
| 形状 | 2核2G（免费试用）或 4核4G（秒杀） |
| 存储 | 系统盘 40G SSD |
| 带宽 | 3M |

### 步骤2：设置密码

1. 设置 root 密码（建议使用 SSH 密钥）
2. 确认实例名称
3. 点击 "立即创建"

### 步骤3：等待创建

等待几分钟，直到实例状态变为 **"运行中"**

## 四、配置安全组

1. 在实例详情页面，点击 **"防火墙"**
2. 添加入站规则：

| 协议 | 端口 | 来源 | 说明 |
|------|------|------|------|
| TCP | 22 | 0.0.0.0/0 | SSH连接 |
| TCP | 3000 | 0.0.0.0/0 | 应用服务 |

## 五、连接服务器

### Windows 用户（使用 PowerShell）

```powershell
# 连接服务器
ssh root@<你的公网IP>

# 输入密码登录
```

### macOS/Linux 用户

```bash
# 连接服务器
ssh root@<你的公网IP>

# 输入密码登录
```

## 六、一键部署

```bash
# 下载部署脚本
curl -O https://raw.githubusercontent.com/yourusername/weibo-lottery-watcher/main/deploy/install.sh

# 赋予执行权限
chmod +x install.sh

# 执行部署
./install.sh
```

## 七、配置环境变量

部署完成后，编辑 `.env.local` 文件：

```bash
cd weibo-lottery-watcher
vim .env.local
```

配置内容：

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

## 八、重启服务

```bash
# 重启服务使配置生效
pm2 restart all
```

## 九、验证服务

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs

# 访问服务
curl http://localhost:3000
```

## 十、访问服务

在浏览器中访问：

```
http://<你的公网IP>:3000
```

## 十一、管理命令

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

## 十二、常见问题

### Q1: 无法访问服务？

1. 检查防火墙是否开放了 3000 端口
2. 检查服务是否启动：`pm2 status`
3. 检查安全组规则

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

## 十三、数据备份

```bash
# 备份数据
cp data/db.json data/db.json.bak

# 备份配置
cp .env.local .env.local.bak
```

## 十四、注意事项

1. **免费试用有期限**：个人版免费1个月，到期后需要续费
2. **续费优惠**：腾讯云试用期间续费可享3.5折
3. **Cookie更新**：微博Cookie有效期较短，需要定期更新
4. **国内服务器**：无需备案即可使用IP访问，绑定域名需要备案