import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff, Mail, ShieldCheck, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

async function postJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return response.json() as Promise<T>;
}

export default function RegisterPage() {
  const { signUp, isConfigured } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const normalizedEmail = email.trim().toLowerCase();
  const canSendCode = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) && cooldown === 0 && !sendingCode;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(value - 1, 0)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function handleSendCode() {
    setError(null);
    setMessage(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('请先填写正确的邮箱地址。');
      return;
    }

    setSendingCode(true);
    try {
      const result = await postJson<{ ok: boolean; error?: string }>('/api/auth/send-email-code', {
        email: normalizedEmail,
      });

      if (!result.ok) {
        setError(result.error || '验证码发送失败，请稍后再试。');
        return;
      }

      setCodeSent(true);
      setCooldown(60);
      setMessage('验证码已发送，请查看邮箱后继续注册。');
    } catch {
      setError('验证码发送失败，请检查网络或稍后再试。');
    } finally {
      setSendingCode(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!agreed) {
      setError('请先阅读并同意使用条款与隐私政策。');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('请填写正确的邮箱地址。');
      return;
    }
    if (!/^\d{6}$/.test(emailCode.trim())) {
      setError('请输入 6 位邮箱验证码。');
      return;
    }
    if (password.length < 6) {
      setError('密码长度至少需要 6 位。');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致。');
      return;
    }

    setLoading(true);
    try {
      const verifyResult = await postJson<{ ok: boolean; error?: string }>('/api/auth/verify-email-code', {
        email: normalizedEmail,
        code: emailCode.trim(),
      });

      if (!verifyResult.ok) {
        setError(verifyResult.error || '邮箱验证码校验失败，请重新输入。');
        return;
      }

      const result = await signUp(normalizedEmail, password, username.trim() || normalizedEmail);
      if (result.error) {
        setError(result.error);
        return;
      }

      setMessage('注册请求已提交。邮箱验证码已通过，请返回登录页面登录。');
      setEmailCode('');
      setPassword('');
      setConfirmPassword('');
    } catch {
      setError('注册失败，请检查网络或稍后再试。');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[85vh] max-w-xl flex-col items-center justify-center px-4 py-12 animate-in fade-in duration-700">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-6 flex h-18 w-18 items-center justify-center rounded-[24px] bg-indigo-600 text-white shadow-2xl shadow-indigo-500/30 reveal-1">
          <UserPlus size={36} />
        </div>
        <h1 className="text-[44px] font-black tracking-tight leading-tight text-[#1d1d1f] reveal-1">加入 LexFlow</h1>
        <p className="mt-4 text-[19px] font-medium text-[#86868b] reveal-2">开启你的英语学习之旅</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full rounded-[40px] border border-[#d2d2d7]/50 bg-white p-10 shadow-2xl shadow-black/5 reveal-2">
        {!isConfigured && <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700">未检测到账号服务配置，请检查环境变量。</div>}
        {error && <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold leading-6 text-red-600">{error}</div>}
        {message && <div className="mb-6 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-bold leading-6 text-green-700">{message}</div>}

        <div className="space-y-6">
          <label className="block">
            <span className="mb-2.5 block text-[15px] font-black tracking-tight text-[#1d1d1f]">用户名</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="h-15 w-full rounded-2xl border border-transparent bg-[#f5f5f7] px-5 text-[17px] font-bold text-[#1d1d1f] outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              placeholder="你的昵称"
            />
          </label>

          <label className="block">
            <span className="mb-2.5 block text-[15px] font-black tracking-tight text-[#1d1d1f]">电子邮箱</span>
            <div className="flex gap-3">
              <div className="relative min-w-0 flex-1">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[#86868b]" size={20} />
                <input
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setCodeSent(false);
                  }}
                  type="email"
                  required
                  className="h-15 w-full rounded-2xl border border-transparent bg-[#f5f5f7] px-12 text-[17px] font-bold text-[#1d1d1f] outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  placeholder="name@example.com"
                />
              </div>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={!canSendCode}
                className="h-15 shrink-0 rounded-2xl border border-indigo-100 bg-indigo-50 px-5 text-[15px] font-black text-indigo-600 transition-all hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {sendingCode ? '发送中' : cooldown > 0 ? `${cooldown}s` : codeSent ? '重新发送' : '发送验证码'}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="mb-2.5 block text-[15px] font-black tracking-tight text-[#1d1d1f]">邮箱验证码</span>
            <div className="relative">
              <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-[#86868b]" size={20} />
              <input
                value={emailCode}
                onChange={(event) => setEmailCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                required
                className="h-15 w-full rounded-2xl border border-transparent bg-[#f5f5f7] px-12 text-[17px] font-bold tracking-[0.2em] text-[#1d1d1f] outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                placeholder="请输入 6 位验证码"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2.5 block text-[15px] font-black tracking-tight text-[#1d1d1f]">设置密码</span>
            <div className="relative">
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? 'text' : 'password'}
                required
                className="h-15 w-full rounded-2xl border border-transparent bg-[#f5f5f7] px-5 pr-14 text-[17px] font-bold text-[#1d1d1f] outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                placeholder="至少 6 位字符"
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-5 top-1/2 -translate-y-1/2 text-[#86868b] transition-colors hover:text-[#1d1d1f]">
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="mb-2.5 block text-[15px] font-black tracking-tight text-[#1d1d1f]">确认密码</span>
            <input
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type={showPassword ? 'text' : 'password'}
              required
              className="h-15 w-full rounded-2xl border border-transparent bg-[#f5f5f7] px-5 text-[17px] font-bold text-[#1d1d1f] outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              placeholder="再次输入密码"
            />
          </label>
        </div>

        <div className="mt-8 mb-10">
          <label className="group flex cursor-pointer items-start gap-4">
            <div className="relative mt-1 flex items-center">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
                className="peer h-6 w-6 cursor-pointer appearance-none rounded-lg border border-[#d2d2d7] transition-all checked:border-indigo-600 checked:bg-indigo-600 hover:border-indigo-400"
              />
              <CheckCircle2 className="pointer-events-none absolute h-6 w-6 scale-0 text-white transition-transform peer-checked:scale-75" />
            </div>
            <span className="text-[15px] font-medium leading-relaxed text-[#86868b]">
              我已阅读并同意 LexFlow 的
              <Link to="/terms" className="mx-1 font-bold text-indigo-600 hover:underline">使用条款</Link>
              与
              <Link to="/privacy" className="mx-1 font-bold text-indigo-600 hover:underline">隐私政策</Link>
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !isConfigured || !agreed}
          className="flex h-15 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 font-black text-white shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-40"
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
        <p>已有账号？<Link className="text-indigo-600 no-underline hover:text-indigo-700" to="/login">立即登录</Link></p>
        <Link className="text-[#86868b] no-underline transition-colors hover:text-[#1d1d1f]" to="/">返回首页</Link>
      </div>
    </div>
  );
}
