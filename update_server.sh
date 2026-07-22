#!/bin/bash

echo "===== 1. 安装依赖 ====="
npm install xlsx --save

echo ""
echo "===== 2. 构建项目 ====="
npm run build

echo ""
echo "===== 3. 重启服务 ====="
pm2 restart weibo-lottery-watcher

echo ""
echo "===== 4. 查看状态 ====="
pm2 status

echo ""
echo "部署完成！请访问 http://106.52.48.35:3000"