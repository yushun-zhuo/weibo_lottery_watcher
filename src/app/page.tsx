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

  useEffect(() => {
    fetchBloggers();
    fetchLotteryPosts();
  }, []);

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

  const deleteBlogger = async (id: number) => {
    await fetch('/api/bloggers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await fetchBloggers();
  };

  const runMonitorNow = async () => {
    setLoading(true);
    await fetch('/api/monitor', { method: 'POST' });
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
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">👥 监控列表</h2>
              <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm">
                {bloggers.length} 位博主
              </span>
            </div>

            <form onSubmit={addBlogger} className="mb-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="博主ID"
                  value={newBloggerId}
                  onChange={(e) => setNewBloggerId(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  placeholder="博主昵称"
                  value={newBloggerName}
                  onChange={(e) => setNewBloggerName(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
                >
                  添加
                </button>
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
              <button
                onClick={runMonitorNow}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <span>🔄</span>
                立即检测
              </button>
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
              <p className="text-sm text-gray-600">在浏览器登录微博，复制Cookie到 .env 文件</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl">
              <h3 className="font-medium text-green-600 mb-2">2. 配置飞书Webhook</h3>
              <p className="text-sm text-gray-600">创建飞书自定义机器人，获取Webhook URL</p>
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
