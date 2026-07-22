'use client';

import { useState, useEffect } from 'react';

interface Blogger {
  id: number;
  bloggerId: string;
  bloggerName: string;
  lastPostId: string | null;
  createdAt: string;
}

interface LotteryPost {
  id: number;
  bloggerId: string;
  bloggerName: string;
  postId: string;
  postContent: string;
  postUrl: string;
  prizes: string[];
  deadline: string | null;
  confidence: number;
  createdAt: string;
}

export default function Home() {
  const [bloggers, setBloggers] = useState<Blogger[]>([]);
  const [lotteryPosts, setLotteryPosts] = useState<LotteryPost[]>([]);
  const [newBloggerId, setNewBloggerId] = useState('');
  const [newBloggerName, setNewBloggerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cookie, setCookie] = useState('');
  const [cookieLength, setCookieLength] = useState(0);
  const [cookieSaved, setCookieSaved] = useState(false);
  const [cookieValid, setCookieValid] = useState<boolean | null>(null);
  const [cookieStatus, setCookieStatus] = useState('');
  const [monitorInterval, setMonitorInterval] = useState(60);
  const [intervalSaved, setIntervalSaved] = useState(false);
  

  useEffect(() => {
    fetchBloggers();
    fetchLotteryPosts();
    fetchCookie();
    fetchEnv();
  }, []);

  const fetchEnv = async () => {
    const res = await fetch('/api/env');
    const data = await res.json();
    if (data.monitorInterval) {
      setMonitorInterval(data.monitorInterval);
    }
  };

  const saveMonitorInterval = async (interval: number) => {
    setMonitorInterval(interval);
    const res = await fetch('/api/env', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monitorInterval: interval }),
    });
    const data = await res.json();
    if (data.message === '检测周期更新成功') {
      setIntervalSaved(true);
      setTimeout(() => setIntervalSaved(false), 3000);
    }
  };

  const fetchBloggers = async () => {
    const res = await fetch('/api/bloggers');
    const data = await res.json();
    setBloggers(data);
  };

  const fetchLotteryPosts = async () => {
    const res = await fetch('/api/lottery');
    const data = await res.json();
    setLotteryPosts(data);
  };

  const fetchCookie = async () => {
    const res = await fetch('/api/cookie');
    const data = await res.json();
    setCookie(data.cookie || '');
    setCookieLength(data.cookieLength || 0);
    validateCookieStatus();
  };

  const validateCookieStatus = async () => {
    if (cookieLength === 0) {
      setCookieValid(null);
      setCookieStatus('');
      return;
    }
    
    const res = await fetch('/api/cookie/validate');
    const data = await res.json();
    setCookieValid(data.valid);
    setCookieStatus(data.message);
  };

  const saveCookie = async () => {
    if (!cookie.trim()) return;
    
    const res = await fetch('/api/cookie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cookie: cookie.trim() }),
    });
    
    const data = await res.json();
    if (data.message === 'Cookie更新成功') {
      setCookieLength(data.cookieLength);
      setCookieSaved(true);
      setError(null);
      setTimeout(() => setCookieSaved(false), 3000);
      
      await validateCookieStatus();
    }
  };

  const addBlogger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBloggerId || !newBloggerName) return;

    setLoading(true);
    await fetch('/api/bloggers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bloggerId: newBloggerId, bloggerName: newBloggerName }),
    });
    setNewBloggerId('');
    setNewBloggerName('');
    await fetchBloggers();
    setLoading(false);
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load xlsx library'));
      document.head.appendChild(script);
    });

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const XLSX = (window as any).XLSX;
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const newBloggers = jsonData.map((item: any) => ({
          bloggerId: String(item['博主ID'] || item['id'] || item['ID'] || item['博主 id'] || item['博主id'] || ''),
          bloggerName: String(item['博主昵称'] || item['昵称'] || item['name'] || item['博主 name'] || item['博主name'] || ''),
        })).filter((item: any) => item.bloggerId && item.bloggerName);

        for (const blogger of newBloggers) {
          await fetch('/api/bloggers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(blogger),
          });
        }

        await fetchBloggers();
        alert(`成功导入 ${newBloggers.length} 位博主！`);
      } catch (error) {
        console.error('导入失败:', error);
        alert('导入失败，请检查Excel文件格式');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const deleteBlogger = async (id: number) => {
    await fetch('/api/bloggers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await fetchBloggers();
  };

  const runMonitorNow = async (fullScan = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/monitor', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullScan }),
      });
      const data = await res.json();
      if (data.error === 'cookie_invalid') {
        setError(data.message);
      }
    } catch (err) {
      setError('检测失败，请稍后重试');
    }
    await fetchLotteryPosts();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent mb-2">
            🎁 微博抽奖监控
          </h1>
          <p className="text-gray-600">实时监控关注博主，第一时间获取转发抽奖信息</p>
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-600 rounded-xl inline-block">
              ⚠️ {error}
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">🍪 Cookie配置</h2>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  cookieLength > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {cookieLength > 0 ? `已配置 (${cookieLength}字符)` : '未配置'}
                </span>
                {cookieValid !== null && (
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    cookieValid ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {cookieValid ? '✓ 有效' : '✗ 失效'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <textarea
                placeholder="粘贴微博移动端Cookie..."
                value={cookie}
                onChange={(e) => setCookie(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none h-24 font-mono text-sm"
              />
              <button
                onClick={saveCookie}
                disabled={loading || !cookie.trim()}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl hover:from-green-600 hover:to-teal-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cookieSaved ? '✓ 已保存' : '保存Cookie'}
              </button>
            </div>
            {cookieStatus && (
              <p className={`mt-3 text-sm ${cookieValid ? 'text-green-600' : 'text-red-600'}`}>
                {cookieValid ? '✓ ' : '✗ '}{cookieStatus}
              </p>
            )}
            <p className="mt-3 text-xs text-gray-500">
              💡 提示：从 m.weibo.cn 获取Cookie，确保包含 _T_WM 字段
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">⏰ 检测周期</h2>
              {intervalSaved && (
                <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-600">
                  ✓ 已保存
                </span>
              )}
            </div>
            <p className="text-gray-600 mb-6">设置自动检测微博的频率</p>
            <div className="grid grid-cols-3 gap-4">
              {[5, 15, 30].map((interval) => (
                <button
                  key={interval}
                  onClick={() => saveMonitorInterval(interval)}
                  className={`py-4 px-6 rounded-xl transition-all ${
                    monitorInterval === interval
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <div className="text-2xl font-bold">{interval}</div>
                  <div className="text-sm opacity-80">分钟</div>
                </button>
              ))}
            </div>
            <p className="mt-6 text-sm text-gray-500">
              当前设置：<span className="font-semibold text-purple-600">每 {monitorInterval} 分钟</span> 检测一次
            </p>
            <p className="mt-2 text-xs text-green-600">
              ✓ 修改后立即生效，无需重启服务
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">👥 监控列表</h2>
              <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm">
                {bloggers.length} 位博主
              </span>
            </div>

            <form onSubmit={addBlogger} className="mb-6">
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="博主ID"
                    value={newBloggerId}
                    onChange={(e) => setNewBloggerId(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    placeholder="博主昵称"
                    value={newBloggerName}
                    onChange={(e) => setNewBloggerName(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
                  >
                    添加
                  </button>
                  <label className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl cursor-pointer transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    导入Excel
                    <input type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </form>

            <div className="space-y-3">
              {bloggers.map((blogger) => (
                <div
                  key={blogger.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-800">{blogger.bloggerName}</p>
                    <p className="text-sm text-gray-500">ID: {blogger.bloggerId}</p>
                  </div>
                  <button
                    onClick={() => deleteBlogger(blogger.id)}
                    className="px-3 py-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    删除
                  </button>
                </div>
              ))}
              {bloggers.length === 0 && (
                <p className="text-center text-gray-400 py-8">暂无监控博主，添加一个开始监控吧</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">🎰 抽奖记录</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => runMonitorNow()}
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <span>🔄</span>
                  立即检测
                </button>
                <button
                  onClick={() => runMonitorNow(true)}
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <span>🔍</span>
                  重新扫描
                </button>
              </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {lotteryPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl border border-orange-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">{post.bloggerName}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        post.confidence >= 0.7
                          ? 'bg-green-100 text-green-600'
                          : post.confidence >= 0.4
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {(post.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{post.postContent}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.prizes.map((prize, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded text-xs">
                        🎁 {prize}
                      </span>
                    ))}
                  </div>
                  {post.deadline && (
                    <p className="text-sm text-gray-500 mb-3">⏰ 截止: {post.deadline}</p>
                  )}
                  <a
                    href={post.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all"
                  >
                    立即参与
                  </a>
                </div>
              ))}
              {lotteryPosts.length === 0 && (
                <p className="text-center text-gray-400 py-8">暂无抽奖记录，点击「立即检测」开始扫描</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">⚙️ 使用说明</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-xl">
              <h3 className="font-medium text-blue-600 mb-2">1. 获取微博Cookie</h3>
              <p className="text-sm text-gray-600">在浏览器访问 m.weibo.cn 登录，复制Cookie到上方输入框</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl">
              <h3 className="font-medium text-green-600 mb-2">2. 配置飞书Webhook</h3>
              <p className="text-sm text-gray-600">创建飞书自定义机器人，获取Webhook URL配置到.env</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl">
              <h3 className="font-medium text-purple-600 mb-2">3. 添加监控博主</h3>
              <p className="text-sm text-gray-600">输入博主ID和昵称，系统会自动检测抽奖</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
