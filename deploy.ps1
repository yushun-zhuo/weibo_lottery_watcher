$server = "ubuntu@106.52.48.35"
$remotePath = "/home/ubuntu/weibo_lottery_watcher"

Write-Host "===== 1. 上传文件 =====" -ForegroundColor Cyan
scp "D:\AI\产品\weibo_lottery_watcher\app\page.tsx" "$server`:$remotePath/app/page.tsx"
scp "D:\AI\产品\weibo_lottery_watcher\package.json" "$server`:$remotePath/package.json"
Write-Host "文件上传完成！" -ForegroundColor Green

Write-Host "`n===== 2. 安装依赖 =====" -ForegroundColor Cyan
ssh $server "cd $remotePath ; npm install xlsx --save"
Write-Host "依赖安装完成！" -ForegroundColor Green

Write-Host "`n===== 3. 构建项目 =====" -ForegroundColor Cyan
ssh $server "cd $remotePath ; npm run build"
Write-Host "项目构建完成！" -ForegroundColor Green

Write-Host "`n===== 4. 重启服务 =====" -ForegroundColor Cyan
ssh $server "cd $remotePath ; pm2 restart weibo-lottery-watcher"
Write-Host "服务重启完成！" -ForegroundColor Green

Write-Host "`n===== 5. 查看状态 =====" -ForegroundColor Cyan
ssh $server "pm2 status"
Write-Host "`n部署完成！请访问 http://106.52.48.35:3000" -ForegroundColor Green