#!/bin/bash

echo "========================================"
echo "   微博抽奖监控 - 云服务器部署脚本"
echo "========================================"

set -e

function error_exit {
    echo "ERROR: $1" >&2
    exit 1
}

function detect_os {
    if [ -f /etc/centos-release ]; then
        echo "centos"
    elif [ -f /etc/os-release ]; then
        if grep -qi "ubuntu" /etc/os-release; then
            echo "ubuntu"
        elif grep -qi "debian" /etc/os-release; then
            echo "debian"
        else
            echo "centos"
        fi
    else
        echo "centos"
    fi
}

OS=$(detect_os)
echo "检测到操作系统: $OS"

echo ""
echo "1. 更新系统..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    sudo apt update -y || error_exit "系统更新失败"
    sudo apt upgrade -y || error_exit "系统升级失败"
else
    sudo yum update -y || error_exit "系统更新失败"
fi

echo ""
echo "2. 安装 Node.js 20.x..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash - || error_exit "Node.js源配置失败"
    sudo apt install -y nodejs || error_exit "Node.js安装失败"
else
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - || error_exit "Node.js源配置失败"
    sudo yum install -y nodejs || error_exit "Node.js安装失败"
fi

echo ""
echo "3. 安装 Git..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    sudo apt install -y git || error_exit "Git安装失败"
else
    sudo yum install -y git || error_exit "Git安装失败"
fi

echo ""
echo "4. 安装 PM2..."
npm install -g pm2 || error_exit "PM2安装失败"

echo ""
echo "5. 克隆项目..."
cd ~ || error_exit "进入用户目录失败"
git clone https://github.com/yourusername/weibo-lottery-watcher.git || error_exit "项目克隆失败"
cd weibo-lottery-watcher || error_exit "进入项目目录失败"

echo ""
echo "6. 安装依赖..."
npm install || error_exit "依赖安装失败"

echo ""
echo "7. 构建项目..."
npm run build || error_exit "项目构建失败"

echo ""
echo "8. 创建数据目录..."
mkdir -p data || error_exit "数据目录创建失败"
touch data/db.json || error_exit "数据库文件创建失败"
echo '{"monitoredBloggers":[],"lotteryPosts":[],"notifications":[],"cookie":""}' > data/db.json

echo ""
echo "9. 创建日志目录..."
mkdir -p logs || error_exit "日志目录创建失败"

echo ""
echo "10. 配置环境变量..."
if [ ! -f .env.local ]; then
    cat > .env.local << 'EOF'
WEIBO_COOKIE=
FEISHU_WEBHOOK_URL=
MONITOR_INTERVAL=60
OPENAI_API_KEY=
OPENAI_API_BASE=https://api.openai.com/v1
EOF
    echo "已创建 .env.local 配置文件，请手动修改配置"
fi

echo ""
echo "11. 启动服务..."
pm2 start ecosystem.config.js || error_exit "服务启动失败"

echo ""
echo "12. 设置开机自启..."
pm2 startup || error_exit "PM2开机自启配置失败"
pm2 save || error_exit "PM2配置保存失败"

echo ""
echo "========================================"
echo "           部署完成！"
echo "========================================"
echo ""
echo "服务地址: http://$(curl -s ifconfig.me):3000"
echo "PM2状态: pm2 status"
echo "查看日志: pm2 logs"
echo "重启服务: pm2 restart all"
echo "停止服务: pm2 stop all"
echo ""
echo "请记得在云服务器安全组中开放 3000 端口！"