import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock, User, ChevronRight, Download, Info, MessageSquare } from 'lucide-react';
import { videoLessons } from '../data/videoData';

export default function VideoListPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showHelp, setShowHelp] = useState(false);
  const categories = ['All', ...new Set(videoLessons.map(v => v.category))];
  const filtered = selectedCategory === 'All'
    ? videoLessons
    : videoLessons.filter(v => v.category === selectedCategory);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">语料学习</h1>
        <p className="text-gray-500">通过真实视频语料学英语，沉浸式提升听力和词汇</p>
      </div>

      {/* Video Help Notice */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 mb-6 border border-blue-100">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 mb-1">视频播放说明</h3>
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showHelp ? '收起' : '展开详情'}
              </button>
            </div>
            <p className="text-sm text-gray-600">
              本站支持本地视频播放。如视频无法播放，可切换到「朗读模式」使用 TTS 语音学习。
            </p>
            {showHelp && (
              <div className="mt-4 space-y-3 text-sm">
                <div className="bg-white rounded-xl p-4 border border-blue-100">
                  <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Download className="w-4 h-4 text-blue-500" />
                    如何添加本地视频
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-gray-600">
                    <li>从 YouTube/Bilibili 等平台下载对应演讲视频（MP4格式）</li>
                    <li>将视频文件放入项目的 <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">public/videos/</code> 目录</li>
                    <li>文件命名参考：<code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">steve-jobs-hungry.mp4</code></li>
                    <li>刷新页面即可播放</li>
                  </ol>
                </div>
                <div className="bg-white rounded-xl p-4 border border-blue-100">
                  <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-green-500" />
                    朗读模式
                  </h4>
                  <p className="text-gray-600">
                    即使没有视频文件，你也可以使用「朗读模式」。系统会使用浏览器 TTS 朗读英文字幕，配合双语字幕学习。
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-8">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat === 'All' ? '全部' : cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(lesson => (
          <Link
            key={lesson.id}
            to={`/corpus/${lesson.id}`}
            className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all no-underline"
          >
            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 h-44 flex items-center justify-center">
              <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-lg">
                Ep.{lesson.episode}
              </div>
              <div className="absolute top-3 right-3 bg-blue-600/80 text-white text-xs px-2.5 py-1 rounded-lg">
                {lesson.category}
              </div>
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-7 h-7 text-white ml-1" />
              </div>
              <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {lesson.duration}
              </div>
            </div>

            <div className="p-5">
              <h3 className="font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors flex items-center justify-between">
                {lesson.title}
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {lesson.speaker}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {lesson.subtitles.length} 句
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {lesson.subtitles.slice(0, 2).flatMap(s => s.highlights).slice(0, 4).map((h, i) => (
                  <span key={i} className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-md border border-orange-100">
                    {h}
                  </span>
                ))}
                <span className="text-xs text-gray-300">...</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
