import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from || '/vocabulary';

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signIn(email.trim(), password);
    setLoading(false);

    if (result.error) {
      setError(result.error || '登录失败，请检查您的凭据');
      return;
    }

    navigate(from, { replace: true });
  }

  return (
    <div className="mx-auto flex min-h-[85vh] max-w-xl flex-col items-center justify-center px-4 py-12 animate-in fade-in duration-700">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-6 flex h-18 w-18 items-center justify-center rounded-[24px] bg-blue-600 text-white shadow-2xl shadow-blue-500/30 reveal-1">
          <LogIn size={36} />
        </div>
        <h1 className="text-[44px] font-black text-[#1d1d1f] tracking-tight leading-tight reveal-1">欢迎回来</h1>
        <p className="mt-4 text-[19px] font-medium text-[#86868b] reveal-2">登录以继续您的英语学习之旅</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full rounded-[40px] border border-[#d2d2d7]/50 bg-white p-10 shadow-2xl shadow-black/5 reveal-2">
        {!isConfigured && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700">
            未检测到 Supabase 配置，请检查环境变量。
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold leading-6 text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <label className="block">
            <span className="mb-2.5 block text-[15px] font-black text-[#1d1d1f] tracking-tight">邮箱</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              required
              className="h-15 w-full rounded-2xl border border-transparent bg-[#f5f5f7] px-5 text-[17px] font-bold text-[#1d1d1f] outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              placeholder="您的邮箱地址"
            />
          </label>

          <label className="block">
            <span className="mb-2.5 block text-[15px] font-black text-[#1d1d1f] tracking-tight">密码</span>
            <div className="relative">
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="h-15 w-full rounded-2xl border border-transparent bg-[#f5f5f7] px-5 pr-14 text-[17px] font-bold text-[#1d1d1f] outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                placeholder="您的密码"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] transition-colors"
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading || !isConfigured}
            className="flex h-15 w-full items-center justify-center gap-2 rounded-2xl bg-[#0071e3] font-black text-white shadow-xl shadow-blue-500/20 transition-all hover:bg-[#0077ed] hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:scale-100"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                <LogIn size={20} />
                <span>登录</span>
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-8 flex flex-col items-center gap-4 text-[15px] font-bold text-[#86868b]">
        <p>
          还没有账号？ <Link className="text-[#0071e3] no-underline hover:text-[#0077ed]" to="/register">立即注册</Link>
        </p>
        <Link className="text-[#86868b] no-underline hover:text-[#1d1d1f] transition-colors" to="/">返回首页</Link>
      </div>
    </div>

  );
}
