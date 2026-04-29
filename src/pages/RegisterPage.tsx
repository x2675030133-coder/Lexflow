import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signUp, isConfigured } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!agreed) {
      setError('请先阅读并同意使用条款与隐私政策');
      return;
    }
    if (password.length < 6) {
      setError('密码长度至少需要 6 位');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    const result = await signUp(email.trim(), password, username.trim() || email.trim());
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setMessage('注册成功！正在为您跳转到登录页面...');
    setTimeout(() => navigate('/login'), 900);
  }

  return (
    <div className="mx-auto flex min-h-[85vh] max-w-xl flex-col items-center justify-center px-4 py-12 animate-in fade-in duration-700">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-6 flex h-18 w-18 items-center justify-center rounded-[24px] bg-indigo-600 text-white shadow-2xl shadow-indigo-500/30 reveal-1">
          <UserPlus size={36} />
        </div>
        <h1 className="text-[44px] font-black text-[#1d1d1f] tracking-tight leading-tight reveal-1">加入 LexFlow</h1>
        <p className="mt-4 text-[19px] font-medium text-[#86868b] reveal-2">开启科技与美学结合的学习之旅</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full rounded-[40px] border border-[#d2d2d7]/50 bg-white p-10 shadow-2xl shadow-black/5 reveal-2">
        {!isConfigured && <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700">未检测到服务器配置，请检查环境变量。</div>}
        {error && <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold leading-6 text-red-600">{error}</div>}
        {message && <div className="mb-6 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-bold leading-6 text-green-700">{message}</div>}

        <div className="space-y-6">
          <label className="block">
            <span className="mb-2.5 block text-[15px] font-black text-[#1d1d1f] tracking-tight">用户名</span>
            <input 
              value={username} 
              onChange={(event) => setUsername(event.target.value)} 
              className="h-15 w-full rounded-2xl border border-transparent bg-[#f5f5f7] px-5 text-[17px] font-bold text-[#1d1d1f] outline-none transition-all focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" 
              placeholder="您的个性称呼" 
            />
          </label>

          <label className="block">
            <span className="mb-2.5 block text-[15px] font-black text-[#1d1d1f] tracking-tight">电子邮箱</span>
            <input 
              value={email} 
              onChange={(event) => setEmail(event.target.value)} 
              type="email" 
              required 
              className="h-15 w-full rounded-2xl border border-transparent bg-[#f5f5f7] px-5 text-[17px] font-bold text-[#1d1d1f] outline-none transition-all focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" 
              placeholder="name@example.com" 
            />
          </label>

          <label className="block">
            <span className="mb-2.5 block text-[15px] font-black text-[#1d1d1f] tracking-tight">设置密码</span>
            <div className="relative">
              <input 
                value={password} 
                onChange={(event) => setPassword(event.target.value)} 
                type={showPassword ? 'text' : 'password'} 
                required 
                className="h-15 w-full rounded-2xl border border-transparent bg-[#f5f5f7] px-5 pr-14 text-[17px] font-bold text-[#1d1d1f] outline-none transition-all focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" 
                placeholder="至少 6 位字符" 
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-5 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] transition-colors">
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="mb-2.5 block text-[15px] font-black text-[#1d1d1f] tracking-tight">确认密码</span>
            <input 
              value={confirmPassword} 
              onChange={(event) => setConfirmPassword(event.target.value)} 
              type={showPassword ? 'text' : 'password'} 
              required 
              className="h-15 w-full rounded-2xl border border-transparent bg-[#f5f5f7] px-5 text-[17px] font-bold text-[#1d1d1f] outline-none transition-all focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" 
              placeholder="再次输入密码" 
            />
          </label>
        </div>

        {/* Terms of Service Checkbox */}
        <div className="mt-8 mb-10">
          <label className="flex items-start gap-4 cursor-pointer group">
            <div className="relative flex items-center mt-1">
              <input 
                type="checkbox" 
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="peer h-6 w-6 cursor-pointer appearance-none rounded-lg border border-[#d2d2d7] transition-all checked:border-indigo-600 checked:bg-indigo-600 hover:border-indigo-400" 
              />
              <CheckCircle2 className="pointer-events-none absolute h-6 w-6 scale-0 text-white transition-transform peer-checked:scale-75" />
            </div>
            <span className="text-[15px] font-medium leading-relaxed text-[#86868b]">
              我已阅读并同意 LexFlow 的 
              <Link to="/terms" className="text-indigo-600 font-bold hover:underline mx-1">使用条款</Link> 
              与 
              <Link to="/privacy" className="text-indigo-600 font-bold hover:underline mx-1">隐私政策</Link>
            </span>
          </label>
        </div>

        <button 
          type="submit" 
          disabled={loading || !isConfigured || !agreed} 
          className="flex h-15 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 font-black text-white shadow-xl shadow-indigo-500/20 transition-all hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <>
              <UserPlus size={20} />
              <span>注册账号</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-8 flex flex-col items-center gap-4 text-[15px] font-bold text-[#86868b]">
        <p>已有账号？ <Link className="text-indigo-600 no-underline hover:text-indigo-700" to="/login">立即登录</Link></p>
        <Link className="text-[#86868b] no-underline hover:text-[#1d1d1f] transition-colors" to="/">返回首页</Link>
      </div>
    </div>

  );
}
