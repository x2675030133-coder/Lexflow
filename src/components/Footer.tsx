import { Link } from 'react-router-dom';

const BRAND = 'LexFlow';
const ICP_RECORD = '浙ICP备2026027815号-1';
const ICP_URL = 'https://beian.miit.gov.cn/';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200/70 bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 text-gray-900 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="mb-5 flex items-center gap-3 no-underline">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-black text-white">L</span>
              <span className="text-xl font-black tracking-tight">{BRAND}</span>
            </Link>
            <p className="max-w-xs text-sm leading-7 text-gray-500">
              精心设计的语言学习工具，把背单词、听力口语、双语阅读和学习统计串成一条清晰路线。
            </p>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-black text-gray-500">探索</h4>
            <ul className="space-y-3 p-0 text-sm font-semibold list-none">
              <li><Link to="/vocabulary" className="text-gray-700 no-underline hover:text-blue-600">背单词</Link></li>
              <li><Link to="/listening" className="text-gray-700 no-underline hover:text-blue-600">听力口语</Link></li>
              <li><Link to="/reading" className="text-gray-700 no-underline hover:text-blue-600">双语阅读</Link></li>
              <li><Link to="/dashboard" className="text-gray-700 no-underline hover:text-blue-600">学习统计</Link></li>
              <li><Link to="/tools" className="text-gray-700 no-underline hover:text-blue-600">学习工具</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-black text-gray-500">支持</h4>
            <ul className="space-y-3 p-0 text-sm font-semibold list-none">
              <li><Link to="/support" className="text-gray-700 no-underline hover:text-rose-600">赞助支持</Link></li>
              <li><Link to="/help" className="text-gray-700 no-underline hover:text-blue-600">帮助中心</Link></li>
              <li><Link to="/privacy" className="text-gray-700 no-underline hover:text-blue-600">隐私政策</Link></li>
              <li><Link to="/terms" className="text-gray-700 no-underline hover:text-blue-600">使用条款</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-black text-gray-500">账号</h4>
            <ul className="space-y-3 p-0 text-sm font-semibold list-none">
              <li><Link to="/login" className="text-gray-700 no-underline hover:text-blue-600">立即登录</Link></li>
              <li><Link to="/register" className="text-gray-700 no-underline hover:text-blue-600">加入 LexFlow</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-gray-200 pt-8 text-sm font-semibold text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>Copyright © 2026 {BRAND} Inc. 保留所有权利。</span>
            <a
              href={ICP_URL}
              target="_blank"
              rel="noreferrer"
              className="text-gray-400 no-underline hover:text-blue-600"
            >
              {ICP_RECORD}
            </a>
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/privacy" className="text-gray-400 no-underline hover:text-gray-700">隐私政策</Link>
            <Link to="/terms" className="text-gray-400 no-underline hover:text-gray-700">使用条款</Link>
            <Link to="/support" className="text-gray-400 no-underline hover:text-rose-600">赞助支持</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
