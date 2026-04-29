import { Link, useLocation } from 'react-router-dom';
import { BarChart3, BookOpen, FileText, Headphones, Heart, Home, Menu, Wrench, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const BRAND = 'LexFlow';

const navItems = [
  { path: '/', label: '首页', icon: Home, color: '#2563eb' },
  { path: '/vocabulary', label: '背单词', icon: BookOpen, color: '#2563eb' },
  { path: '/listening', label: '听力口语', icon: Headphones, color: '#0ea5e9' },
  { path: '/reading', label: '双语阅读', icon: FileText, color: '#10b981' },
  { path: '/tools', label: '学习工具', icon: Wrench, color: '#f59e0b' },
  { path: '/dashboard', label: '学习统计', icon: BarChart3, color: '#8b5cf6' },
  { path: '/support', label: '赞助支持', icon: Heart, color: '#ef4444' },
];

function LogoMark() {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/20">
      <span className="text-xl font-black tracking-tight">L</span>
    </div>
  );
}

export default function Navbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  const authLabel = user ? '个人中心' : '立即登录';
  const authPath = user ? '/profile' : '/login';
  const avatarText = (user?.user_metadata?.username || user?.email?.charAt(0) || 'X').charAt(0).toUpperCase();

  return (
    <nav className="sticky top-0 z-[100] glass-nav">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 no-underline group active:scale-95 transition-transform duration-200">
            <LogoMark />
            <span className="text-2xl font-black tracking-tight text-[#1d1d1f]">{BRAND}</span>
          </Link>
          <Link to={authPath} className="hidden items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-2 font-semibold text-blue-700 no-underline transition-all hover:bg-blue-100 hover:scale-[1.02] active:scale-95 sm:flex">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">{avatarText}</span>
            {authLabel}
          </Link>
        </div>

        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`flex items-center gap-2 rounded-2xl px-4 py-2 font-semibold no-underline transition-all duration-300 hover:scale-[1.05] active:scale-95 ${active ? 'bg-blue-50 text-blue-700' : 'text-[#86868b] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'}`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <button 
          type="button" 
          onClick={() => setMenuOpen(true)} 
          className="rounded-2xl bg-[#f5f5f7] p-3 text-[#1d1d1f] md:hidden transition-all hover:bg-[#e8e8ed] active:scale-90" 
          aria-label="打开菜单"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Animated Mobile Menu */}
      <div className={`fixed inset-0 z-[200] bg-white transition-all duration-500 ease-[cubic-bezier(0.4,0,0,1)] md:hidden ${menuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="p-5 h-full flex flex-col">
          <div className="mb-12 flex items-center justify-between">
            <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 no-underline active:scale-95 transition-transform">
              <LogoMark />
              <span className="text-2xl font-black text-[#1d1d1f]">{BRAND}</span>
            </Link>
            <button 
              type="button" 
              onClick={() => setMenuOpen(false)} 
              className="rounded-2xl bg-[#f5f5f7] p-3 text-[#1d1d1f] transition-all active:scale-90" 
              aria-label="关闭菜单"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-3 flex-1">
            <Link 
              to={authPath} 
              onClick={() => setMenuOpen(false)} 
              className="mb-8 flex items-center gap-4 rounded-[32px] bg-blue-50 px-6 py-5 text-2xl font-black text-blue-700 no-underline active:scale-95 transition-all"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/20">{avatarText}</span>
              {authLabel}
            </Link>
            
            <div className="grid gap-2">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <Link 
                    key={item.path} 
                    to={item.path} 
                    onClick={() => setMenuOpen(false)} 
                    className={`flex items-center gap-5 rounded-[28px] px-6 py-5 text-xl font-black no-underline active:scale-95 transition-all ${active ? 'bg-[#f5f5f7] text-blue-600' : 'text-[#1d1d1f] hover:bg-[#f5f5f7]'}`}
                    style={{ 
                      transitionDelay: `${index * 50}ms`,
                      transform: menuOpen ? 'translateY(0)' : 'translateY(20px)',
                      opacity: menuOpen ? 1 : 0
                    }}
                  >
                    <span 
                      className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm" 
                      style={{ backgroundColor: `${item.color}14`, color: item.color }}
                    >
                      <Icon size={26} />
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="mt-auto pb-8 text-center text-[13px] font-bold text-[#86868b] tracking-widest uppercase">
            Designed for Excellence
          </div>
        </div>
      </div>
    </nav>
  );
}



